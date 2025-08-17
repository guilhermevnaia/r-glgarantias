import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  FileBarChart, 
  Download,
  Filter,
  Calendar,
  DollarSign,
  Users,
  Wrench,
  AlertTriangle,
  FileText,
  TrendingUp,
  PieChart,
  BarChart3,
  Settings,
  Search,
  ChevronDown,
  Printer,
  FileSpreadsheet,
  X,
  Plus
} from "lucide-react";
import { useDashboardStats } from "@/hooks/useGlobalData";
import { exportToProfessionalExcel } from '@/utils/exportExcelPro';
import { exportToPDF } from '@/utils/exportPDF';
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

const ReportsNew = () => {
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
      // Aplicar presets de data
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
        includeCharts: true,
        includeAnalytics: true,
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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white rounded-lg w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header Executivo */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <FileBarChart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Central de Relatórios
              </h1>
              <p className="text-gray-600">
                Análises avançadas e relatórios executivos de garantias
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros Avançados
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </Button>
            <Button onClick={clearAllFilters} variant="outline" size="sm">
              Limpar Filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros Principais */}
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Período */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Período</Label>
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
              <Select onValueChange={(value) => addToArrayFilter('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="G">G - Garantia</SelectItem>
                  <SelectItem value="GO">GO - Garantia c/ Obs.</SelectItem>
                  <SelectItem value="GU">GU - Garantia Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fabricante */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Fabricante</Label>
              <Select onValueChange={(value) => addToArrayFilter('manufacturers', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar fabricante" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.manufacturers.map(mfg => (
                    <SelectItem key={mfg} value={mfg}>{mfg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mecânico */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Mecânico</Label>
              <Select onValueChange={(value) => addToArrayFilter('mechanics', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar mecânico" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.mechanics.map(mech => (
                    <SelectItem key={mech} value={mech}>{mech}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtros Selecionados */}
          {(filters.status.length > 0 || filters.manufacturers.length > 0 || filters.mechanics.length > 0 || 
            filters.models.length > 0 || filters.types.length > 0 || filters.defectKeywords.length > 0) && (
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
                {filters.models.map(model => (
                  <Badge key={model} variant="secondary" className="flex items-center gap-1">
                    Modelo: {model}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArrayFilter('models', model)} />
                  </Badge>
                ))}
                {filters.types.map(type => (
                  <Badge key={type} variant="secondary" className="flex items-center gap-1">
                    Tipo: {type}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArrayFilter('types', type)} />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Filtros Avançados */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Modelos de Motor */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Modelo Motor</Label>
                  <Select onValueChange={(value) => addToArrayFilter('models', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions.models.map(model => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipos de Motor */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Tipo Motor</Label>
                  <Select onValueChange={(value) => addToArrayFilter('types', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions.types.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Busca por Defeitos */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Defeito (palavra-chave)</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Ex: bomba, motor, vazamento"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const value = (e.target as HTMLInputElement).value.trim();
                          if (value && !filters.defectKeywords.includes(value)) {
                            addToArrayFilter('defectKeywords', value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={(e) => {
                        const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                        const value = input.value.trim();
                        if (value && !filters.defectKeywords.includes(value)) {
                          addToArrayFilter('defectKeywords', value);
                          input.value = '';
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Range de OS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">OS - De</Label>
                  <Input 
                    type="number"
                    placeholder="Ex: 1000"
                    value={filters.osRange.from}
                    onChange={(e) => handleFilterChange('osRange', { ...filters.osRange, from: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">OS - Até</Label>
                  <Input 
                    type="number"
                    placeholder="Ex: 9999"
                    value={filters.osRange.to}
                    onChange={(e) => handleFilterChange('osRange', { ...filters.osRange, to: e.target.value })}
                  />
                </div>
              </div>

              {/* Palavras-chave de Defeitos Selecionadas */}
              {filters.defectKeywords.length > 0 && (
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Defeitos Pesquisados</Label>
                  <div className="flex flex-wrap gap-2">
                    {filters.defectKeywords.map(keyword => (
                      <Badge key={keyword} variant="outline" className="flex items-center gap-1">
                        🔍 {keyword}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArrayFilter('defectKeywords', keyword)} />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Data Range Personalizado */}
          {filters.dateRange.preset === 'custom' && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Data Inicial</Label>
                  <Input 
                    type="date" 
                    value={filters.dateRange.startDate}
                    onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Data Final</Label>
                  <Input 
                    type="date" 
                    value={filters.dateRange.endDate}
                    onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métricas Executivas */}
      {filteredData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-600 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de OS</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {filteredData.totalOrders.toLocaleString('pt-BR')}
                  </p>
                </div>
                <FileText className="h-12 w-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {filteredData.totalValue.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
                <DollarSign className="h-12 w-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Médio</p>
                  <p className="text-2xl font-bold text-purple-600">
                    R$ {filteredData.avgValue.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-600 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Garantias</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {Object.values(filteredData.statusDistribution).reduce((a, b) => a + b, 0)}
                  </p>
                </div>
                <AlertTriangle className="h-12 w-12 text-orange-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ações de Exportação */}
      <div className="flex items-center justify-between">
        <Tabs value={reportType} onValueChange={(value: any) => setReportType(value)}>
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="summary">Resumo</TabsTrigger>
            <TabsTrigger value="detailed">Detalhado</TabsTrigger>
            <TabsTrigger value="analytical">Analítico</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3">
          <Button 
            onClick={handleExportExcel}
            disabled={isGenerating || !filteredData?.orders.length}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            {isGenerating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            Exportar Excel
          </Button>
          
          <Button 
            onClick={handleExportPDF}
            disabled={isGenerating || !filteredData?.orders.length}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Gerar PDF
          </Button>
          
          <Button 
            onClick={() => window.print()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Conteúdo dos Relatórios */}
      {filteredData && (
        <Tabs value={reportType} className="space-y-6">
          {/* Resumo Executivo */}
          <TabsContent value="summary" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribuição por Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Distribuição por Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(filteredData.statusDistribution).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
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
                          <span className="font-medium">
                            {status === 'G' ? 'Garantia' : status === 'GO' ? 'Garantia c/ Obs.' : 'Garantia Usuário'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{count}</div>
                          <div className="text-sm text-gray-500">
                            {((count / filteredData.totalOrders) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Fabricantes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Top Fabricantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(filteredData.manufacturerDistribution)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([manufacturer, count]) => (
                        <div key={manufacturer} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{manufacturer}</span>
                          <div className="text-right">
                            <div className="font-bold text-lg">{count}</div>
                            <div className="text-sm text-gray-500">
                              {((count / filteredData.totalOrders) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Relatório Detalhado */}
          <TabsContent value="detailed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ordens de Serviço - Visualização Detalhada</CardTitle>
                <CardDescription>
                  {filteredData.totalOrders} ordens encontradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">OS</TableHead>
                        <TableHead className="font-semibold">Data</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Fabricante</TableHead>
                        <TableHead className="font-semibold">Mecânico</TableHead>
                        <TableHead className="font-semibold text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.orders.slice(0, 50).map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.order_number}</TableCell>
                          <TableCell>
                            {new Date(order.order_date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={order.order_status === 'G' ? 'default' : 
                                      order.order_status === 'GO' ? 'secondary' : 'destructive'}
                              className={
                                order.order_status === 'G' ? 'bg-blue-100 text-blue-800' :
                                order.order_status === 'GO' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {order.order_status}
                            </Badge>
                          </TableCell>
                          <TableCell>{order.engine_manufacturer || 'N/A'}</TableCell>
                          <TableCell>{order.responsible_mechanic || 'N/A'}</TableCell>
                          <TableCell className="text-right font-medium">
                            R$ {(parseFloat(order.grand_total || '0')).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {filteredData.orders.length > 50 && (
                    <div className="p-4 text-center text-gray-500 border-t">
                      Mostrando 50 de {filteredData.totalOrders} registros. 
                      <Button variant="link" className="p-0 h-auto ml-1">
                        Exportar todos para ver completo
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relatório Analítico */}
          <TabsContent value="analytical" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Análise Temporal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Análise Temporal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border">
                      <h4 className="font-semibold text-blue-900 mb-2">Período Analisado</h4>
                      <p className="text-blue-700">
                        {filters.dateRange.preset === 'custom' ? 
                          `${new Date(filters.dateRange.startDate).toLocaleDateString('pt-BR')} - ${new Date(filters.dateRange.endDate).toLocaleDateString('pt-BR')}` :
                          filters.dateRange.preset === 'thisMonth' ? 'Este Mês' :
                          filters.dateRange.preset === 'lastMonth' ? 'Mês Anterior' :
                          filters.dateRange.preset === 'thisYear' ? 'Este Ano' :
                          'Todos os Períodos'
                        }
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span>Volume médio/mês:</span>
                        <span className="font-semibold">
                          {Math.round(filteredData.totalOrders / 12)} OS
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span>Receita média/mês:</span>
                        <span className="font-semibold">
                          R$ {(filteredData.totalValue / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Análise Financeira */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Análise Financeira
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(filteredData.statusDistribution).map(([status, count]) => {
                      const statusOrders = filteredData.orders.filter(o => o.order_status === status);
                      const statusValue = statusOrders.reduce((sum, o) => sum + (parseFloat(o.grand_total) || 0), 0);
                      
                      return (
                        <div key={status} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
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
                            <span className="text-sm text-gray-500">{count} OS</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm">Valor Total:</span>
                              <span className="font-semibold">
                                R$ {statusValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Valor Médio:</span>
                              <span className="font-semibold">
                                R$ {(statusValue / count).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ReportsNew;