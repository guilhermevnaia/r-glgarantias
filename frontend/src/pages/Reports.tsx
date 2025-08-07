import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FileBarChart, 
  Download,
  Filter,
  Eye,
  Calendar,
  DollarSign,
  Users,
  Wrench,
  AlertTriangle,
  FileText,
  Printer
} from "lucide-react";
import { useDashboardStats } from "@/hooks/useGlobalData";
import { exportToExcel, formatServiceOrdersForExport } from '@/utils/exportExcel';
import { useAI } from '@/hooks/useAI';

const Reports = () => {
  // Estados para filtros
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('all');
  const [selectedMechanic, setSelectedMechanic] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  
  // Estados para campos do relatório
  const [includeFinancial, setIncludeFinancial] = useState(true);
  const [includeDefects, setIncludeDefects] = useState(true);
  const [includeMechanics, setIncludeMechanics] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(false);
  
  // Buscar dados
  const { data: stats, isLoading } = useDashboardStats();
  const { classifications } = useAI();
  
  // Dados filtrados
  const [filteredData, setFilteredData] = useState<any>(null);
  
  useEffect(() => {
    if (!stats) return;
    
    let filtered = { ...stats };
    
    // Aplicar filtros
    if (stats.orders) {
      let orders = [...stats.orders];
      
      if (selectedStatus !== 'all') {
        orders = orders.filter(order => order.order_status === selectedStatus);
      }
      
      if (selectedManufacturer !== 'all') {
        orders = orders.filter(order => order.engine_manufacturer === selectedManufacturer);
      }
      
      if (selectedMechanic !== 'all') {
        orders = orders.filter(order => order.responsible_mechanic === selectedMechanic);
      }
      
      if (yearFilter !== 'all') {
        const year = parseInt(yearFilter);
        orders = orders.filter(order => new Date(order.order_date).getFullYear() === year);
      }
      
      // Recalcular estatísticas
      const totalOrders = orders.length;
      const totalValue = orders.reduce((sum, order) => sum + (parseFloat(order.grand_total || '0')), 0);
      const averageValue = totalOrders > 0 ? totalValue / totalOrders : 0;
      
      const statusDistribution = orders.reduce((acc, order) => {
        acc[order.order_status] = (acc[order.order_status] || 0) + 1;
        return acc;
      }, {} as any);
      
      filtered = {
        ...stats,
        orders,
        totalOrders,
        financialSummary: {
          ...stats.financialSummary,
          totalValue,
          averageValue
        },
        statusDistribution: {
          G: statusDistribution.G || 0,
          GO: statusDistribution.GO || 0,
          GU: statusDistribution.GU || 0
        }
      };
    }
    
    setFilteredData(filtered);
  }, [stats, selectedStatus, selectedManufacturer, selectedMechanic, yearFilter]);
  
  const handleGenerateReport = () => {
    if (!filteredData) return;
    
    const reportData = formatServiceOrdersForExport(filteredData.orders || [], classifications);
    const fileName = `relatorio-garantias-${new Date().toISOString().split('T')[0]}`;
    
    const success = exportToExcel(reportData, fileName, 'Relatório de Garantias');
    
    if (success) {
      console.log('✅ Relatório gerado com sucesso');
    } else {
      console.error('❌ Erro ao gerar relatório');
    }
  };
  
  const handlePreviewReport = () => {
    // Implementar preview em uma nova janela ou modal
    console.log('👁️ Preview do relatório');
  };
  
  const handlePrintReport = () => {
    window.print();
  };
  
  // Obter valores únicos para os filtros
  const manufacturers = stats?.orders ? 
    [...new Set(stats.orders.map(o => o.engine_manufacturer).filter(Boolean))] : [];
  const mechanics = stats?.orders ? 
    [...new Set(stats.orders.map(o => o.responsible_mechanic).filter(Boolean))] : [];
  const years = stats?.orders ? 
    [...new Set(stats.orders.map(o => new Date(o.order_date).getFullYear()))].sort((a, b) => b - a) : [];
  
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
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileBarChart className="h-8 w-8 text-blue-600" />
          Relatórios de Garantias
        </h1>
        <p className="text-gray-600">
          Gere relatórios personalizados das ordens de serviço e garantias
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Filtros */}
        <div className="lg:col-span-1">
          <Card className="bg-white border shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-600" />
                Filtros do Relatório
              </CardTitle>
              <CardDescription>
                Configure os parâmetros para gerar seu relatório
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Filtros */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Status da Garantia</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="G">G - Garantia</SelectItem>
                      <SelectItem value="GO">GO - Garantia com Observação</SelectItem>
                      <SelectItem value="GU">GU - Garantia Usuário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="manufacturer">Fabricante</Label>
                  <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos os fabricantes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os fabricantes</SelectItem>
                      {manufacturers.map(mfg => (
                        <SelectItem key={mfg} value={mfg}>{mfg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="mechanic">Mecânico Responsável</Label>
                  <Select value={selectedMechanic} onValueChange={setSelectedMechanic}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos os mecânicos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os mecânicos</SelectItem>
                      {mechanics.map(mech => (
                        <SelectItem key={mech} value={mech}>{mech}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="year">Ano</Label>
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos os anos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os anos</SelectItem>
                      {years.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Campos a incluir */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Campos a incluir no relatório:
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="financial" 
                      checked={includeFinancial}
                      onCheckedChange={setIncludeFinancial}
                    />
                    <Label htmlFor="financial" className="text-sm">Informações Financeiras</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="defects" 
                      checked={includeDefects}
                      onCheckedChange={setIncludeDefects}
                    />
                    <Label htmlFor="defects" className="text-sm">Descrições de Defeitos</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="mechanics" 
                      checked={includeMechanics}
                      onCheckedChange={setIncludeMechanics}
                    />
                    <Label htmlFor="mechanics" className="text-sm">Dados dos Mecânicos</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="charts" 
                      checked={includeCharts}
                      onCheckedChange={setIncludeCharts}
                    />
                    <Label htmlFor="charts" className="text-sm">Gráficos e Análises</Label>
                  </div>
                </div>
              </div>
              
              {/* Ações */}
              <div className="border-t pt-4 space-y-2">
                <Button 
                  onClick={handleGenerateReport}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Relatório Excel
                </Button>
                <Button 
                  onClick={handlePreviewReport}
                  variant="outline"
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar Preview
                </Button>
                <Button 
                  onClick={handlePrintReport}
                  variant="outline"
                  className="w-full"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Relatório
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Preview dos Dados */}
        <div className="lg:col-span-2">
          <Card className="bg-white border shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-semibold">Preview do Relatório</CardTitle>
              <CardDescription>
                Visualização dos dados que serão incluídos no relatório
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {filteredData ? (
                <div className="space-y-6">
                  {/* Resumo Executivo */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        R$ {(filteredData.financialSummary?.totalValue || 0).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">Mecânicos</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-900">
                        {mechanics.length}
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-900">Garantias</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-900">
                        {((filteredData.statusDistribution?.G || 0) + 
                          (filteredData.statusDistribution?.GO || 0) + 
                          (filteredData.statusDistribution?.GU || 0)).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Distribuição por Status */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Distribuição por Status</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {filteredData.statusDistribution?.G || 0}
                        </div>
                        <div className="text-sm text-gray-600">Garantia (G)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {filteredData.statusDistribution?.GO || 0}
                        </div>
                        <div className="text-sm text-gray-600">Garantia Obs. (GO)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {filteredData.statusDistribution?.GU || 0}
                        </div>
                        <div className="text-sm text-gray-600">Garantia Usuário (GU)</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Amostra dos Dados */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Amostra dos Dados (Primeiras 5 ordens)
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">OS</TableHead>
                            <TableHead className="font-semibold">Data</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Fabricante</TableHead>
                            <TableHead className="font-semibold">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(filteredData.orders || []).slice(0, 5).map((order: any) => (
                            <TableRow key={order.id || order.order_number}>
                              <TableCell className="font-medium">{order.order_number}</TableCell>
                              <TableCell>
                                {order.order_date.split('T')[0].split('-').reverse().join('/')}
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
                              <TableCell className="text-sm">
                                {order.engine_manufacturer || 'N/A'}
                              </TableCell>
                              <TableCell className="font-medium">
                                R$ {parseFloat(order.grand_total || '0').toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileBarChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Carregando dados para preview...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;