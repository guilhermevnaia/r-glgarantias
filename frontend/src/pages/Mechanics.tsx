import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  Search, 
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  Shield,
  Wrench,
  AlertOctagon,
  XCircle,
  MinusCircle,
  FilterX,
  FileText,
  Activity,
  Calendar
} from "lucide-react";
import { exportToExcel, formatServiceOrdersForExport } from '@/utils/exportExcel';
import { useAI } from '@/hooks/useAI';
import { SimpleDefectCard } from '@/components/SimpleDefectCard';
import { AppleCard } from '@/components/AppleCard';
import { ChartCard } from "@/components/ChartCard";
import { useMechanicsData } from "@/hooks/useGlobalData";
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
  Legend
} from 'recharts';

const Mechanics = () => {
  // 🤖 DADOS DA IA
  const { classifications, loading: aiLoading, error: aiError } = useAI();
  
  // Estados para filtros com período padrão (desde 2019 até data atual)
  const [dateRange, setDateRange] = useState<{start: string, end: string}>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];
    return {
      start: startDate,
      end: endDate
    };
  });
  const [selectedDefectType, setSelectedDefectType] = useState('all');
  const [selectedMotor, setSelectedMotor] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [sortBy, setSortBy] = useState<'warranties' | 'totalCost' | 'avgCost' | 'defects'>('warranties');
  const [showMechanicDetails, setShowMechanicDetails] = useState<string | null>(null);
  const [showDefectsModal, setShowDefectsModal] = useState<{mechanic: string, defects: string[]} | null>(null);

  // Buscar dados reais com hook (sem filtros de mês/ano específicos para ter dados completos)
  const getMonthYearFromRange = () => {
    if (!dateRange.start || !dateRange.end) {
      return { month: undefined, year: undefined };
    }
    
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    // Para aba Mecânicos, sempre buscar dados completos para depois filtrar no frontend
    // Isso garante que tenhamos todos os dados históricos dos mecânicos
    return { month: undefined, year: undefined };
  };
  
  // Sempre buscar todos os dados - sem filtros
  const { data: mechanicsData, isLoading: loading, error } = useMechanicsData();

  if (loading) {
    return (
      <div className="min-h-screen bg-apple-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-6 max-w-7xl mx-auto">
          <div className="h-8 bg-white rounded-lg w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-96 bg-white rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !mechanicsData) {
    return (
      <div className="min-h-screen bg-apple-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full">
          <CardContent>
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Erro ao carregar dados dos mecânicos</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filtrar e recalcular dados baseado nos filtros selecionados (incluindo data)
  const filteredMechanics = ((mechanicsData as any)?.mechanicsStats || []).map((mechanic: any) => {
    // Primeiro filtrar as ordens do mecânico pelo período de data
    let filteredOrders = mechanic.orders || [];
    
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      filteredOrders = mechanic.orders.filter((order: any) => {
        if (!order.order_date) return false;
        const orderDate = new Date(order.order_date);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }
    
    // Se não há ordens no período, retornar null para filtrar depois
    if (filteredOrders.length === 0) return null;
    
    // Recalcular estatísticas baseadas apenas nas ordens filtradas
    const totalWarranties = filteredOrders.length;
    const totalCost = filteredOrders.reduce((sum: number, order: any) => {
      // ✅ APLICAR DIVISÃO POR 2 para dados de produção (conforme regra de negócio)
      return sum + (parseFloat(order.grand_total || 0) / 2);
    }, 0);
    const avgCostPerWarranty = totalWarranties > 0 ? totalCost / totalWarranties : 0;
    
    // 🤖 Recalcular tipos de defeitos usando classificações que vêm com as ordens
    const defectTypes = [...new Set(filteredOrders.map((order: any) => {
      // Usar a classificação que vem junto com a ordem (igual ao Dashboard)
      const classification = order.defect_classifications && order.defect_classifications.length > 0 
        ? order.defect_classifications[0] 
        : null;
      
      // Verificar se existe classificação e tem categoria
      if (classification && classification.defect_categories && classification.defect_categories.category_name) {
        return classification.defect_categories.category_name;
      }
      
      // Fallback: se não há classificação da API, usar o hook useAI
      const aiClassification = classifications.find(c => c.service_order_id === order.id);
      if (aiClassification && aiClassification.defect_categories && aiClassification.defect_categories.category_name) {
        return aiClassification.defect_categories.category_name;
      }
      
      return null; // Não mostrar defeitos não classificados
    }).filter(Boolean))];
    const manufacturers = [...new Set(filteredOrders.map((order: any) => order.engine_manufacturer).filter(Boolean))];
    const models = [...new Set(filteredOrders.map((order: any) => order.engine_description).filter(Boolean))];
    
    const lastWarranty = filteredOrders.length > 0 ? 
      filteredOrders.sort((a: any, b: any) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())[0].order_date : 
      null;
    
    return {
      ...mechanic,
      orders: filteredOrders,
      totalWarranties,
      totalCost,
      avgCostPerWarranty,
      defectTypes,
      manufacturers,
      models,
      lastWarranty
    };
  }).filter(Boolean);

  // Ordenar mecânicos baseado no critério selecionado
  const sortedMechanics = [...filteredMechanics].sort((a: any, b: any) => {
    switch (sortBy) {
      case 'warranties':
        return b.totalWarranties - a.totalWarranties;
      case 'totalCost':
        return b.totalCost - a.totalCost;
      case 'avgCost':
        return b.avgCostPerWarranty - a.avgCostPerWarranty;
      case 'defects':
        return b.defectTypes.length - a.defectTypes.length;
      default:
        return b.totalWarranties - a.totalWarranties;
    }
  });


  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para obter iniciais do nome
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Calcular estatísticas baseadas nos dados filtrados
  const totalWarranties = sortedMechanics.reduce((sum: number, mechanic: any) => sum + mechanic.totalWarranties, 0);
  const totalCost = sortedMechanics.reduce((sum: number, mechanic: any) => sum + mechanic.totalCost, 0);
  const avgCostPerWarranty = totalWarranties > 0 ? totalCost / totalWarranties : 0;
  const totalMechanics = sortedMechanics.length;

  // Dados para gráficos com ordenação
  const chartData = sortedMechanics.slice(0, 10); // Top 10 para melhor visualização

  // Função para renderizar o modal de detalhes do mecânico
  const renderMechanicDetailsModal = () => {
    if (!showMechanicDetails) return null;
    
    const mechanic = sortedMechanics.find(m => m.name === showMechanicDetails);
    if (!mechanic) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{mechanic.name}</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMechanicDetails(null)}
              >
                ×
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{mechanic.totalWarranties}</p>
                <p className="text-sm text-gray-600">Total de Garantias</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(mechanic.totalCost)}</p>
                <p className="text-sm text-gray-600">Custo Total</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(mechanic.avgCostPerWarranty)}</p>
                <p className="text-sm text-gray-600">Custo Médio</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{mechanic.defectTypes.length}</p>
                <p className="text-sm text-gray-600">Tipos de Defeitos</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Tipos de Defeitos (Classificados por IA)</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {mechanic.defectTypes.length > 0 ? (
                    mechanic.defectTypes.map((defect: string, index: number) => (
                      <div key={index} className="p-2 bg-red-50 rounded text-sm flex items-center justify-between">
                        <span>{defect}</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                          IA
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-gray-50 rounded text-sm text-center text-gray-500">
                      Nenhum defeito classificado pela IA encontrado
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Modelos de Motor</h3>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {mechanic.models.map((model: string, index: number) => (
                    <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {model}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            {mechanic.orders && mechanic.orders.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Ordens de Serviço</h3>
                <div className="overflow-x-auto max-h-60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>OS</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Defeito</TableHead>
                        <TableHead>Custo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mechanic.orders.slice(0, 10).map((order: any, index: number) => (
                        <TableRow key={order.order_number || index}>
                          <TableCell className="font-medium">{order.order_number}</TableCell>
                          <TableCell>{order.order_date.split('T')[0].split('-').reverse().join('/')}</TableCell>
                          <TableCell>
                            <SimpleDefectCard 
                              order={order}
                              classification={order.defect_classifications && order.defect_classifications.length > 0 ? order.defect_classifications[0] : null}
                              className="text-xs"
                            />
                          </TableCell>
                          <TableCell className="text-red-600 font-semibold">
                            {formatCurrency(parseFloat(order.grand_total || 0) / 2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Função para renderizar detalhes do mecânico selecionado
  const renderSelectedMechanicDetails = () => {
    if (!searchTerm) return null;
    
    const selectedMechanic = filteredMechanics.find((m: any) => m.name === searchTerm);
    if (!selectedMechanic) return null;
    
    return (
      <div className="space-y-6">
        
        {/* Card Principal do Mecânico - Responsivo */}
        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200 shadow-md">
          <CardContent className="p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <Avatar className="h-16 w-16 flex-shrink-0">
                <AvatarFallback className="text-lg font-semibold bg-white">
                  {getInitials(selectedMechanic.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold text-gray-900">{selectedMechanic.name}</h2>
                <p className="text-gray-600">
                  {selectedMechanic.totalWarranties} garantias • 
                  Média: {formatCurrency(selectedMechanic.avgCostPerWarranty)}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 lg:p-4 bg-white rounded-lg">
                <p className="text-xl lg:text-2xl font-bold text-red-600">{selectedMechanic.totalWarranties}</p>
                <p className="text-xs lg:text-sm text-gray-600">Total de Garantias</p>
              </div>
              <div className="text-center p-3 lg:p-4 bg-white rounded-lg">
                <p className="text-xl lg:text-2xl font-bold text-red-600">
                  <span className="hidden sm:inline">{formatCurrency(selectedMechanic.totalCost)}</span>
                  <span className="sm:hidden">{formatCurrency(selectedMechanic.totalCost / 1000)}k</span>
                </p>
                <p className="text-xs lg:text-sm text-gray-600">Custo Total</p>
              </div>
              <div className="text-center p-3 lg:p-4 bg-white rounded-lg">
                <p className="text-xl lg:text-2xl font-bold text-orange-600">
                  <span className="hidden sm:inline">{formatCurrency(selectedMechanic.avgCostPerWarranty)}</span>
                  <span className="sm:hidden">{formatCurrency(selectedMechanic.avgCostPerWarranty / 1000)}k</span>
                </p>
                <p className="text-xs lg:text-sm text-gray-600">Custo Médio</p>
              </div>
              <div className="text-center p-3 lg:p-4 bg-white rounded-lg">
                <p className="text-xl lg:text-2xl font-bold text-blue-600">{selectedMechanic.defectTypes.length}</p>
                <p className="text-xs lg:text-sm text-gray-600">Tipos de Defeitos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detalhes em Grid Responsivo */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* Gráfico de Pizza - Tipos de Defeitos Classificados pela IA */}
          <Card className="bg-white border-2 border-black shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-red-600" />
                Tipos de Defeitos Causados (IA)
              </CardTitle>
              <CardDescription className="text-gray-500">
                Defeitos classificados automaticamente pela IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                // Criar dados para o gráfico de pizza baseado nas classificações da IA
                const defectCounts = {};
                selectedMechanic.orders.forEach((order: any) => {
                  // Usar a classificação que vem junto com a ordem (igual ao Dashboard)
                  const classification = order.defect_classifications && order.defect_classifications.length > 0 
                    ? order.defect_classifications[0] 
                    : null;
                  
                  // Verificar se existe classificação e categoria
                  if (classification && classification.defect_categories && classification.defect_categories.category_name) {
                    const categoryName = classification.defect_categories.category_name;
                    defectCounts[categoryName] = (defectCounts[categoryName] || 0) + 1;
                  } else {
                    // Fallback: usar hook useAI
                    const aiClassification = classifications.find(c => c.service_order_id === order.id);
                    if (aiClassification && aiClassification.defect_categories && aiClassification.defect_categories.category_name) {
                      const categoryName = aiClassification.defect_categories.category_name;
                      defectCounts[categoryName] = (defectCounts[categoryName] || 0) + 1;
                    }
                  }
                });

                const pieData = Object.entries(defectCounts).map(([name, value], index) => ({
                  name,
                  value,
                  color: [
                    '#DC2626', '#EA580C', '#D97706', '#CA8A04', 
                    '#059669', '#0891B2', '#1D4ED8', '#7C3AED'
                  ][index % 8]
                })).sort((a, b) => b.value - a.value);

                const totalDefects = Object.values(defectCounts).reduce((sum: number, count: number) => sum + count, 0);

                return pieData.length > 0 ? (
                  <div>
                    <div className="h-64 mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any, name: string) => [
                              `${value} defeitos (${((value / totalDefects) * 100).toFixed(1)}%)`,
                              name
                            ]}
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px'
                            }}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            formatter={(value) => `${value}`}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Lista resumida abaixo do gráfico */}
                    <div className="space-y-2">
                      {pieData.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-medium text-gray-900 text-sm">
                              {item.name}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.value} ({((item.value / totalDefects) * 100).toFixed(1)}%)
                          </div>
                        </div>
                      ))}
                      {pieData.length > 3 && (
                        <div className="text-center text-sm text-gray-500 pt-2">
                          +{pieData.length - 3} outras categorias
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Wrench className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Nenhum defeito classificado encontrado</p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Modelos, Fabricantes e Tipos de Motores */}
          <Card className="bg-white border-2 border-black shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Modelos, Fabricantes e Tipos de Motores
              </CardTitle>
              <CardDescription className="text-gray-500">
                Análise completa dos equipamentos trabalhados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Fabricantes - Seção Principal */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Fabricantes de Motores ({selectedMechanic.manufacturers.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMechanic.manufacturers.map((mfg: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200 text-sm font-medium">
                        {mfg}
                      </Badge>
                    ))}
                    {selectedMechanic.manufacturers.length === 0 && (
                      <span className="text-sm text-gray-500 italic">Nenhum fabricante identificado</span>
                    )}
                  </div>
                </div>

                {/* Modelos - Seção Expandida */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Modelos de Motores ({selectedMechanic.models.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedMechanic.models.slice(0, 8).map((model: string, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="font-medium text-blue-900 text-sm truncate flex-1" title={model}>
                          {model}
                        </span>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300 text-xs ml-2">
                          Motor
                        </Badge>
                      </div>
                    ))}
                    {selectedMechanic.models.length > 8 && (
                      <div className="sm:col-span-2 text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-sm text-gray-600">
                          +{selectedMechanic.models.length - 8} outros modelos
                        </span>
                      </div>
                    )}
                    {selectedMechanic.models.length === 0 && (
                      <div className="sm:col-span-2 text-center p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-500 italic">Nenhum modelo identificado</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tipos de Motores - Nova Seção */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Tipos de Motores por Aplicação
                  </h4>
                  {(() => {
                    // Classificar modelos por tipo baseado em palavras-chave
                    const motorTypes = {
                      'Diesel': [],
                      'Gasolina': [],
                      'Flex': [],
                      'Turbo': [],
                      'Aspirado': [],
                      'Industrial': [],
                      'Marítimo': [],
                      'Outros': []
                    };

                    selectedMechanic.models.forEach((model: string) => {
                      const modelLower = model.toLowerCase();
                      let classified = false;
                      
                      if (modelLower.includes('diesel') || modelLower.includes('tdi') || modelLower.includes('hdi')) {
                        motorTypes['Diesel'].push(model);
                        classified = true;
                      }
                      if (modelLower.includes('gasolina') || modelLower.includes('gsi') || modelLower.includes('mpfi')) {
                        motorTypes['Gasolina'].push(model);
                        classified = true;
                      }
                      if (modelLower.includes('flex') || modelLower.includes('total flex')) {
                        motorTypes['Flex'].push(model);
                        classified = true;
                      }
                      if (modelLower.includes('turbo') || modelLower.includes('tsi') || modelLower.includes('tfsi')) {
                        motorTypes['Turbo'].push(model);
                        classified = true;
                      }
                      if (modelLower.includes('aspirado') || modelLower.includes('16v') || modelLower.includes('8v')) {
                        motorTypes['Aspirado'].push(model);
                        classified = true;
                      }
                      if (modelLower.includes('industrial') || modelLower.includes('máquina') || modelLower.includes('trator')) {
                        motorTypes['Industrial'].push(model);
                        classified = true;
                      }
                      if (modelLower.includes('marítimo') || modelLower.includes('lancha') || modelLower.includes('barco')) {
                        motorTypes['Marítimo'].push(model);
                        classified = true;
                      }
                      
                      if (!classified) {
                        motorTypes['Outros'].push(model);
                      }
                    });

                    const activeTypes = Object.entries(motorTypes).filter(([type, models]) => models.length > 0);
                    const typeColors = {
                      'Diesel': 'bg-red-50 text-red-700 border-red-200',
                      'Gasolina': 'bg-green-50 text-green-700 border-green-200', 
                      'Flex': 'bg-blue-50 text-blue-700 border-blue-200',
                      'Turbo': 'bg-purple-50 text-purple-700 border-purple-200',
                      'Aspirado': 'bg-yellow-50 text-yellow-700 border-yellow-200',
                      'Industrial': 'bg-orange-50 text-orange-700 border-orange-200',
                      'Marítimo': 'bg-cyan-50 text-cyan-700 border-cyan-200',
                      'Outros': 'bg-gray-50 text-gray-700 border-gray-200'
                    };

                    return activeTypes.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {activeTypes.map(([type, models]) => (
                          <div key={type} className="text-center">
                            <Badge 
                              variant="outline" 
                              className={`${typeColors[type]} text-sm font-medium w-full justify-center mb-1`}
                            >
                              {type}
                            </Badge>
                            <div className="text-xs text-gray-600">
                              {models.length} motor{models.length !== 1 ? 'es' : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-500 italic">
                          Tipos de motores serão identificados conforme os modelos forem classificados
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Resumo Estatístico */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-gray-900 mb-2">Resumo dos Equipamentos</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">{selectedMechanic.manufacturers.length}</div>
                      <div className="text-xs text-gray-600">Fabricantes</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">{selectedMechanic.models.length}</div>
                      <div className="text-xs text-gray-600">Modelos</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-600">{selectedMechanic.orders.length}</div>
                      <div className="text-xs text-gray-600">Serviços</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Histórico de Garantias */}
         <Card className="bg-white border-2 border-black shadow-md">
           <CardHeader>
             <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
               <Calendar className="h-5 w-5 text-purple-600" />
               Histórico de Garantias
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="space-y-3">
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-purple-50 rounded-lg gap-2">
                 <div>
                   <p className="font-medium text-gray-900">Última Garantia</p>
                   <p className="text-sm text-gray-600">
                     {selectedMechanic.lastWarranty ? 
                       selectedMechanic.lastWarranty.split('T')[0].split('-').reverse().join('/') : 
                       'Não informado'
                     }
                   </p>
                 </div>
                 <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300 self-start sm:self-center">
                   Recente
                 </Badge>
               </div>
               <div className="text-center p-4 bg-gray-50 rounded-lg">
                 <p className="text-sm text-gray-600">
                   Total de {selectedMechanic.totalWarranties} garantias registradas
                 </p>
               </div>
               <div className="flex justify-center">
                 <Button 
                   onClick={() => setShowOrderDetails(!showOrderDetails)}
                   variant="outline"
                   className="flex items-center gap-2"
                 >
                   <FileText className="h-4 w-4" />
                   {showOrderDetails ? 'Ocultar Detalhes' : 'Ver Todas as OS'}
                 </Button>
               </div>
             </div>
           </CardContent>
         </Card>

         {/* Lista das Ordens de Serviço */}
         {showOrderDetails && selectedMechanic.orders && (
           <Card className="bg-white border-2 border-black shadow-md">
             <CardHeader>
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                 <div>
                   <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                     <FileText className="h-5 w-5 text-blue-600" />
                     Todas as OS - {selectedMechanic.name}
                   </CardTitle>
                   <CardDescription className="text-gray-500">
                     {selectedMechanic.orders.length} ordens de serviço encontradas
                   </CardDescription>
                 </div>
                 <Button
                   onClick={() => {
                     const exportData = formatServiceOrdersForExport(selectedMechanic.orders, classifications);
                     exportToExcel(
                       exportData, 
                       `OS_${selectedMechanic.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
                       'Ordens de Serviço'
                     );
                   }}
                   variant="outline"
                   className="flex items-center gap-2"
                 >
                   <Download className="h-4 w-4" />
                   Exportar Excel
                 </Button>
               </div>
             </CardHeader>
             <CardContent className="p-0">
               <div className="overflow-x-auto">
                 <Table>
                   <TableHeader>
                     <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                       <TableHead className="font-semibold text-gray-700 min-w-[100px]">OS</TableHead>
                       <TableHead className="font-semibold text-gray-700 min-w-[100px]">Data</TableHead>
                       <TableHead className="font-semibold text-gray-700 min-w-[150px] hidden sm:table-cell">Defeito</TableHead>
                       <TableHead className="font-semibold text-gray-700 min-w-[150px] hidden md:table-cell">Modelo</TableHead>
                       <TableHead className="font-semibold text-gray-700 min-w-[100px]">Custo</TableHead>
                       <TableHead className="font-semibold text-gray-700 min-w-[80px] hidden lg:table-cell">Status</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {selectedMechanic.orders.map((order: any, index: number) => (
                       <TableRow key={order.order_number || index} className="hover:bg-gray-50/30">
                         <TableCell className="font-medium text-gray-900 text-sm">
                           {order.order_number || `OS-${index + 1}`}
                         </TableCell>
                         <TableCell className="text-gray-600 text-sm">
                           {order.order_date.split('T')[0].split('-').reverse().join('/')}
                         </TableCell>
                         <TableCell className="hidden sm:table-cell">
                           <SimpleDefectCard 
                             order={order}
                             classification={order.defect_classifications && order.defect_classifications.length > 0 ? order.defect_classifications[0] : null}
                             className="text-xs"
                           />
                         </TableCell>
                         <TableCell className="hidden md:table-cell">
                           <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                             {order.engine_description || 'Não informado'}
                           </Badge>
                         </TableCell>
                         <TableCell className="text-red-600 font-semibold text-sm">
                           {formatCurrency(parseFloat(order.grand_total || 0) / 2)}
                         </TableCell>
                         <TableCell className="hidden lg:table-cell">
                           <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                             {order.order_status || 'G'}
                           </Badge>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
               {selectedMechanic.orders.length > 20 && (
                 <div className="p-4 text-center text-sm text-gray-500 border-t">
                   Mostrando primeiras 20 de {selectedMechanic.orders.length} ordens
                 </div>
               )}
             </CardContent>
           </Card>
         )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Análise de Mecânicos</h1>
      
      {/* Tabs de Análise */}
      <Tabs defaultValue="ranking" className="w-full">
        <div className="flex justify-center">
          <TabsList className="inline-flex w-auto bg-black rounded-md p-1 mb-4 sm:mb-6 h-10">
            <TabsTrigger 
              value="ranking"
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-3 sm:px-6"
            >
              Ranking
            </TabsTrigger>
            <TabsTrigger 
              value="analytics"
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-3 sm:px-6"
            >
              Análises
            </TabsTrigger>
            <TabsTrigger 
              value="comparison"
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-3 sm:px-6"
            >
              Comparativo
            </TabsTrigger>
          </TabsList>
        </div>

          {/* Filtros Responsivos */}
          <Card className="bg-white border-2 border-black shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <span className="hidden sm:inline">Filtros de Análise</span>
                <span className="sm:hidden">Filtros</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                
                {/* Filtro de Data Início */}
                <div className="flex flex-col justify-end">
                  <Label className="text-xs font-normal text-gray-500 mb-1">Data Início</Label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full h-9"
                  />
                </div>

                {/* Filtro de Data Fim */}
                <div className="flex flex-col justify-end">
                  <Label className="text-xs font-normal text-gray-500 mb-1">Data Fim</Label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full h-9"
                  />
                </div>

                {/* Filtro de Motor */}
                <div className="flex flex-col justify-end">
                  <Label className="text-xs font-normal text-gray-500 mb-1">Motor</Label>
                  <Select value={selectedMotor} onValueChange={setSelectedMotor}>
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {[...new Set(filteredMechanics.flatMap(m => m.manufacturers))].slice(0, 10).map((mfg: string) => (
                        <SelectItem key={mfg} value={mfg}>
                          {mfg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Busca por Mecânico */}
                <div className="flex flex-col justify-end">
                  <Label className="text-xs font-normal text-gray-500 mb-1">Buscar Mecânico</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Nome do mecânico..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full h-9"
                    />
                  </div>
                </div>
                
                {/* Botão Reset Período */}
                <div className="flex items-end">
                  <Button 
                    onClick={() => {
                      const now = new Date();
                      const year = now.getFullYear();
                      setDateRange({
                        start: `${year}-01-01`,
                        end: now.toISOString().split('T')[0]
                      });
                    }}
                    variant="outline" 
                    className="w-full h-9"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Este Ano
                  </Button>
                </div>
              </div>

              {/* Botão para limpar filtros em dispositivos móveis */}
              <div className="mt-4 sm:hidden">
                <Button 
                  onClick={() => {
                    const now = new Date();
                    const year = now.getFullYear();
                    setDateRange({
                      start: `${year}-01-01`,
                      end: now.toISOString().split('T')[0]
                    });
                    setSelectedDefectType('all');
                    setSelectedMotor('all');
                    setSearchTerm('');
                    setSortBy('warranties');
                  }}
                  variant="outline" 
                  className="w-full"
                >
                  <FilterX className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resumo Estatístico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mt-6 lg:mt-8">
            <Card className="bg-white border-2 border-black shadow-md">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Total de Garantias
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-3xl font-bold text-red-600">{totalWarranties}</p>
                <p className="text-sm text-gray-500">{totalMechanics} mecânicos ativos</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-2 border-black shadow-md">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Custo Total
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-3xl font-bold text-orange-600">{formatCurrency(totalCost)}</p>
                <p className="text-sm text-gray-500">Média: {formatCurrency(avgCostPerWarranty)}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-2 border-black shadow-md">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Tipos de Defeitos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-3xl font-bold text-red-600">
                  {new Set(sortedMechanics.flatMap((m: any) => m.defectTypes)).size}
                </p>
                <p className="text-sm text-gray-500">Únicos no período</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-2 border-black shadow-md">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Mecânicos Ativos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-3xl font-bold text-blue-600">{totalMechanics}</p>
                <p className="text-sm text-gray-500">
                  {((mechanicsData as any)?.mechanicsStats || []).length > totalMechanics ? 
                    `${((mechanicsData as any)?.mechanicsStats || []).length - totalMechanics} filtrados` : 
                    "Todos visíveis"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Ranking de Garantias */}
          <TabsContent value="ranking" className="space-y-6 lg:space-y-8 mt-6 lg:mt-8">
            
            {/* Top 3 Mecânicos - Responsivo */}
            {sortedMechanics.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {sortedMechanics.slice(0, 3).map((mechanic: any, index: number) => (
                  <Card key={mechanic.name} className={`${
                    index === 0 ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200' :
                    index === 1 ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200' :
                    'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                  } shadow-md`}>
                    <CardContent className="p-4 text-center">
                      <div className="flex justify-center mb-3">
                        {index === 0 && <AlertOctagon className="h-6 w-6 text-red-500" />}
                        {index === 1 && <XCircle className="h-6 w-6 text-orange-500" />}
                        {index === 2 && <AlertTriangle className="h-6 w-6 text-yellow-500" />}
                      </div>
                      
                      <Avatar className="h-12 w-12 mx-auto mb-3">
                        <AvatarFallback className="text-sm font-semibold bg-white">
                          {getInitials(mechanic.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <h3 className="font-bold text-base text-gray-900 mb-2 truncate" title={mechanic.name}>
                        {mechanic.name}
                      </h3>
                     
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Garantias:</span>
                          <span className="font-semibold text-red-600">{mechanic.totalWarranties}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Custo:</span>
                          <span className="font-semibold text-red-600">{formatCurrency(mechanic.totalCost)}</span>
                        </div>
                      </div>
                     
                      <Badge className="mt-2 text-red-600 bg-red-50 border-red-200 text-xs">
                        {mechanic.defectTypes.length} tipo{mechanic.defectTypes.length !== 1 ? 's' : ''}
                      </Badge>
                   </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Tabela Completa - Responsiva */}
            <Card className="bg-white border-2 border-black shadow-md">
              <CardHeader className="border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      Ranking Completo de Garantias
                    </CardTitle>
                    <CardDescription className="text-gray-500">
                      {sortedMechanics.length} mecânicos encontrados
                    </CardDescription>
                  </div>
                  
                  {/* Seletor de Ordenação na Tabela */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Ordenar por:</label>
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warranties">Maior Número de Garantias</SelectItem>
                        <SelectItem value="totalCost">Maior Custo Total</SelectItem>
                        <SelectItem value="avgCost">Maior Custo Médio</SelectItem>
                        <SelectItem value="defects">Maior Número de Defeitos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                        <TableHead className="font-semibold text-gray-700 min-w-[60px]">Pos.</TableHead>
                        <TableHead className="font-semibold text-gray-700 min-w-[200px]">Mecânico</TableHead>
                        <TableHead className="font-semibold text-gray-700 min-w-[100px]">Garantias</TableHead>
                        <TableHead className="font-semibold text-gray-700 min-w-[120px]">Custo Total</TableHead>
                        <TableHead className="font-semibold text-gray-700 min-w-[120px] hidden sm:table-cell">Custo Médio</TableHead>
                        <TableHead className="font-semibold text-gray-700 min-w-[100px] hidden lg:table-cell">Defeitos</TableHead>
                        <TableHead className="font-semibold text-gray-700 min-w-[150px] hidden xl:table-cell">Modelos de Motor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedMechanics.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                            Nenhum mecânico encontrado com os filtros aplicados
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedMechanics.map((mechanic: any, index: number) => (
                          <TableRow 
                            key={mechanic.name} 
                            className="hover:bg-gray-50/30 cursor-pointer"
                            onClick={() => setShowMechanicDetails(mechanic.name)}
                          >
                            <TableCell className="font-bold text-gray-900">
                              #{index + 1}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                  <AvatarFallback className="text-xs bg-gray-100">
                                    {getInitials(mechanic.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-gray-900 truncate" title={mechanic.name}>
                                  {mechanic.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-red-600 font-semibold">
                              {mechanic.totalWarranties}
                            </TableCell>
                            <TableCell className="text-red-600 font-semibold">
                              <span className="hidden sm:inline">{formatCurrency(mechanic.totalCost)}</span>
                              <span className="sm:hidden">
                                {formatCurrency(mechanic.totalCost / 1000)}k
                              </span>
                            </TableCell>
                            <TableCell className="text-gray-700 hidden sm:table-cell">
                              {formatCurrency(mechanic.avgCostPerWarranty)}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <Badge 
                                variant="outline" 
                                className="bg-red-50 text-red-700 border-red-200 text-xs hover:bg-red-100 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDefectsModal({ mechanic: mechanic.name, defects: mechanic.defectTypes });
                                }}
                              >
                                {mechanic.defectTypes.length} tipo{mechanic.defectTypes.length !== 1 ? 's' : ''}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell">
                              <div className="flex flex-wrap gap-1">
                                {mechanic.models.slice(0, 2).map((model: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    {model}
                                  </Badge>
                                ))}
                                {mechanic.models.length > 2 && (
                                  <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                                    +{mechanic.models.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Análise Individual */}
          <TabsContent value="analytics" className="space-y-6 lg:space-y-8 mt-6 lg:mt-8">
            
            {/* Seletor de Mecânico */}
            <Card className="bg-white border-2 border-black shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Análise Individual por Mecânico
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Selecione um mecânico para visualizar informações detalhadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Selecionar Mecânico</label>
                    <Select value={searchTerm} onValueChange={setSearchTerm}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Escolha um mecânico..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredMechanics.map((mechanic: any) => (
                          <SelectItem key={mechanic.name} value={mechanic.name}>
                            {mechanic.name} ({mechanic.totalWarranties} garantias)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={() => setSearchTerm('')} 
                      variant="outline" 
                      className="w-full"
                      disabled={!searchTerm}
                    >
                      <FilterX className="h-4 w-4 mr-2" />
                      Limpar Seleção
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detalhes do Mecânico Selecionado */}
            {renderSelectedMechanicDetails()}
          </TabsContent>

          {/* Comparativo */}
          <TabsContent value="comparison" className="space-y-6 lg:space-y-8 mt-6 lg:mt-8">
            
            {/* Gráficos Comparativos Responsivos */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* Comparativo de Custo */}
              <ChartCard
                title="Comparativo de Custo por Mecânico"
                description={`Top ${Math.min(10, chartData.length)} mecânicos`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(value), 'Custo Total']}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="totalCost" 
                      fill="#EF4444" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Comparativo de Quantidade */}
              <ChartCard
                title="Comparativo de Garantias por Mecânico"
                description={`Top ${Math.min(10, chartData.length)} mecânicos`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip 
                      formatter={(value: any) => [value, 'Garantias']}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="totalWarranties" 
                      fill="#F97316" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

              {/* Timeline dos Mecânicos por Ano */}
              <ChartCard
                title="Timeline dos Mecânicos por Ano"
                description={`Evolução anual dos mecânicos mais ativos ${
                  dateRange.start && dateRange.end 
                    ? `- Período: ${new Date(dateRange.start).getFullYear()} a ${new Date(dateRange.end).getFullYear()}` 
                    : '- Todos os anos disponíveis'
                }`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={(() => {
                    // Gerar dados anuais dos mecânicos com foco no período selecionado
                    const generateYearlyData = () => {
                      const data = [];
                      let startYear = 2019;
                      let endYear = new Date().getFullYear();
                      
                      // 🔍 ADAPTAR PERÍODO BASEADO NO FILTRO SELECIONADO
                      if (dateRange.start && dateRange.end) {
                        const filterStartYear = new Date(dateRange.start).getFullYear();
                        const filterEndYear = new Date(dateRange.end).getFullYear();
                        
                        // Expandir ligeiramente o range para contexto (1 ano antes e depois se possível)
                        startYear = Math.max(2019, filterStartYear - 1);
                        endYear = Math.min(new Date().getFullYear(), filterEndYear + 1);
                        
                        // Se o período filtrado é muito específico (1-2 anos), manter exato
                        if (filterEndYear - filterStartYear <= 1) {
                          startYear = filterStartYear;
                          endYear = filterEndYear;
                        }
                      }
                      
                      
                      // Para cada ano no período adaptado
                      for (let year = startYear; year <= endYear; year++) {
                        const yearData: any = {
                          year: year.toString(),
                          total: 0
                        };
                        
                        // Para os top 5 mecânicos mais ativos
                        filteredMechanics.slice(0, 5).forEach((mechanic: any) => {
                          let yearlyWarranties = 0;
                          
                          // Contar garantias do mecânico neste ano
                          if (mechanic.orders) {
                            yearlyWarranties = mechanic.orders.filter((order: any) => {
                              if (!order.order_date) return false;
                              const orderYear = new Date(order.order_date).getFullYear();
                              return orderYear === year;
                            }).length;
                          }
                          
                          yearData[mechanic.name] = yearlyWarranties;
                          yearData.total += yearlyWarranties;
                        });
                        
                        data.push(yearData);
                      }
                      
                      return data;
                    };
                    
                    return generateYearlyData();
                  })()} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                      label={{ value: 'Garantias', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        `${value} garantias`,
                        name === 'total' ? 'Total Geral' : name
                      ]}
                      labelFormatter={(label) => `Ano: ${label}`}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    
                    {/* Linha para cada mecânico (Top 5) */}
                    {filteredMechanics.slice(0, 5).map((mechanic: any, index: number) => {
                      const colors = [
                        '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6'
                      ];
                      
                      return (
                        <Line
                          key={mechanic.name}
                          type="monotone"
                          dataKey={mechanic.name}
                          stroke={colors[index]}
                          strokeWidth={3}
                          dot={{ fill: colors[index], strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, stroke: colors[index], strokeWidth: 2 }}
                          name={mechanic.name}
                        />
                      );
                    })}
                    
                    {/* Linha total em cinza tracejado */}
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#6B7280"
                      strokeWidth={2}
                      strokeDasharray="8 8"
                      dot={{ fill: '#6B7280', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#6B7280', strokeWidth: 2 }}
                      name="Total Geral"
                    />
                  </LineChart>
                </ResponsiveContainer>
                
                {/* Informações do Período com Zoom Aplicado */}
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900 mb-1 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Visualização Adaptada
                      </h4>
                      <p className="text-sm text-blue-700">
                        {(() => {
                          if (!dateRange.start || !dateRange.end) {
                            return "Exibindo todos os anos disponíveis (2019-2025)";
                          }
                          
                          const filterStartYear = new Date(dateRange.start).getFullYear();
                          const filterEndYear = new Date(dateRange.end).getFullYear();
                          const yearSpan = filterEndYear - filterStartYear + 1;
                          
                          if (yearSpan === 1) {
                            return `🔍 Zoom aplicado: Focando apenas no ano ${filterStartYear}`;
                          } else if (yearSpan <= 2) {
                            return `🔍 Zoom aplicado: Focando no período ${filterStartYear}-${filterEndYear}`;
                          } else {
                            return `📊 Período ampliado: ${filterStartYear}-${filterEndYear} com contexto adicional`;
                          }
                        })()}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <div className="text-sm font-medium text-blue-900">
                        Mecânicos Ativos:
                      </div>
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <span className="font-semibold">{filteredMechanics.slice(0, 5).length}</span>
                        <span>de</span>
                        <span>{filteredMechanics.length} total</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Dica Visual */}
                  {dateRange.start && dateRange.end && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs text-blue-600 flex items-center gap-1">
                        💡 Dica: O gráfico se adapta automaticamente ao período selecionado nos filtros para melhor visualização
                      </p>
                    </div>
                  )}
                </div>
              </ChartCard>
          </TabsContent>
        </Tabs>
      
      {/* Modal de Detalhes do Mecânico */}
      {renderMechanicDetailsModal()}
      
      {/* Modal de Lista de Defeitos */}
      {showDefectsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Defeitos Classificados por IA - {showDefectsModal.mechanic}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDefectsModal(null)}
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-3">
                {showDefectsModal.defects.map((defect: string, index: number) => (
                  <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{defect}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                          IA
                        </Badge>
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-center text-sm text-gray-500">
                Total: {showDefectsModal.defects.length} tipos de defeitos classificados por IA
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mechanics;