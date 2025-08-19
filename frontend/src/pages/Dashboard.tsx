import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  TrendingUp, 
  Users, 
  BarChart3, 
  CheckCircle, 
  Settings, 
  Truck,
  DollarSign,
  Calendar,
  Activity,
  Download,
  Wrench,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  Zap,
  X
} from "lucide-react";
import { AppleCard } from '@/components/AppleCard';
import { ChartCard } from "@/components/ChartCard";
import { DashboardStats } from "@/services/api";
import { useDashboardStats } from "@/hooks/useGlobalData";
import { exportToExcel, formatServiceOrdersForExport } from '@/utils/exportExcel';
import { useAI } from '@/hooks/useAI';
import { SimpleDefectCard } from '@/components/SimpleDefectCard';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

interface DashboardProps {}

const Dashboard = () => {
  const [aiStats, setAiStats] = useState<any>(null);
  
  // 📅 FILTROS PARA VISÃO GERAL - PADRÃO PARA MÊS E ANO ATUAIS
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number | null>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number | null>(currentDate.getFullYear());

  // 📊 BUSCAR DADOS COM FILTROS OPCIONAIS
  const { data: stats, isLoading: loading, error } = useDashboardStats(selectedMonth, selectedYear);
  
  // 🔄 DADOS PARA ANÁLISE COMPARATIVA - MÊS ATUAL VS MÊS ANTERIOR
  const currentMonth = currentDate.getMonth() + 1;
  const currentYearForComparison = currentDate.getFullYear();
  
  // Calcular mês anterior
  let previousMonth = currentMonth - 1;
  let previousYear = currentYearForComparison;
  if (previousMonth === 0) {
    previousMonth = 12;
    previousYear = currentYearForComparison - 1;
  }

  // Buscar dados do mês atual
  const { data: currentMonthStats } = useDashboardStats(currentMonth, currentYearForComparison);
  
  // Buscar dados do mês anterior
  const { data: previousMonthStats } = useDashboardStats(previousMonth, previousYear);
  
  // 🤖 DADOS DA IA
  const { classifications, getClassificationForOrder } = useAI();
  
  // Dados sempre todos os períodos (sem filtro para tendências)
  const { data: yearTrendStats } = useDashboardStats();

  
  // 📅 FUNÇÕES DOS FILTROS - ANOS DE 2019 ATÉ ATUAL
  const currentYear = new Date().getFullYear();
  const startYear = 2019;
  const years = Array.from({length: currentYear - startYear + 1}, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  // Função para resetar filtros
  const resetFilters = () => {
    setSelectedMonth(null);
    setSelectedYear(null);
  };

  // Função para formatar o título da tabela baseado nos filtros
  const getTableTitle = () => {
    if (selectedMonth && selectedYear) {
      const monthLabel = months.find(m => m.value === selectedMonth)?.label;
      return `Ordens de Serviço - ${monthLabel} de ${selectedYear}`;
    } else if (selectedYear) {
      return `Ordens de Serviço - ${selectedYear}`;
    } else if (selectedMonth) {
      const monthLabel = months.find(m => m.value === selectedMonth)?.label;
      return `Ordens de Serviço - ${monthLabel}`;
    } else {
      return "Ordens de Serviço - Todos os períodos";
    }
  };

  // Carregar dados da IA
  useEffect(() => {
    const loadAIStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
                    return;
        }

        const API_BASE = import.meta.env.VITE_API_URL || 'https://gl-garantias-backend.onrender.com';
        const response = await fetch(`${API_BASE}/api/v1/ai/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 401) {
                    return;
        }

        const data = await response.json();
        if (data.success) {
          setAiStats(data.data);
        }
      } catch (error) {
              }
    };

    loadAIStats();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-apple-gray-50 p-8">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-apple-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-80 bg-white rounded-apple-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-apple-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <p className="text-apple-gray-500">Erro ao carregar dados do dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dados para gráficos
  const statusData = [
    { name: 'Garantia (G)', value: (stats as DashboardStats)?.statusDistribution?.G || 0, color: '#FF3B30' },
    { name: 'Garantia Oficina (GO)', value: (stats as DashboardStats)?.statusDistribution?.GO || 0, color: '#FF9500' },
    { name: 'Garantia Usinagem (GU)', value: (stats as DashboardStats)?.statusDistribution?.GU || 0, color: '#FFCC00' }
  ];

  const yearData = Object.entries((stats as DashboardStats)?.yearDistribution || {}).map(([year, count]) => ({
    year,
    count
  }));
  
  const manufacturerData = (stats as DashboardStats)?.topManufacturers?.slice(0, 5) || [];

  return (
    <div className="space-y-8">
        {/* Tabs de Conteúdo */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="flex justify-center">
            <TabsList className="inline-flex w-auto bg-black rounded-md p-1 mb-6 h-10">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
              >
                Visão Geral
              </TabsTrigger>
              <TabsTrigger 
                value="comparative_analysis" 
                className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
              >
                Análise Comparativa
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <AppleCard
                title="Total de OS"
                value={(stats as DashboardStats)?.totalOrders?.toString() || '0'}
                icon={FileText}
                gradient="blue"
              />
              <AppleCard
                title="Valor Total"
                value={(() => {
                  const totalValue = (stats as DashboardStats)?.financialSummary?.totalValue || 0;
                  if (totalValue >= 1000000) {
                    return `R$ ${(totalValue / 1000000).toFixed(1)}M`;
                  } else if (totalValue >= 1000) {
                    return `R$ ${(totalValue / 1000).toFixed(1)}k`;
                  } else {
                    return `R$ ${totalValue.toLocaleString('pt-BR')}`;
                  }
                })()}
                icon={DollarSign}
                gradient="purple"
                trend={{
                  value: `Prod: R$ ${(() => {
                    const partsTotal = (stats as DashboardStats)?.financialSummary?.partsTotal || 0;
                    if (partsTotal >= 1000000) {
                      return `${(partsTotal / 1000000).toFixed(1)}M`;
                    } else if (partsTotal >= 1000) {
                      return `${(partsTotal / 1000).toFixed(1)}k`;
                    } else {
                      return partsTotal.toLocaleString('pt-BR');
                    }
                  })()} | Serv: R$ ${(() => {
                    const laborTotal = (stats as DashboardStats)?.financialSummary?.laborTotal || 0;
                    if (laborTotal >= 1000000) {
                      return `${(laborTotal / 1000000).toFixed(1)}M`;
                    } else if (laborTotal >= 1000) {
                      return `${(laborTotal / 1000).toFixed(1)}k`;
                    } else {
                      return laborTotal.toLocaleString('pt-BR');
                    }
                  })()}`,
                  isPositive: true,
                }}
              />
              <AppleCard
                title="Mecânicos Ativos"
                value={(stats as DashboardStats)?.mechanicsCount?.toString() || '0'}
                icon={Users}
                gradient="orange"
              />
              <AppleCard
                title="Total de Defeitos"
                value={(stats as DashboardStats)?.defectsCount?.toString() || '0'}
                icon={Wrench}
                gradient="red"
              />
            </div>

            {/* Tabela de Ordens de Serviço */}
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-black shadow-sm">
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold text-foreground">
                      {getTableTitle()}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Lista completa das ordens de serviço
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* 📅 FILTROS DE ANO E MÊS */}
                    <div className="flex items-center gap-2">
                      <Select value={selectedYear?.toString() || ""} onValueChange={(value) => setSelectedYear(value ? parseInt(value) : null)}>
                        <SelectTrigger className="w-20 h-8">
                          <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent side="bottom" align="start">
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={selectedMonth?.toString() || ""} onValueChange={(value) => setSelectedMonth(value ? parseInt(value) : null)}>
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent side="bottom" align="start">
                          {months.map((month) => (
                            <SelectItem key={month.value} value={month.value.toString()}>
                              {month.label.substring(0, 3)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {(selectedMonth || selectedYear) && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={resetFilters}
                          className="h-8 px-2 text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <div className="h-4 w-px bg-gray-300"></div>

                    <button 
                      onClick={() => {
                        // Exportar dados do dashboard para Excel
                        const exportData = formatServiceOrdersForExport((stats as DashboardStats)?.orders || [], classifications);
                        const fileName = selectedMonth || selectedYear 
                          ? `dashboard-${selectedYear || 'todos'}-${selectedMonth ? months.find(m => m.value === selectedMonth)?.label : 'todos-meses'}`
                          : `dashboard-completo`;
                        const success = exportToExcel(exportData, fileName, 'Dashboard');
                        
                        if (success) {
                                                  } else {
                          console.error('❌ Erro ao exportar dados do dashboard para Excel');
                        }
                      }}
                      className="flex items-center gap-2 h-8 px-3 text-sm border rounded hover:bg-gray-100 text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Download className="h-4 w-4" />
                      Exportar Dados
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
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
                        <TableHead className="font-semibold text-foreground">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(stats as DashboardStats)?.orders && Array.isArray((stats as DashboardStats).orders) && (stats as DashboardStats).orders.length > 0 ? (
                        (stats as DashboardStats).orders.map((order, index) => (
                          <TableRow key={order.order_number || index} className="hover:bg-muted/30">
                            <TableCell className="font-medium text-foreground">
                              {order.order_number || `OS-${(index + 1).toString().padStart(4, '0')}`}
                            </TableCell>
                            <TableCell className="text-foreground">
                              {order.order_date ? order.order_date.split('T')[0].split('-').reverse().join('/') : '-'}
                            </TableCell>
                            <TableCell className="text-foreground">
                              {order.engine_manufacturer || '-'}
                            </TableCell>
                            <TableCell className="text-foreground">
                              {order.engine_description || '-'}
                            </TableCell>
                            <TableCell className="text-foreground">
                              {order.vehicle_model || '-'}
                            </TableCell>
                            <TableCell className="text-foreground">
                              <SimpleDefectCard 
                                order={order}
                                classification={order.defect_classifications && order.defect_classifications.length > 0 ? order.defect_classifications[0] : null}
                                className="text-xs"
                              />
                            </TableCell>
                            <TableCell className="text-foreground">
                              {order.responsible_mechanic || '-'}
                            </TableCell>
                            <TableCell className="font-semibold text-foreground">
                              R$ {((order.parts_total || 0) + (order.labor_total || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            Nenhuma ordem de serviço encontrada.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Análise Comparativa */}
          <TabsContent value="comparative_analysis" className="space-y-8 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Distribuição por Status de Garantias"
                description={`Comparação: ${months.find(m => m.value === currentMonth)?.label} ${currentYearForComparison} vs ${months.find(m => m.value === previousMonth)?.label} ${previousYear}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={[
                      { 
                        name: 'G', 
                        atual: (currentMonthStats as DashboardStats)?.statusDistribution?.G || 0,
                        anterior: (previousMonthStats as DashboardStats)?.statusDistribution?.G || 0
                      },
                      { 
                        name: 'GO', 
                        atual: (currentMonthStats as DashboardStats)?.statusDistribution?.GO || 0,
                        anterior: (previousMonthStats as DashboardStats)?.statusDistribution?.GO || 0
                      },
                      { 
                        name: 'GU', 
                        atual: (currentMonthStats as DashboardStats)?.statusDistribution?.GU || 0,
                        anterior: (previousMonthStats as DashboardStats)?.statusDistribution?.GU || 0
                      },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="atual" name={`${months.find(m => m.value === currentMonth)?.label} ${currentYearForComparison}`} fill="#007AFF" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="anterior" name={`${months.find(m => m.value === previousMonth)?.label} ${previousYear}`} fill="#FF9500" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Top 5 Modelos de Motor"
                description={`Comparação: ${months.find(m => m.value === currentMonth)?.label} ${currentYearForComparison} vs ${months.find(m => m.value === previousMonth)?.label} ${previousYear}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={(currentMonthStats as DashboardStats)?.orders ? 
                      Object.entries(
                        (currentMonthStats as DashboardStats).orders.reduce((acc: any, order: any) => {
                          const model = order.engine_description || 'Não informado';
                          acc[model] = (acc[model] || 0) + 1;
                          return acc;
                        }, {})
                      )
                      .sort(([,a]: any, [,b]: any) => b - a)
                      .slice(0, 5)
                      .map(([name, count]) => ({ 
                        name: name.length > 15 ? name.substring(0, 15) + '...' : name, 
                        atual: count,
                        anterior: (previousMonthStats as DashboardStats)?.orders ? 
                          (previousMonthStats as DashboardStats).orders.reduce((acc: number, order: any) => {
                            if (order.engine_description === name) acc += 1;
                            return acc;
                          }, 0) : 0
                      }))
                      : []
                    }
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip formatter={(value: any) => [value, 'Ordens']} contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
                    <Bar dataKey="atual" name={`${months.find(m => m.value === currentMonth)?.label} ${currentYearForComparison}`} fill="#34C759" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="anterior" name={`${months.find(m => m.value === previousMonth)?.label} ${previousYear}`} fill="#FF3B30" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Mecânicos Mais Ativos"
                description={`Comparação: ${months.find(m => m.value === currentMonth)?.label} ${currentYearForComparison} vs ${months.find(m => m.value === previousMonth)?.label} ${previousYear}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(currentMonthStats as DashboardStats)?.orders ? 
                      Object.entries(
                        (currentMonthStats as DashboardStats).orders.reduce((acc: any, order: any) => {
                          const mechanic = order.responsible_mechanic || 'Não informado';
                          acc[mechanic] = (acc[mechanic] || 0) + 1;
                          return acc;
                        }, {})
                      )
                      .filter(([name]) => name !== 'TESTE' && name !== 'Não informado')
                      .sort(([,a]: any, [,b]: any) => b - a)
                      .slice(0, 5)
                      .map(([name, count]) => ({ 
                        name: name.length > 12 ? name.substring(0, 12) + '...' : name, 
                        atual: count,
                        anterior: (previousMonthStats as DashboardStats)?.orders ? 
                          (previousMonthStats as DashboardStats).orders.reduce((acc: number, order: any) => {
                            if (order.responsible_mechanic === name) acc += 1;
                            return acc;
                          }, 0) : 0
                      }))
                      : []
                    }
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip formatter={(value: any) => [value, 'OS Atendidas']} contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
                    <Bar dataKey="atual" name={`${months.find(m => m.value === currentMonth)?.label} ${currentYearForComparison}`} fill="#FF9500" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="anterior" name={`${months.find(m => m.value === previousMonth)?.label} ${previousYear}`} fill="#FF3B30" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Principais Tipos de Defeitos"
                description={`Comparação: ${months.find(m => m.value === currentMonth)?.label} ${currentYearForComparison} vs ${months.find(m => m.value === previousMonth)?.label} ${previousYear}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(currentMonthStats as DashboardStats)?.orders ? 
                      Object.entries(
                        (currentMonthStats as DashboardStats).orders.reduce((acc: any, order: any) => {
                          // 🤖 USAR CLASSIFICAÇÃO DA IA OU FALLBACK
                          const classification = classifications.find(c => c.service_order_id === (order as any).id);
                          let defectCategory;
                          
                          if (classification && classification.defect_categories) {
                            // Usar categoria da IA
                            defectCategory = classification.defect_categories.category_name;
                          } else {
                            // Fallback para classificação manual (antigo sistema)
                            let defect = order.raw_defect_description;
                            if (!defect || defect === 'null' || defect.trim() === '') {
                              defectCategory = 'Não Classificado';
                            } else {
                              defect = defect.toUpperCase();
                              if (defect.includes('VAZAMENTO')) defectCategory = 'Vazamentos';
                              else if (defect.includes('BARULHO')) defectCategory = 'Ruídos Anômalos';
                              else if (defect.includes('QUEBROU') || defect.includes('QUEBR') || defect.includes('DANIFIC')) defectCategory = 'Desgaste de Componentes';
                              else if (defect.includes('AQUEC') || defect.includes('ESQUENT')) defectCategory = 'Superaquecimento';
                              else if (defect.includes('OLEO') || defect.includes('ÓLEO')) defectCategory = 'Vazamentos';
                              else if (defect.includes('FALH') || defect.includes('FALHANDO') || defect.includes('NÃO PEGA')) defectCategory = 'Falhas Elétricas';
                              else defectCategory = 'Não Classificado';
                            }
                          }
                          
                          acc[defectCategory] = (acc[defectCategory] || 0) + 1;
                          return acc;
                        }, {})
                      )
                      .sort(([,a]: any, [,b]: any) => b - a)
                      .slice(0, 5)
                      .map(([name, count]) => ({ 
                        name, 
                        atual: count,
                        anterior: (previousMonthStats as DashboardStats)?.orders ? 
                          (previousMonthStats as DashboardStats).orders.reduce((acc: number, order: any) => {
                            // 🤖 USAR CLASSIFICAÇÃO DA IA OU FALLBACK
                            const classification = classifications.find(c => c.service_order_id === (order as any).id);
                            let defectCategory;
                            
                            if (classification && classification.defect_categories) {
                              defectCategory = classification.defect_categories.category_name;
                            } else {
                              let defect = order.raw_defect_description;
                              if (!defect || defect === 'null' || defect.trim() === '') {
                                defectCategory = 'Não Classificado';
                              } else {
                                defect = defect.toUpperCase();
                                if (defect.includes('VAZAMENTO')) defectCategory = 'Vazamentos';
                                else if (defect.includes('BARULHO')) defectCategory = 'Ruídos Anômalos';
                                else if (defect.includes('QUEBROU') || defect.includes('QUEBR') || defect.includes('DANIFIC')) defectCategory = 'Desgaste de Componentes';
                                else if (defect.includes('AQUEC') || defect.includes('ESQUENT')) defectCategory = 'Superaquecimento';
                                else if (defect.includes('OLEO') || defect.includes('ÓLEO')) defectCategory = 'Vazamentos';
                                else if (defect.includes('FALH') || defect.includes('FALHANDO') || defect.includes('NÃO PEGA')) defectCategory = 'Falhas Elétricas';
                                else defectCategory = 'Não Classificado';
                              }
                            }
                            
                            if (defectCategory === name) acc += 1;
                            return acc;
                          }, 0) : 0
                      }))
                      : []
                    }
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip formatter={(value: any) => [value, 'Ocorrências']} contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
                    <Bar dataKey="atual" name={`${months.find(m => m.value === currentMonth)?.label} ${currentYearForComparison}`} fill="#FF3B30" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="anterior" name={`${months.find(m => m.value === previousMonth)?.label} ${previousYear}`} fill="#FF9500" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Resumo Estatístico Geral */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Resumo Estatístico Comparativo
                </CardTitle>
                <CardDescription className="mt-1">
                  Comparativo: {months.find(m => m.value === currentMonth)?.label} {currentYearForComparison} vs {months.find(m => m.value === previousMonth)?.label} {previousYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Métrica</TableHead>
                      <TableHead className="text-right font-semibold">
                        {months.find(m => m.value === currentMonth)?.label} {currentYearForComparison}
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        {months.find(m => m.value === previousMonth)?.label} {previousYear}
                      </TableHead>
                      <TableHead className="text-right font-semibold">Variação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        metric: 'Total de Ordens de Serviço',
                        current: (currentMonthStats as DashboardStats)?.totalOrders || 0,
                        previous: (previousMonthStats as DashboardStats)?.totalOrders || 0,
                        isImprovement: (current, previous) => current > previous,
                        format: (value) => value.toLocaleString('pt-BR'),
                      },
                      {
                        metric: 'Valor Financeiro Total',
                        current: (currentMonthStats as DashboardStats)?.financialSummary?.totalValue || 0,
                        previous: (previousMonthStats as DashboardStats)?.financialSummary?.totalValue || 0,
                        isImprovement: (current, previous) => current > previous,
                        format: (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      },
                      {
                        metric: 'Valor Médio por OS',
                        current: (currentMonthStats as DashboardStats)?.financialSummary?.averageValue || 0,
                        previous: (previousMonthStats as DashboardStats)?.financialSummary?.averageValue || 0,
                        isImprovement: (current, previous) => current > previous,
                        format: (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      },
                      {
                        metric: 'Total de Garantias (G+GO+GU)',
                        current: ((currentMonthStats as DashboardStats)?.statusDistribution?.G || 0) + ((currentMonthStats as DashboardStats)?.statusDistribution?.GO || 0) + ((currentMonthStats as DashboardStats)?.statusDistribution?.GU || 0),
                        previous: ((previousMonthStats as DashboardStats)?.statusDistribution?.G || 0) + ((previousMonthStats as DashboardStats)?.statusDistribution?.GO || 0) + ((previousMonthStats as DashboardStats)?.statusDistribution?.GU || 0),
                        isImprovement: (current, previous) => current < previous,
                        format: (value) => value.toLocaleString('pt-BR'),
                      },
                      {
                        metric: 'Taxa de Garantia',
                        current: (currentMonthStats as DashboardStats)?.totalOrders && (currentMonthStats as DashboardStats).totalOrders > 0 ? ((((currentMonthStats as DashboardStats)?.statusDistribution?.G || 0) + ((currentMonthStats as DashboardStats)?.statusDistribution?.GO || 0) + ((currentMonthStats as DashboardStats)?.statusDistribution?.GU || 0)) / (currentMonthStats as DashboardStats).totalOrders) * 100 : 0,
                        previous: (previousMonthStats as DashboardStats)?.totalOrders && (previousMonthStats as DashboardStats).totalOrders > 0 ? ((((previousMonthStats as DashboardStats)?.statusDistribution?.G || 0) + ((previousMonthStats as DashboardStats)?.statusDistribution?.GO || 0) + ((previousMonthStats as DashboardStats)?.statusDistribution?.GU || 0)) / (previousMonthStats as DashboardStats).totalOrders) * 100 : 0,
                        isImprovement: (current, previous) => current < previous,
                        format: (value) => `${value.toFixed(1)}%`,
                      },
                      {
                        metric: 'Mecânicos Ativos',
                        current: (currentMonthStats as DashboardStats)?.mechanicsCount || 0,
                        previous: (previousMonthStats as DashboardStats)?.mechanicsCount || 0,
                        isImprovement: (current, previous) => current > previous, // More mechanics can be good
                        format: (value) => value.toLocaleString('pt-BR'),
                      },
                      {
                        metric: 'Total de Tipos de Defeitos',
                        current: (currentMonthStats as DashboardStats)?.defectsCount || 0,
                        previous: (previousMonthStats as DashboardStats)?.defectsCount || 0,
                        isImprovement: (current, previous) => current < previous,
                        format: (value) => value.toLocaleString('pt-BR'),
                      },
                    ].map(({ metric, current, previous, isImprovement, format }) => {
                      const variation = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;
                      const improved = isImprovement(current, previous);

                      return (
                        <TableRow key={metric}>
                          <TableCell className="font-medium">{metric}</TableCell>
                          <TableCell className="text-right">{format(current)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{format(previous)}</TableCell>
                          <TableCell className={`text-right font-bold ${variation === 0 ? 'text-gray-500' : improved ? 'text-green-600' : 'text-red-600'}`}>
                            <div className="flex items-center justify-end gap-2">
                              <span>{variation > 0 ? '+' : ''}{variation.toFixed(1)}%</span>
                              {variation !== 0 && (improved ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />)}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
};

export default Dashboard;