import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown,
  Minus,
  BarChart3, 
  PieChart, 
  LineChart as LineChartIcon,
  DollarSign,
  Calendar,
  Factory,
  Zap,
  ChevronDown,
  ChevronRight,
  Eye,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
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
  ComposedChart,
  Legend
} from 'recharts';
import { api } from "@/services/api";

interface SubgroupMetrics {
  total_cases: number;
  avg_cost: number;
  top_manufacturers: Array<{ name: string; count: number }>;
  monthly_trend: Array<{ month: string; count: number }>;
}

interface Subgroup {
  id: number;
  category_name: string;
  description: string;
  color_hex: string;
  icon: string;
  total_occurrences: number;
  metrics: SubgroupMetrics;
}

interface HierarchyGroup {
  name: string;
  color: string;
  icon: string;
  total_occurrences: number;
  subgroups: Subgroup[];
}

interface HierarchicalData {
  hierarchy: HierarchyGroup[];
  statistics: {
    total_main_groups: number;
    total_subgroups: number;
    total_cases: number;
    coverage_percentage: number;
  };
  subgroups: Subgroup[];
}

const HierarchicalAnalysisView: React.FC = () => {
  const [data, setData] = useState<HierarchicalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedView, setSelectedView] = useState<'overview' | 'comparison' | 'trends'>('overview');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadHierarchicalData();
  }, []);

  const loadHierarchicalData = async () => {
    setLoading(true);
    try {

      // Dados mockados baseados na estrutura real que criamos
      const mockData: HierarchicalData = {
        hierarchy: [
          {
            name: 'Vazamentos',
            color: '#ef4444',
            icon: 'droplets',
            total_occurrences: 107,
            subgroups: [
              {
                id: 1,
                category_name: 'Vazamento Sistema Arrefecimento',
                description: 'Vazamentos do sistema de arrefecimento',
                color_hex: '#ef4444',
                icon: 'droplets',
                total_occurrences: 47,
                metrics: {
                  total_cases: 47,
                  avg_cost: 1850.50,
                  top_manufacturers: [
                    { name: 'MERCEDES-BENZ', count: 9 },
                    { name: 'MWM', count: 7 },
                    { name: 'PERKINS', count: 6 }
                  ],
                  monthly_trend: [
                    { month: '2025-03', count: 4 },
                    { month: '2025-04', count: 6 },
                    { month: '2025-05', count: 8 },
                    { month: '2025-06', count: 12 },
                    { month: '2025-07', count: 17 }
                  ]
                }
              },
              {
                id: 2,
                category_name: 'Vazamento Carter/Óleo Motor',
                description: 'Vazamentos do carter e óleo do motor',
                color_hex: '#ef4444',
                icon: 'droplets',
                total_occurrences: 43,
                metrics: {
                  total_cases: 43,
                  avg_cost: 1245.75,
                  top_manufacturers: [
                    { name: 'MWM', count: 8 },
                    { name: 'MERCEDES-BENZ', count: 8 },
                    { name: 'CUMMINS', count: 5 }
                  ],
                  monthly_trend: [
                    { month: '2025-03', count: 3 },
                    { month: '2025-04', count: 5 },
                    { month: '2025-05', count: 9 },
                    { month: '2025-06', count: 11 },
                    { month: '2025-07', count: 15 }
                  ]
                }
              },
              {
                id: 3,
                category_name: 'Vazamento Combustível',
                description: 'Vazamentos de combustível',
                color_hex: '#ef4444',
                icon: 'droplets',
                total_occurrences: 11,
                metrics: {
                  total_cases: 11,
                  avg_cost: 980.25,
                  top_manufacturers: [
                    { name: 'MERCEDES-BENZ', count: 4 },
                    { name: 'MWM', count: 3 },
                    { name: 'CUMMINS', count: 1 }
                  ],
                  monthly_trend: [
                    { month: '2025-03', count: 1 },
                    { month: '2025-04', count: 2 },
                    { month: '2025-05', count: 2 },
                    { month: '2025-06', count: 3 },
                    { month: '2025-07', count: 3 }
                  ]
                }
              }
            ]
          },
          {
            name: 'Problemas Mecânicos',
            color: '#f97316',
            icon: 'wrench',
            total_occurrences: 71,
            subgroups: [
              {
                id: 4,
                category_name: 'Folgas Mecânicas',
                description: 'Folgas excessivas em componentes',
                color_hex: '#f97316',
                icon: 'wrench',
                total_occurrences: 32,
                metrics: {
                  total_cases: 32,
                  avg_cost: 2150.00,
                  top_manufacturers: [
                    { name: 'CUMMINS', count: 4 },
                    { name: 'MERCEDES-BENZ', count: 4 },
                    { name: 'MWM', count: 4 }
                  ],
                  monthly_trend: [
                    { month: '2025-03', count: 2 },
                    { month: '2025-04', count: 4 },
                    { month: '2025-05', count: 6 },
                    { month: '2025-06', count: 8 },
                    { month: '2025-07', count: 12 }
                  ]
                }
              },
              {
                id: 5,
                category_name: 'Quebras e Fraturas',
                description: 'Componentes quebrados ou fraturados',
                color_hex: '#f97316',
                icon: 'wrench',
                total_occurrences: 23,
                metrics: {
                  total_cases: 23,
                  avg_cost: 3250.75,
                  top_manufacturers: [
                    { name: 'CUMMINS', count: 8 },
                    { name: 'PERKINS', count: 3 },
                    { name: 'GM', count: 1 }
                  ],
                  monthly_trend: [
                    { month: '2025-03', count: 1 },
                    { month: '2025-04', count: 3 },
                    { month: '2025-05', count: 4 },
                    { month: '2025-06', count: 6 },
                    { month: '2025-07', count: 9 }
                  ]
                }
              }
            ]
          },
          {
            name: 'Ruídos Anômalos',
            color: '#eab308',
            icon: 'volume-2',
            total_occurrences: 32,
            subgroups: [
              {
                id: 6,
                category_name: 'Ruído Motor Interno',
                description: 'Ruídos internos do motor',
                color_hex: '#eab308',
                icon: 'volume-2',
                total_occurrences: 17,
                metrics: {
                  total_cases: 17,
                  avg_cost: 1890.50,
                  top_manufacturers: [
                    { name: 'YANMAR', count: 5 },
                    { name: 'MWM', count: 3 },
                    { name: 'SCANIA', count: 2 }
                  ],
                  monthly_trend: [
                    { month: '2025-03', count: 1 },
                    { month: '2025-04', count: 2 },
                    { month: '2025-05', count: 3 },
                    { month: '2025-06', count: 5 },
                    { month: '2025-07', count: 6 }
                  ]
                }
              }
            ]
          },
          {
            name: 'Problemas Elétricos',
            color: '#2563eb',
            icon: 'zap',
            total_occurrences: 41,
            subgroups: [
              {
                id: 7,
                category_name: 'Problemas Sensores',
                description: 'Falhas em sensores',
                color_hex: '#2563eb',
                icon: 'zap',
                total_occurrences: 12,
                metrics: {
                  total_cases: 12,
                  avg_cost: 750.25,
                  top_manufacturers: [
                    { name: 'CUMMINS', count: 6 },
                    { name: 'MERCEDES-BENZ', count: 2 },
                    { name: 'VOLKSWAGEN', count: 1 }
                  ],
                  monthly_trend: [
                    { month: '2025-03', count: 1 },
                    { month: '2025-04', count: 1 },
                    { month: '2025-05', count: 2 },
                    { month: '2025-06', count: 3 },
                    { month: '2025-07', count: 5 }
                  ]
                }
              }
            ]
          },
          {
            name: 'Superaquecimento',
            color: '#dc2626',
            icon: 'thermometer',
            total_occurrences: 24,
            subgroups: [
              {
                id: 8,
                category_name: 'Temperatura Alta Geral',
                description: 'Problemas de superaquecimento geral',
                color_hex: '#dc2626',
                icon: 'thermometer',
                total_occurrences: 24,
                metrics: {
                  total_cases: 24,
                  avg_cost: 1650.00,
                  top_manufacturers: [
                    { name: 'CUMMINS', count: 6 },
                    { name: 'MWM', count: 4 },
                    { name: 'PERKINS', count: 3 }
                  ],
                  monthly_trend: [
                    { month: '2025-03', count: 2 },
                    { month: '2025-04', count: 3 },
                    { month: '2025-05', count: 4 },
                    { month: '2025-06', count: 6 },
                    { month: '2025-07', count: 9 }
                  ]
                }
              }
            ]
          },
          {
            name: 'Operacional',
            color: '#059669',
            icon: 'settings',
            total_occurrences: 30,
            subgroups: [
              {
                id: 9,
                category_name: 'Testes e Verificações',
                description: 'Testes e verificações operacionais',
                color_hex: '#059669',
                icon: 'settings',
                total_occurrences: 18,
                metrics: {
                  total_cases: 18,
                  avg_cost: 450.75,
                  top_manufacturers: [
                    { name: 'MERCEDES-BENZ', count: 4 },
                    { name: 'CUMMINS', count: 3 },
                    { name: 'TOYOTA', count: 2 }
                  ],
                  monthly_trend: [
                    { month: '2025-03', count: 2 },
                    { month: '2025-04', count: 2 },
                    { month: '2025-05', count: 3 },
                    { month: '2025-06', count: 4 },
                    { month: '2025-07', count: 7 }
                  ]
                }
              },
              {
                id: 10,
                category_name: 'Manutenção Preventiva',
                description: 'Manutenções preventivas',
                color_hex: '#059669',
                icon: 'settings',
                total_occurrences: 12,
                metrics: {
                  total_cases: 12,
                  avg_cost: 325.50,
                  top_manufacturers: [
                    { name: 'MERCEDES-BENZ', count: 4 },
                    { name: 'RENAULT', count: 3 },
                    { name: 'FIAT', count: 1 }
                  ],
                  monthly_trend: [
                    { month: '2025-03', count: 1 },
                    { month: '2025-04', count: 1 },
                    { month: '2025-05', count: 2 },
                    { month: '2025-06', count: 3 },
                    { month: '2025-07', count: 5 }
                  ]
                }
              }
            ]
          }
        ],
        statistics: {
          total_main_groups: 6,
          total_subgroups: 18,
          total_cases: 305,
          coverage_percentage: 89.2
        },
        subgroups: []
      };

      setData(mockData);
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados hierárquicos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const getFilteredData = () => {
    if (!data || selectedGroup === 'all') return data;
    
    return {
      ...data,
      hierarchy: data.hierarchy.filter(group => group.name === selectedGroup)
    };
  };

  const getPieChartData = () => {
    const filteredData = getFilteredData();
    if (!filteredData) return [];
    
    return filteredData.hierarchy.map(group => ({
      name: group.name,
      value: group.total_occurrences,
      color: group.color
    }));
  };

  const getSubgroupsComparisonData = () => {
    const filteredData = getFilteredData();
    if (!filteredData) return [];
    
    const allSubgroups: any[] = [];
    filteredData.hierarchy.forEach(group => {
      group.subgroups.forEach(subgroup => {
        allSubgroups.push({
          name: subgroup.category_name.length > 20 
            ? subgroup.category_name.substring(0, 20) + '...' 
            : subgroup.category_name,
          fullName: subgroup.category_name,
          cases: subgroup.metrics.total_cases,
          avgCost: subgroup.metrics.avg_cost,
          group: group.name,
          color: subgroup.color_hex
        });
      });
    });
    
    return allSubgroups
      .sort((a, b) => b.cases - a.cases)
      .slice(0, 5); // Top 5 subgrupos
  };

  const getTrendData = () => {
    if (!data) return [];
    
    // Combinar tendências mensais de todos os subgrupos
    const monthlyData = new Map();
    
    data.hierarchy.forEach(group => {
      group.subgroups.forEach(subgroup => {
        subgroup.metrics.monthly_trend.forEach(trend => {
          if (!monthlyData.has(trend.month)) {
            monthlyData.set(trend.month, { month: trend.month, total: 0, groups: {} });
          }
          const monthData = monthlyData.get(trend.month);
          monthData.total += trend.count;
          monthData.groups[group.name] = (monthData.groups[group.name] || 0) + trend.count;
        });
      });
    });
    
    return Array.from(monthlyData.values()).sort((a, b) => a.month.localeCompare(b.month));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Dados não disponíveis</h3>
        <p className="text-muted-foreground mb-4">
          Não foi possível carregar os dados de análise hierárquica.
        </p>
        <Button onClick={loadHierarchicalData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
  }

  const filteredData = getFilteredData();
  const pieChartData = getPieChartData();
  const subgroupsData = getSubgroupsComparisonData();
  const trendData = getTrendData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Análise Hierárquica Detalhada</h1>
          <p className="text-muted-foreground">
            Análise quantitativa dos defeitos organizados por grupos e subgrupos específicos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecionar grupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🎯 Todos os Grupos</SelectItem>
              {data.hierarchy.map(group => (
                <SelectItem key={group.name} value={group.name}>
                  {group.name} ({group.total_occurrences})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={loadHierarchicalData} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Grupos Principais</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.statistics.total_main_groups}
                </p>
              </div>
              <PieChart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Subgrupos Específicos</p>
                <p className="text-2xl font-bold text-green-600">
                  {data.statistics.total_subgroups}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Casos</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.statistics.total_cases.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cobertura</p>
                <p className="text-2xl font-bold text-orange-600">
                  {data.statistics.coverage_percentage.toFixed(1)}%
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Visualização */}
      <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <Eye className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="comparison">
            <BarChart3 className="h-4 w-4 mr-2" />
            Comparação
          </TabsTrigger>
          <TabsTrigger value="trends">
            <LineChartIcon className="h-4 w-4 mr-2" />
            Tendências
          </TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribuição por Grupos */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Grupos Principais</CardTitle>
                <CardDescription>
                  Proporção de casos por cada grupo hierárquico
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [value.toLocaleString(), 'Casos']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Detalhamento por Subgrupos */}
            <Card>
              <CardHeader>
                <CardTitle>Top Subgrupos por Volume</CardTitle>
                <CardDescription>
                  Subgrupos com maior número de casos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subgroupsData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={120}
                        fontSize={12}
                      />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          value.toLocaleString(), 
                          name === 'cases' ? 'Casos' : 'Custo Médio'
                        ]}
                        labelFormatter={(label: string) => {
                          const item = subgroupsData.find(d => d.name === label);
                          return item ? item.fullName : label;
                        }}
                      />
                      <Bar 
                        dataKey="cases" 
                        fill="#8884d8"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Estrutura Hierárquica Detalhada */}
          <Card>
            <CardHeader>
              <CardTitle>Estrutura Hierárquica Detalhada</CardTitle>
              <CardDescription>
                Navegue pelos grupos e subgrupos para ver métricas específicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredData?.hierarchy.map((group) => (
                  <div key={group.name} className="border rounded-lg">
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                      onClick={() => toggleGroup(group.name)}
                    >
                      <div className="flex items-center gap-3">
                        {expandedGroups.has(group.name) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: group.color }}
                        />
                        <div>
                          <h3 className="font-semibold">{group.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {group.subgroups.length} subgrupos • {group.total_occurrences.toLocaleString()} casos
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {group.total_occurrences.toLocaleString()}
                      </Badge>
                    </div>

                    {expandedGroups.has(group.name) && (
                      <div className="border-t bg-gray-50/50 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {group.subgroups.map((subgroup) => (
                            <div 
                              key={subgroup.id}
                              className="bg-white p-3 rounded border border-gray-200"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-sm">
                                  {subgroup.category_name}
                                </h4>
                                <Badge 
                                  variant="outline"
                                  style={{ 
                                    borderColor: subgroup.color_hex,
                                    color: subgroup.color_hex 
                                  }}
                                >
                                  {subgroup.metrics.total_cases}
                                </Badge>
                              </div>
                              
                              <div className="space-y-1 text-xs text-muted-foreground">
                                <div className="flex justify-between">
                                  <span>Custo médio:</span>
                                  <span className="font-medium">
                                    R$ {subgroup.metrics.avg_cost.toLocaleString('pt-BR', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </span>
                                </div>
                                
                                {subgroup.metrics.top_manufacturers.length > 0 && (
                                  <div className="flex justify-between">
                                    <span>Top fabricante:</span>
                                    <span className="font-medium">
                                      {subgroup.metrics.top_manufacturers[0].name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Comparação */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comparação de Subgrupos por Volume e Custo</CardTitle>
              <CardDescription>
                Análise comparativa entre subgrupos - casos vs custo médio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={subgroupsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={10}
                    />
                    <YAxis yAxisId="cases" orientation="left" />
                    <YAxis yAxisId="cost" orientation="right" />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'cases' ? value.toLocaleString() : 
                        `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        name === 'cases' ? 'Casos' : 'Custo Médio'
                      ]}
                    />
                    <Legend />
                    <Bar 
                      yAxisId="cases"
                      dataKey="cases" 
                      fill="#8884d8" 
                      name="Casos"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line 
                      yAxisId="cost"
                      type="monotone" 
                      dataKey="avgCost" 
                      stroke="#ff7300" 
                      strokeWidth={2}
                      name="Custo Médio"
                      dot={{ fill: '#ff7300' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Tendências */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tendência Temporal dos Defeitos</CardTitle>
              <CardDescription>
                Evolução mensal dos casos por grupo principal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stackId="1"
                      stroke="#8884d8" 
                      fill="#8884d8"
                      fillOpacity={0.8}
                      name="Total de Casos"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
};

export default HierarchicalAnalysisView;