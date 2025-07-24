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

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiService.getStats();
        console.log("Dados da API:", data);
        setStats(data);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
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
    <div className="min-h-screen bg-apple-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-apple-gray-200 p-6 mb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-apple-gray-900 mb-2">
            Sistema LÚCIO
          </h1>
          <p className="text-apple-gray-500 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Dashboard de Análise de Garantias - Dados em tempo real
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AppleCard
            title="Total de Ordens"
            value={stats.totalOrders}
            subtitle="Ordens processadas"
            icon={FileText}
            trend={{ value: "+12.5%", isPositive: true }}
            gradient="blue"
          />
          
          <AppleCard
            title="Garantias Aprovadas"
            value={stats.statusDistribution.G}
            subtitle={`${((stats.statusDistribution.G / stats.totalOrders) * 100).toFixed(1)}% do total`}
            icon={CheckCircle}
            trend={{ value: "+8.3%", isPositive: true }}
            gradient="green"
          />
          
          <AppleCard
            title="Valor Total"
            value={`R$ ${(stats.financialSummary.totalValue / 1000000).toFixed(1)}M`}
            subtitle="Em garantias processadas"
            icon={DollarSign}
            trend={{ value: "+15.2%", isPositive: true }}
            gradient="purple"
          />
          
          <AppleCard
            title="Valor Médio"
            value={`R$ ${stats.financialSummary.averageValue.toFixed(0)}`}
            subtitle="Por ordem de serviço"
            icon={Activity}
            trend={{ value: "+5.7%", isPositive: true }}
            gradient="orange"
          />
        </div>

        {/* Tabs de Conteúdo */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-apple-sm rounded-apple-md">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-apple-blue data-[state=active]:text-white font-medium rounded-apple-sm"
            >
              Visão Geral
            </TabsTrigger>
            <TabsTrigger 
              value="charts" 
              className="data-[state=active]:bg-apple-blue data-[state=active]:text-white font-medium rounded-apple-sm"
            >
              Gráficos
            </TabsTrigger>
            <TabsTrigger 
              value="analysis" 
              className="data-[state=active]:bg-apple-blue data-[state=active]:text-white font-medium rounded-apple-sm"
            >
              Análises
            </TabsTrigger>
            <TabsTrigger 
              value="trends" 
              className="data-[state=active]:bg-apple-blue data-[state=active]:text-white font-medium rounded-apple-sm"
            >
              Tendências
            </TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cards de Status */}
              <AppleCard
                title="Garantias (G)"
                value={stats.statusDistribution.G}
                subtitle={`${((stats.statusDistribution.G / stats.totalOrders) * 100).toFixed(1)}% do total`}
                icon={CheckCircle}
                gradient="green"
              />
              
              <AppleCard
                title="Garantias Outros (GO)"
                value={stats.statusDistribution.GO}
                subtitle={`${((stats.statusDistribution.GO / stats.totalOrders) * 100).toFixed(1)}% do total`}
                icon={Settings}
                gradient="blue"
              />
              
              <AppleCard
                title="Garantias Usados (GU)"
                value={stats.statusDistribution.GU}
                subtitle={`${((stats.statusDistribution.GU / stats.totalOrders) * 100).toFixed(1)}% do total`}
                icon={Truck}
                gradient="orange"
              />
            </div>

            {/* Tabela de Top Fabricantes */}
            <Card className="bg-white/80 backdrop-blur-sm border-apple-gray-200 shadow-apple-md">
              <CardHeader className="border-b border-apple-gray-100">
                <CardTitle className="text-xl font-semibold text-apple-gray-900">
                  Top Fabricantes
                </CardTitle>
                <CardDescription className="text-apple-gray-500">
                  Fabricantes com maior volume de ordens
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-apple-gray-50/50 hover:bg-apple-gray-50/50">
                      <TableHead className="font-semibold text-apple-gray-700">Fabricante</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Quantidade</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Participação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.topManufacturers.map((manufacturer, index) => (
                      <TableRow key={manufacturer.name} className="hover:bg-apple-gray-50/30">
                        <TableCell className="font-medium text-apple-gray-900">
                          {manufacturer.name}
                        </TableCell>
                        <TableCell className="text-apple-gray-700">
                          {manufacturer.count.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className="bg-apple-blue/10 text-apple-blue border-apple-blue/20"
                          >
                            {((manufacturer.count / stats.totalOrders) * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
              <Card className="bg-white/80 backdrop-blur-sm border-apple-gray-200 shadow-apple-md">
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
                      R$ {(stats.financialSummary.totalValue / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-apple-gray-50 rounded-apple-md">
                    <span className="text-apple-gray-700 font-medium">Valor Médio</span>
                    <span className="text-xl font-bold text-apple-gray-900">
                      R$ {stats.financialSummary.averageValue.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-apple-gray-50 rounded-apple-md">
                    <span className="text-apple-gray-700 font-medium">Total Peças</span>
                    <span className="text-xl font-bold text-apple-gray-900">
                      R$ {(stats.financialSummary.partsTotal / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-apple-gray-50 rounded-apple-md">
                    <span className="text-apple-gray-700 font-medium">Total Mão de Obra</span>
                    <span className="text-xl font-bold text-apple-gray-900">
                      R$ {(stats.financialSummary.laborTotal / 1000000).toFixed(2)}M
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-apple-gray-200 shadow-apple-md">
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
    </div>
  );
};

export default Dashboard;