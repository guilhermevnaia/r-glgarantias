import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { 
  FileBarChart, 
  Download,
  RefreshCw,
  FileText,
  Calendar,
  Filter,
  Settings,
  Eye,
  Share2,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Wrench,
  DollarSign,
  Target,
  Mail,
  Printer,
  Save,
  Copy,
  Edit,
  Trash2,
  Plus
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
  AreaChart
} from 'recharts';

const Reports = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<any>(null);
  const [selectedFormat, setSelectedFormat] = useState('pdf');

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
            <p className="text-apple-gray-500">Erro ao carregar dados para relatórios</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Templates de relatórios pré-definidos
  const reportTemplates = [
    {
      id: 'executive-summary',
      name: 'Resumo Executivo',
      description: 'Visão geral para gestores com KPIs principais',
      icon: Target,
      metrics: ['total-orders', 'approval-rate', 'revenue', 'avg-time'],
      charts: ['status-distribution', 'monthly-trend'],
      frequency: 'Mensal'
    },
    {
      id: 'financial-analysis',
      name: 'Análise Financeira',
      description: 'Relatório detalhado de receitas e custos',
      icon: DollarSign,
      metrics: ['revenue', 'avg-value', 'parts-cost', 'labor-cost'],
      charts: ['revenue-trend', 'cost-breakdown'],
      frequency: 'Trimestral'
    },
    {
      id: 'operational-performance',
      name: 'Performance Operacional',
      description: 'Análise de eficiência e produtividade',
      icon: BarChart3,
      metrics: ['total-orders', 'avg-time', 'approval-rate', 'mechanic-performance'],
      charts: ['productivity-trend', 'mechanic-ranking'],
      frequency: 'Semanal'
    },
    {
      id: 'defect-analysis',
      name: 'Análise de Defeitos',
      description: 'Relatório de defeitos e padrões de falhas',
      icon: Wrench,
      metrics: ['defect-frequency', 'defect-cost', 'defect-trends'],
      charts: ['defect-categories', 'defect-by-manufacturer'],
      frequency: 'Mensal'
    },
    {
      id: 'mechanic-evaluation',
      name: 'Avaliação de Mecânicos',
      description: 'Performance individual e ranking da equipe',
      icon: Users,
      metrics: ['mechanic-ranking', 'satisfaction-rating', 'specialization'],
      charts: ['performance-radar', 'productivity-comparison'],
      frequency: 'Mensal'
    },
    {
      id: 'custom-report',
      name: 'Relatório Personalizado',
      description: 'Crie seu próprio relatório com métricas específicas',
      icon: Settings,
      metrics: [],
      charts: [],
      frequency: 'Sob demanda'
    }
  ];

  // Métricas disponíveis
  const availableMetrics = [
    { id: 'total-orders', name: 'Total de Ordens', category: 'Geral' },
    { id: 'approval-rate', name: 'Taxa de Aprovação', category: 'Geral' },
    { id: 'revenue', name: 'Receita Total', category: 'Financeiro' },
    { id: 'avg-value', name: 'Valor Médio', category: 'Financeiro' },
    { id: 'parts-cost', name: 'Custo de Peças', category: 'Financeiro' },
    { id: 'labor-cost', name: 'Custo de Mão de Obra', category: 'Financeiro' },
    { id: 'avg-time', name: 'Tempo Médio', category: 'Operacional' },
    { id: 'mechanic-performance', name: 'Performance dos Mecânicos', category: 'Operacional' },
    { id: 'defect-frequency', name: 'Frequência de Defeitos', category: 'Qualidade' },
    { id: 'defect-cost', name: 'Custo de Defeitos', category: 'Qualidade' },
    { id: 'customer-satisfaction', name: 'Satisfação do Cliente', category: 'Qualidade' }
  ];

  // Relatórios salvos/agendados
  const savedReports = [
    {
      id: 1,
      name: 'Relatório Mensal - Janeiro 2025',
      template: 'Resumo Executivo',
      createdAt: '2025-01-15',
      status: 'Concluído',
      format: 'PDF',
      size: '2.3 MB'
    },
    {
      id: 2,
      name: 'Análise Financeira Q4 2024',
      template: 'Análise Financeira',
      createdAt: '2025-01-10',
      status: 'Concluído',
      format: 'Excel',
      size: '1.8 MB'
    },
    {
      id: 3,
      name: 'Performance Semanal',
      template: 'Performance Operacional',
      createdAt: '2025-01-20',
      status: 'Agendado',
      format: 'PDF',
      size: '-'
    }
  ];

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template.id);
    setReportName(template.name);
    setReportDescription(template.description);
    setSelectedMetrics(template.metrics);
  };

  const generateReport = () => {
    // Aqui seria implementada a lógica de geração do relatório
    console.log('Gerando relatório:', {
      template: selectedTemplate,
      name: reportName,
      metrics: selectedMetrics,
      format: selectedFormat,
      dateRange
    });
  };

  return (
    <div className="min-h-screen bg-apple-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-apple-gray-200 p-6 mb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-apple-gray-900 mb-2">
            Central de Relatórios
          </h1>
          <p className="text-apple-gray-500 flex items-center gap-2">
            <FileBarChart className="h-4 w-4" />
            Geração e gerenciamento de relatórios personalizados - Dados em tempo real
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-8">
        {/* KPIs de Relatórios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AppleCard
            title="Relatórios Gerados"
            value="127"
            subtitle="Este mês"
            icon={FileText}
            trend={{ value: "+23", isPositive: true }}
            gradient="blue"
          />
          
          <AppleCard
            title="Relatórios Agendados"
            value="8"
            subtitle="Próximos 30 dias"
            icon={Clock}
            trend={{ value: "+2", isPositive: true }}
            gradient="green"
          />
          
          <AppleCard
            title="Templates Ativos"
            value="6"
            subtitle="Modelos disponíveis"
            icon={Settings}
            trend={{ value: "+1", isPositive: true }}
            gradient="purple"
          />
          
          <AppleCard
            title="Tempo Médio"
            value="2.3min"
            subtitle="Para gerar relatório"
            icon={TrendingUp}
            trend={{ value: "-0.5min", isPositive: true }}
            gradient="orange"
          />
        </div>

        {/* Tabs de Relatórios */}
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="inline-flex w-auto bg-black rounded-md p-1 mb-6 h-10">
            <TabsTrigger 
              value="templates" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              Templates
            </TabsTrigger>
            <TabsTrigger 
              value="custom" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              Personalizado
            </TabsTrigger>
            <TabsTrigger 
              value="saved" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              Salvos
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Templates Pré-definidos */}
          <TabsContent value="templates" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportTemplates.map((template, index) => (
                <Card 
                  key={template.id} 
                  className={`bg-white border-2 border-black shadow-md cursor-pointer transition-all hover:shadow-lg ${
                    selectedTemplate === template.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <template.icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-apple-gray-900">{template.name}</h3>
                        <p className="text-sm text-apple-gray-500">{template.frequency}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-apple-gray-600 mb-4">
                      {template.description}
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-apple-gray-500 mb-1">MÉTRICAS INCLUÍDAS</p>
                        <div className="flex flex-wrap gap-1">
                          {template.metrics.slice(0, 3).map(metric => (
                            <Badge key={metric} variant="secondary" className="text-xs">
                              {availableMetrics.find(m => m.id === metric)?.name || metric}
                            </Badge>
                          ))}
                          {template.metrics.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.metrics.length - 3} mais
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        variant={selectedTemplate === template.id ? "default" : "outline"}
                        size="sm"
                      >
                        {selectedTemplate === template.id ? 'Selecionado' : 'Usar Template'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Configuração do Relatório Selecionado */}
            {selectedTemplate && (
              <Card className="bg-white border-2 border-black shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-apple-gray-900">
                    Configurar Relatório
                  </CardTitle>
                  <CardDescription className="text-apple-gray-500">
                    Personalize as configurações do seu relatório
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="report-name">Nome do Relatório</Label>
                        <Input 
                          id="report-name"
                          value={reportName}
                          onChange={(e) => setReportName(e.target.value)}
                          placeholder="Digite o nome do relatório"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="report-description">Descrição</Label>
                        <Textarea 
                          id="report-description"
                          value={reportDescription}
                          onChange={(e) => setReportDescription(e.target.value)}
                          placeholder="Descreva o objetivo do relatório"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label>Período</Label>
                        <DatePickerWithRange 
                          date={dateRange}
                          setDate={setDateRange}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>Formato de Exportação</Label>
                        <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o formato" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="excel">Excel</SelectItem>
                            <SelectItem value="csv">CSV</SelectItem>
                            <SelectItem value="powerpoint">PowerPoint</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button onClick={generateReport} className="flex-1">
                          <Download className="h-4 w-4 mr-2" />
                          Gerar Relatório
                        </Button>
                        <Button variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </Button>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Save className="h-4 w-4 mr-2" />
                          Salvar
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Calendar className="h-4 w-4 mr-2" />
                          Agendar
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Share2 className="h-4 w-4 mr-2" />
                          Compartilhar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Relatório Personalizado */}
          <TabsContent value="custom" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Configuração */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="bg-white border-2 border-black shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-apple-gray-900">
                      Configurações
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="custom-name">Nome do Relatório</Label>
                      <Input 
                        id="custom-name"
                        placeholder="Meu Relatório Personalizado"
                      />
                    </div>
                    
                    <div>
                      <Label>Período</Label>
                      <DatePickerWithRange />
                    </div>
                    
                    <div>
                      <Label>Formato</Label>
                      <Select defaultValue="pdf">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Gerar Relatório
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              {/* Seleção de Métricas */}
              <div className="lg:col-span-2">
                <Card className="bg-white border-2 border-black shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-apple-gray-900">
                      Selecionar Métricas
                    </CardTitle>
                    <CardDescription className="text-apple-gray-500">
                      Escolha as métricas que deseja incluir no relatório
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {['Geral', 'Financeiro', 'Operacional', 'Qualidade'].map(category => (
                        <div key={category}>
                          <h4 className="font-medium text-apple-gray-900 mb-3">{category}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {availableMetrics
                              .filter(metric => metric.category === category)
                              .map(metric => (
                                <div key={metric.id} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={metric.id}
                                    checked={selectedMetrics.includes(metric.id)}
                                    onCheckedChange={() => handleMetricToggle(metric.id)}
                                  />
                                  <Label 
                                    htmlFor={metric.id}
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    {metric.name}
                                  </Label>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Relatórios Salvos */}
          <TabsContent value="saved" className="space-y-6 mt-6">
            <Card className="bg-white border-2 border-black shadow-md">
              <CardHeader className="border-b border-apple-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold text-apple-gray-900">
                      Relatórios Salvos e Agendados
                    </CardTitle>
                    <CardDescription className="text-apple-gray-500">
                      Gerencie seus relatórios salvos e agendamentos
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtrar
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-apple-gray-50/50 hover:bg-apple-gray-50/50">
                      <TableHead className="font-semibold text-apple-gray-700">Nome</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Template</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Data de Criação</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Status</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Formato</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Tamanho</TableHead>
                      <TableHead className="font-semibold text-apple-gray-700">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savedReports.map((report) => (
                      <TableRow key={report.id} className="hover:bg-apple-gray-50/30">
                        <TableCell className="font-medium text-apple-gray-900">
                          {report.name}
                        </TableCell>
                        <TableCell className="text-apple-gray-700">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {report.template}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-apple-gray-700">
                          {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              report.status === 'Concluído' 
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : report.status === 'Agendado'
                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                : 'bg-orange-100 text-orange-700 border-orange-200'
                            }
                          >
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-apple-gray-700">
                          {report.format}
                        </TableCell>
                        <TableCell className="text-apple-gray-700">
                          {report.size}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics de Relatórios */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Uso de Templates */}
              <ChartCard
                title="Uso de Templates"
                description="Templates mais utilizados"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Resumo Executivo', count: 45 },
                    { name: 'Performance Operacional', count: 32 },
                    { name: 'Análise Financeira', count: 28 },
                    { name: 'Análise de Defeitos', count: 22 },
                    { name: 'Avaliação de Mecânicos', count: 18 },
                    { name: 'Personalizado', count: 12 }
                  ]}>
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
                      formatter={(value: any) => [value.toLocaleString('pt-BR'), 'Relatórios']}
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

              {/* Formatos de Exportação */}
              <ChartCard
                title="Formatos de Exportação"
                description="Preferências de formato"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'PDF', value: 68, color: '#007AFF' },
                        { name: 'Excel', value: 24, color: '#34C759' },
                        { name: 'PowerPoint', value: 6, color: '#FF9500' },
                        { name: 'CSV', value: 2, color: '#8E8E93' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {[
                        { name: 'PDF', value: 68, color: '#007AFF' },
                        { name: 'Excel', value: 24, color: '#34C759' },
                        { name: 'PowerPoint', value: 6, color: '#FF9500' },
                        { name: 'CSV', value: 2, color: '#8E8E93' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`${value}%`, 'Uso']}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Estatísticas de Uso */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Relatórios Este Mês</p>
                      <p className="text-3xl font-bold text-blue-900">127</p>
                      <p className="text-blue-600 text-sm">+18% vs mês anterior</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Tempo Médio</p>
                      <p className="text-3xl font-bold text-green-900">2.3min</p>
                      <p className="text-green-600 text-sm">-12% vs mês anterior</p>
                    </div>
                    <Clock className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">Taxa de Sucesso</p>
                      <p className="text-3xl font-bold text-purple-900">98.5%</p>
                      <p className="text-purple-600 text-sm">+0.3% vs mês anterior</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 text-sm font-medium">Usuários Ativos</p>
                      <p className="text-3xl font-bold text-orange-900">23</p>
                      <p className="text-orange-600 text-sm">+2 novos usuários</p>
                    </div>
                    <Users className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tendência de Uso */}
            <ChartCard
              title="Tendência de Uso de Relatórios"
              description="Evolução mensal da geração de relatórios"
              height="h-96"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyTrend.map(item => ({
                  month: item.month,
                  reports: Math.floor(item.count / 20), // Simulado
                  automated: Math.floor(item.count / 40),
                  manual: Math.floor(item.count / 30)
                }))}>
                  <defs>
                    <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
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
                    formatter={(value: any) => [value.toLocaleString('pt-BR'), 'Relatórios']}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reports"
                    stroke="#007AFF"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorReports)"
                    name="Total"
                  />
                  <Area
                    type="monotone"
                    dataKey="automated"
                    stroke="#34C759"
                    strokeWidth={2}
                    fill="transparent"
                    name="Automatizados"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;

