import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MoreHorizontal, Search, ChevronLeft, ChevronRight, Filter, X, Download, Shield, AlertTriangle, Eye, Edit, Printer, FileDown } from "lucide-react";
import { ServiceOrder } from "@/services/api";
import { useDataIntegrity, useRecordCountVerification } from "@/hooks/useDataIntegrity";
import { useToast } from "@/hooks/use-toast";
import { useServiceOrders, useUpdateServiceOrder, useDataSync } from "@/hooks/useGlobalData";
import { useAI } from '@/hooks/useAI';
import { ClassifiedDefect, ClassifiedDefectText } from '@/components/ClassifiedDefect';

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  "G": "outline",
  "GO": "default",
  "GU": "secondary",
};

const statusLabels: { [key: string]: string } = {
  "G": "Garantia",
  "GO": "Garantia de Oficina",
  "GU": "Garantia de Usinagem",
};

const ServiceOrders = () => {
  // 🤖 DADOS DA IA
  const { classifications } = useAI();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [manufacturerFilter, setManufacturerFilter] = useState("all");
  const [mechanicFilter, setMechanicFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 50; // Registros por página

  // ✅ USANDO ESTADO GLOBAL SINCRONIZADO
  const serviceOrdersParams = {
    page: currentPage,
    limit: recordsPerPage,
    ...(searchTerm && { search: searchTerm }),
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(yearFilter !== "all" && { year: parseInt(yearFilter) }),
    ...(monthFilter !== "all" && { month: parseInt(monthFilter) }),
    ...(manufacturerFilter !== "all" && { manufacturer: manufacturerFilter }),
    ...(mechanicFilter !== "all" && { mechanic: mechanicFilter }),
    ...(modelFilter !== "all" && { model: modelFilter }),
  };

  const { data: serviceOrdersResponse, isLoading: loading, error } = useServiceOrders(serviceOrdersParams);
  const serviceOrders = serviceOrdersResponse?.data || [];
  const totalRecords = serviceOrdersResponse?.pagination?.total || 0;
  const totalPages = serviceOrdersResponse?.pagination?.totalPages || 1;

  // Estados para ações
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<ServiceOrder>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Hooks de integridade de dados e sincronização
  const { integrityStatus, isLoading: integrityLoading, error: integrityError, checkIntegrity } = useDataIntegrity();
  const { isValid: isCountValid, actualCount, isChecking, verifyCount } = useRecordCountVerification(serviceOrders.length);
  const { updateServiceOrder } = useUpdateServiceOrder();
  const { invalidateAllData } = useDataSync();

  // Lista de anos únicos
  const availableYears = ["2019", "2020", "2021", "2022", "2023", "2024", "2025"];
  
  // Lista de meses
  const availableMonths = [
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" }
  ];

  // Extrair listas únicas dos dados
  const uniqueManufacturers = useMemo(() => {
    const manufacturers = [...new Set(serviceOrders.map(order => order.engine_manufacturer).filter(Boolean))];
    return manufacturers.sort();
  }, [serviceOrders]);

  const uniqueMechanics = useMemo(() => {
    const mechanics = [...new Set(serviceOrders.map(order => order.responsible_mechanic).filter(Boolean))];
    return mechanics.sort();
  }, [serviceOrders]);

  const uniqueModels = useMemo(() => {
    const models = [...new Set(serviceOrders.map(order => order.vehicle_model).filter(Boolean))];
    return models.sort();
  }, [serviceOrders]);

  // ✅ fetchServiceOrders removido - usando estado global sincronizado

  // ✅ useEffect removido - dados carregados automaticamente pelo hook global

  // Calcular hasActiveFilters antes de usar no useEffect
  const hasActiveFilters = statusFilter !== "all" || yearFilter !== "all" || monthFilter !== "all" || 
                          manufacturerFilter !== "all" || mechanicFilter !== "all" || modelFilter !== "all" || searchTerm;

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, yearFilter, monthFilter, manufacturerFilter, mechanicFilter, modelFilter]);

  // Aplicar filtros locais (frontend) sobre os dados da página atual
  const filteredOrders = useMemo(() => {
    return serviceOrders.filter(order => {
      // Filtro por ano (local)
      const orderYear = order.order_date ? new Date(order.order_date).getFullYear().toString() : "";
      const matchesYear = yearFilter === "all" || orderYear === yearFilter;
      
      // Filtro por mês (local)
      const orderMonth = order.order_date ? (new Date(order.order_date).getMonth() + 1).toString() : "";
      const matchesMonth = monthFilter === "all" || orderMonth === monthFilter;
      
      // Filtro por fabricante (local)
      const matchesManufacturer = manufacturerFilter === "all" || order.engine_manufacturer === manufacturerFilter;
      
      // Filtro por mecânico (local)
      const matchesMechanic = mechanicFilter === "all" || order.responsible_mechanic === mechanicFilter;
      
      // Filtro por modelo (local)
      const matchesModel = modelFilter === "all" || order.vehicle_model === modelFilter;

      return matchesYear && matchesMonth && matchesManufacturer && matchesMechanic && matchesModel;
    });
  }, [serviceOrders, yearFilter, monthFilter, manufacturerFilter, mechanicFilter, modelFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setYearFilter("all");
    setMonthFilter("all");
    setManufacturerFilter("all");
    setMechanicFilter("all");
    setModelFilter("all");
    setCurrentPage(1);
    // ✅ Não precisa mais chamar fetchServiceOrders - dados sincronizados automaticamente
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      // Para exportação, buscar todos os dados com os filtros aplicados
      console.log("📤 Buscando todos os dados para exportação...");
      
      toast({
        title: "Iniciando exportação",
        description: "Buscando todos os dados. Isso pode levar alguns segundos...",
      });

      const exportParams: any = {
        limit: 10000, // Buscar muitos registros para exportação
        page: 1
      };

      // Aplicar os mesmos filtros da busca
      if (searchTerm) exportParams.search = searchTerm;
      if (statusFilter !== "all") exportParams.status = statusFilter;

      const response = await apiService.getServiceOrders(exportParams);
      const allData = response.data || [];
      
      // Aplicar filtros locais também
      const dataToExport = allData.filter(order => {
        const orderYear = order.order_date ? new Date(order.order_date).getFullYear().toString() : "";
        const matchesYear = yearFilter === "all" || orderYear === yearFilter;
        
        const orderMonth = order.order_date ? (new Date(order.order_date).getMonth() + 1).toString() : "";
        const matchesMonth = monthFilter === "all" || orderMonth === monthFilter;
        
        const matchesManufacturer = manufacturerFilter === "all" || order.engine_manufacturer === manufacturerFilter;
        const matchesMechanic = mechanicFilter === "all" || order.responsible_mechanic === mechanicFilter;
        const matchesModel = modelFilter === "all" || order.vehicle_model === modelFilter;

        return matchesYear && matchesMonth && matchesManufacturer && matchesMechanic && matchesModel;
      });
      
      if (dataToExport.length === 0) {
        toast({
          title: "Nenhum dado para exportar",
          description: "Não há dados para exportar com os filtros aplicados.",
          variant: "destructive",
        });
        return;
      }

      console.log(`📤 Exportando ${dataToExport.length} registros...`);

    // Definir cabeçalhos do CSV
    const headers = [
      "OS",
      "Data",
      "Fabricante",
      "Motor",
      "Modelo", 
      "Defeito",
      "Mecânico Montador",
      "Total Peças",
      "Total Serviços",
      "Total"
    ];

    // Converter dados para formato CSV
    const csvContent = [
      headers.join(","),
      ...dataToExport.map(order => [
        `"${order.order_number || ''}"`,
        `"${order.order_date ? new Date(order.order_date).toLocaleDateString('pt-BR') : ''}"`,
        `"${order.engine_manufacturer || ''}"`,
        `"${order.engine_description || ''}"`,
        `"${order.vehicle_model || ''}"`,
        `"${(() => {
          const classification = classifications.find(c => c.service_order_id === order.id);
          if (classification && classification.defect_categories) {
            return classification.defect_categories.category_name;
          }
          return order.raw_defect_description || 'Não Classificado';
        })()}"`,
        `"${order.responsible_mechanic || ''}"`,
        `"R$ ${((order.original_parts_value || order.parts_total || 0) / 2).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`,
        `"R$ ${(order.labor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`,
        `"R$ ${(((order.original_parts_value || order.parts_total || 0) / 2) + (order.labor_total || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`
      ].join(","))
    ].join("\n");

    // Criar e baixar arquivo
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    
    // Nome do arquivo com filtros aplicados
    let fileName = "ordens_servico";
    const activeFilters = [];
    
    if (statusFilter !== "all") activeFilters.push(`status_${statusFilter}`);
    if (yearFilter !== "all") activeFilters.push(`ano_${yearFilter}`);
    if (monthFilter !== "all") activeFilters.push(`mes_${monthFilter}`);
    if (manufacturerFilter !== "all") activeFilters.push(`fabricante_${manufacturerFilter.replace(/\s+/g, '_')}`);
    if (mechanicFilter !== "all") activeFilters.push(`mecanico_${mechanicFilter.replace(/\s+/g, '_')}`);
    if (modelFilter !== "all") activeFilters.push(`modelo_${modelFilter.replace(/\s+/g, '_')}`);
    if (searchTerm) activeFilters.push("pesquisa");
    
    if (activeFilters.length > 0) {
      fileName += `_filtrado_${activeFilters.join('_')}`;
    }
    
    fileName += `_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
      console.log(`📤 Exportados ${dataToExport.length} registros para ${fileName}`);
      
      toast({
        title: "Exportação concluída!",
        description: `${dataToExport.length} registros exportados com sucesso.`,
      });
    } catch (error) {
      console.error("❌ Erro durante exportação:", error);
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      // ✅ Página atualizada automaticamente via estado global
    }
  };

  // Funções de ação
  const handleViewDetails = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setShowDetailsDialog(true);
  };

  const handleEdit = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setEditFormData({
      order_number: order.order_number,
      order_date: order.order_date ? new Date(order.order_date).toISOString().split('T')[0] : '',
      engine_manufacturer: order.engine_manufacturer || '',
      engine_description: order.engine_description || '',
      vehicle_model: order.vehicle_model || '',
      raw_defect_description: order.raw_defect_description || '',
      responsible_mechanic: order.responsible_mechanic || '',
      parts_total: order.parts_total || 0,
      labor_total: order.labor_total || 0,
      grand_total: order.grand_total || 0,
      order_status: order.order_status
    });
    setShowEditDialog(true);
  };

  const handlePrint = (order: ServiceOrder) => {
    // Criar uma versão imprimível da OS
    const printContent = `
      <html>
        <head>
          <title>Ordem de Serviço - ${order.order_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-item { margin-bottom: 10px; }
            .label { font-weight: bold; }
            .financials { margin-top: 30px; padding: 15px; border: 1px solid #ccc; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ORDEM DE SERVIÇO</h1>
            <h2>OS: ${order.order_number}</h2>
            <p>Data: ${order.order_date ? new Date(order.order_date).toLocaleDateString('pt-BR') : 'N/A'}</p>
          </div>
          
          <div class="info-grid">
            <div>
              <div class="info-item">
                <span class="label">Fabricante:</span> ${order.engine_manufacturer || 'N/A'}
              </div>
              <div class="info-item">
                <span class="label">Motor:</span> ${order.engine_description || 'N/A'}
              </div>
              <div class="info-item">
                <span class="label">Modelo:</span> ${order.vehicle_model || 'N/A'}
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="label">Mecânico:</span> ${order.responsible_mechanic || 'N/A'}
              </div>
              <div class="info-item">
                <span class="label">Status:</span> ${statusLabels[order.order_status] || order.order_status}
              </div>
            </div>
          </div>
          
          <div class="info-item">
            <span class="label">Descrição do Defeito:</span><br>
            ${order.raw_defect_description || 'N/A'}
          </div>
          
          <div class="financials">
            <h3>Valores</h3>
            <div class="info-item">
              <span class="label">Total Peças:</span> R$ ${((order.original_parts_value || order.parts_total || 0) / 2).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div class="info-item">
              <span class="label">Total Serviços:</span> R$ ${(order.labor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div class="info-item" style="font-size: 1.2em; margin-top: 10px;">
              <span class="label">TOTAL GERAL:</span> R$ ${(((order.original_parts_value || order.parts_total || 0) / 2) + (order.labor_total || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      
      toast({
        title: "OS enviada para impressão",
        description: `Ordem de serviço ${order.order_number} preparada para impressão.`,
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedOrder) return;

    setIsUpdating(true);
    try {
      // Validar dados antes de enviar
      if (!editFormData.order_number?.trim()) {
        toast({
          title: "❌ Erro de validação",
          description: "Número da OS é obrigatório.",
          variant: "destructive",
        });
        return;
      }

      if (!editFormData.order_status) {
        toast({
          title: "❌ Erro de validação", 
          description: "Status é obrigatório.",
          variant: "destructive",
        });
        return;
      }

      console.log('🔄 Salvando alterações da OS:', selectedOrder.id);
      console.log('📝 Dados alterados:', editFormData);

      const updatedOrder = await apiService.updateServiceOrder(selectedOrder.id, editFormData);
      
      // Atualizar a lista local com os novos dados
      setServiceOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === selectedOrder.id ? { ...order, ...updatedOrder } : order
        )
      );

      setShowEditDialog(false);
      setEditFormData({});
      setSelectedOrder(null);

      toast({
        title: "✅ OS atualizada com sucesso!",
        description: `Ordem de serviço ${editFormData.order_number} foi atualizada. Todas as análises e dashboards foram atualizados automaticamente.`,
      });

      // Verificar integridade após atualização
      setTimeout(() => {
        checkIntegrity();
      }, 1000);

    } catch (error: any) {
      console.error('❌ Erro ao salvar alterações:', error);
      
      let errorMessage = 'Erro desconhecido ao atualizar OS';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "❌ Erro ao atualizar OS",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportSingle = (order: ServiceOrder) => {
    const csvContent = [
      "OS,Data,Fabricante,Motor,Modelo,Defeito,Mecânico Montador,Total Peças,Total Serviços,Total",
      [
        `"${order.order_number || ''}"`,
        `"${order.order_date ? new Date(order.order_date).toLocaleDateString('pt-BR') : ''}"`,
        `"${order.engine_manufacturer || ''}"`,
        `"${order.engine_description || ''}"`,
        `"${order.vehicle_model || ''}"`,
        `"${(() => {
          const classification = classifications.find(c => c.service_order_id === order.id);
          if (classification && classification.defect_categories) {
            return classification.defect_categories.category_name;
          }
          return order.raw_defect_description || 'Não Classificado';
        })()}"`,
        `"${order.responsible_mechanic || ''}"`,
        `"R$ ${((order.original_parts_value || order.parts_total || 0) / 2).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`,
        `"R$ ${(order.labor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`,
        `"R$ ${(((order.original_parts_value || order.parts_total || 0) / 2) + (order.labor_total || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`
      ].join(",")
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `OS_${order.order_number}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "OS exportada",
      description: `Ordem de serviço ${order.order_number} exportada com sucesso.`,
    });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Ordens de Serviço</h1>
      <Card className="bg-white/80 backdrop-blur-sm border-2 border-black shadow-sm">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold text-foreground">
                Histórico de Ordens
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Consulte, filtre e gerencie todas as ordens de serviço.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por OS, fabricante, modelo, defeito..."
                  className="w-80 pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className={`${hasActiveFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros {hasActiveFilters && `(${[statusFilter, yearFilter, monthFilter, manufacturerFilter, mechanicFilter, modelFilter].filter(f => f !== 'all').length})`}
              </Button>

              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} size="sm">
                  <X className="h-4 w-4 mr-1" />
                  Limpar Filtros
                </Button>
              )}

              <Button 
                variant="outline" 
                onClick={exportToCSV}
                disabled={isExporting}
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 disabled:opacity-50"
              >
                {isExporting ? (
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isExporting ? "Exportando..." : "Exportar (Todos os dados)"}
              </Button>

              {/* Indicador de Integridade */}
              <Button 
                variant="outline" 
                onClick={checkIntegrity}
                disabled={integrityLoading}
                className={`${
                  integrityStatus?.isHealthy === true 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : integrityStatus?.hasRecentErrors 
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                }`}
                title={
                  integrityStatus?.isHealthy 
                    ? 'Sistema íntegro' 
                    : integrityStatus?.hasRecentErrors 
                      ? 'Problemas detectados' 
                      : 'Verificando...'
                }
              >
                {integrityLoading ? (
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                ) : integrityStatus?.isHealthy ? (
                  <Shield className="h-4 w-4 mr-2" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                )}
                Integridade
                {isCountValid === false && (
                  <span className="ml-1 text-xs bg-red-200 text-red-800 px-1 rounded">
                    {actualCount}/{serviceOrders.length}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Seção de Filtros Expandida */}
        {showFilters && (
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="G">Garantia (G)</SelectItem>
                    <SelectItem value="GO">Garantia de Oficina (GO)</SelectItem>
                    <SelectItem value="GU">Garantia de Usinagem (GU)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Ano</label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Mês</label>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {availableMonths.map(month => (
                      <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Fabricante</label>
                <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {uniqueManufacturers.map(manufacturer => (
                      <SelectItem key={manufacturer} value={manufacturer}>{manufacturer}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Mecânico</label>
                <Select value={mechanicFilter} onValueChange={setMechanicFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {uniqueMechanics.map(mechanic => (
                      <SelectItem key={mechanic} value={mechanic}>{mechanic}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Modelo</label>
                <Select value={modelFilter} onValueChange={setModelFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {uniqueModels.map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
        
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3 mx-auto"></div>
              </div>
            </div>
          ) : (
            <>
              {/* Contador de resultados e paginação */}
              <div className="px-6 py-3 bg-gray-50 border-b text-sm text-gray-600 flex justify-between items-center">
                <div>
                  Mostrando {((currentPage - 1) * recordsPerPage) + 1} a {Math.min(currentPage * recordsPerPage, totalRecords)} de {totalRecords.toLocaleString('pt-BR')} ordens de serviço
                  {hasActiveFilters && " (filtrado)"}
                </div>
                <div className="flex items-center gap-3">
                  {hasActiveFilters && (
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      📤 Dados filtrados prontos para exportação
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Página {currentPage} de {totalPages}
                  </div>
                </div>
              </div>
              
              <div className="max-h-[70vh] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold text-foreground">OS</TableHead>
                      <TableHead className="font-semibold text-foreground">Data</TableHead>
                      <TableHead className="font-semibold text-foreground">Fabricante</TableHead>
                      <TableHead className="font-semibold text-foreground">Motor</TableHead>
                      <TableHead className="font-semibold text-foreground">Modelo</TableHead>
                      <TableHead className="font-semibold text-foreground">Defeito</TableHead>
                      <TableHead className="font-semibold text-foreground">Mecânico Montador</TableHead>
                      <TableHead className="font-semibold text-foreground text-right">Total Peças</TableHead>
                      <TableHead className="font-semibold text-foreground text-right">Total Serviços</TableHead>
                      <TableHead className="font-semibold text-foreground text-right">Total</TableHead>
                      <TableHead className="text-right font-semibold text-foreground">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-foreground">
                            <div className="flex flex-col">
                              <span className="font-semibold">{order.order_number}</span>
                              <Badge variant={statusVariant[order.order_status] || "default"} className="w-fit text-xs mt-1">
                                {statusLabels[order.order_status] || order.order_status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-foreground">
                            {order.order_date ? new Date(order.order_date).toLocaleDateString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell className="text-foreground font-medium">{order.engine_manufacturer || '-'}</TableCell>
                          <TableCell className="text-foreground max-w-40 truncate" title={order.engine_description || ''}>
                            {order.engine_description || '-'}
                          </TableCell>
                          <TableCell className="text-foreground max-w-32 truncate" title={order.vehicle_model || ''}>
                            {order.vehicle_model || '-'}
                          </TableCell>
                          <TableCell className="text-foreground max-w-48">
                            <ClassifiedDefectText 
                              order={order}
                              classification={classifications.find(c => c.service_order_id === order.id)}
                              maxLength={30}
                            />
                          </TableCell>
                          <TableCell className="text-foreground max-w-32 truncate" title={order.responsible_mechanic || ''}>
                            {order.responsible_mechanic || '-'}
                          </TableCell>
                          <TableCell className="text-foreground font-semibold text-right">
                            R$ {((order.original_parts_value || order.parts_total || 0) / 2).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-foreground font-semibold text-right">
                            R$ {(order.labor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-foreground font-bold text-right bg-blue-50">
                            R$ {(((order.original_parts_value || order.parts_total || 0) / 2) + (order.labor_total || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(order)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePrint(order)}>
                                  <Printer className="h-4 w-4 mr-2" />
                                  Imprimir OS
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExportSingle(order)}>
                                  <FileDown className="h-4 w-4 mr-2" />
                                  Exportar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                          {hasActiveFilters || searchTerm
                            ? "Nenhuma ordem de serviço encontrada com os filtros aplicados." 
                            : "Nenhuma ordem de serviço encontrada."
                          }
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Controles de Paginação */}
              <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                <div className="flex items-center text-sm text-gray-600">
                  {hasActiveFilters && (
                    <div className="text-blue-700 mr-4">
                      📊 {[statusFilter, yearFilter, monthFilter, manufacturerFilter, mechanicFilter, modelFilter].filter(f => f !== 'all').length} filtro(s) aplicado(s)
                    </div>
                  )}
                  Exibindo {recordsPerPage} registros por página
                </div>

                {/* Navegação de páginas */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    «
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    ‹
                  </Button>

                  <div className="flex items-center space-x-1">
                    {/* Mostrar páginas próximas */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      if (pageNumber <= totalPages) {
                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNumber)}
                            className="h-8 w-8 p-0"
                          >
                            {pageNumber}
                          </Button>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    ›
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    »
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Ordem de Serviço
            </DialogTitle>
            <DialogDescription>
              Edite os dados da OS {selectedOrder?.order_number}. As alterações serão refletidas em todo o sistema.
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Informações da OS</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Número da OS *</label>
                      <Input
                        value={editFormData.order_number || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, order_number: e.target.value }))}
                        placeholder="Ex: OS-2024-001"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Data da OS *</label>
                      <Input
                        type="date"
                        value={editFormData.order_date || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, order_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Status *</label>
                      <Select 
                        value={editFormData.order_status || ''} 
                        onValueChange={(value) => setEditFormData(prev => ({ ...prev, order_status: value as 'G' | 'GO' | 'GU' }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="G">Garantia (G)</SelectItem>
                          <SelectItem value="GO">Garantia de Oficina (GO)</SelectItem>
                          <SelectItem value="GU">Garantia de Usinagem (GU)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Equipamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Fabricante</label>
                      <Input
                        value={editFormData.engine_manufacturer || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, engine_manufacturer: e.target.value }))}
                        placeholder="Ex: Mercedes-Benz"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Motor</label>
                      <Input
                        value={editFormData.engine_description || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, engine_description: e.target.value }))}
                        placeholder="Ex: OM926LA"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Modelo do Veículo</label>
                      <Input
                        value={editFormData.vehicle_model || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, vehicle_model: e.target.value }))}
                        placeholder="Ex: Atego 1719"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Descrição do Defeito */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Descrição do Defeito</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md resize-vertical"
                    value={editFormData.raw_defect_description || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, raw_defect_description: e.target.value }))}
                    placeholder="Descreva o defeito detalhadamente..."
                  />
                </CardContent>
              </Card>

              {/* Responsável e Valores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Responsável</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Mecânico Montador</label>
                      <Input
                        value={editFormData.responsible_mechanic || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, responsible_mechanic: e.target.value }))}
                        placeholder="Ex: João Silva"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Valores Financeiros</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Total Peças (R$)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editFormData.parts_total || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, parts_total: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Total Serviços (R$)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editFormData.labor_total || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, labor_total: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Total Geral (R$)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editFormData.grand_total || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, grand_total: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ações do Dialog */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditDialog(false)}
                  disabled={isUpdating}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveEdit}
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes da Ordem de Serviço
            </DialogTitle>
            <DialogDescription>
              Informações completas da OS {selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Informações da OS</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Número da OS</label>
                      <p className="font-semibold text-lg">{selectedOrder.order_number}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Data</label>
                      <p>{selectedOrder.order_date ? new Date(selectedOrder.order_date).toLocaleDateString('pt-BR') : 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="mt-1">
                        <Badge variant={statusVariant[selectedOrder.order_status] || "default"}>
                          {statusLabels[selectedOrder.order_status] || selectedOrder.order_status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Equipamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Fabricante</label>
                      <p>{selectedOrder.engine_manufacturer || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Motor</label>
                      <p className="break-words">{selectedOrder.engine_description || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Modelo do Veículo</label>
                      <p>{selectedOrder.vehicle_model || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Descrição do Defeito */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Descrição do Defeito</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedOrder.raw_defect_description || 'Nenhuma descrição disponível'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Informações do Serviço */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Responsável</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Mecânico Montador</label>
                      <p className="font-medium">{selectedOrder.responsible_mechanic || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Valores Financeiros</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Total Peças:</span>
                      <span className="font-semibold">
                        R$ {((selectedOrder.original_parts_value || selectedOrder.parts_total || 0) / 2).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Total Serviços:</span>
                      <span className="font-semibold">
                        R$ {(selectedOrder.labor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">TOTAL GERAL:</span>
                        <span className="text-xl font-bold text-blue-600">
                          R$ {(((selectedOrder.original_parts_value || selectedOrder.parts_total || 0) / 2) + (selectedOrder.labor_total || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ações do Dialog */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => handlePrint(selectedOrder)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                <Button variant="outline" onClick={() => handleExportSingle(selectedOrder)}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Button onClick={() => setShowDetailsDialog(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceOrders;
