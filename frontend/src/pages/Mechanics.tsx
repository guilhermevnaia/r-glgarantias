import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ClassifiedDefect } from '@/components/ClassifiedDefect';
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
  const { classifications } = useAI();
  // Estados para filtros com período padrão (desde 2019 até data atual)
  const [dateRange, setDateRange] = useState<{start: string, end: string}>(() => {
    const now = new Date();
    return {
      start: '2019-01-01',
      end: now.toISOString().split('T')[0]
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
      console.log('🔍 Sem range definido, usando dados completos');
      return { month: undefined, year: undefined };
    }
    
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    console.log('📅 Range selecionado:', {
      start: dateRange.start,
      end: dateRange.end,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    // Para aba Mecânicos, sempre buscar dados completos para depois filtrar no frontend
    // Isso garante que tenhamos todos os dados históricos dos mecânicos
    console.log('📅 Usando dados completos para análise de mecânicos');
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
      return sum + parseFloat(order.parts_total || 0) + parseFloat(order.labor_total || 0);
    }, 0);
    const avgCostPerWarranty = totalWarranties > 0 ? totalCost / totalWarranties : 0;
    
    // 🤖 Recalcular tipos de defeitos usando classificações da IA
    const defectTypes = [...new Set(filteredOrders.map((order: any) => {
      const classification = classifications.find(c => c.service_order_id === order.id);
      if (classification && classification.defect_categories) {
        return classification.defect_categories.category_name;
      }
      return order.raw_defect_description || 'Não Classificado';
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

  // Debug logs para verificar dados
  console.log('🔍 Dados filtrados:', {
    totalMechanics: (mechanicsData as any)?.mechanicsStats?.length || 0,
    filteredCount: filteredMechanics.length,
    sortedCount: sortedMechanics.length,
    dateRange,
    searchTerm,
    selectedDefectType,
    selectedMotor
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
                <h3 className="text-lg font-semibold mb-3">Tipos de Defeitos</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {mechanic.defectTypes.map((defect: string, index: number) => (
                    <div key={index} className="p-2 bg-red-50 rounded text-sm">
                      {defect}
                    </div>
                  ))}
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
                            <ClassifiedDefect 
                              order={order}
                              classification={classifications.find(c => c.service_order_id === order.id)}
                              showIcon={false}
                              className="text-xs"
                            />
                          </TableCell>
                          <TableCell className="text-red-600 font-semibold">
                            {formatCurrency(parseFloat(order.parts_total || 0) + parseFloat(order.labor_total || 0))}
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
          
          {/* Tipos de Defeitos */}
          <Card className="bg-white border-2 border-black shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-red-600" />
                Tipos de Defeitos Causados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedMechanic.defectTypes.slice(0, 5).map((defect: string, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="font-medium text-gray-900 text-sm truncate flex-1 mr-2" title={defect}>
                      {defect}
                    </span>
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs flex-shrink-0">
                      #{index + 1}
                    </Badge>
                  </div>
                ))}
                {selectedMechanic.defectTypes.length > 5 && (
                  <div className="text-center text-sm text-gray-500 pt-2">
                    +{selectedMechanic.defectTypes.length - 5} outros tipos
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Modelos e Fabricantes */}
          <Card className="bg-white border-2 border-black shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Modelos e Fabricantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Modelos Trabalhados:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMechanic.models.slice(0, 3).map((model: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                        {model}
                      </Badge>
                    ))}
                    {selectedMechanic.models.length > 3 && (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
                        +{selectedMechanic.models.length - 3} outros
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Fabricantes:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMechanic.manufacturers.map((mfg: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                        {mfg}
                      </Badge>
                    ))}
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
                           <ClassifiedDefect 
                             order={order}
                             classification={classifications.find(c => c.service_order_id === order.id)}
                             className="text-xs"
                           />
                         </TableCell>
                         <TableCell className="hidden md:table-cell">
                           <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                             {order.engine_description || 'Não informado'}
                           </Badge>
                         </TableCell>
                         <TableCell className="text-red-600 font-semibold text-sm">
                           {formatCurrency(parseFloat(order.parts_total || 0) + parseFloat(order.labor_total || 0))}
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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-4 sm:p-6 lg:p-8 bg-apple-gray-50 min-h-screen">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600" />
          <span className="hidden sm:inline">Análise de Mecânicos</span>
          <span className="sm:hidden">Mecânicos</span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Análise detalhada do desempenho e atividades dos mecânicos
        </p>
      </div>
      
      {/* Tabs de Análise */}
      <Tabs defaultValue="ranking" className="w-full">
        <div className="flex justify-center">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
            <TabsTrigger value="analytics">Análises</TabsTrigger>
            <TabsTrigger value="comparison">Comparativo</TabsTrigger>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Filtro de Data Início */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Data Início</label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full"
                  />
                </div>

                {/* Filtro de Data Fim */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Data Fim</label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full"
                  />
                </div>

                {/* Filtro de Motor */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Motor</label>
                  <Select value={selectedMotor} onValueChange={setSelectedMotor}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos os motores" />
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
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    <span className="hidden sm:inline">Buscar Mecânico</span>
                    <span className="sm:hidden">Buscar</span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Nome do mecânico..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                </div>
              </div>
              
              {/* Segunda linha de filtros */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {/* Filtro de Tipo de Defeito */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    <span className="hidden lg:inline">Tipo de Defeito</span>
                    <span className="lg:hidden">Defeito</span>
                  </label>
                  <Select value={selectedDefectType} onValueChange={setSelectedDefectType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos os defeitos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {[...new Set(filteredMechanics.flatMap(m => m.defectTypes))].slice(0, 10).map((defect: string) => (
                        <SelectItem key={defect} value={defect}>
                          {defect}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Botão Reset Período */}
                <div className="flex items-end">
                  <Button 
                    onClick={() => {
                      const now = new Date();
                      setDateRange({
                        start: '2019-01-01',
                        end: now.toISOString().split('T')[0]
                      });
                    }}
                    variant="outline" 
                    className="w-full"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Todos os Dados
                  </Button>
                </div>
              </div>

              {/* Botão para limpar filtros em dispositivos móveis */}
              <div className="mt-4 sm:hidden">
                <Button 
                  onClick={() => {
                    const now = new Date();
                    setDateRange({
                      start: '2019-01-01',
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

                                                   {/* Gráfico de Barras Temporal de Garantias por Mecânico */}
              <Card className="bg-white border-2 border-black shadow-md">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Garantias por Período - Mecânicos Ativos
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    Apenas mecânicos com OS no período - Linha tracejada representa a média
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={(() => {
                      // Gerar dados temporais baseados nos filtros selecionados
                      const generateTimeData = () => {
                        const data = [];
                        const now = new Date();
                        let startDate, endDate, interval;
                        
                        // Determinar período baseado no dateRange
                        if (dateRange.start && dateRange.end) {
                          startDate = new Date(dateRange.start);
                          endDate = new Date(dateRange.end);
                          
                          // Calcular diferença em dias para determinar o intervalo
                          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          
                          if (diffDays <= 31) {
                            // Mês ou menos - mostrar por semana
                            interval = 'week';
                          } else if (diffDays <= 365) {
                            // Até 1 ano - mostrar por mês
                            interval = 'month';
                          } else {
                            // Mais de 1 ano - mostrar por mês
                            interval = 'month';
                          }
                        } else {
                          // Últimos 12 meses (padrão)
                          startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
                          endDate = now;
                          interval = 'month';
                        }
                        
                        const current = new Date(startDate);
                        const activeMechanics: string[] = [];
                        
                        while (current <= endDate) {
                          const timePoint: any = {
                            date: interval === 'week' 
                              ? `Semana ${Math.ceil((current.getDate() + current.getDay()) / 7)}`
                              : current.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
                            fullDate: new Date(current),
                            total: 0
                          };
                          
                          // Adicionar dados reais baseados nas ordens de serviço
                          filteredMechanics.slice(0, 8).forEach((mechanic: any) => {
                            let warrantyCount = 0;
                            
                            // Contar ordens reais do mecânico no período atual
                            if (mechanic.orders) {
                              warrantyCount = mechanic.orders.filter((order: any) => {
                                if (!order.order_date) return false;
                                const orderDate = new Date(order.order_date);
                                
                                if (interval === 'week') {
                                  // Para semanas, calcular se a data está na semana atual
                                  const weekStart = new Date(current);
                                  const weekEnd = new Date(current);
                                  weekEnd.setDate(weekEnd.getDate() + 6);
                                  return orderDate >= weekStart && orderDate <= weekEnd;
                                } else {
                                  // Para meses, verificar se é o mesmo mês/ano
                                  return orderDate.getMonth() === current.getMonth() && 
                                         orderDate.getFullYear() === current.getFullYear();
                                }
                              }).length;
                            }
                            
                            // Só adicionar se teve garantias no período
                            if (warrantyCount > 0) {
                              timePoint[mechanic.name] = warrantyCount;
                              timePoint.total += warrantyCount;
                              if (!activeMechanics.includes(mechanic.name)) {
                                activeMechanics.push(mechanic.name);
                              }
                            }
                          });
                          
                          // Calcular média para o período
                          const activeCount = Object.keys(timePoint).filter(key => 
                            key !== 'date' && key !== 'fullDate' && key !== 'total'
                          ).length;
                          timePoint.average = activeCount > 0 ? Math.round(timePoint.total / activeCount) : 0;
                          
                          data.push(timePoint);
                          
                          if (interval === 'week') {
                            current.setDate(current.getDate() + 7);
                          } else {
                            current.setMonth(current.getMonth() + 1);
                          }
                        }
                        
                        return data;
                      };
                      
                      return generateTimeData();
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                        label={{ value: 'Quantidade de Garantias', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                      />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          name === 'average' ? `${value} (média)` : value, 
                          name === 'average' ? 'Média' : name
                        ]}
                        labelFormatter={(label) => `Período: ${label}`}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      
                      {/* Barras para cada mecânico ativo */}
                      {filteredMechanics.slice(0, 8).map((mechanic: any, index: number) => {
                        const colors = [
                          '#EF4444', '#F97316', '#EAB308', '#22C55E', 
                          '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4'
                        ];
                        
                        return (
                          <Bar
                            key={mechanic.name}
                            dataKey={mechanic.name}
                            fill={colors[index % colors.length]}
                            radius={[4, 4, 0, 0]}
                            stackId="a"
                          />
                        );
                      })}
                      
                      {/* Linha tracejada da média */}
                      <Line
                        type="monotone"
                        dataKey="average"
                        stroke="#374151"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: '#374151', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#374151', strokeWidth: 2 }}
                        name="Média"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  {/* Legenda dos Mecânicos Ativos */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Mecânicos com Atividade no Período:</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {filteredMechanics.slice(0, 8).map((mechanic: any, index: number) => {
                        const colors = [
                          '#EF4444', '#F97316', '#EAB308', '#22C55E', 
                          '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4'
                        ];
                        
                        return (
                          <div key={mechanic.name} className="flex items-center gap-2 text-sm">
                            <div 
                              className="w-3 h-3 rounded flex-shrink-0"
                              style={{ backgroundColor: colors[index % colors.length] }}
                            />
                            <span className="truncate" title={mechanic.name}>
                              {mechanic.name}
                            </span>
                            <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                              {mechanic.totalWarranties}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Informações do Período */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Período Analisado:
                        </p>
                        <p className="text-sm text-gray-600">
                          {dateRange.start && dateRange.end
                            ? `${dateRange.start.split('T')[0].split('-').reverse().join('/')} - ${dateRange.end.split('T')[0].split('-').reverse().join('/')}`
                            : 'Período atual'
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          Mecânicos Ativos:
                        </p>
                        <p className="text-sm text-blue-600 font-semibold">
                          {filteredMechanics.slice(0, 8).length} de {(mechanicsData?.mechanicsStats || []).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                  Defeitos - {showDefectsModal.mechanic}
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
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-center text-sm text-gray-500">
                Total: {showDefectsModal.defects.length} tipos de defeitos
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mechanics;