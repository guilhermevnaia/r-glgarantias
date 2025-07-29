import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Search, 
  Filter,
  Download,
  RefreshCw,
  Wrench,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  BarChart3,
  PieChart,
  Calendar,
  Target
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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart,
  Treemap,
  Sankey,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';

const Defects = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedManufacturer, setSelectedManufacturer] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
            <p className="text-apple-gray-500">Erro ao carregar dados de defeitos</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dados simulados para análise de defeitos (em produção viriam da API)
  const defectCategories = [
    { name: 'Motor', count: 856, percentage: 34.0, severity: 'high', avgCost: 1250 },
    { name: 'Transmissão', count: 634, percentage: 25.2, severity: 'high', avgCost: 980 },
    { name: 'Sistema Elétrico', count: 428, percentage: 17.0, severity: 'medium', avgCost: 650 },
    { name: 'Freios', count: 315, percentage: 12.5, severity: 'medium', avgCost: 420 },
    { name: 'Suspensão', count: 186, percentage: 7.4, severity: 'low', avgCost: 380 },
    { name: 'Outros', count: 100, percentage: 3.9, severity: 'low', avgCost: 280 }
  ];

  const topDefects = [
    { defect: 'Falha no sistema de injeção', count: 234, manufacturer: 'MWM', avgCost: 1450, trend: 'up' },
    { defect: 'Problema na embreagem', count: 198, manufacturer: 'Mercedes-Benz', avgCost: 890, trend: 'down' },
    { defect: 'Vazamento de óleo', count: 176, manufacturer: 'Cummins', avgCost: 650, trend: 'stable' },
    { defect: 'Superaquecimento', count: 154, manufacturer: 'MWM', avgCost: 1200, trend: 'up' },
    { defect: 'Falha no turbo', count: 142, manufacturer: 'Perkins', avgCost: 1800, trend: 'down' },
    { defect: 'Problema no alternador', count: 128, manufacturer: 'Volkswagen', avgCost: 520, trend: 'stable' },
    { defect: 'Desgaste prematuro', count: 115, manufacturer: 'Mercedes-Benz', avgCost: 750, trend: 'up' },
    { defect: 'Falha na bomba d\'água', count: 98, manufacturer: 'Cummins', avgCost: 480, trend: 'down' }
  ];

  const defectsByManufacturer = stats.topManufacturers.map(manufacturer => ({
    name: manufacturer.name,
    total: manufacturer.count,
    motor: Math.floor(manufacturer.count * 0.34),
    transmissao: Math.floor(manufacturer.count * 0.25),
    eletrico: Math.floor(manufacturer.count * 0.17),
    freios: Math.floor(manufacturer.count * 0.12),
    outros: Math.floor(manufacturer.count * 0.12)
  }));

  const monthlyDefectTrend = stats.monthlyTrend.map(item => ({
    month: item.month,
    total: item.count,
    criticos: Math.floor(item.count * 0.15),
    medios: Math.floor(item.count * 0.35),
    baixos: Math.floor(item.count * 0.50)
  }));

  const defectSeverityData = [
    { name: 'Críticos', value: 385, color: '#FF3B30', percentage: 15.3 },
    { name: 'Médios', value: 883, color: '#FF9500', percentage: 35.1 },
    { name: 'Baixos', value: 1251, color: '#34C759', percentage: 49.6 }
  ];

  const costImpactData = defectCategories.map(category => ({
    category: category.name,
    frequency: category.count,
    avgCost: category.avgCost,
    totalCost: category.count * category.avgCost
  }));

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Tabs de Defeitos */}
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
              value="categories" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              Categorias
            </TabsTrigger>
            <TabsTrigger 
              value="trends" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              Tendências
            </TabsTrigger>
            <TabsTrigger 
              value="impact" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              Impacto
            </TabsTrigger>
          </TabsList>
        </div>

        {/* KPIs de Defeitos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AppleCard
            title="Total de Defeitos"
            value="1,247"
            subtitle="Catalogados no sistema"
            icon={AlertTriangle}
            gradient="red"
          />
          
          <AppleCard
            title="Defeitos Críticos"
            value="189"
            subtitle="15.3% do total"
            icon={AlertCircle}
            gradient="orange"
          />
          
          <AppleCard
            title="Custo Médio"
            value="R$ 2.8K"
            subtitle="Por defeito resolvido"
            icon={DollarSign}
            gradient="purple"
          />
          
          <AppleCard
            title="Tempo Médio"
            value="4.2h"
            subtitle="Para resolução"
            icon={Clock}
            gradient="blue"
          />
        </div>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Distribuição por Severidade */}
              <ChartCard
                title="Distribuição por Severidade"
                description="Classificação dos defeitos por criticidade"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={defectSeverityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {defectSeverityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [value.toLocaleString('pt-BR'), 'Quantidade']}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Top Categorias */}
              <ChartCard
                title="Principais Categorias de Defeitos"
                description="Distribuição por tipo de componente"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={defectCategories} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                      width={80}
                    />
                    <Tooltip 
                      formatter={(value: any) => [value.toLocaleString('pt-BR'), 'Ocorrências']}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#FF3B30" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Tabela de Top Defeitos */}
            <Card className="bg-white border-2 border-black shadow-md">
              <CardHeader className="border-b border-apple-gray-100">
                <CardTitle className="text-xl font-semibold text-apple-gray-900">
                  Top 8 Defeitos Mais Frequentes
                </CardTitle>
                <CardDescription className="text-apple-gray-500">
                  Defeitos com maior incidência no sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-apple-gray-50/50 hover:bg-apple-gray-50/50">
                      <TableHead className="font-semibold text-apple-gray-700">Defeito</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Fabricante</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Ocorrências</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Custo Médio</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Tendência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topDefects.map((defect, index) => (
                      <TableRow key={index} className="hover:bg-apple-gray-50/30">
                        <TableCell className="font-medium text-apple-gray-900">
                          {defect.defect}
                        </TableCell>
                        <TableCell className="text-apple-gray-700">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {defect.manufacturer}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-apple-gray-700">
                          {defect.count.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-apple-gray-700">
                          R$ {defect.avgCost.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {getTrendIcon(defect.trend)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Análise por Categorias */}
          <TabsContent value="categories" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Defeitos por Fabricante */}
              <ChartCard
                title="Defeitos por Fabricante"
                description="Distribuição de defeitos por marca"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={defectsByManufacturer}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fill: '#6B7280' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip 
                      formatter={(value: any) => [value.toLocaleString('pt-BR'), 'Defeitos']}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="motor" stackId="a" fill="#FF3B30" name="Motor" />
                    <Bar dataKey="transmissao" stackId="a" fill="#FF9500" name="Transmissão" />
                    <Bar dataKey="eletrico" stackId="a" fill="#007AFF" name="Elétrico" />
                    <Bar dataKey="freios" stackId="a" fill="#34C759" name="Freios" />
                    <Bar dataKey="outros" stackId="a" fill="#8E8E93" name="Outros" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Análise de Custo por Categoria */}
              <ChartCard
                title="Impacto Financeiro por Categoria"
                description="Custo total vs frequência"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={costImpactData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="category"
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'frequency' ? value.toLocaleString('pt-BR') : `R$ ${value.toLocaleString('pt-BR')}`,
                        name === 'frequency' ? 'Frequência' : name === 'avgCost' ? 'Custo Médio' : 'Custo Total'
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
                      dataKey="frequency" 
                      fill="#007AFF" 
                      radius={[4, 4, 0, 0]}
                      name="Frequência"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="avgCost" 
                      stroke="#FF9500" 
                      strokeWidth={3}
                      name="Custo Médio"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Cards de Categorias */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {defectCategories.map((category, index) => (
                <Card key={index} className="bg-white border-2 border-black shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg">
                          <Wrench className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-apple-gray-900">{category.name}</h3>
                          <p className="text-sm text-apple-gray-500">{category.percentage}% do total</p>
                        </div>
                      </div>
                      <Badge className={getSeverityColor(category.severity)}>
                        {category.severity === 'high' ? 'Alto' : category.severity === 'medium' ? 'Médio' : 'Baixo'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-apple-gray-600">Ocorrências</span>
                        <span className="font-semibold text-apple-gray-900">
                          {category.count.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-apple-gray-600">Custo Médio</span>
                        <span className="font-semibold text-apple-gray-900">
                          R$ {category.avgCost.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="w-full bg-apple-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Análise de Tendências */}
          <TabsContent value="trends" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Evolução Mensal */}
              <ChartCard
                title="Evolução Mensal de Defeitos"
                description="Tendência de defeitos por severidade"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyDefectTrend}>
                    <defs>
                      <linearGradient id="colorCriticos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF3B30" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FF3B30" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMedios" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF9500" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FF9500" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBaixos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34C759" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#34C759" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip 
                      formatter={(value: any) => [value.toLocaleString('pt-BR'), 'Defeitos']}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="criticos"
                      stackId="1"
                      stroke="#FF3B30"
                      fill="url(#colorCriticos)"
                      name="Críticos"
                    />
                    <Area
                      type="monotone"
                      dataKey="medios"
                      stackId="1"
                      stroke="#FF9500"
                      fill="url(#colorMedios)"
                      name="Médios"
                    />
                    <Area
                      type="monotone"
                      dataKey="baixos"
                      stackId="1"
                      stroke="#34C759"
                      fill="url(#colorBaixos)"
                      name="Baixos"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Previsão de Defeitos */}
              <ChartCard
                title="Análise Preditiva"
                description="Projeção baseada em tendências históricas"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    ...monthlyDefectTrend,
                    { month: 'Jul', total: 195, criticos: 29, medios: 68, baixos: 98 },
                    { month: 'Ago', total: 210, criticos: 32, medios: 74, baixos: 104 },
                    { month: 'Set', total: 188, criticos: 28, medios: 66, baixos: 94 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip 
                      formatter={(value: any) => [value.toLocaleString('pt-BR'), 'Defeitos']}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#007AFF" 
                      strokeWidth={3}
                      strokeDasharray="0 0 5 5"
                      name="Total (Projeção)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="criticos" 
                      stroke="#FF3B30" 
                      strokeWidth={2}
                      strokeDasharray="0 0 5 5"
                      name="Críticos (Projeção)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Insights de Tendências */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-100">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="h-6 w-6 text-red-600" />
                    <h3 className="font-semibold text-red-900">Tendência Crescente</h3>
                  </div>
                  <p className="text-sm text-red-700 mb-3">
                    Defeitos em sistemas de injeção aumentaram 23% nos últimos 3 meses.
                  </p>
                  <Badge className="bg-red-100 text-red-700 border-red-200">
                    Atenção Requerida
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingDown className="h-6 w-6 text-green-600" />
                    <h3 className="font-semibold text-green-900">Melhoria Detectada</h3>
                  </div>
                  <p className="text-sm text-green-700 mb-3">
                    Problemas de embreagem reduziram 15% após implementação de melhorias.
                  </p>
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    Progresso Positivo
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="h-6 w-6 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Oportunidade</h3>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    Foco em manutenção preventiva pode reduzir 30% dos defeitos críticos.
                  </p>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    Ação Recomendada
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Análise de Impacto */}
          <TabsContent value="impact" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Impacto Financeiro */}
              <ChartCard
                title="Impacto Financeiro Total"
                description="Custo acumulado por categoria de defeito"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={costImpactData}
                    dataKey="totalCost"
                    aspectRatio={4/3}
                    stroke="#fff"
                    fill="#007AFF"
                  />
                </ResponsiveContainer>
              </ChartCard>

              {/* Matriz de Priorização */}
              <Card className="bg-white border-2 border-black shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-apple-gray-900">
                    Matriz de Priorização
                  </CardTitle>
                  <CardDescription className="text-apple-gray-500">
                    Frequência vs Impacto Financeiro
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 h-64">
                    {/* Quadrante Alto Impacto / Alta Frequência */}
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2">Crítico</h4>
                      <div className="space-y-1 text-sm">
                        <div className="text-red-700">• Motor (856 casos)</div>
                        <div className="text-red-700">• Transmissão (634 casos)</div>
                      </div>
                    </div>

                    {/* Quadrante Alto Impacto / Baixa Frequência */}
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                      <h4 className="font-semibold text-orange-900 mb-2">Monitorar</h4>
                      <div className="space-y-1 text-sm">
                        <div className="text-orange-700">• Falha no turbo</div>
                        <div className="text-orange-700">• Superaquecimento</div>
                      </div>
                    </div>

                    {/* Quadrante Baixo Impacto / Alta Frequência */}
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-900 mb-2">Otimizar</h4>
                      <div className="space-y-1 text-sm">
                        <div className="text-yellow-700">• Sistema Elétrico</div>
                        <div className="text-yellow-700">• Freios</div>
                      </div>
                    </div>

                    {/* Quadrante Baixo Impacto / Baixa Frequência */}
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2">Manter</h4>
                      <div className="space-y-1 text-sm">
                        <div className="text-green-700">• Suspensão</div>
                        <div className="text-green-700">• Outros</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Plano de Ação */}
            <Card className="bg-white border-2 border-black shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-apple-gray-900">
                  Plano de Ação Recomendado
                </CardTitle>
                <CardDescription className="text-apple-gray-500">
                  Estratégias baseadas na análise de defeitos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <h4 className="font-semibold text-red-900">Ação Imediata</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-red-700">
                      <li>• Revisar processos de injeção</li>
                      <li>• Treinamento especializado</li>
                      <li>• Auditoria de qualidade</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <h4 className="font-semibold text-orange-900">Médio Prazo</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-orange-700">
                      <li>• Manutenção preventiva</li>
                      <li>• Upgrade de equipamentos</li>
                      <li>• Parcerias com fornecedores</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-green-900">Longo Prazo</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-green-700">
                      <li>• Sistema preditivo</li>
                      <li>• Automação de processos</li>
                      <li>• Certificações ISO</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
};

export default Defects;

