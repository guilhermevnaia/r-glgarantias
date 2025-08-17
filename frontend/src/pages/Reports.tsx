import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  FileBarChart, 
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Users,
  Wrench,
  Building,
  AlertTriangle,
  Cog
} from "lucide-react";
import { useDashboardStats } from "@/hooks/useGlobalData";
import { exportToProfessionalExcel } from '@/utils/exportExcelPro';
import { exportToPDF } from '@/utils/exportPDF';
import { exportToProfessionalPDF } from '@/utils/exportPDFProfessional';
import { exportToSimplePDF } from '@/utils/simplePDFExport';
import { exportToProfessionalComplePDF } from '@/utils/professionalPDFComplete';

// Tipos para filtros alinhados com o novo exportPDF
interface FilterState {
  dateRange: {
    startDate: string | null;
    endDate: string | null;
    preset: 'custom' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'thisYear' | 'lastYear' | 'all';
  };
  status: string[];
  mechanics: string[];
  manufacturers: string[];
  groups: string[];
}

const Reports = () => {
  // Estados principais
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      startDate: null,
      endDate: null,
      preset: 'all'
    },
    status: ['Todas as Garantias'],
    mechanics: ['Todos os Mecânicos'],
    manufacturers: ['Todos os Fabricantes'],
    groups: ['Todos os Grupos']
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvancedPDFOptions, setShowAdvancedPDFOptions] = useState(false);
  
  // Estado para configurações avançadas do PDF
  const [pdfConfig, setPdfConfig] = useState({
    includeCharts: true,
    includeDetailedTables: true,
    includeHierarchicalAnalysis: true,
    pageFormat: 'a4' as 'a4' | 'letter',
    orientation: 'portrait' as 'portrait' | 'landscape',
    customTitle: '',
    customSubtitle: ''
  });
  
  // Dados do backend
  const { data: stats, isLoading } = useDashboardStats();
  
  // Opções para filtros
  const filterOptions = {
    status: ['Todas as Garantias', 'G - Garantia', 'GO - Garantia Oficina', 'GU - Garantia Usinagem'],
    mechanics: ['Todos os Mecânicos', ...((stats as any)?.orders ? [...new Set((stats as any).orders.map((o: any) => o.responsible_mechanic).filter(Boolean))] : [])],
    manufacturers: ['Todos os Fabricantes', ...((stats as any)?.orders ? [...new Set((stats as any).orders.map((o: any) => o.engine_manufacturer).filter(Boolean))] : [])],
    groups: ['Todos os Grupos', ...((stats as any)?.orders ? [...new Set((stats as any).orders.map((o: any) => o.defect_group).filter(Boolean))] : [])]
  };
  
  // Handlers
  const handleCheckboxChange = (category: keyof Omit<FilterState, 'dateRange'>, value: string, checked: boolean) => {
    setFilters(prev => {
      const newValues = checked 
        ? [...(prev[category] as string[]), value]
        : (prev[category] as string[]).filter(v => v !== value);
      
      // Lógica para "Todos"
      if (value.startsWith('Todos')) {
        return { ...prev, [category]: [value] };
      } else {
        const filteredValues = newValues.filter(v => !v.startsWith('Todos'));
        return { ...prev, [category]: filteredValues.length > 0 ? filteredValues : [prev[category][0]] };
      }
    });
  };

  const handleDatePresetChange = (preset: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, preset: preset as any }
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      dateRange: { startDate: null, endDate: null, preset: 'all' },
      status: ['Todas as Garantias'],
      mechanics: ['Todos os Mecânicos'],
      manufacturers: ['Todos os Fabricantes'],
      groups: ['Todos os Grupos']
    });
  };

  // Funções auxiliares para cálculos do PDF
  const calculateMonthlyTrend = (orders: any[]) => {
    const monthlyData: Record<string, { count: number; value: number }> = {};
    
    orders.forEach(order => {
      const date = new Date(order.order_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, value: 0 };
      }
      
      monthlyData[monthKey].count++;
      monthlyData[monthKey].value += parseFloat(order.grand_total || '0');
    });
    
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' }),
        count: data.count,
        value: data.value
      }));
  };

  const calculateTopMechanics = (orders: any[]) => {
    const mechanicsData: Record<string, { count: number; value: number }> = {};
    
    orders.forEach(order => {
      const mechanic = order.responsible_mechanic || 'Não Informado';
      
      if (!mechanicsData[mechanic]) {
        mechanicsData[mechanic] = { count: 0, value: 0 };
      }
      
      mechanicsData[mechanic].count++;
      mechanicsData[mechanic].value += parseFloat(order.grand_total || '0');
    });
    
    return Object.entries(mechanicsData)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 15)
      .map(([name, data]) => ({
        name,
        count: data.count,
        value: data.value
      }));
  };
  
  const handleExportExcel = async () => {
    if (!(stats as any)?.orders) return;
    
    setIsGenerating(true);
    try {
      const filteredOrders = applyFilters((stats as any).orders);
      
      await exportToProfessionalExcel({
        orders: filteredOrders,
        totalOrders: filteredOrders.length,
        totalValue: filteredOrders.reduce((sum, order) => sum + (parseFloat(order.grand_total) || 0), 0),
        avgValue: filteredOrders.length > 0 ? filteredOrders.reduce((sum, order) => sum + (parseFloat(order.grand_total) || 0), 0) / filteredOrders.length : 0,
        statusDistribution: {},
        manufacturerDistribution: {}
      }, filters as any, {
        includeCharts: false,
        includeAnalytics: true,
        includeSummary: true
      });
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleExportSimplePDF = async () => {
    if (!(stats as any)?.orders) return;

    setIsGenerating(true);
    try {
      const filteredOrders = applyFilters((stats as any).orders);
      const totalOrders = filteredOrders.length;
      const totalValue = filteredOrders.reduce((sum, order) => sum + (parseFloat(order.grand_total) || 0), 0);
      const avgValue = totalOrders > 0 ? totalValue / totalOrders : 0;

      const statusDistribution = filteredOrders.reduce((acc, order) => {
        const status = order.order_status || 'Desconhecido';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const manufacturerDistribution = filteredOrders.reduce((acc, order) => {
        const manufacturer = order.engine_manufacturer || 'N/A';
        acc[manufacturer] = (acc[manufacturer] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const defectGroupDistribution = filteredOrders.reduce((acc, order) => {
        const group = (order as any).defect_group || 'Não Classificado';
        acc[group] = (acc[group] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const pdfData = {
        orders: filteredOrders,
        totalOrders,
        totalValue,
        avgValue,
        statusDistribution,
        manufacturerDistribution,
        defectGroupDistribution,
      };

      await exportToSimplePDF(pdfData, filters);

    } catch (error) {
      console.error('Erro ao gerar PDF simples:', error);
      alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!(stats as any)?.orders) return;

    setIsGenerating(true);
    try {
      // 1. Aplicar filtros para obter as ordens relevantes
      const filteredOrders = applyFilters((stats as any).orders);

      // 2. Calcular dados resumidos a partir das ordens filtradas
      const totalOrders = filteredOrders.length;
      const totalValue = filteredOrders.reduce((sum, order) => sum + (parseFloat(order.grand_total) || 0), 0);
      const avgValue = totalOrders > 0 ? totalValue / totalOrders : 0;

      // 3. Calcular distribuições
      const statusDistribution = filteredOrders.reduce((acc, order) => {
        const status = order.order_status || 'Desconhecido';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const manufacturerDistribution = filteredOrders.reduce((acc, order) => {
        const manufacturer = order.engine_manufacturer || 'N/A';
        acc[manufacturer] = (acc[manufacturer] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const defectGroupDistribution = filteredOrders.reduce((acc, order) => {
        const group = (order as any).defect_group || 'Não Classificado';
        acc[group] = (acc[group] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // 4. Calcular tendência mensal e top mecânicos
      const monthlyTrend = calculateMonthlyTrend(filteredOrders);
      const topMechanics = calculateTopMechanics(filteredOrders);

      // 5. Montar o objeto FilterData completo
      const pdfData = {
        orders: filteredOrders,
        totalOrders,
        totalValue,
        avgValue,
        statusDistribution,
        manufacturerDistribution,
        defectGroupDistribution,
        monthlyTrend,
        topMechanics
      };

      // 6. Usar exportação PROFISSIONAL COMPLETA com gráficos, índices e fórmulas
      await exportToProfessionalComplePDF(pdfData, filters);

    } catch (error) {
      console.error('Erro ao gerar PDF profissional:', error);
      alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Função para aplicar filtros aos dados
  const applyFilters = (orders: any[]) => {
    let filtered = [...orders];
    
    // Filtro de período
    if (filters.dateRange.preset !== 'all') {
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;
      
      switch (filters.dateRange.preset) {
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'lastMonth':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'thisQuarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
          break;
        case 'thisYear':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        case 'lastYear':
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          endDate = new Date(now.getFullYear() - 1, 11, 31);
          break;
      }
      
      if (startDate && endDate) {
        endDate.setHours(23, 59, 59, 999); // Incluir todo o dia final
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.order_date);
          return orderDate >= (startDate as Date) && orderDate <= (endDate as Date);
        });
      }
    }
    
    // Filtros de status
    if (filters.status.length > 0 && !filters.status.includes('Todas as Garantias')) {
      filtered = filtered.filter(order => 
        filters.status.some(statusFilter => {
          const statusCode = statusFilter.split(' - ')[0];
          return order.order_status === statusCode;
        })
      );
    }
    
    // Filtros de mecânico
    if (filters.mechanics.length > 0 && !filters.mechanics.includes('Todos os Mecânicos')) {
      filtered = filtered.filter(order => filters.mechanics.includes(order.responsible_mechanic));
    }
    
    // Filtros de fabricante
    if (filters.manufacturers.length > 0 && !filters.manufacturers.includes('Todos os Fabricantes')) {
      filtered = filtered.filter(order => filters.manufacturers.includes(order.engine_manufacturer));
    }
    
    // Filtros de grupo de defeito
    if (filters.groups.length > 0 && !filters.groups.includes('Todos os Grupos')) {
      filtered = filtered.filter(order => filters.groups.includes(order.defect_group));
    }
    
    return filtered;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileBarChart className="h-8 w-8 text-blue-600" />
            Relatórios
          </h1>
          <p className="text-muted-foreground mt-2">
            Selecione os filtros e exporte seus relatórios profissionais
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-gray-600" />
            Filtros para Relatório
          </CardTitle>
          <CardDescription>
            Marque as opções que deseja incluir no relatório
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Período */}
          <div>
            <Label className="text-base font-semibold flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              Período
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'thisMonth', label: 'Este Mês' },
                { value: 'lastMonth', label: 'Mês Anterior' },
                { value: 'thisQuarter', label: 'Este Trimestre' },
                { value: 'thisYear', label: 'Este Ano' },
                { value: 'lastYear', label: 'Ano Anterior' },
                { value: 'all', label: 'Todos' }
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`period-${option.value}`}
                    checked={filters.dateRange.preset === option.value}
                    onCheckedChange={() => handleDatePresetChange(option.value)}
                  />
                  <Label htmlFor={`period-${option.value}`} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Status da Garantia */}
          <div>
            <Label className="text-base font-semibold flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Status da Garantia
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {filterOptions.status.map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={filters.status.includes(status)}
                    onCheckedChange={(checked) => handleCheckboxChange('status', status, checked as boolean)}
                  />
                  <Label htmlFor={`status-${status}`} className="text-sm">
                    {status}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Mecânicos */}
          <div>
            <Label className="text-base font-semibold flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-green-600" />
              Mecânicos
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filterOptions.mechanics.map((mechanic: string) => (
                <div key={mechanic} className="flex items-center space-x-2">
                  <Checkbox
                    id={`mechanic-${mechanic}`}
                    checked={filters.mechanics.includes(mechanic)}
                    onCheckedChange={(checked) => handleCheckboxChange('mechanics', mechanic, checked as boolean)}
                  />
                  <Label htmlFor={`mechanic-${mechanic}`} className="text-sm">
                    {mechanic}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Fabricantes */}
          <div>
            <Label className="text-base font-semibold flex items-center gap-2 mb-3">
              <Building className="h-5 w-5 text-purple-600" />
              Fabricantes
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filterOptions.manufacturers.map((manufacturer: string) => (
                <div key={manufacturer} className="flex items-center space-x-2">
                  <Checkbox
                    id={`manufacturer-${manufacturer}`}
                    checked={filters.manufacturers.includes(manufacturer)}
                    onCheckedChange={(checked) => handleCheckboxChange('manufacturers', manufacturer, checked as boolean)}
                  />
                  <Label htmlFor={`manufacturer-${manufacturer}`} className="text-sm">
                    {manufacturer}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Grupos de Defeito */}
          <div>
            <Label className="text-base font-semibold flex items-center gap-2 mb-3">
              <Cog className="h-5 w-5 text-teal-600" />
              Grupos de Defeito
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filterOptions.groups.map((group: string) => (
                <div key={group} className="flex items-center space-x-2">
                  <Checkbox
                    id={`group-${group}`}
                    checked={filters.groups.includes(group)}
                    onCheckedChange={(checked) => handleCheckboxChange('groups', group, checked as boolean)}
                  />
                  <Label htmlFor={`group-${group}`} className="text-sm">
                    {group}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Configurações Avançadas do PDF */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Cog className="h-5 w-5 text-purple-600" />
                Configurações do PDF
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedPDFOptions(!showAdvancedPDFOptions)}
              >
                {showAdvancedPDFOptions ? 'Ocultar' : 'Mostrar'} Opções Avançadas
              </Button>
            </div>
            
            {showAdvancedPDFOptions && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeCharts"
                    checked={pdfConfig.includeCharts}
                    onCheckedChange={(checked) => setPdfConfig(prev => ({ ...prev, includeCharts: checked as boolean }))}
                  />
                  <Label htmlFor="includeCharts" className="text-sm">Incluir Gráficos</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeDetailedTables"
                    checked={pdfConfig.includeDetailedTables}
                    onCheckedChange={(checked) => setPdfConfig(prev => ({ ...prev, includeDetailedTables: checked as boolean }))}
                  />
                  <Label htmlFor="includeDetailedTables" className="text-sm">Tabelas Detalhadas</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeHierarchicalAnalysis"
                    checked={pdfConfig.includeHierarchicalAnalysis}
                    onCheckedChange={(checked) => setPdfConfig(prev => ({ ...prev, includeHierarchicalAnalysis: checked as boolean }))}
                  />
                  <Label htmlFor="includeHierarchicalAnalysis" className="text-sm">Análise Hierárquica</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label className="text-sm">Formato:</Label>
                  <select 
                    value={pdfConfig.pageFormat} 
                    onChange={(e) => setPdfConfig(prev => ({ ...prev, pageFormat: e.target.value as 'a4' | 'letter' }))}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="a4">A4</option>
                    <option value="letter">Letter</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label className="text-sm">Orientação:</Label>
                  <select 
                    value={pdfConfig.orientation} 
                    onChange={(e) => setPdfConfig(prev => ({ ...prev, orientation: e.target.value as 'portrait' | 'landscape' }))}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="portrait">Retrato</option>
                    <option value="landscape">Paisagem</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Botões de Ação */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button onClick={clearAllFilters} variant="outline">
              Limpar Filtros
            </Button>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleExportExcel}
                disabled={isGenerating}
                className="bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-5 w-5 mr-2" />
                    Exportar Excel
                  </>
                )}
              </Button>

              <Button 
                onClick={handleExportPDF}
                disabled={isGenerating}
                className="bg-red-600 hover:bg-red-700"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5 mr-2" />
                    PDF Completo (Gráficos + Fórmulas)
                  </>
                )}
              </Button>

              <Button 
                onClick={handleExportSimplePDF}
                disabled={isGenerating}
                className="bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5 mr-2" />
                    PDF Simples
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
