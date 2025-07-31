import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService, ServiceOrder, DashboardStats } from '@/services/api';

// Chaves de cache globais para React Query
export const QUERY_KEYS = {
  DASHBOARD_STATS: 'dashboard-stats',
  SERVICE_ORDERS: 'service-orders',
  MECHANICS: 'mechanics',
  DEFECTS: 'defects',
  INTEGRITY_STATUS: 'integrity-status'
} as const;

// Hook para buscar e sincronizar dados do dashboard
export const useDashboardStats = (month?: number, year?: number) => {
  return useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD_STATS, month, year],
    queryFn: () => apiService.getStats(month, year),
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
};

// Hook para buscar e sincronizar ordens de serviço
export const useServiceOrders = (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  month?: number;
  year?: number;
  manufacturer?: string;
  mechanic?: string;
  model?: string;
} = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SERVICE_ORDERS, params],
    queryFn: () => apiService.getServiceOrders(params),
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
};

// Hook para invalidar cache e forçar atualização de todas as abas
export const useDataSync = () => {
  const queryClient = useQueryClient();

  const invalidateAllData = () => {
    console.log('🔄 Invalidando cache global - sincronizando todas as abas');
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SERVICE_ORDERS] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MECHANICS] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DEFECTS] });
  };

  const invalidateDashboard = () => {
    console.log('📊 Invalidando cache do dashboard');
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] });
  };

  const invalidateServiceOrders = () => {
    console.log('📋 Invalidando cache das ordens de serviço');
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SERVICE_ORDERS] });
  };

  const refreshAllData = async () => {
    console.log('🔄 Forçando refresh completo de todos os dados');
    await queryClient.refetchQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] });
    await queryClient.refetchQueries({ queryKey: [QUERY_KEYS.SERVICE_ORDERS] });
  };

  return {
    invalidateAllData,
    invalidateDashboard,
    invalidateServiceOrders,
    refreshAllData
  };
};

// Hook para atualizar ordem de serviço com sincronização automática
export const useUpdateServiceOrder = () => {
  const { invalidateAllData } = useDataSync();
  
  const updateServiceOrder = async (id: number, updateData: Partial<ServiceOrder>) => {
    console.log('🔄 Atualizando OS com sincronização automática:', id);
    
    try {
      const result = await apiService.updateServiceOrder(id, updateData);
      
      // Invalidar cache para sincronizar todas as abas
      console.log('✅ OS atualizada - sincronizando dados em todas as abas');
      invalidateAllData();
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao atualizar OS:', error);
      throw error;
    }
  };

  return { updateServiceOrder };
};

// Hook para upload com sincronização automática
export const useUploadWithSync = () => {
  const { invalidateAllData } = useDataSync();
  
  const uploadWithSync = async (file: File) => {
    console.log('🔄 Upload com sincronização automática');
    
    try {
      const result = await apiService.uploadExcel(file);
      
      // Invalidar cache para sincronizar todas as abas
      console.log('✅ Upload concluído - sincronizando dados em todas as abas');
      invalidateAllData();
      
      return result;
    } catch (error) {
      console.error('❌ Erro no upload:', error);
      throw error;
    }
  };

  return { uploadWithSync };
};

// Hook para buscar dados de mecânicos processados
export const useMechanicsData = (month?: number, year?: number) => {
  console.log('🔧 useMechanicsData chamado com:', { month, year });
  
  return useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD_STATS, 'mechanics', month, year],
    queryFn: async () => {
      console.log('📡 Fazendo chamada para API com parâmetros:', { month, year });
      const stats = await apiService.getStats(month, year);
      console.log('📋 Dados recebidos da API:', {
        totalOrders: stats.totalOrders,
        ordersLength: stats.orders?.length,
        firstOrder: stats.orders?.[0]
      });
      const processed = processMechanicsData(stats);
      console.log('🔄 Dados processados:', {
        totalWarranties: processed.totalWarranties,
        mechanicsCount: processed.mechanicsStats.length,
        firstMechanic: processed.mechanicsStats[0]
      });
      return processed;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
};

