import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FileBarChart, 
  Download,
  Filter,
  Settings,
  Search,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Printer,
  X,
  Plus,
  Calendar,
  Users,
  Wrench,
  Building,
  Cog,
  Eye,
  BarChart3,
  PieChart,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Info
} from "lucide-react";
import { useDashboardStats } from "@/hooks/useGlobalData";
import { exportToProfessionalExcel } from '@/utils/exportExcelPro';
import { exportToPDF } from '@/utils/exportPDFSimple';
import { useAI } from '@/hooks/useAI';

// Tipos para filtros
interface FilterState {
  dateRange: {
    startDate: string;
    endDate: string;
    preset: 'custom' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'thisYear' | 'lastYear' | 'all';
  };
  status: string[];
  manufacturers: string[];
  mechanics: string[];
  models: string[];
  types: string[];
  osRange: {
    from: string;
    to: string;
  };
  defectKeywords: string[];
  valueRange: {
    min: number;
    max: number;
  };
}

const ReportsConfig = () => {
  // Estados principais
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      startDate: '',
      endDate: '',
      preset: 'thisMonth'
    },
    status: [],
    manufacturers: [],
    mechanics: [],
    models: [],
    types: [],
    osRange: { from: '', to: '' },
    defectKeywords: [],
    valueRange: { min: 0, max: 0 }
  });

  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'analytical'>('summary');
  const [reportOptions, setReportOptions] = useState({
    includeFinancials: true,
    includeDefects: true,
    includeMechanics: true,
    includeAnalytics: true,
    includeCharts: false,
    customTitle: '',
    customDescription: ''
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Dados do backend
  const { data: stats, isLoading } = useDashboardStats();
  const { classifications } = useAI();
  
  // Cálculo de dados filtrados
  const filteredData = useMemo(() => {
    if (!stats?.orders) return null;
    
    let filtered = [...stats.orders];
    
    // Aplicar filtros de data
    if (filters.dateRange.startDate && filters.dateRange.endDate) {
      const startDate = new Date(filters.dateRange.startDate);
      const endDate = new Date(filters.dateRange.endDate);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.order_date);
        return orderDate >= startDate && orderDate <= endDate;
      });
    } else if (filters.dateRange.preset !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.dateRange.preset) {
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'lastMonth':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.order_date);
            return orderDate >= startDate && orderDate <= endDate;
          });
          break;
        case 'thisQuarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'thisYear':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'lastYear':
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.order_date);
            return orderDate >= startDate && orderDate <= lastYearEnd;
          });
          break;
      }
      
      if (filters.dateRange.preset !== 'lastMonth' && filters.dateRange.preset !== 'lastYear') {
        filtered = filtered.filter(order => new Date(order.order_date) >= startDate);
      }
    }
    
    // Outros filtros
    if (filters.status.length > 0) {
      filtered = filtered.filter(order => filters.status.includes(order.order_status));
    }
    
    if (filters.manufacturers.length > 0) {
      filtered = filtered.filter(order => filters.manufacturers.includes(order.engine_manufacturer));
    }
    
    if (filters.mechanics.length > 0) {
      filtered = filtered.filter(order => filters.mechanics.includes(order.responsible_mechanic));
    }
    
    if (filters.models.length > 0) {
      filtered = filtered.filter(order => 
        filters.models.some(model => 
          (order.engine_model && order.engine_model.includes(model)) ||
          (order.vehicle_model && order.vehicle_model.includes(model))
        )
      );
    }
    
    if (filters.types.length > 0) {
      filtered = filtered.filter(order => filters.types.includes(order.engine_type));
    }
    
    if (filters.osRange.from || filters.osRange.to) {
      filtered = filtered.filter(order => {
        const osNum = parseInt(order.order_number);
        const from = filters.osRange.from ? parseInt(filters.osRange.from) : 0;
        const to = filters.osRange.to ? parseInt(filters.osRange.to) : Infinity;
        return osNum >= from && osNum <= to;
      });
    }
    
    if (filters.defectKeywords.length > 0) {
      filtered = filtered.filter(order => {
        const defect = order.raw_defect_description || '';
        return filters.defectKeywords.some(keyword => 
          defect.toLowerCase().includes(keyword.toLowerCase())
        );
      });
    }
    
    // Calcular métricas
    const totalValue = filtered.reduce((sum, order) => sum + (parseFloat(order.grand_total) || 0), 0);
    const avgValue = filtered.length > 0 ? totalValue / filtered.length : 0;
    
    const statusDistribution = filtered.reduce((acc, order) => {
      acc[order.order_status] = (acc[order.order_status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const manufacturerDistribution = filtered.reduce((acc, order) => {
      const mfg = order.engine_manufacturer || 'N/A';
      acc[mfg] = (acc[mfg] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      orders: filtered,
      totalOrders: filtered.length,
      totalValue,
      avgValue,
      statusDistribution,
      manufacturerDistribution
    };
  }, [stats, filters]);
  
  // Opções para filtros
  const filterOptions = useMemo(() => {
    if (!stats?.orders) return { manufacturers: [], mechanics: [], models: [], types: [] };
    
    const manufacturers = [...new Set(stats.orders.map(o => o.engine_manufacturer).filter(Boolean))];
    const mechanics = [...new Set(stats.orders.map(o => o.responsible_mechanic).filter(Boolean))];
    const models = [...new Set(stats.orders.map(o => o.engine_model || o.vehicle_model).filter(Boolean))];
    const types = [...new Set(stats.orders.map(o => o.engine_type).filter(Boolean))];
    
    return { manufacturers, mechanics, models, types };
  }, [stats]);
  
  // Handlers
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const addToArrayFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: [...(prev[key] as string[]), value]
    }));
  };
  
  const removeFromArrayFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: (prev[key] as string[]).filter(v => v !== value)
    }));
  };
  
  const clearAllFilters = () => {
    setFilters({
      dateRange: { startDate: '', endDate: '', preset: 'all' },
      status: [],
      manufacturers: [],
      mechanics: [],
      models: [],
      types: [],
      osRange: { from: '', to: '' },
      defectKeywords: [],
      valueRange: { min: 0, max: 0 }
    });
  };
  
  const handleExportExcel = async () => {
    if (!filteredData?.orders) return;
    
    setIsGenerating(true);
    try {
      await exportToProfessionalExcel(filteredData, filters, {
        includeCharts: reportOptions.includeCharts,
        includeAnalytics: reportOptions.includeAnalytics,
        includeSummary: true
      });
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleExportPDF = async () => {
    if (!filteredData?.orders) return;
    
    setIsGenerating(true);
    try {
      await exportToPDF(filteredData, filters, reportType);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-4 md:p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Análises e Relatórios
              </h1>
              <p className="text-gray-600">
                Dashboards, análises e relatórios personalizados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Abas principais */}
      <Tabs defaultValue="analises" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="analises">Análises</TabsTrigger>
          <TabsTrigger value="defeito-modelos">Defeito x Modelos</TabsTrigger>
        </TabsList>

        {/* Aba Análises */}
        <TabsContent value="analises" className="space-y-6">
          {/* Seção Informações - Cards de Estatística */}
          {filteredData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  Informações Gerais
                </CardTitle>
                <CardDescription>
                  Métricas principais do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Total de OS</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {filteredData.totalOrders?.toLocaleString('pt-BR') || 0}
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Valor Total</span>
                    </div>
                    <div className="text-xl font-bold text-green-900">
                      R$ {(filteredData.totalValue || 0).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Valor Médio</span>
                    </div>
                    <div className="text-xl font-bold text-purple-900">
                      R$ {(filteredData.avgValue || 0).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-900">Garantias</span>
                    </div>
                    <div className="text-xl font-bold text-orange-900">
                      {Object.values(filteredData.statusDistribution || {}).reduce((a, b) => a + b, 0)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filtros de Análise - Responsivo e Funcional */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-600" />
                Filtros de Análise
              </CardTitle>
              <CardDescription>
                Configure os filtros para personalizar as análises
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Período */}
                <div>
                  <Label className="text-sm font-medium mb-2 block flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Período
                  </Label>
                  <Select 
                    value={filters.dateRange.preset} 
                    onValueChange={(value) => handleFilterChange('dateRange', { ...filters.dateRange, preset: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thisMonth">Este Mês</SelectItem>
                      <SelectItem value="lastMonth">Mês Anterior</SelectItem>
                      <SelectItem value="thisQuarter">Este Trimestre</SelectItem>
                      <SelectItem value="thisYear">Este Ano</SelectItem>
                      <SelectItem value="lastYear">Ano Anterior</SelectItem>
                      <SelectItem value="all">Todos os Períodos</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Status</Label>
                  <Select onValueChange={(value) => {
                    if (value === 'all') {
                      setFilters(prev => ({ ...prev, status: [] }));
                    } else {
                      addToArrayFilter('status', value);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">✓ Todos os Status</SelectItem>
                      <SelectItem value="G">G - Garantia</SelectItem>
                      <SelectItem value="GO">GO - Garantia c/ Obs.</SelectItem>
                      <SelectItem value="GU">GU - Garantia Usuário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Fabricante */}
                <div>
                  <Label className="text-sm font-medium mb-2 block flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    Fabricante
                  </Label>
                  <Select onValueChange={(value) => {
                    if (value === 'all') {
                      setFilters(prev => ({ ...prev, manufacturers: [] }));
                    } else {
                      addToArrayFilter('manufacturers', value);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar fabricante" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">✓ Todos os Fabricantes</SelectItem>
                      {filterOptions.manufacturers.map(mfg => (
                        <SelectItem key={mfg} value={mfg}>{mfg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mecânico */}
                <div>
                  <Label className="text-sm font-medium mb-2 block flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Mecânico
                  </Label>
                  <Select onValueChange={(value) => {
                    if (value === 'all') {
                      setFilters(prev => ({ ...prev, mechanics: [] }));
                    } else {
                      addToArrayFilter('mechanics', value);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar mecânico" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">✓ Todos os Mecânicos</SelectItem>
                      {filterOptions.mechanics.map(mech => (
                        <SelectItem key={mech} value={mech}>{mech}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filtros Ativos */}
              {(filters.status.length > 0 || filters.manufacturers.length > 0 || filters.mechanics.length > 0) && (
                <div className="mt-4 pt-4 border-t">
                  <Label className="text-sm font-medium mb-2 block">Filtros Ativos</Label>
                  <div className="flex flex-wrap gap-2">
                    {filters.status.map(status => (
                      <Badge key={status} variant="secondary" className="flex items-center gap-1">
                        Status: {status}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArrayFilter('status', status)} />
                      </Badge>
                    ))}
                    {filters.manufacturers.map(mfg => (
                      <Badge key={mfg} variant="secondary" className="flex items-center gap-1">
                        {mfg}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArrayFilter('manufacturers', mfg)} />
                      </Badge>
                    ))}
                    {filters.mechanics.map(mech => (
                      <Badge key={mech} variant="secondary" className="flex items-center gap-1">
                        {mech}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArrayFilter('mechanics', mech)} />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Range Personalizado */}
              {filters.dateRange.preset === 'custom' && (
                <div className="mt-4 pt-4 border-t">
                  <Label className="text-sm font-medium mb-3 block">Período Personalizado</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs mb-2 block">Data Inicial</Label>
                      <Input 
                        type="date" 
                        value={filters.dateRange.startDate}
                        onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-2 block">Data Final</Label>
                      <Input 
                        type="date" 
                        value={filters.dateRange.endDate}
                        onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t flex justify-end">
                <Button onClick={clearAllFilters} variant="outline" size="sm">
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Três Gráficos Responsivos */}
          {filteredData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gráfico 1: Distribuição por Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PieChart className="h-5 w-5" />
                    Distribuição por Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(filteredData.statusDistribution || {}).map(([status, count]) => {
                      const percentage = filteredData.totalOrders > 0 ? (count / filteredData.totalOrders * 100) : 0;
                      return (
                        <div key={status} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={status === 'G' ? 'default' : status === 'GO' ? 'secondary' : 'destructive'}
                              className={
                                status === 'G' ? 'bg-blue-100 text-blue-800' :
                                status === 'GO' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {status}
                            </Badge>
                            <span className="text-sm font-medium">
                              {status === 'G' ? 'Garantia' : status === 'GO' ? 'Garantia c/ Obs.' : 'Garantia Usuário'}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{count}</div>
                            <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico 2: Top Fabricantes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-5 w-5" />
                    Top Fabricantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(filteredData.manufacturerDistribution || {})
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([manufacturer, count]) => {
                        const percentage = filteredData.totalOrders > 0 ? (count / filteredData.totalOrders * 100) : 0;
                        return (
                          <div key={manufacturer} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium truncate">{manufacturer}</span>
                            <div className="text-right">
                              <div className="font-bold">{count}</div>
                              <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico 3: Análise Financeira */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <DollarSign className="h-5 w-5" />
                    Análise Financeira
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-2 bg-green-50 rounded border border-green-200">
                      <div className="text-xs text-green-700 mb-1">Valor Total</div>
                      <div className="text-lg font-bold text-green-800">
                        R$ {(filteredData.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="text-xs text-blue-700 mb-1">Valor Médio</div>
                      <div className="text-lg font-bold text-blue-800">
                        R$ {(filteredData.avgValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="p-2 bg-purple-50 rounded border border-purple-200">
                      <div className="text-xs text-purple-700 mb-1">Ticket Médio/Mês</div>
                      <div className="text-lg font-bold text-purple-800">
                        R$ {((filteredData.totalValue || 0) / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Aba Defeito x Modelos */}
        <TabsContent value="defeito-modelos" className="space-y-6">
          {/* Conteúdo da aba Defeito x Modelos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Análise de Defeitos por Modelos
              </CardTitle>
              <CardDescription>
                Visualize a correlação entre defeitos e modelos de motores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredData && filteredData.orders ? (
                <div className="space-y-6">
                  {/* Tabela de Defeitos por Modelo */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Defeitos por Modelo de Motor</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="max-h-96 overflow-y-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="p-3 text-left font-semibold">Modelo do Motor</th>
                              <th className="p-3 text-left font-semibold">Total de Defeitos</th>
                              <th className="p-3 text-left font-semibold">Principais Defeitos</th>
                              <th className="p-3 text-right font-semibold">% do Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const defectsByModel = filteredData.orders.reduce((acc, order) => {
                                const model = order.engine_model || order.vehicle_model || 'N/A';
                                if (!acc[model]) {
                                  acc[model] = {
                                    count: 0,
                                    defects: [],
                                    orders: []
                                  };
                                }
                                acc[model].count++;
                                acc[model].orders.push(order);
                                if (order.raw_defect_description) {
                                  acc[model].defects.push(order.raw_defect_description);
                                }
                                return acc;
                              }, {} as Record<string, any>);

                              return Object.entries(defectsByModel)
                                .sort(([,a], [,b]) => b.count - a.count)
                                .slice(0, 10)
                                .map(([model, data]) => {
                                  const percentage = (data.count / filteredData.totalOrders * 100);
                                  const topDefects = data.defects
                                    .reduce((acc: any, defect: string) => {
                                      const key = defect.toLowerCase().trim();
                                      acc[key] = (acc[key] || 0) + 1;
                                      return acc;
                                    }, {})
                                  const sortedDefects = Object.entries(topDefects)
                                    .sort(([,a], [,b]) => (b as number) - (a as number))
                                    .slice(0, 3)
                                    .map(([defect]) => defect);
                                  
                                  return (
                                    <tr key={model} className="border-b hover:bg-gray-50">
                                      <td className="p-3 font-medium">{model}</td>
                                      <td className="p-3">{data.count}</td>
                                      <td className="p-3">
                                        <div className="space-y-1">
                                          {sortedDefects.slice(0, 2).map((defect, idx) => (
                                            <div key={idx} className="text-sm text-gray-600 truncate max-w-xs">
                                              • {defect.charAt(0).toUpperCase() + defect.slice(1)}
                                            </div>
                                          ))}
                                        </div>
                                      </td>
                                      <td className="p-3 text-right font-semibold">
                                        {percentage.toFixed(1)}%
                                      </td>
                                    </tr>
                                  );
                                });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Estatísticas Rápidas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-blue-600">
                          {[...new Set(filteredData.orders.map(o => o.engine_model || o.vehicle_model).filter(Boolean))].length}
                        </div>
                        <div className="text-sm text-gray-600">Modelos Únicos</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">
                          {(() => {
                            const avgDefectsPerModel = filteredData.totalOrders / 
                              [...new Set(filteredData.orders.map(o => o.engine_model || o.vehicle_model).filter(Boolean))].length;
                            return Math.round(avgDefectsPerModel);
                          })()}
                        </div>
                        <div className="text-sm text-gray-600">Média por Modelo</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-orange-600">
                          {(() => {
                            const modelCounts = filteredData.orders.reduce((acc, order) => {
                              const model = order.engine_model || order.vehicle_model || 'N/A';
                              acc[model] = (acc[model] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);
                            const maxCount = Math.max(...Object.values(modelCounts));
                            return maxCount;
                          })()}
                        </div>
                        <div className="text-sm text-gray-600">Modelo com Mais Defeitos</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gráfico de Barras dos Top 5 Modelos */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Top 5 Modelos com Mais Defeitos</h3>
                    <div className="space-y-3">
                      {(() => {
                        const modelCounts = filteredData.orders.reduce((acc, order) => {
                          const model = order.engine_model || order.vehicle_model || 'N/A';
                          acc[model] = (acc[model] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>);
                        
                        return Object.entries(modelCounts)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 5)
                          .map(([model, count]) => {
                            const percentage = (count / filteredData.totalOrders * 100);
                            return (
                              <div key={model} className="flex items-center gap-4">
                                <div className="w-32 text-sm font-medium truncate">{model}</div>
                                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                  <div 
                                    className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                                    style={{ width: `${Math.max(percentage, 5)}%` }}
                                  >
                                    <span className="text-white text-xs font-semibold">
                                      {count}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-600 w-12 text-right">
                                  {percentage.toFixed(1)}%
                                </div>
                              </div>
                            );
                          });
                      })()}
                    </div>
                  </div>

                  {/* Botões de Export */}
                  <div className="border-t pt-4 flex justify-end gap-3">
                    <Button 
                      onClick={handleExportExcel}
                      disabled={isGenerating}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Exportar Excel
                    </Button>
                    <Button 
                      onClick={handleExportPDF}
                      disabled={isGenerating}
                      variant="outline"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Exportar PDF
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum dado disponível para análise</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsConfig;