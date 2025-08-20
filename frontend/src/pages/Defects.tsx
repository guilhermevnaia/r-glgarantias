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
  Edit,
  Cog,
  Car,
  Wrench,
  Info,
  Activity,
  Shield,
  Database,
  Cpu,
  Network,
  HardDrive,
  Calendar
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
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { AppleCard } from '@/components/AppleCard';
import { ChartCard } from "@/components/ChartCard";
import { api, apiService } from "@/services/api";
import HierarchicalDefectsView from '@/components/HierarchicalDefectsView';
import HierarchicalAnalysisView from '@/components/HierarchicalAnalysisView';

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

interface ServiceOrder {
  id: number;
  order_number: string;
  order_date: string;
  engine_manufacturer: string;
  engine_description: string;
  engine_model: string;
  engine_type: string;
  vehicle_model: string;
  raw_defect_description: string;
  responsible_mechanic: string;
  parts_total: number;
  labor_total: number;
  grand_total: number;
  order_status: 'G' | 'GO' | 'GU';
  created_at: string;
  updated_at: string;
  defect_classifications?: Array<{
    id: number;
    category_id: number;
    ai_confidence: number;
    ai_reasoning?: string;
    defect_categories: {
      category_name: string;
      color_hex: string;
      icon?: string;
    };
  }>;
}

interface AIStats {
  categories: DefectCategory[];
  totalClassified: number;
  totalDefects: number;
  classificationRate: number;
}

interface EngineModelStats {
  manufacturer: string;
  model: string; // vehicle_model dos dados
  description: string; // engine_description dos dados
  totalDefects: number;
  classifiedDefects: number;
  topDefects: string[];
  averageCost: number;
  lastDefectDate?: string; // Adicionado para o novo gráfico de linha
}