// Função para processar dados dos mecânicos
const processMechanicsData = (stats: any) => {
  if (!stats.orders || !Array.isArray(stats.orders)) {
    return {
      mechanicsStats: [],
      totalWarranties: 0,
      totalCost: 0,
      averageCost: 0,
      uniqueDefects: 0,
      defectStats: [],
      manufacturerStats: []
    };
  }

  // Agrupar por mecânico
  const mechanicGroups = stats.orders.reduce((acc: any, order: any) => {
    const mechanic = order.responsible_mechanic || 'Não informado';
    
    if (!acc[mechanic]) {
      acc[mechanic] = {
        name: mechanic,
        orders: [],
        totalWarranties: 0,
        totalCost: 0,
        defectTypes: new Set(),
        manufacturers: new Set(),
        models: new Set()
      };
    }
    
    acc[mechanic].orders.push(order);
    acc[mechanic].totalWarranties++;
    acc[mechanic].totalCost += (order.parts_total || 0) + (order.labor_total || 0);
    
    if (order.raw_defect_description) {
      acc[mechanic].defectTypes.add(order.raw_defect_description);
    }
    if (order.engine_manufacturer) {
      acc[mechanic].manufacturers.add(order.engine_manufacturer);
    }
    if (order.engine_description) {
      acc[mechanic].models.add(order.engine_description);
    }
    
    return acc;
  }, {});

  // Converter para array e calcular estatísticas
  const mechanicsStats = Object.values(mechanicGroups)
    .map((mechanic: any) => ({
      ...mechanic,
      avgCostPerWarranty: mechanic.totalWarranties > 0 ? mechanic.totalCost / mechanic.totalWarranties : 0,
      defectTypes: Array.from(mechanic.defectTypes),
      manufacturers: Array.from(mechanic.manufacturers),
      models: Array.from(mechanic.models),
      lastWarranty: mechanic.orders.length > 0 ? 
        mechanic.orders.sort((a: any, b: any) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())[0].order_date :
        null
    }))
    .sort((a: any, b: any) => b.totalWarranties - a.totalWarranties);

  // Estatísticas gerais
  const totalWarranties = mechanicsStats.reduce((sum: number, m: any) => sum + m.totalWarranties, 0);
  const totalCost = mechanicsStats.reduce((sum: number, m: any) => sum + m.totalCost, 0);
  const averageCost = totalWarranties > 0 ? totalCost / totalWarranties : 0;

  // Estatísticas de defeitos
  const defectGroups = stats.orders.reduce((acc: any, order: any) => {
    const defect = order.raw_defect_description || 'Não informado';
    if (!acc[defect]) {
      acc[defect] = { defectType: defect, totalWarranties: 0, totalCost: 0 };
    }
    acc[defect].totalWarranties++;
    acc[defect].totalCost += (order.parts_total || 0) + (order.labor_total || 0);
    return acc;
  }, {});

  const defectStats = Object.values(defectGroups)
    .map((defect: any) => ({
      ...defect,
      avgCost: defect.totalWarranties > 0 ? defect.totalCost / defect.totalWarranties : 0
    }))
    .sort((a: any, b: any) => b.totalWarranties - a.totalWarranties);

  // Estatísticas de fabricantes
  const manufacturerGroups = stats.orders.reduce((acc: any, order: any) => {
    const manufacturer = order.engine_manufacturer || 'Não informado';
    if (!acc[manufacturer]) {
      acc[manufacturer] = { 
        name: manufacturer, 
        totalWarranties: 0, 
        totalCost: 0,
        mechanics: new Set(),
        defectTypes: new Set()
      };
    }
    acc[manufacturer].totalWarranties++;
    acc[manufacturer].totalCost += (order.parts_total || 0) + (order.labor_total || 0);
    acc[manufacturer].mechanics.add(order.responsible_mechanic);
    acc[manufacturer].defectTypes.add(order.raw_defect_description);
    return acc;
  }, {});

  const manufacturerStats = Object.values(manufacturerGroups)
    .map((manufacturer: any) => ({
      ...manufacturer,
      avgCost: manufacturer.totalWarranties > 0 ? manufacturer.totalCost / manufacturer.totalWarranties : 0,
      mechanicsCount: manufacturer.mechanics.size,
      defectTypesCount: manufacturer.defectTypes.size,
      defectTypes: Array.from(manufacturer.defectTypes).filter(Boolean),
      mechanics: Array.from(manufacturer.mechanics).filter(Boolean)
    }))
    .sort((a: any, b: any) => b.totalWarranties - a.totalWarranties);

  const uniqueDefects = new Set(stats.orders.map((order: any) => order.raw_defect_description).filter(Boolean)).size;

  return {
    mechanicsStats,
    totalWarranties,
    totalCost,
    averageCost,
    uniqueDefects,
    defectStats,
    manufacturerStats
  };
};