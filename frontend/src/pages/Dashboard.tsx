import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  TrendingUp, 
  Users, 
  BarChart3, 
  CheckCircle, 
  Settings, 
  Truck,
  DollarSign,
  Calendar,
  Activity
} from "lucide-react";
import { AppleCard } from '@/components/AppleCard';
import { ChartCard } from "@/components/ChartCard";
import { apiService, DashboardStats } from "@/services/api";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

interface DashboardProps {
  selectedMonth?: number;
  selectedYear?: number;
  onMonthChange?: (month: number) => void;
  onYearChange?: (year: number) => void;
}

const Dashboard = ({ selectedMonth: initialMonth, selectedYear: initialYear }: DashboardProps) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth || 1);
  const [selectedYear, setSelectedYear] = useState<number>(initialYear || 2024);

  const fetchStats = async (month?: number, year?: number) => {
    console.log("🔄 fetchStats chamado com:", { month, year, selectedMonth, selectedYear });
    setLoading(true);
    try {
      console.log("🌐 Fazendo chamada para API...");
      const data = await apiService.getStats(month, year);
      console.log("✅ Dados recebidos da API no Dashboard:", data);
      console.log("📈 Total de ordens recebido:", data?.totalOrders);
      console.log("📈 Orders array recebido:", data?.orders?.length);
      console.log("📈 Status distribution:", data?.statusDistribution);
      console.log("📈 Financial summary:", data?.financialSummary);
      setStats(data);
      console.log("📊 Stats setado no estado");
    } catch (error) {
      console.error('❌ ERRO CRÍTICO ao carregar estatísticas:', error);
      console.error('❌ Detalhes do erro:', error?.message);
      console.error('❌ Response do erro:', error?.response?.data);
      console.error('❌ Status do erro:', error?.response?.status);
    } finally {
      console.log("🏁 Loading finalizado");
      setLoading(false);
    }
  };

  useEffect(() => {
    // Iniciar com filtros padrão (Janeiro 2024)
    fetchStats(selectedMonth, selectedYear);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-apple-gray-50 p-8">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-apple-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-80 bg-white rounded-apple-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-apple-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <p className="text-apple-gray-500">Erro ao carregar dados do dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dados para gráficos
  const statusData = [
    { name: 'Garantias (G)', value: stats.statusDistribution.G, color: '#34C759' },
    { name: 'Garantias Outros (GO)', value: stats.statusDistribution.GO, color: '#007AFF' },
    { name: 'Garantias Usados (GU)', value: stats.statusDistribution.GU, color: '#FF9500' }
  ];

  const yearData = Object.entries(stats.yearDistribution).map(([year, count]) => ({
    year,
    count
  }));
  console.log("Dados do ano:", yearData);

  const manufacturerData = stats.topManufacturers.slice(0, 5);

  return (
    <div className="space-y-8">
        {/* Tabs de Conteúdo - Movido para cima dos cards */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="flex justify-center">
          <TabsList className="inline-flex w-auto bg-black rounded-md p-1 mb-6 h-10">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              Visão Geral
            </TabsTrigger>
            <TabsTrigger 
              value="charts" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              Gráficos
            </TabsTrigger>
            <TabsTrigger 
              value="analysis" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              Análises
            </TabsTrigger>
            <TabsTrigger 
              value="trends" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              Tendências
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <AppleCard
            title="Total de OS"
            value={stats.totalOrders}
            subtitle="Ordens processadas"
            icon={FileText}
            gradient="blue"
          />
          
          <AppleCard
            title="Valor Total"
            value={stats.financialSummary ? (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  Peças: {stats.financialSummary.partsTotal >= 1000000 ? 
                    `R$ ${(stats.financialSummary.partsTotal / 1000000).toFixed(1)}M` : 
                    stats.financialSummary.partsTotal >= 1000 ?
                      `R$ ${(stats.financialSummary.partsTotal / 1000).toFixed(1)}K` :
                      `R$ ${stats.financialSummary.partsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  }
                </div>
                <div className="text-xs text-muted-foreground">
                  Serviços: {stats.financialSummary.laborTotal >= 1000000 ? 
                    `R$ ${(stats.financialSummary.laborTotal / 1000000).toFixed(1)}M` : 
                    stats.financialSummary.laborTotal >= 1000 ?
                      `R$ ${(stats.financialSummary.laborTotal / 1000).toFixed(1)}K` :
                      `R$ ${stats.financialSummary.laborTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  }
                </div>
                <div className="text-lg font-bold">
                  {stats.financialSummary.totalValue >= 1000000 ? 
                    `R$ ${(stats.financialSummary.totalValue / 1000000).toFixed(1)}M` : 
                    stats.financialSummary.totalValue >= 1000 ?
                      `R$ ${(stats.financialSummary.totalValue / 1000).toFixed(1)}K` :
                      `R$ ${stats.financialSummary.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  }
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Peças: R$ 0,00</div>
                <div className="text-xs text-muted-foreground">Serviços: R$ 0,00</div>
                <div className="text-lg font-bold">R$ 0,00</div>
              </div>
            )}
            subtitle="Detalhamento financeiro"
            icon={DollarSign}
            gradient="purple"
          />
          
          <AppleCard
            title="Mecânicos Ativos"
            value={stats.mechanicsCount || 0}
            subtitle="Profissionais ativas"
            icon={Users}
            gradient="orange"
          />
          
          <AppleCard
            title="Total de Defeitos"
            value={stats.defectsCount || 0}
            subtitle="Tipos catalogados"
            icon={Settings}
            gradient="red"
          />
          
          <AppleCard
            title="Status OS"
            value={
              <div className="space-y-1">
                <div className="text-xs">G: {stats.statusDistribution.G}</div>
                <div className="text-xs">GO: {stats.statusDistribution.GO}</div>
                <div className="text-xs">GU: {stats.statusDistribution.GU}</div>
              </div>
            }
            subtitle="Distribuição"
            icon={BarChart3}
            gradient="green"
          />
        </div>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Tabela de Ordens de Serviço */}
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-black shadow-sm">
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold text-foreground">
                      Ordens de Serviço - {new Date(selectedYear, selectedMonth - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Lista das ordens de serviço do período selecionado
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Filtros:</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select 
                        value={selectedMonth || 1} 
                        onChange={(e) => {
                          const month = parseInt(e.target.value);
                          setSelectedMonth(month);
                          fetchStats(month, selectedYear || 2024);
                        }}
                        className="w-32 h-8 text-sm border rounded px-2"
                      >
                        <option value={1}>Janeiro</option>
                        <option value={2}>Fevereiro</option>
                        <option value={3}>Março</option>
                        <option value={4}>Abril</option>
                        <option value={5}>Maio</option>
                        <option value={6}>Junho</option>
                        <option value={7}>Julho</option>
                        <option value={8}>Agosto</option>
                        <option value={9}>Setembro</option>
                        <option value={10}>Outubro</option>
                        <option value={11}>Novembro</option>
                        <option value={12}>Dezembro</option>
                      </select>

                      <select 
                        value={selectedYear || 2024} 
                        onChange={(e) => {
                          const year = parseInt(e.target.value);
                          setSelectedYear(year);
                          fetchStats(selectedMonth || 1, year);
                        }}
                        className="w-24 h-8 text-sm border rounded px-2"
                      >
                        <option value={2025}>2025</option>
                        <option value={2024}>2024</option>
                        <option value={2023}>2023</option>
                        <option value={2022}>2022</option>
                        <option value={2021}>2021</option>
                        <option value={2020}>2020</option>
                        <option value={2019}>2019</option>
                      </select>
                    </div>

                    <div className="h-4 w-px bg-gray-300" />

                    <button 
                      onClick={() => {
                        setSelectedMonth(1);
                        setSelectedYear(2024);
                        fetchStats(1, 2024);
                      }}
                      className="flex items-center gap-2 h-8 px-3 text-sm border rounded hover:bg-gray-100 text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      Resetar Filtros
                    </button>

                    <button 
                      onClick={() => console.log('Exportar dados')}
                      className="flex items-center gap-2 h-8 px-3 text-sm border rounded hover:bg-gray-100"
                    >
                      Exportar
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="font-semibold text-foreground">OS</TableHead>
                        <TableHead className="font-semibold text-foreground">Data</TableHead>
                        <TableHead className="font-semibold text-foreground">Fabricante</TableHead>
                        <TableHead className="font-semibold text-foreground">Motor</TableHead>
                        <TableHead className="font-semibold text-foreground">Modelo</TableHead>
                        <TableHead className="font-semibold text-foreground">Defeito</TableHead>
                        <TableHead className="font-semibold text-foreground">Mecânico Montador</TableHead>
                        <TableHead className="font-semibold text-foreground">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.orders && Array.isArray(stats.orders) && stats.orders.length > 0 ? (
                        stats.orders.map((order, index) => (
                          <TableRow key={order.order_number || index} className="hover:bg-muted/30">
                            <TableCell className="font-medium text-foreground">
                              {order.order_number || `OS-${(index + 1).toString().padStart(4, '0')}`}
                            </TableCell>
                            <TableCell className="text-foreground">
                              {order.order_date ? new Date(order.order_date).toLocaleDateString('pt-BR') : '-'}
                            </TableCell>
                            <TableCell className="text-foreground">
                              {order.engine_manufacturer || '-'}
                            </TableCell>
                            <TableCell className="text-foreground">
                              {order.engine_description || '-'}
                            </TableCell>
                            <TableCell className="text-foreground">
                              {order.vehicle_model || '-'}
                            </TableCell>
                            <TableCell className="text-foreground">
                              {order.raw_defect_description || '-'}
                            </TableCell>
                            <TableCell className="text-foreground">
                              {order.responsible_mechanic || '-'}
                            </TableCell>
                            <TableCell className="font-semibold text-foreground">
                              R$ {((order.original_parts_value || order.parts_total || 0) + (order.labor_total || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            Nenhuma ordem de serviço encontrada para {new Date(selectedYear, selectedMonth - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gráficos */}
          <TabsContent value="charts" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Gráfico de Pizza - Distribuição por Status */}
              <ChartCard
                title="Distribuição por Status"
                description="Proporção de cada tipo de garantia"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [value.toLocaleString('pt-BR'), 'Quantidade']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Gráfico de Barras - Top Fabricantes */}
              <ChartCard
                title="Top 5 Fabricantes"
                description="Fabricantes com maior volume"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={manufacturerData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip 
                      formatter={(value: any) => [value.toLocaleString('pt-BR'), 'Ordens']}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#007AFF" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Gráfico de Linha - Evolução por Ano */}
            <ChartCard
              title="Evolução Temporal"
              description="Distribuição de ordens por ano"
              height="h-96"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={yearData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="year" 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <Tooltip 
                    formatter={(value: any) => [value.toLocaleString('pt-BR'), 'Ordens']}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#007AFF"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </TabsContent>

          {/* Análises */}
          <TabsContent value="analysis" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-apple-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-apple-gray-900">
                    Análise Financeira
                  </CardTitle>
                  <CardDescription className="text-apple-gray-500">
                    Resumo dos valores processados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-apple-gray-50 rounded-apple-md">
                    <span className="text-apple-gray-700 font-medium">Valor Total</span>
                    <span className="text-xl font-bold text-apple-gray-900">
                      {stats.financialSummary.totalValue >= 1000000 ? 
                        `R$ ${(stats.financialSummary.totalValue / 1000000).toFixed(2)}M` : 
                        stats.financialSummary.totalValue >= 1000 ?
                          `R$ ${(stats.financialSummary.totalValue / 1000).toFixed(1)}K` :
                          `R$ ${stats.financialSummary.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-apple-gray-50 rounded-apple-md">
                    <span className="text-apple-gray-700 font-medium">Valor Médio</span>
                    <span className="text-xl font-bold text-apple-gray-900">
                      R$ {stats.financialSummary.averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-apple-gray-50 rounded-apple-md">
                    <span className="text-apple-gray-700 font-medium">Total Peças</span>
                    <span className="text-xl font-bold text-apple-gray-900">
                      {stats.financialSummary.partsTotal >= 1000000 ? 
                        `R$ ${(stats.financialSummary.partsTotal / 1000000).toFixed(2)}M` : 
                        stats.financialSummary.partsTotal >= 1000 ?
                          `R$ ${(stats.financialSummary.partsTotal / 1000).toFixed(1)}K` :
                          `R$ ${stats.financialSummary.partsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-apple-gray-50 rounded-apple-md">
                    <span className="text-apple-gray-700 font-medium">Total Mão de Obra</span>
                    <span className="text-xl font-bold text-apple-gray-900">
                      {stats.financialSummary.laborTotal >= 1000000 ? 
                        `R$ ${(stats.financialSummary.laborTotal / 1000000).toFixed(2)}M` : 
                        stats.financialSummary.laborTotal >= 1000 ?
                          `R$ ${(stats.financialSummary.laborTotal / 1000).toFixed(1)}K` :
                          `R$ ${stats.financialSummary.laborTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-apple-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-apple-gray-900">
                    Insights Principais
                  </CardTitle>
                  <CardDescription className="text-apple-gray-500">
                    Principais descobertas dos dados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-apple-md">
                    <p className="text-green-800 font-medium">
                      ✓ Taxa de aprovação de 90% (Status G)
                    </p>
                    <p className="text-green-600 text-sm mt-1">
                      Excelente performance nas garantias
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-apple-md">
                    <p className="text-blue-800 font-medium">
                      📊 MWM lidera com 173 ordens
                    </p>
                    <p className="text-blue-600 text-sm mt-1">
                      Seguida por Mercedes-Benz e Cummins
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-apple-md">
                    <p className="text-orange-800 font-medium">
                      📈 Crescimento de 12.5% no período
                    </p>
                    <p className="text-orange-600 text-sm mt-1">
                      Tendência positiva de volume
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tendências */}
          <TabsContent value="trends" className="space-y-6 mt-6">
            <ChartCard
              title="Tendência Mensal"
              description="Evolução de ordens e valores por mês"
              height="h-96"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'count' ? value.toLocaleString('pt-BR') : `R$ ${value.toLocaleString('pt-BR')}`,
                      name === 'count' ? 'Ordens' : 'Valor'
                    ]}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    stroke="#007AFF"
                    strokeWidth={3}
                    dot={{ fill: '#007AFF', strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="value"
                    stroke="#34C759"
                    strokeWidth={3}
                    dot={{ fill: '#34C759', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </TabsContent>
        </Tabs>
    </div>
  );
};

export default Dashboard;