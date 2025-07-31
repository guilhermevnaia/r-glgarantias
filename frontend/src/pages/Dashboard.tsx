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
  Activity,
  Download,
  Wrench,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { AppleCard } from '@/components/AppleCard';
import { ChartCard } from "@/components/ChartCard";
import { DashboardStats } from "@/services/api";
import { useDashboardStats } from "@/hooks/useGlobalData";
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
  // Definir mês e ano atual
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // Janeiro é 0, então somamos 1
  const currentYear = currentDate.getFullYear();
  
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth || currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(initialYear || currentYear);

  // ✅ USANDO ESTADO GLOBAL SINCRONIZADO
  const { data: stats, isLoading: loading, error } = useDashboardStats(selectedMonth, selectedYear);
  
  // Buscar dados do mês anterior para comparação
  const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
  const { data: previousMonthStats } = useDashboardStats(prevMonth, prevYear);
  
  // Buscar dados do ano completo para tendência
  const { data: yearTrendStats } = useDashboardStats(undefined, selectedYear);

  console.log("📊 Dashboard usando dados sincronizados:", { 
    loading, 
    stats: !!stats, 
    previousMonthStats: !!previousMonthStats 
  });

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
    { name: 'Garantia (G)', value: stats.statusDistribution.G, color: '#FF3B30' },
    { name: 'Garantia Oficina (GO)', value: stats.statusDistribution.GO, color: '#FF9500' },
    { name: 'Garantia Usinagem (GU)', value: stats.statusDistribution.GU, color: '#FFCC00' }
  ];

  const yearData = Object.entries(stats.yearDistribution).map(([year, count]) => ({
    year,
    count
  }));
  console.log("Dados do ano:", yearData);

  const manufacturerData = stats.topManufacturers.slice(0, 5);

  return (
    <div className="space-y-8">
        {/* Tabs de Conteúdo */}
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
                value="comparative_analysis" 
                className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
              >
                Análise Comparativa
              </TabsTrigger>
              <TabsTrigger 
                value="evaluation" 
                className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
              >
                Avaliação IA
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <AppleCard
                title="Total de OS"
                value={stats.totalOrders}
                icon={FileText}
                gradient="blue"
                trend={{
                  value: `${previousMonthStats?.totalOrders ?? 0}`,
                  isPositive: stats.totalOrders < (previousMonthStats?.totalOrders ?? 0),
                }}
              />
              <AppleCard
                title="Valor Total"
                value={`R$ ${(stats.financialSummary.totalValue / 1000).toFixed(0)}k`}
                icon={DollarSign}
                gradient="purple"
                trend={{
                  value: `R$ ${((previousMonthStats?.financialSummary.totalValue ?? 0) / 1000).toFixed(0)}k`,
                  isPositive: stats.financialSummary.totalValue < (previousMonthStats?.financialSummary.totalValue ?? 0),
                }}
              />
              <AppleCard
                title="Mecânicos Ativos"
                value={stats.mechanicsCount || 0}
                icon={Users}
                gradient="orange"
                trend={{
                  value: `${previousMonthStats?.mechanicsCount ?? 0}`,
                  isPositive: stats.mechanicsCount < (previousMonthStats?.mechanicsCount ?? 0),
                }}
              />
              <AppleCard
                title="Total de Defeitos"
                value={stats.defectsCount || 0}
                icon={Wrench}
                gradient="red"
                trend={{
                  value: `${previousMonthStats?.defectsCount ?? 0}`,
                  isPositive: stats.defectsCount < (previousMonthStats?.defectsCount ?? 0),
                }}
              />
            </div>

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
                        setSelectedMonth(currentMonth);
                        setSelectedYear(currentYear);
                      }}
                      className="flex items-center gap-2 h-8 px-3 text-sm border rounded hover:bg-gray-100 text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      Mês Atual
                    </button>

                    <button 
                      onClick={() => {
                        // Função de exportação completa
                        const exportData = {
                          periodo: `${new Date(selectedYear, selectedMonth - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`,
                          resumo: {
                            totalOrdens: stats.totalOrders,
                            valorTotal: stats.financialSummary.totalValue,
                            valorMedio: stats.financialSummary.averageValue,
                            mecanicosAtivos: stats.mechanicsCount,
                            tiposDefeitos: stats.defectsCount
                          },
                          distribuicaoStatus: stats.statusDistribution,
                          ordens: stats.orders,
                          fabricantes: stats.topManufacturers,
                          tendenciaMensal: stats.monthlyTrend,
                          distribuicaoAnual: stats.yearDistribution
                        };
                        
                        const dataStr = JSON.stringify(exportData, null, 2);
                        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                        
                        const exportFileDefaultName = `dashboard-${selectedYear}-${selectedMonth.toString().padStart(2, '0')}.json`;
                        
                        const linkElement = document.createElement('a');
                        linkElement.setAttribute('href', dataUri);
                        linkElement.setAttribute('download', exportFileDefaultName);
                        linkElement.click();
                      }}
                      className="flex items-center gap-2 h-8 px-3 text-sm border rounded hover:bg-gray-100 text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Download className="h-4 w-4" />
                      Exportar Dados
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
                              R$ {(((order.original_parts_value || order.parts_total || 0) / 2) + (order.labor_total || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

          {/* Análise Comparativa */}
          <TabsContent value="comparative_analysis" className="space-y-8 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Distribuição por Status de Garantias"
                description="Comparativo de garantias com o mês anterior"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={[
                      { name: 'G', atual: stats.statusDistribution.G, anterior: previousMonthStats?.statusDistribution.G ?? 0 },
                      { name: 'GO', atual: stats.statusDistribution.GO, anterior: previousMonthStats?.statusDistribution.GO ?? 0 },
                      { name: 'GU', atual: stats.statusDistribution.GU, anterior: previousMonthStats?.statusDistribution.GU ?? 0 },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="anterior" name="Mês Anterior" fill="#A1A1AA" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="atual" name="Mês Atual" fill="#007AFF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Top 5 Modelos de Motor"
                description={`Modelos com maior volume em ${new Date(selectedYear, selectedMonth - 1).toLocaleString('pt-BR', { month: 'long' })}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={stats.orders ? 
                      Object.entries(
                        stats.orders.reduce((acc: any, order: any) => {
                          const model = order.engine_description || 'Não informado';
                          acc[model] = (acc[model] || 0) + 1;
                          return acc;
                        }, {})
                      )
                      .sort(([,a]: any, [,b]: any) => b - a)
                      .slice(0, 5)
                      .map(([name, count]) => ({ 
                        name: name.length > 15 ? name.substring(0, 15) + '...' : name, 
                        value: count 
                      }))
                      : []
                    }
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip formatter={(value: any) => [value, 'Ordens']} contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="#34C759" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Mecânicos Mais Ativos"
                description={`Top 5 com mais ordens em ${new Date(selectedYear, selectedMonth - 1).toLocaleString('pt-BR', { month: 'long' })}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.orders ? 
                      Object.entries(
                        stats.orders.reduce((acc: any, order: any) => {
                          const mechanic = order.responsible_mechanic || 'Não informado';
                          acc[mechanic] = (acc[mechanic] || 0) + 1;
                          return acc;
                        }, {})
                      )
                      .filter(([name]) => name !== 'TESTE' && name !== 'Não informado')
                      .sort(([,a]: any, [,b]: any) => b - a)
                      .slice(0, 5)
                      .map(([name, count]) => ({ 
                        name: name.length > 12 ? name.substring(0, 12) + '...' : name, 
                        value: count 
                      }))
                      : []
                    }
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip formatter={(value: any) => [value, 'OS Atendidas']} contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="#FF9500" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Principais Tipos de Defeitos"
                description={`Categorias mais frequentes em ${new Date(selectedYear, selectedMonth - 1).toLocaleString('pt-BR', { month: 'long' })}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.orders ? 
                      Object.entries(
                        stats.orders.reduce((acc: any, order: any) => {
                          let defect = order.raw_defect_description;
                          if (!defect || defect === 'null' || defect.trim() === '') {
                            defect = 'Não informado';
                          } else {
                            defect = defect.toUpperCase();
                            if (defect.includes('VAZAMENTO')) defect = 'VAZAMENTO';
                            else if (defect.includes('BARULHO')) defect = 'BARULHO/RUÍDO';
                            else if (defect.includes('QUEBROU') || defect.includes('QUEBR') || defect.includes('DANIFIC')) defect = 'QUEBRA/DANO';
                            else if (defect.includes('AQUEC') || defect.includes('ESQUENT')) defect = 'AQUECIMENTO';
                            else if (defect.includes('OLEO') || defect.includes('ÓLEO')) defect = 'PROBLEMA ÓLEO';
                            else if (defect.includes('FALH') || defect.includes('FALHANDO') || defect.includes('NÃO PEGA')) defect = 'FALHA FUNCIONAMENTO';
                            else defect = 'OUTROS';
                          }
                          acc[defect] = (acc[defect] || 0) + 1;
                          return acc;
                        }, {})
                      )
                      .sort(([,a]: any, [,b]: any) => b - a)
                      .slice(0, 5)
                      .map(([name, count]) => ({ name, value: count }))
                      : []
                    }
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip formatter={(value: any) => [value, 'Ocorrências']} contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="#FF3B30" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Tabela Comparativa Detalhada */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Análise Detalhada vs. Mês Anterior</CardTitle>
                <CardDescription className="mt-1">
                  Comparativo completo dos indicadores de performance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Métrica</TableHead>
                      <TableHead className="text-right font-semibold">Mês Atual</TableHead>
                      <TableHead className="text-right font-semibold">Mês Anterior</TableHead>
                      <TableHead className="text-right font-semibold">Variação (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        metric: 'Total de Ordens de Serviço',
                        current: stats.totalOrders,
                        previous: previousMonthStats?.totalOrders ?? 0,
                        isImprovement: (current, previous) => current < previous,
                        format: (value) => value.toLocaleString('pt-BR'),
                      },
                      {
                        metric: 'Valor Financeiro Total',
                        current: stats.financialSummary.totalValue,
                        previous: previousMonthStats?.financialSummary.totalValue ?? 0,
                        isImprovement: (current, previous) => current < previous,
                        format: (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      },
                      {
                        metric: 'Valor Médio por OS',
                        current: stats.financialSummary.averageValue,
                        previous: previousMonthStats?.financialSummary.averageValue ?? 0,
                        isImprovement: (current, previous) => current < previous,
                        format: (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      },
                      {
                        metric: 'Total de Garantias (G+GO+GU)',
                        current: stats.statusDistribution.G + stats.statusDistribution.GO + stats.statusDistribution.GU,
                        previous: (previousMonthStats?.statusDistribution.G ?? 0) + (previousMonthStats?.statusDistribution.GO ?? 0) + (previousMonthStats?.statusDistribution.GU ?? 0),
                        isImprovement: (current, previous) => current < previous,
                        format: (value) => value.toLocaleString('pt-BR'),
                      },
                      {
                        metric: 'Taxa de Garantia',
                        current: stats.totalOrders > 0 ? ((stats.statusDistribution.G + stats.statusDistribution.GO + stats.statusDistribution.GU) / stats.totalOrders) * 100 : 0,
                        previous: (previousMonthStats?.totalOrders ?? 0) > 0 ? (((previousMonthStats?.statusDistribution.G ?? 0) + (previousMonthStats?.statusDistribution.GO ?? 0) + (previousMonthStats?.statusDistribution.GU ?? 0)) / (previousMonthStats?.totalOrders ?? 1)) * 100 : 0,
                        isImprovement: (current, previous) => current < previous,
                        format: (value) => `${value.toFixed(1)}%`,
                      },
                      {
                        metric: 'Mecânicos Ativos',
                        current: stats.mechanicsCount,
                        previous: previousMonthStats?.mechanicsCount ?? 0,
                        isImprovement: (current, previous) => current > previous, // More mechanics can be good
                        format: (value) => value.toLocaleString('pt-BR'),
                      },
                      {
                        metric: 'Total de Tipos de Defeitos',
                        current: stats.defectsCount,
                        previous: previousMonthStats?.defectsCount ?? 0,
                        isImprovement: (current, previous) => current < previous,
                        format: (value) => value.toLocaleString('pt-BR'),
                      },
                    ].map(({ metric, current, previous, isImprovement, format }) => {
                      const variation = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;
                      const improved = isImprovement(current, previous);

                      return (
                        <TableRow key={metric}>
                          <TableCell className="font-medium">{metric}</TableCell>
                          <TableCell className="text-right">{format(current)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{format(previous)}</TableCell>
                          <TableCell className={`text-right font-bold ${variation === 0 ? 'text-gray-500' : improved ? 'text-green-600' : 'text-red-600'}`}>
                            <div className="flex items-center justify-end gap-2">
                              <span>{variation.toFixed(1)}%</span>
                              {variation !== 0 && (improved ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />)}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Avaliação IA */}
          <TabsContent value="evaluation" className="space-y-6 mt-6">
            <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 shadow-sm">
              <CardHeader className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center mb-6">
                  <Activity className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-purple-900 mb-4">
                  Relatório de Avaliação Inteligente
                </CardTitle>
                <CardDescription className="text-purple-700 text-lg max-w-2xl mx-auto">
                  Este espaço será preenchido automaticamente por uma IA que analisará todos os dados do período de{' '}
                  <strong>{new Date(selectedYear, selectedMonth - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</strong>
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
};

export default Dashboard;