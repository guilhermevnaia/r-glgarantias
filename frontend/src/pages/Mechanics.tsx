import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  Search, 
  Filter,
  Download,
  RefreshCw,
  Award,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  Target,
  BarChart3,
  Trophy,
  Medal,
  Zap,
  ThumbsUp,
  Calendar,
  Wrench
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter
} from 'recharts';

const Mechanics = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
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
            <p className="text-apple-gray-500">Erro ao carregar dados dos mecânicos</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dados simulados para análise de mecânicos (em produção viriam da API)
  const topMechanics = [
    { 
      id: 1,
      name: 'Carlos Silva', 
      orders: 156, 
      approvalRate: 94.2, 
      avgTime: 3.2, 
      rating: 4.8,
      specialty: 'Motor',
      experience: 8,
      certifications: 3,
      avatar: '/avatars/carlos.jpg'
    },
    { 
      id: 2,
      name: 'João Santos', 
      orders: 142, 
      approvalRate: 91.5, 
      avgTime: 3.8, 
      rating: 4.6,
      specialty: 'Transmissão',
      experience: 6,
      certifications: 2,
      avatar: '/avatars/joao.jpg'
    },
    { 
      id: 3,
      name: 'Pedro Oliveira', 
      orders: 138, 
      approvalRate: 89.7, 
      avgTime: 4.1, 
      rating: 4.5,
      specialty: 'Sistema Elétrico',
      experience: 5,
      certifications: 4,
      avatar: '/avatars/pedro.jpg'
    },
    { 
      id: 4,
      name: 'Roberto Lima', 
      orders: 134, 
      approvalRate: 92.8, 
      avgTime: 3.5, 
      rating: 4.7,
      specialty: 'Motor',
      experience: 10,
      certifications: 5,
      avatar: '/avatars/roberto.jpg'
    },
    { 
      id: 5,
      name: 'André Costa', 
      orders: 128, 
      approvalRate: 88.3, 
      avgTime: 4.3, 
      rating: 4.4,
      specialty: 'Freios',
      experience: 4,
      certifications: 2,
      avatar: '/avatars/andre.jpg'
    },
    { 
      id: 6,
      name: 'Fernando Alves', 
      orders: 125, 
      approvalRate: 90.4, 
      avgTime: 3.9, 
      rating: 4.5,
      specialty: 'Transmissão',
      experience: 7,
      certifications: 3,
      avatar: '/avatars/fernando.jpg'
    },
    { 
      id: 7,
      name: 'Marcos Pereira', 
      orders: 118, 
      approvalRate: 87.2, 
      avgTime: 4.5, 
      rating: 4.3,
      specialty: 'Suspensão',
      experience: 3,
      certifications: 1,
      avatar: '/avatars/marcos.jpg'
    },
    { 
      id: 8,
      name: 'Luis Rodrigues', 
      orders: 115, 
      approvalRate: 93.1, 
      avgTime: 3.6, 
      rating: 4.6,
      specialty: 'Sistema Elétrico',
      experience: 9,
      certifications: 4,
      avatar: '/avatars/luis.jpg'
    }
  ];

  const mechanicSpecialties = [
    { specialty: 'Motor', mechanics: 12, avgRating: 4.6, totalOrders: 456 },
    { specialty: 'Transmissão', mechanics: 8, avgRating: 4.4, totalOrders: 342 },
    { specialty: 'Sistema Elétrico', mechanics: 10, avgRating: 4.5, totalOrders: 298 },
    { specialty: 'Freios', mechanics: 6, avgRating: 4.3, totalOrders: 234 },
    { specialty: 'Suspensão', mechanics: 5, avgRating: 4.2, totalOrders: 189 },
    { specialty: 'Outros', mechanics: 4, avgRating: 4.1, totalOrders: 156 }
  ];

  const performanceMetrics = [
    { metric: 'Produtividade', value: 85, benchmark: 80 },
    { metric: 'Qualidade', value: 92, benchmark: 85 },
    { metric: 'Velocidade', value: 78, benchmark: 75 },
    { metric: 'Satisfação', value: 88, benchmark: 80 },
    { metric: 'Eficiência', value: 82, benchmark: 75 },
    { metric: 'Inovação', value: 75, benchmark: 70 }
  ];

  const monthlyProductivity = stats.monthlyTrend.map(item => ({
    month: item.month,
    orders: item.count,
    avgTime: 3.2 + Math.random() * 1.5,
    approvalRate: 85 + Math.random() * 10,
    satisfaction: 4.0 + Math.random() * 0.8
  }));

  const experienceDistribution = [
    { range: '0-2 anos', count: 8, avgRating: 4.1 },
    { range: '3-5 anos', count: 12, avgRating: 4.3 },
    { range: '6-8 anos', count: 15, avgRating: 4.6 },
    { range: '9+ anos', count: 10, avgRating: 4.8 }
  ];

  const certificationImpact = [
    { certifications: 0, avgRating: 4.0, avgApproval: 85.2 },
    { certifications: 1, avgRating: 4.2, avgApproval: 87.8 },
    { certifications: 2, avgRating: 4.4, avgApproval: 90.1 },
    { certifications: 3, avgRating: 4.6, avgApproval: 92.5 },
    { certifications: 4, avgRating: 4.7, avgApproval: 94.2 },
    { certifications: 5, avgRating: 4.8, avgApproval: 95.8 }
  ];

  const getPerformanceColor = (value: number, benchmark: number) => {
    if (value >= benchmark + 5) return 'text-green-600';
    if (value >= benchmark) return 'text-blue-600';
    if (value >= benchmark - 5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="min-h-screen bg-apple-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-apple-gray-200 p-6 mb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-apple-gray-900 mb-2">
            Análise de Mecânicos
          </h1>
          <p className="text-apple-gray-500 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Performance, produtividade e especialização da equipe - Dados em tempo real
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-8">
        {/* KPIs da Equipe */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AppleCard
            title="Total de Mecânicos"
            value="45"
            subtitle="Profissionais ativos"
            icon={Users}
            trend={{ value: "+3", isPositive: true }}
            gradient="blue"
          />
          
          <AppleCard
            title="Avaliação Média"
            value="4.5"
            subtitle="Satisfação dos clientes"
            icon={Star}
            trend={{ value: "+0.2", isPositive: true }}
            gradient="yellow"
          />
          
          <AppleCard
            title="Taxa de Aprovação"
            value="91.2%"
            subtitle="Garantias aprovadas"
            icon={CheckCircle2}
            trend={{ value: "+1.8%", isPositive: true }}
            gradient="green"
          />
          
          <AppleCard
            title="Tempo Médio"
            value="3.7h"
            subtitle="Por ordem de serviço"
            icon={Clock}
            trend={{ value: "-0.3h", isPositive: true }}
            gradient="purple"
          />
        </div>

        {/* Tabs de Análises */}
        <Tabs defaultValue="ranking" className="w-full">
          <TabsList className="inline-flex w-auto bg-black rounded-md p-1 mb-6 h-10">
            <TabsTrigger 
              value="ranking" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              Ranking
            </TabsTrigger>
            <TabsTrigger 
              value="performance" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              Performance
            </TabsTrigger>
            <TabsTrigger 
              value="specialties" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              Especialidades
            </TabsTrigger>
            <TabsTrigger 
              value="development" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              Desenvolvimento
            </TabsTrigger>
          </TabsList>

          {/* Ranking de Mecânicos */}
          <TabsContent value="ranking" className="space-y-6 mt-6">
            {/* Top 3 Mecânicos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topMechanics.slice(0, 3).map((mechanic, index) => (
                <Card key={mechanic.id} className={`bg-gradient-to-br ${
                  index === 0 ? 'from-yellow-50 to-amber-50 border-yellow-200' :
                  index === 1 ? 'from-gray-50 to-slate-50 border-gray-200' :
                  'from-orange-50 to-red-50 border-orange-200'
                }`}>
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      {index === 0 && <Trophy className="h-8 w-8 text-yellow-500" />}
                      {index === 1 && <Medal className="h-8 w-8 text-gray-500" />}
                      {index === 2 && <Award className="h-8 w-8 text-orange-500" />}
                    </div>
                    
                    <Avatar className="h-16 w-16 mx-auto mb-4">
                      <AvatarImage src={mechanic.avatar} alt={mechanic.name} />
                      <AvatarFallback className="text-lg font-semibold">
                        {mechanic.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <h3 className="font-bold text-lg text-apple-gray-900 mb-2">
                      {mechanic.name}
                    </h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-apple-gray-600">Ordens:</span>
                        <span className="font-semibold">{mechanic.orders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-apple-gray-600">Aprovação:</span>
                        <span className="font-semibold">{mechanic.approvalRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-apple-gray-600">Avaliação:</span>
                        <div className="flex items-center gap-1">
                          {getRatingStars(mechanic.rating)}
                          <span className="font-semibold ml-1">{mechanic.rating}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Badge className="mt-3 bg-blue-100 text-blue-700 border-blue-200">
                      {mechanic.specialty}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tabela Completa de Rankings */}
            <Card className="bg-white border-2 border-black shadow-md">
              <CardHeader className="border-b border-apple-gray-100">
                <CardTitle className="text-xl font-semibold text-apple-gray-900">
                  Ranking Completo de Mecânicos
                </CardTitle>
                <CardDescription className="text-apple-gray-500">
                  Performance detalhada de todos os mecânicos
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-apple-gray-50/50 hover:bg-apple-gray-50/50">
                      <TableHead className="font-semibold text-apple-gray-700">Posição</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Mecânico</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Especialidade</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Ordens</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Taxa Aprovação</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Tempo Médio</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Avaliação</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Experiência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topMechanics.map((mechanic, index) => (
                      <TableRow key={mechanic.id} className="hover:bg-apple-gray-50/30">
                        <TableCell className="font-bold text-apple-gray-900">
                          #{index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={mechanic.avatar} alt={mechanic.name} />
                              <AvatarFallback className="text-xs">
                                {mechanic.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-apple-gray-900">{mechanic.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {mechanic.specialty}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-apple-gray-700">
                          {mechanic.orders}
                        </TableCell>
                        <TableCell className="text-apple-gray-700">
                          <div className="flex items-center gap-2">
                            <Progress value={mechanic.approvalRate} className="w-16 h-2" />
                            <span className="text-sm">{mechanic.approvalRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-apple-gray-700">
                          {mechanic.avgTime}h
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getRatingStars(mechanic.rating)}
                            <span className="text-sm ml-1">{mechanic.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-apple-gray-700">
                          {mechanic.experience} anos
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Análise de Performance */}
          <TabsContent value="performance" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Radar de Performance */}
              <ChartCard
                title="Métricas de Performance da Equipe"
                description="Comparação com benchmarks da indústria"
              >
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
                      name="Atual"
                      dataKey="value"
                      stroke="#007AFF"
                      fill="#007AFF"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Benchmark"
                      dataKey="benchmark"
                      stroke="#FF9500"
                      fill="#FF9500"
                      fillOpacity={0.1}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Evolução da Produtividade */}
              <ChartCard
                title="Evolução da Produtividade"
                description="Tendência mensal de performance"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyProductivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'orders' ? value.toLocaleString('pt-BR') : 
                        name === 'avgTime' ? `${value.toFixed(1)}h` :
                        name === 'approvalRate' ? `${value.toFixed(1)}%` :
                        value.toFixed(1),
                        name === 'orders' ? 'Ordens' : 
                        name === 'avgTime' ? 'Tempo Médio' :
                        name === 'approvalRate' ? 'Taxa Aprovação' :
                        'Satisfação'
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
                      dataKey="orders" 
                      fill="#007AFF" 
                      radius={[4, 4, 0, 0]}
                      name="Ordens"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="approvalRate" 
                      stroke="#34C759" 
                      strokeWidth={3}
                      name="Taxa Aprovação"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {performanceMetrics.map((metric, index) => (
                <Card key={index} className="bg-white border-2 border-black shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-apple-gray-900">{metric.metric}</h3>
                      <div className={`text-2xl font-bold ${getPerformanceColor(metric.value, metric.benchmark)}`}>
                        {metric.value}%
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Progress value={metric.value} className="w-full h-3" />
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-apple-gray-600">Benchmark: {metric.benchmark}%</span>
                        <span className={`font-medium ${
                          metric.value >= metric.benchmark ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {metric.value >= metric.benchmark ? '+' : ''}{metric.value - metric.benchmark}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Análise de Especialidades */}
          <TabsContent value="specialties" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Distribuição por Especialidade */}
              <ChartCard
                title="Distribuição por Especialidade"
                description="Número de mecânicos por área"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mechanicSpecialties}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="specialty" 
                      tick={{ fontSize: 11, fill: '#6B7280' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip 
                      formatter={(value: any) => [value.toLocaleString('pt-BR'), 'Mecânicos']}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="mechanics" 
                      fill="#007AFF" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Performance por Especialidade */}
              <ChartCard
                title="Performance por Especialidade"
                description="Avaliação média vs volume de ordens"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={mechanicSpecialties}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      type="number" 
                      dataKey="totalOrders" 
                      name="Total de Ordens"
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="avgRating" 
                      name="Avaliação Média"
                      domain={[4.0, 5.0]}
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'totalOrders' ? value.toLocaleString('pt-BR') : value.toFixed(1),
                        name === 'totalOrders' ? 'Total de Ordens' : 'Avaliação Média'
                      ]}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Scatter 
                      dataKey="avgRating" 
                      fill="#007AFF"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Cards de Especialidades */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mechanicSpecialties.map((specialty, index) => (
                <Card key={index} className="bg-white border-2 border-black shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Wrench className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-apple-gray-900">{specialty.specialty}</h3>
                          <p className="text-sm text-apple-gray-500">{specialty.mechanics} mecânicos</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-apple-gray-600">Total de Ordens</span>
                        <span className="font-semibold text-apple-gray-900">
                          {specialty.totalOrders.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-apple-gray-600">Avaliação Média</span>
                        <div className="flex items-center gap-1">
                          {getRatingStars(specialty.avgRating)}
                          <span className="font-semibold text-apple-gray-900 ml-1">
                            {specialty.avgRating}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-apple-gray-600">Ordens por Mecânico</span>
                        <span className="font-semibold text-apple-gray-900">
                          {Math.round(specialty.totalOrders / specialty.mechanics)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Desenvolvimento e Capacitação */}
          <TabsContent value="development" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Distribuição por Experiência */}
              <ChartCard
                title="Distribuição por Experiência"
                description="Mecânicos por faixa de experiência"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={experienceDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="range" 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip 
                      formatter={(value: any) => [value.toLocaleString('pt-BR'), 'Mecânicos']}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#34C759" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Impacto das Certificações */}
              <ChartCard
                title="Impacto das Certificações"
                description="Relação entre certificações e performance"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={certificationImpact}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="certifications" 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'avgApproval' ? `${value.toFixed(1)}%` : value.toFixed(1),
                        name === 'avgApproval' ? 'Taxa Aprovação' : 'Avaliação Média'
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
                      dataKey="avgApproval" 
                      fill="#007AFF" 
                      radius={[4, 4, 0, 0]}
                      name="Taxa Aprovação"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="avgRating" 
                      stroke="#FF9500" 
                      strokeWidth={3}
                      name="Avaliação Média"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Plano de Desenvolvimento */}
            <Card className="bg-white border-2 border-black shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-apple-gray-900">
                  Plano de Desenvolvimento da Equipe
                </CardTitle>
                <CardDescription className="text-apple-gray-500">
                  Estratégias para capacitação e melhoria contínua
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-900">Treinamento Técnico</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-blue-700">
                      <li>• Certificação em novos motores</li>
                      <li>• Workshop de diagnóstico avançado</li>
                      <li>• Curso de sistemas eletrônicos</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <ThumbsUp className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-green-900">Soft Skills</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-green-700">
                      <li>• Atendimento ao cliente</li>
                      <li>• Comunicação efetiva</li>
                      <li>• Trabalho em equipe</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-5 w-5 text-purple-600" />
                      <h4 className="font-semibold text-purple-900">Metas 2025</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-purple-700">
                      <li>• 95% taxa de aprovação</li>
                      <li>• 4.7 avaliação média</li>
                      <li>• 3.0h tempo médio</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Programa de Reconhecimento */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-yellow-900 flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Mecânico do Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={topMechanics[0].avatar} alt={topMechanics[0].name} />
                      <AvatarFallback className="text-lg font-semibold">
                        {topMechanics[0].name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-lg text-yellow-900">{topMechanics[0].name}</h3>
                      <p className="text-yellow-700">{topMechanics[0].specialty}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {getRatingStars(topMechanics[0].rating)}
                        <span className="text-sm text-yellow-700 ml-1">{topMechanics[0].rating}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-green-900 flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Maior Evolução
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={topMechanics[4].avatar} alt={topMechanics[4].name} />
                      <AvatarFallback className="text-lg font-semibold">
                        {topMechanics[4].name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-lg text-green-900">{topMechanics[4].name}</h3>
                      <p className="text-green-700">{topMechanics[4].specialty}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700">+15% este mês</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Mechanics;

