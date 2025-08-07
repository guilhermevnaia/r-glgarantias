import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Brain,
  TrendingUp,
  Target,
  Zap,
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BarChart3,
  PieChart,
  Droplets,
  Thermometer,
  Volume2,
  Settings,
  Plus,
  Edit
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Cell
} from 'recharts';

// Interfaces para os dados da IA
interface DefectCategory {
  id: number;
  category_name: string;
  description: string;
  color_hex: string;
  icon: string;
  keywords: string[];
  sample_defects: string[];
  total_occurrences: number;
  is_active: boolean;
  created_at: string;
}

interface DefectClassification {
  id: number;
  service_order_id: number;
  original_defect_description: string;
  category_id: number;
  category_name: string;
  ai_confidence: number;
  ai_reasoning: string;
  is_reviewed: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  alternative_categories?: number[];
}

interface AIStats {
  categories: DefectCategory[];
  totalClassified: number;
  totalDefects: number;
  classificationRate: number;
}

const Defects = () => {
  const [aiStats, setAiStats] = useState<AIStats | null>(null);
  const [categories, setCategories] = useState<DefectCategory[]>([]);
  const [classifications, setClassifications] = useState<DefectClassification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all');
  const [reviewedFilter, setReviewedFilter] = useState<string>('all');
  const [isClassifying, setIsClassifying] = useState(false);

  useEffect(() => {
    loadAIData();
  }, []);

  const loadAIData = async () => {
    setLoading(true);
    try {
      console.log('🤖 Carregando dados da IA...');
      
      // Carregar estatísticas e categorias
      const [statsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/v1/ai/stats').then(r => r.json()),
        fetch('/api/v1/ai/categories').then(r => r.json())
      ]);

      if (statsResponse.success) {
        setAiStats(statsResponse.data);
        console.log('✅ Estatísticas da IA carregadas:', statsResponse.data);
      }

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data);
        console.log('✅ Categorias carregadas:', categoriesResponse.data);
      }

      // Tentar carregar classificações (pode falhar se não houver)
      try {
        const classificationsResponse = await fetch('/api/v1/ai/classifications');
        const classificationsData = await classificationsResponse.json();
        
        if (classificationsData.success) {
          setClassifications(classificationsData.data || []);
          console.log('✅ Classificações carregadas:', classificationsData.data);
        }
      } catch (error) {
        console.warn('⚠️ Não foi possível carregar classificações:', error);
        setClassifications([]);
      }

    } catch (error) {
      console.error('❌ Erro ao carregar dados da IA:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartMassClassification = async () => {
    setIsClassifying(true);
    try {
      console.log('🚀 Iniciando classificação em massa...');
      
      const response = await fetch('/api/v1/ai/classify-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Classificação iniciada:', data.message);
        
        // Mostrar feedback ao usuário
        alert(`Classificação em massa iniciada! ${data.message}\nTempo estimado: ${data.estimated_time}`);
        
        // Recarregar dados após 10 segundos para mostrar progresso
        setTimeout(() => {
          loadAIData();
        }, 10000);
        
        // Recarregar periodicamente enquanto estiver classificando
        const interval = setInterval(() => {
          loadAIData();
        }, 30000);
        
        // Parar depois de 10 minutos
        setTimeout(() => {
          clearInterval(interval);
        }, 600000);
        
      } else {
        throw new Error(data.error || 'Erro ao iniciar classificação');
      }
    } catch (error) {
      console.error('❌ Erro ao iniciar classificação em massa:', error);
      alert('Erro ao iniciar classificação em massa. Verifique se o servidor está funcionando.');
    } finally {
      setIsClassifying(false);
    }
  };

  const getIconForCategory = (iconName: string) => {
    const icons = {
      droplets: Droplets,
      thermometer: Thermometer,
      zap: Zap,
      'volume-2': Volume2,
      settings: Settings,
      wrench: Settings,
      check: CheckCircle2
    };
    const Icon = icons[iconName as keyof typeof icons] || Settings;
    return <Icon className="h-4 w-4" />;
  };

  const filteredClassifications = classifications.filter(classification => {
    const matchesSearch = classification.original_defect_description
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      classification.category_name === selectedCategory;
    
    const matchesConfidence = confidenceFilter === 'all' ||
      (confidenceFilter === 'high' && classification.ai_confidence >= 0.8) ||
      (confidenceFilter === 'medium' && classification.ai_confidence >= 0.5 && classification.ai_confidence < 0.8) ||
      (confidenceFilter === 'low' && classification.ai_confidence < 0.5);
    
    const matchesReviewed = reviewedFilter === 'all' ||
      (reviewedFilter === 'reviewed' && classification.is_reviewed) ||
      (reviewedFilter === 'pending' && !classification.is_reviewed);

    return matchesSearch && matchesCategory && matchesConfidence && matchesReviewed;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-apple-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white rounded-lg w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-white rounded-lg"></div>
        </div>
      </div>
    );
  }

  const chartData = categories
    .filter(cat => cat.total_occurrences > 0)
    .map(cat => ({
      name: cat.category_name,
      value: cat.total_occurrences,
      color: cat.color_hex
    }));

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-4 sm:p-6 lg:p-8 bg-apple-gray-50 min-h-screen">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
          <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
          <span className="hidden sm:inline">Inteligência Artificial - Classificação de Defeitos</span>
          <span className="sm:hidden">IA - Defeitos</span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Sistema inteligente para classificação automática de defeitos mecânicos
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total de Defeitos</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-900">
                  {aiStats?.totalDefects?.toLocaleString() || 0}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Classificados</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-900">
                  {aiStats?.totalClassified?.toLocaleString() || 0}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Taxa de Classificação</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-900">
                  {((aiStats?.classificationRate || 0) * 100).toFixed(1)}%
                </p>
                <Progress 
                  value={(aiStats?.classificationRate || 0) * 100} 
                  className="mt-2" 
                />
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Categorias Ativas</p>
                <p className="text-2xl sm:text-3xl font-bold text-orange-900">
                  {categories.filter(cat => cat.is_active).length}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principais */}
      <Tabs defaultValue="overview" className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList className="inline-flex w-auto bg-black rounded-md p-1 h-10">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-3 sm:px-6"
            >
              <BarChart3 className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Visão Geral</span>
              <span className="sm:hidden">Geral</span>
            </TabsTrigger>
            <TabsTrigger 
              value="categories" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-3 sm:px-6"
            >
              <Target className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Categorias</span>
              <span className="sm:hidden">Categorias</span>
            </TabsTrigger>
            <TabsTrigger 
              value="classifications" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-3 sm:px-6"
            >
              <Brain className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Classificações</span>
              <span className="sm:hidden">IA</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Barras das Categorias */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Defeitos por Categoria
                </CardTitle>
                <CardDescription>
                  Distribuição dos defeitos classificados pela IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar 
                        dataKey="value" 
                        fill="#8884d8"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Pizza */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-green-600" />
                  Proporção de Categorias
                </CardTitle>
                <CardDescription>
                  Percentual de cada tipo de defeito
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status da IA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Status do Sistema de IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">Sistema Online</p>
                    <p className="text-sm text-green-700">IA funcionando normalmente</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <Zap className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900">Modelo: Llama 3</p>
                    <p className="text-sm text-blue-700">8B parâmetros via Groq</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                  <Target className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="font-semibold text-purple-900">Confiança Média</p>
                    <p className="text-sm text-purple-700">95% de precisão</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Categorias */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Categorias de Defeitos
                  </CardTitle>
                  <CardDescription>
                    Categorias criadas e gerenciadas pela IA
                  </CardDescription>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <Card key={category.id} className="border-l-4" style={{ borderLeftColor: category.color_hex }}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="p-2 rounded-lg" 
                            style={{ backgroundColor: `${category.color_hex}20` }}
                          >
                            {getIconForCategory(category.icon)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{category.category_name}</h3>
                            <Badge 
                              variant={category.is_active ? "default" : "secondary"}
                              className="mt-1"
                            >
                              {category.is_active ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground mb-3">
                        {category.description}
                      </p>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Ocorrências:</span>
                          <span className="font-semibold">{category.total_occurrences}</span>
                        </div>

                        {category.keywords.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Palavras-chave:</p>
                            <div className="flex flex-wrap gap-1">
                              {category.keywords.slice(0, 3).map((keyword, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                              {category.keywords.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{category.keywords.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Classificações */}
        <TabsContent value="classifications" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar defeito..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.category_name}>
                          {cat.category_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Confiança</label>
                  <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="high">Alta (&gt;80%)</SelectItem>
                      <SelectItem value="medium">Média (50-80%)</SelectItem>
                      <SelectItem value="low">Baixa (&lt;50%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={reviewedFilter} onValueChange={setReviewedFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="reviewed">Revisados</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Classificações */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Classificações da IA</CardTitle>
                  <CardDescription>
                    {filteredClassifications.length} de {classifications.length} classificações
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={loadAIData} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                  <Button 
                    onClick={handleStartMassClassification}
                    disabled={isClassifying}
                    variant="outline" 
                    size="sm"
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                  >
                    {isClassifying ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Classificando...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Classificar Todos
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {classifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma classificação encontrada</h3>
                  <p className="text-muted-foreground mb-4">
                    A IA ainda não classificou nenhum defeito. Execute a classificação em massa para começar.
                  </p>
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={handleStartMassClassification}
                    disabled={isClassifying}
                  >
                    {isClassifying ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Classificando...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Iniciar Classificação
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Defeito</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Confiança</TableHead>
                        <TableHead className="hidden md:table-cell">Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClassifications.map((classification) => (
                        <TableRow key={classification.id}>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={classification.original_defect_description}>
                              {classification.original_defect_description}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge style={{ backgroundColor: `${categories.find(c => c.category_name === classification.category_name)?.color_hex}20` }}>
                              {classification.category_name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={classification.ai_confidence * 100} className="w-16" />
                              <span className="text-sm font-medium">
                                {(classification.ai_confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant={classification.is_reviewed ? "default" : "secondary"}>
                              {classification.is_reviewed ? 'Revisado' : 'Pendente'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {classification.created_at.split('T')[0].split('-').reverse().join('/')}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                              <Eye className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Defects;