import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Search, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const ordersPerPage = 20;

  const fetchServiceOrders = async (page: number = 1) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: ordersPerPage
      };
      
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== "all") params.status = statusFilter;

      console.log("🔄 Buscando ordens de serviço:", params);
      const response: ServiceOrdersResponse = await apiService.getServiceOrders(params);
      console.log("✅ Ordens recebidas:", response);
      
      setServiceOrders(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalRecords(response.pagination?.total || 0);
      setCurrentPage(response.pagination?.page || 1);
    } catch (error) {
      console.error("❌ Erro ao buscar ordens:", error);
      setServiceOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceOrders(1);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm || statusFilter !== "all") {
        fetchServiceOrders(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  const filteredOrders = useMemo(() => {
    return serviceOrders.filter(order => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        order.order_number.toLowerCase().includes(searchLower) ||
        (order.engine_manufacturer && order.engine_manufacturer.toLowerCase().includes(searchLower)) ||
        (order.vehicle_model && order.vehicle_model.toLowerCase().includes(searchLower)) ||
        (order.responsible_mechanic && order.responsible_mechanic.toLowerCase().includes(searchLower));
      
      const matchesStatus = statusFilter === "all" || order.order_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [serviceOrders, searchTerm, statusFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchServiceOrders(newPage);
    }
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
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por OS, fabricante, modelo..."
                  className="w-64 pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="G">Garantia (G)</SelectItem>
                  <SelectItem value="GO">Garantia Outros (GO)</SelectItem>
                  <SelectItem value="GU">Garantia Usados (GU)</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={clearFilters}>Limpar Filtros</Button>
            </div>
          </div>
        </CardHeader>
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
              <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold text-foreground">OS</TableHead>
                      <TableHead className="font-semibold text-foreground">Data</TableHead>
                      <TableHead className="font-semibold text-foreground">Fabricante</TableHead>
                      <TableHead className="font-semibold text-foreground">Motor</TableHead>
                      <TableHead className="font-semibold text-foreground">Modelo</TableHead>
                      <TableHead className="font-semibold text-foreground">Defeito</TableHead>
                      <TableHead className="font-semibold text-foreground">Mecânico</TableHead>
                      <TableHead className="font-semibold text-foreground">Total</TableHead>
                      <TableHead className="font-semibold text-foreground">Status</TableHead>
                      <TableHead className="text-right font-semibold text-foreground">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-foreground">{order.order_number}</TableCell>
                          <TableCell className="text-foreground">
                            {order.order_date ? new Date(order.order_date).toLocaleDateString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell className="text-foreground">{order.engine_manufacturer || '-'}</TableCell>
                          <TableCell className="text-foreground max-w-32 truncate" title={order.engine_description || ''}>
                            {order.engine_description || '-'}
                          </TableCell>
                          <TableCell className="text-foreground">{order.vehicle_model || '-'}</TableCell>
                          <TableCell className="text-foreground max-w-40 truncate" title={order.raw_defect_description || ''}>
                            {order.raw_defect_description || '-'}
                          </TableCell>
                          <TableCell className="text-foreground">{order.responsible_mechanic || '-'}</TableCell>
                          <TableCell className="text-foreground font-semibold">
                            R$ {order.grand_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[order.order_status] || "default"}>
                              {statusLabels[order.order_status] || order.order_status}
                            </Badge>
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
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                          {searchTerm || statusFilter !== "all" 
                            ? "Nenhuma ordem de serviço encontrada com os filtros aplicados." 
                            : "Nenhuma ordem de serviço encontrada."
                          }
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * ordersPerPage) + 1} a {Math.min(currentPage * ordersPerPage, totalRecords)} de {totalRecords} ordens
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
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