const Defects = () => {
  const [aiStats, setAiStats] = useState<AIStats | null>(null);
  const [categories, setCategories] = useState<DefectCategory[]>([]);
  const [classifications, setClassifications] = useState<DefectClassification[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [engineStats, setEngineStats] = useState<EngineModelStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all');
  const [reviewedFilter, setReviewedFilter] = useState<string>('all');
  const [isClassifying, setIsClassifying] = useState(false);
  
  // Filtros para análise
  const [dateRange, setDateRange] = useState<{start: string, end: string}>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];
    return { start: startDate, end: endDate };
  });

  const [manufacturerFilter, setManufacturerFilter] = useState<string>('all');
  const [modelFilter, setModelFilter] = useState<string>('all');
  
  // Estados para classificação individual
  const [classifyInput, setClassifyInput] = useState('');
  const [classifyResult, setClassifyResult] = useState<any>(null);
  const [isClassifyingIndividual, setIsClassifyingIndividual] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      console.log('🔍 Token disponível:', token ? 'SIM' : 'NÃO');
      
      // Sempre carregar dados básicos (não precisam de auth)
      const ordersResponse = await apiService.getServiceOrders({ limit: 10000 }).catch(() => ({ data: [], pagination: { total: 0 } }));
      
      if (ordersResponse.data && ordersResponse.data.length > 0) {
        setServiceOrders(ordersResponse.data || []);
        processEngineStats(ordersResponse.data || []);
      }
      
      // Tentar carregar dados de IA apenas se tiver token
      if (token) {
        try {
          const [statsResponse, categoriesResponse, classificationsResponse] = await Promise.all([
            api.get('/api/v1/ai/stats').catch((err) => {
              console.warn('⚠️ Falha ao carregar stats de IA:', err.message);
              return { data: { success: false } };
            }),
            api.get('/api/v1/ai/categories').catch((err) => {
              console.warn('⚠️ Falha ao carregar categorias:', err.message);
              return { data: { success: false } };
            }),
            api.get('/api/v1/ai/classifications?limit=10000').catch((err) => {
              console.warn('⚠️ Falha ao carregar classificações:', err.message);
              return { data: { success: false } };
            })
          ]);

          if (statsResponse.data?.success) {
            setAiStats(statsResponse.data.data);
          }

          if (categoriesResponse.data?.success) {
            setCategories(categoriesResponse.data.data);
          }

          if (classificationsResponse.data?.success) {
            setClassifications(classificationsResponse.data.data || []);
          }
        } catch (error) {
          console.warn('⚠️ Alguns dados de IA não puderam ser carregados:', error);
        }
      } else {
        console.warn('⚠️ Sem token - dados de IA não carregados, calculando baseado nos service orders');
        // Calcular estatísticas baseadas nos dados reais disponíveis
        const totalDefects = ordersResponse.data?.length || 0;
        
        // Contar ordens ÚNICAS que têm pelo menos uma classificação (não contar classificações múltiplas)
        const ordersWithClassifications = ordersResponse.data?.filter((order: ServiceOrder) => 
          order.defect_classifications && order.defect_classifications.length > 0
        ).length || 0;
        
        // Total de classificações individuais (para informação adicional)
        const totalClassificationRecords = ordersResponse.data?.reduce((total: number, order: ServiceOrder) => {
          return total + (order.defect_classifications?.length || 0);
        }, 0) || 0;
        
        setAiStats({
          categories: [],
          totalClassified: ordersWithClassifications, // Ordens únicas classificadas
          totalDefects: totalDefects,
          classificationRate: totalDefects > 0 ? ordersWithClassifications / totalDefects : 0
        });
        setCategories([]);
        setClassifications([]);
      }

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const processEngineStats = (orders: ServiceOrder[]) => {
        
    const statsMap = new Map<string, EngineModelStats>();
    
    orders.forEach((order, index) => {
      // ✅ CORRIGIDO: Usar os campos reais dos dados
      const key = `${order.engine_manufacturer || 'N/A'}|${order.vehicle_model || 'N/A'}|${order.engine_description || 'N/A'}`;
      
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          manufacturer: order.engine_manufacturer || 'N/A',
          model: order.vehicle_model || 'N/A', // ✅ vehicle_model ao invés de engine_model
          description: order.engine_description || 'N/A', // ✅ engine_description ao invés de engine_type
          totalDefects: 0,
          classifiedDefects: 0,
          topDefects: [],
          averageCost: 0,
          lastDefectDate: order.created_at
        });
      }
      
      const stats = statsMap.get(key)!;
      stats.totalDefects++;
      stats.averageCost += (order.parts_total || 0) + (order.labor_total || 0);
      
      if (order.defect_classifications && order.defect_classifications.length > 0) {
        stats.classifiedDefects++;
      }
      
      if (order.raw_defect_description) {
        stats.topDefects.push(order.raw_defect_description);
      }
      if (order.created_at && (!stats.lastDefectDate || new Date(order.created_at) > new Date(stats.lastDefectDate))) {
        stats.lastDefectDate = order.created_at;
      }
      
      // Log a cada 100 ordens processadas
      if ((index + 1) % 100 === 0) {
        console.log(`Processadas ${index + 1} ordens`);
      }
    });

    // Calcular médias e limitar top defeitos
    const processedStats = Array.from(statsMap.values()).map(stats => ({
      ...stats,
      averageCost: stats.totalDefects > 0 ? stats.averageCost / stats.totalDefects : 0,
      topDefects: stats.topDefects.slice(0, 5) // Top 5 defeitos
    }));

    setEngineStats(processedStats);
  };

  const handleStartMassClassification = async () => {
    setIsClassifying(true);
    try {
      const authHeaders = {
        'Authorization': localStorage.getItem('auth-token') ? `Bearer ${localStorage.getItem('auth-token')}` : '',
        'Content-Type': 'application/json'
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://gl-garantias-backend.onrender.com'}/api/v1/ai/classify-all`, {
        method: 'POST',
        headers: authHeaders
      });

      if (response.ok) {
        const data = await response.json();
                alert(`Classificação iniciada!\n${data.message}\nTempo estimado: ${data.estimated_time}`);
        setTimeout(() => {
          loadAllData();
        }, 3000);
      } else {
        console.error('❌ Erro ao iniciar classificação em massa');
        alert('Erro ao iniciar classificação em massa');
      }
    } catch (error) {
      console.error('❌ Erro na classificação em massa:', error);
      alert('Erro de conexão ao iniciar classificação');
    } finally {
      setIsClassifying(false);
    }
  };

  // Função para classificar um defeito individual
  const handleClassifyDefect = async () => {
    if (!classifyInput.trim()) return;
    
    setIsClassifyingIndividual(true);
    setClassifyResult(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://gl-garantias-backend.onrender.com'}/api/v1/ai/classify-defect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          defectDescription: classifyInput.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setClassifyResult(data.data);
      } else {
        setClassifyResult({ error: data.error || 'Erro na classificação' });
      }
    } catch (error) {
      setClassifyResult({ error: 'Erro de conexão' });
    } finally {
      setIsClassifyingIndividual(false);
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
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

  // Dados filtrados para gráficos
  const getFilteredEngineStats = () => {
    return engineStats.filter(stat => {
      const matchesManufacturer = manufacturerFilter === 'all' || stat.manufacturer === manufacturerFilter;
      const matchesModel = modelFilter === 'all' || stat.model === modelFilter;
      const hasDefects = stat.totalDefects > 0;
      
      return matchesManufacturer && matchesModel && hasDefects;
    });
  };

  const getFilteredServiceOrders = () => {
    return serviceOrders.filter(order => {
      const orderDate = new Date(order.order_date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      const matchesDate = orderDate >= startDate && orderDate <= endDate;
      const matchesManufacturer = manufacturerFilter === 'all' || order.engine_manufacturer === manufacturerFilter;
      const matchesModel = modelFilter === 'all' || (order.engine_model === modelFilter || order.vehicle_model === modelFilter);
      
      return matchesDate && matchesManufacturer && matchesModel;
    });
  };

  const engineChartData = getFilteredEngineStats()
    .slice(0, 10) // Top 10
    .map(stat => ({
      name: `${stat.manufacturer} ${stat.model}`,
      total: stat.totalDefects,
      classified: stat.classifiedDefects,
      rate: stat.totalDefects > 0 ? (stat.classifiedDefects / stat.totalDefects) * 100 : 0
    }));

  // 🔍 DEBUG: Logs para investigar dados do gráfico
  console.log('🔍 DEBUG Engine Chart Data:', {
    chartDataLength: engineChartData.length,
    sampleEngineStats: engineStats.slice(0, 3),
    sampleChartData: engineChartData.slice(0, 3)
  });

  return (
    <div className="space-y-6">
      {/* Header da Página */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Defeitos - Classificados por IA</h1>
      </div>

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="analises" className="w-full">
        <div className="flex justify-center">
          <TabsList className="inline-flex w-auto bg-black rounded-md p-1 mb-4 h-10">
            <TabsTrigger 
              value="analises" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Gráficos Gerais
            </TabsTrigger>
            <TabsTrigger 
              value="analise-hierarquica" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Análise Hierárquica
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab: Análise Hierárquica */}
        <TabsContent value="analise-hierarquica" className="space-y-6 mt-6">
          <HierarchicalAnalysisView />
        </TabsContent>

        {/* Tab: Análises */}
        <TabsContent value="analises" className="space-y-6 mt-6">
          {/* Filtros de Análise - Funcionais e Responsivos */}
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-black shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros de Análise
              </CardTitle>
              <CardDescription>
                Configure os filtros para personalizar as análises e visualizações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Período Início
                  </label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setDateRange(prev => ({ ...prev, start: newValue }));
                                          }}
                    className="transition-colors focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Período Fim
                  </label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setDateRange(prev => ({ ...prev, end: newValue }));
                                          }}
                    className="transition-colors focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Car className="h-4 w-4" />
                    Modelo do Motor
                  </label>
                  <Select 
                    value={modelFilter} 
                    onValueChange={(value) => {
                      setModelFilter(value);
                                          }}
                  >
                    <SelectTrigger className="transition-colors focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Selecionar modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">✓ Todos os Modelos</SelectItem>
                      {Array.from(new Set(serviceOrders.map(o => o.engine_model || o.vehicle_model).filter(Boolean))).map(model => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
            </CardContent>
          </Card>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Defeitos por Categoria"
              description="Distribuição dos defeitos classificados pela IA"
            >
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
            </ChartCard>

            <ChartCard
              title="Proporção de Categorias"
              description="Percentual de cada tipo de defeito"
            >
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
            </ChartCard>
          </div>

          {/* Terceiro Gráfico - Performance da IA por Modelo de Motor */}
          <ChartCard
            title="Performance da IA por Modelo de Motor"
            description="Taxa de classificação e eficiência por fabricante e modelo"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engineChartData.map(item => ({
                ...item,
                totalDefects: engineStats.find(stat => 
                  `${stat.manufacturer} ${stat.model}` === item.name
                )?.totalDefects || 0,
                classifiedDefects: engineStats.find(stat => 
                  `${stat.manufacturer} ${stat.model}` === item.name
                )?.classifiedDefects || 0
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={10}
                  stroke="#666"
                />
                <YAxis 
                  stroke="#666"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'Taxa de Classificação (%)') {
                      return [`${Number(value).toFixed(1)}%`, 'Taxa de IA'];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label: string) => `Modelo: ${label}`}
                />
                <Bar 
                  dataKey="rate" 
                  fill="url(#colorGradient)"
                  radius={[4, 4, 0, 0]}
                  name="Taxa de Classificação (%)"
                  stroke="#4f46e5"
                  strokeWidth={1}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.7}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default Defects;