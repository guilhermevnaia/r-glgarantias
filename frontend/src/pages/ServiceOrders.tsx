import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Search, ChevronLeft, ChevronRight, Filter, X, Download } from "lucide-react";
import { apiService, ServiceOrder, ServiceOrdersResponse } from "@/services/api";

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  "G": "outline",
  "GO": "default",
  "GU": "secondary",
};

const statusLabels: { [key: string]: string } = {
  "G": "Garantia",
  "GO": "Garantia Outros",
  "GU": "Garantia Usados",
};

const ServiceOrders = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [manufacturerFilter, setManufacturerFilter] = useState("all");
  const [mechanicFilter, setMechanicFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

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

  const fetchServiceOrders = async () => {
    setLoading(true);
    try {
      // Para dados brutos, buscar TODOS os registros sem paginação
      const params: any = {
        limit: 10000, // Limite alto para garantir que pegue todos os dados
        page: 1
      };

      console.log("🔄 Buscando TODAS as ordens de serviço (dados brutos):", params);
      const response: ServiceOrdersResponse = await apiService.getServiceOrders(params);
      console.log("✅ Ordens recebidas:", response);
      console.log(`📊 Total de registros carregados: ${response.data?.length || 0}`);
      
      setServiceOrders(response.data || []);
      setTotalRecords(response.data?.length || 0);
    } catch (error) {
      console.error("❌ Erro ao buscar ordens:", error);
      setServiceOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceOrders();
  }, []);

  // Calcular hasActiveFilters antes de usar no useEffect
  const hasActiveFilters = statusFilter !== "all" || yearFilter !== "all" || monthFilter !== "all" || 
                          manufacturerFilter !== "all" || mechanicFilter !== "all" || modelFilter !== "all" || searchTerm;

  // Para dados brutos, não precisamos de paginação - todos os filtros são feitos no frontend

  const filteredOrders = useMemo(() => {
    return serviceOrders.filter(order => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        order.order_number.toLowerCase().includes(searchLower) ||
        (order.engine_manufacturer && order.engine_manufacturer.toLowerCase().includes(searchLower)) ||
        (order.vehicle_model && order.vehicle_model.toLowerCase().includes(searchLower)) ||
        (order.responsible_mechanic && order.responsible_mechanic.toLowerCase().includes(searchLower)) ||
        (order.raw_defect_description && order.raw_defect_description.toLowerCase().includes(searchLower));
      
      const matchesStatus = statusFilter === "all" || order.order_status === statusFilter;
      
      // Filtro por ano
      const orderYear = order.order_date ? new Date(order.order_date).getFullYear().toString() : "";
      const matchesYear = yearFilter === "all" || orderYear === yearFilter;
      
      // Filtro por mês  
      const orderMonth = order.order_date ? (new Date(order.order_date).getMonth() + 1).toString() : "";
      const matchesMonth = monthFilter === "all" || orderMonth === monthFilter;
      
      // Filtro por fabricante
      const matchesManufacturer = manufacturerFilter === "all" || order.engine_manufacturer === manufacturerFilter;
      
      // Filtro por mecânico
      const matchesMechanic = mechanicFilter === "all" || order.responsible_mechanic === mechanicFilter;
      
      // Filtro por modelo
      const matchesModel = modelFilter === "all" || order.vehicle_model === modelFilter;

      return matchesSearch && matchesStatus && matchesYear && matchesMonth && 
             matchesManufacturer && matchesMechanic && matchesModel;
    });
  }, [serviceOrders, searchTerm, statusFilter, yearFilter, monthFilter, manufacturerFilter, mechanicFilter, modelFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setYearFilter("all");
    setMonthFilter("all");
    setManufacturerFilter("all");
    setMechanicFilter("all");
    setModelFilter("all");
  };

  const exportToCSV = () => {
    const dataToExport = filteredOrders;
    
    if (dataToExport.length === 0) {
      alert("Não há dados para exportar com os filtros aplicados.");
      return;
    }

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
        `"${order.raw_defect_description || ''}"`,
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
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar ({filteredOrders.length})
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
                    <SelectItem value="GO">Garantia Outros (GO)</SelectItem>
                    <SelectItem value="GU">Garantia Usados (GU)</SelectItem>
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
              {/* Contador de resultados */}
              <div className="px-6 py-3 bg-gray-50 border-b text-sm text-gray-600 flex justify-between items-center">
                <div>
                  Mostrando {filteredOrders.length} de {serviceOrders.length} ordens de serviço
                  {hasActiveFilters && " (filtrado)"}
                </div>
                {hasActiveFilters && (
                  <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                    📤 Dados filtrados prontos para exportação
                  </div>
                )}
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
                          <TableCell className="text-foreground max-w-48 truncate" title={order.raw_defect_description || ''}>
                            {order.raw_defect_description || '-'}
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
                                <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                                <DropdownMenuItem>Editar</DropdownMenuItem>
                                <DropdownMenuItem>Imprimir OS</DropdownMenuItem>
                                <DropdownMenuItem>Exportar</DropdownMenuItem>
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
              
              {/* Resumo de filtros aplicados */}
              {hasActiveFilters && (
                <div className="flex items-center justify-center px-6 py-3 border-t bg-blue-50">
                  <div className="text-sm text-blue-700">
                    📊 {filteredOrders.length} registros encontrados com {[statusFilter, yearFilter, monthFilter, manufacturerFilter, mechanicFilter, modelFilter].filter(f => f !== 'all').length} filtro(s) aplicado(s)
                  </div>  
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceOrders;
