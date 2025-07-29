import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  CheckCircle2,
  DollarSign,
  Target,
  Award,
  AlertCircle,
  Lightbulb,
  Calendar,
  Activity
} from "lucide-react";
import { MinimalCard } from '@/components/MinimalCard';
import { MinimalChartCard } from "@/components/MinimalChartCard";
import { apiService, DashboardStats } from "@/services/api";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter
} from 'recharts';

const Analysis = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiService.getStats();
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
          <div className="h-8 bg-white rounded-apple-lg w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-apple-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
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
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-apple-gray-500">Erro ao carregar dados de análise</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Cálculos baseados nos dados reais
  const totalRevenue = stats.financialSummary.totalValue;
  const avgOrderValue = stats.financialSummary.averageValue;
  const approvalRate = (stats.statusDistribution.G / stats.totalOrders) * 100;

  // Dados simulados para análises avançadas (em produção viriam da API)
  const performanceMetrics = [
    { metric: 'Qualidade', value: 92, fullMark: 100 },
    { metric: 'Velocidade', value: 78, fullMark: 100 },
    { metric: 'Satisfação', value: 88, fullMark: 100 },
    { metric: 'Eficiência', value: 82, fullMark: 100 },
    { metric: 'Custo', value: 75, fullMark: 100 }
  ];

  const financialTrend = stats.monthlyTrend.map(item => ({
    month: item.month,
    revenue: item.count * avgOrderValue,
    margin: 15 + Math.random() * 10,
    cost: item.count * avgOrderValue * 0.7
  }));

  const correlationData = stats.topManufacturers.slice(0, 8).map(manufacturer => ({
    name: manufacturer.name,
    volume: manufacturer.count,
    avgValue: avgOrderValue + (Math.random() - 0.5) * 1000,
    satisfaction: 4.0 + Math.random() * 1.0
  }));

  const insights = [
    {
      type: 'positive',
      title: 'Crescimento Sustentável',
      description: 'Taxa de aprovação aumentou 8.3% no último mês, indicando melhoria na qualidade dos serviços.',
      impact: 'Alto',
      action: 'Manter estratégia atual'
    },
    {
      type: 'warning',
      title: 'Oportunidade de Otimização',
      description: 'Tempo médio de processamento pode ser reduzido em 15% com automação.',
      impact: 'Médio',
      action: 'Implementar automação'
    },
    {
      type: 'info',
      title: 'Tendência de Mercado',
      description: 'Aumento de 23% em garantias de veículos elétricos nos últimos 6 meses.',
      impact: 'Médio',
      action: 'Capacitar equipe'
    }
  ];

  const recommendations = [
    {
      priority: 'Alta',
      title: 'Implementar IA Preditiva',
      description: 'Usar machine learning para prever defeitos e reduzir custos em 20%',
      roi: '+R$ 450k/ano',
      effort: '3-4 meses'
    },
    {
      priority: 'Média',
      title: 'Otimizar Processo de Aprovação',
      description: 'Automatizar aprovações simples para reduzir tempo de resposta',
      roi: '+R$ 180k/ano',
      effort: '1-2 meses'
    },
    {
      priority: 'Baixa',
      title: 'Expandir Parcerias',
      description: 'Aumentar rede de fornecedores para melhorar disponibilidade de peças',
      roi: '+R$ 120k/ano',
      effort: '2-3 meses'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Tabs de Análises */}
      <Tabs defaultValue="performance" className="w-full">
        <div className="flex justify-center">
          <TabsList className="inline-flex w-auto bg-black rounded-md p-1 mb-6 h-10">
            <TabsTrigger 
              value="performance" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              Performance
            </TabsTrigger>
            <TabsTrigger 
              value="financial" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              Financeiro
            </TabsTrigger>
            <TabsTrigger 
              value="trends" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              Tendências
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              Insights
            </TabsTrigger>
          </TabsList>
        </div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AppleCard
            title="Total de Ordens"
            value={stats.totalOrders}
            subtitle="Ordens processadas"
            icon={Activity}
            gradient="blue"
          />
          
          <AppleCard
            title="Taxa de Aprovação"
            value={`${approvalRate.toFixed(1)}%`}
            subtitle="Garantias aprovadas"
            icon={CheckCircle2}
            gradient="green"
          />
          
          <AppleCard
            title="Receita Total"
            value={`R$ ${(totalRevenue / 1000000).toFixed(1)}M`}
            subtitle="Em garantias processadas"
            icon={DollarSign}
            gradient="purple"
          />
          
          <AppleCard
            title="Ticket Médio"
            value={`R$ ${avgOrderValue.toFixed(0)}`}
            subtitle="Por ordem de serviço"
            icon={Target}
            gradient="orange"
          />
        </div>

          {/* Performance */}
          <TabsContent value="performance" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Radar de Performance */}
              <Card className="bg-white border-2 border-black shadow-md">
                <CardHeader className="pb-4 border-b border-border">
                  <CardTitle className="text-xl font-semibold text-foreground">
                    Radar de Performance
                  </CardTitle>
                  <CardDescription className="text-muted-foreground font-medium">
                    Análise multidimensional dos indicadores
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={performanceMetrics}>
                    <PolarGrid stroke="#E5E7EB" />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                    />
                    <Radar
                      name="Performance"
                      dataKey="value"
                      stroke="#007AFF"
                      fill="#007AFF"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Distribuição por Status */}
              <Card className="bg-white border-2 border-black shadow-md">
                <CardHeader className="pb-4 border-b border-border">
                  <CardTitle className="text-xl font-semibold text-foreground">
                    Distribuição por Status
                  </CardTitle>
                  <CardDescription className="text-muted-foreground font-medium">
                    Proporção de cada tipo de garantia
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Garantias (G)', value: stats.statusDistribution.G, color: '#34C759' },
                        { name: 'Garantias Outros (GO)', value: stats.statusDistribution.GO, color: '#007AFF' },
                        { name: 'Garantias Usados (GU)', value: stats.statusDistribution.GU, color: '#FF9500' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {[
                        { name: 'Garantias (G)', value: stats.statusDistribution.G, color: '#34C759' },
                        { name: 'Garantias Outros (GO)', value: stats.statusDistribution.GO, color: '#007AFF' },
                        { name: 'Garantias Usados (GU)', value: stats.statusDistribution.GU, color: '#FF9500' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [value.toLocaleString('pt-BR'), 'Quantidade'                    </Tooltip>
                  </RechartsPieChart>
                </ResponsiveContainer>
                </CardContent>
              </Card>
            </d            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {performanceMetrics.map((metric, index) => (
                <Card key={index} className="bg-white border-2 border-black shadow-md">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <h3 className="font-semibold text-apple-gray-900 mb-2">{metric.metric}</h3>
                      <div className="text-3xl font-bold text-apple-blue mb-2">{metric.value}%</div>
                      <div className="w-full bg-apple-gray-200 rounded-full h-2">
                        <div 
                          className="bg-apple-blue h-2 rounded-full transition-all duration-500"
                          style={{ width: `${metric.value}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Financeiro */}
          <TabsContent value="financial" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Evolução da Receita */}
              <ChartCard
                title="Evolução da Receita"
                description="Tendência mensal de faturamento"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={financialTrend}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip 
                      formatter={(value: any) => [`R$ ${(value / 1000000).toFixed(1)}M`, 'Receita']}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#007AFF"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Análise de Margem */}
              <ChartCard
                title="Análise de Margem"
                description="Receita vs Custo por período"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={financialTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'margin' ? `${value.toFixed(1)}%` : `R$ ${(value / 1000000).toFixed(1)}M`,
                        name === 'margin' ? 'Margem' : name === 'revenue' ? 'Receita' : 'Custo'
                      ]}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      yAxisId="left"
                      dataKey="revenue" 
                      fill="#007AFF" 
                      radius={[4, 4, 0, 0]}
                      name="revenue"
                    />
                    <Bar 
                      yAxisId="left"
                      dataKey="cost" 
                      fill="#FF9500" 
                      radius={[4, 4, 0, 0]}
                      name="cost"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="margin" 
                      stroke="#34C759" 
                      strokeWidth={3}
                      name="margin"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Resumo Financeiro */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Receita Total</p>
                      <p className="text-3xl font-bold text-blue-900">
                        R$ {(stats.financialSummary.totalValue / 1000000).toFixed(2)}M
                      </p>
                      <p className="text-blue-600 text-sm">+15.2% vs mês anterior</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Margem Média</p>
                      <p className="text-3xl font-bold text-green-900">18.5%</p>
                      <p className="text-green-600 text-sm">+2.1% vs mês anterior</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">ROI Médio</p>
                      <p className="text-3xl font-bold text-purple-900">24.3%</p>
                      <p className="text-purple-600 text-sm">+1.8% vs mês anterior</p>
                    </div>
                    <Target className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tendências */}
          <TabsContent value="trends" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Correlação Volume vs Valor */}
              <ChartCard
                title="Correlação Volume vs Valor"
                description="Relação entre quantidade e valor médio por fabricante"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={correlationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      type="number" 
                      dataKey="volume" 
                      name="Volume"
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="avgValue" 
                      name="Valor Médio"
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'volume' ? value.toLocaleString('pt-BR') : `R$ ${value.toFixed(0)}`,
                        name === 'volume' ? 'Volume' : 'Valor Médio'
                      ]}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Scatter 
                      dataKey="avgValue" 
                      fill="#007AFF"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Evolução Temporal */}
              <ChartCard
                title="Evolução Temporal"
                description="Distribuição de ordens por ano"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(stats.yearDistribution).map(([year, count]) => ({
                    year,
                    count
                  }))}>
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
                    <Bar 
                      dataKey="count" 
                      fill="#007AFF" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Top Fabricantes */}
            <Card className="bg-white/80 backdrop-blur-sm border-apple-gray-200 shadow-apple-md">
              <CardHeader className="border-b border-apple-gray-100">
                <CardTitle className="text-xl font-semibold text-apple-gray-900">
                  Análise por Fabricante
                </CardTitle>
                <CardDescription className="text-apple-gray-500">
                  Performance detalhada dos principais fabricantes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-apple-gray-50/50 hover:bg-apple-gray-50/50">
                      <TableHead className="font-semibold text-apple-gray-700">Fabricante</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Volume</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Participação</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Valor Médio</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Tendência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {correlationData.slice(0, 6).map((manufacturer, index) => (
                      <TableRow key={manufacturer.name} className="hover:bg-apple-gray-50/30">
                        <TableCell className="font-medium text-apple-gray-900">
                          {manufacturer.name}
                        </TableCell>
                        <TableCell className="text-apple-gray-700">
                          {manufacturer.volume.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className="bg-apple-blue/10 text-apple-blue border-apple-blue/20"
                          >
                            {((manufacturer.volume / stats.totalOrders) * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-apple-gray-700">
                          R$ {manufacturer.avgValue.toFixed(0)}
                        </TableCell>
                        <TableCell>
                          {index < 3 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights */}
          <TabsContent value="insights" className="space-y-6 mt-6">
            {/* Insights Automáticos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {insights.map((insight, index) => (
                <Card 
                  key={index} 
                  className={`bg-white/80 backdrop-blur-sm shadow-apple-md ${
                    insight.type === 'positive' ? 'border-green-200' :
                    insight.type === 'warning' ? 'border-orange-200' :
                    'border-blue-200'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        insight.type === 'positive' ? 'bg-green-50' :
                        insight.type === 'warning' ? 'bg-orange-50' :
                        'bg-blue-50'
                      }`}>
                        <Lightbulb className={`h-5 w-5 ${
                          insight.type === 'positive' ? 'text-green-600' :
                          insight.type === 'warning' ? 'text-orange-600' :
                          'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-apple-gray-900 mb-2">
                          {insight.title}
                        </h3>
                        <p className="text-sm text-apple-gray-600 mb-3">
                          {insight.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge 
                            className={
                              insight.impact === 'Alto' ? 'bg-red-100 text-red-700 border-red-200' :
                              insight.impact === 'Médio' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                              'bg-blue-100 text-blue-700 border-blue-200'
                            }
                          >
                            {insight.impact}
                          </Badge>
                          <span className="text-xs text-apple-gray-500">
                            {insight.action}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recomendações Estratégicas */}
            <Card className="bg-white/80 backdrop-blur-sm border-apple-gray-200 shadow-apple-md">
              <CardHeader className="border-b border-apple-gray-100">
                <CardTitle className="text-xl font-semibold text-apple-gray-900">
                  Recomendações Estratégicas
                </CardTitle>
                <CardDescription className="text-apple-gray-500">
                  Ações prioritárias para otimização dos resultados
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-apple-gray-50 rounded-apple-md">
                      <div className={`p-2 rounded-lg ${
                        rec.priority === 'Alta' ? 'bg-red-50' :
                        rec.priority === 'Média' ? 'bg-orange-50' :
                        'bg-blue-50'
                      }`}>
                        <Target className={`h-5 w-5 ${
                          rec.priority === 'Alta' ? 'text-red-600' :
                          rec.priority === 'Média' ? 'text-orange-600' :
                          'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-apple-gray-900">{rec.title}</h4>
                          <Badge 
                            className={
                              rec.priority === 'Alta' ? 'bg-red-100 text-red-700 border-red-200' :
                              rec.priority === 'Média' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                              'bg-blue-100 text-blue-700 border-blue-200'
                            }
                          >
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-apple-gray-600 mb-3">{rec.description}</p>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-green-700 font-medium">{rec.roi}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="text-blue-700">{rec.effort}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analysis;

