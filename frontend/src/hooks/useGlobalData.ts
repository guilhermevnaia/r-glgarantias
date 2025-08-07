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

// Hook para buscar e sincronizar dados do dashboard - TODOS OS DADOS POR PADRÃO
export const useDashboardStats = (month?: number | null, year?: number | null) => {
  return useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD_STATS, { month, year }],
    queryFn: () => apiService.getStats(month, year), // Com filtros opcionais (null = todos os dados)
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
};

// Hook para buscar e sincronizar ordens de serviço - COM FILTROS DE DATA
export const useServiceOrders = (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  year?: number;
  month?: number;
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

// Hook para buscar dados de mecânicos processados - SEMPRE TODOS OS DADOS
export const useMechanicsData = () => {
  console.log('🔧 Hook useMechanicsData ativado - buscando todos os dados');

  return useQuery({
    // A chave de query agora inclui 'service-orders' para refletir a nova fonte de dados
    queryKey: [QUERY_KEYS.SERVICE_ORDERS, 'mechanics-processing'],
    queryFn: async () => {
      console.log('📡 Iniciando busca completa de Ordens de Serviço para análise de mecânicos...');
      
      const allOrders: ServiceOrder[] = [];
      let page = 1;
      const limit = 1000; // Buscar em lotes grandes para eficiência
      let totalPages = 1;

      // Loop para buscar todas as páginas de dados - SEM FILTROS DE DATA
      while (page <= totalPages) {
        console.log(`📄 Buscando página ${page} de ${totalPages}...`);
        const response = await apiService.getServiceOrders({
          page,
          limit,
          // Removido: month, year - sempre todos os dados
        });

        if (response && response.data && response.data.length > 0) {
          allOrders.push(...response.data);
          totalPages = response.pagination.totalPages;
          page++;
        } else {
          // Se não houver mais dados, interrompe o loop
          break;
        }
      }
      
      console.log(`✅ Busca completa. Total de ${allOrders.length} ordens recebidas.`);
      console.log('📦 Primeiras 3 ordens recebidas:', allOrders.slice(0, 3));

      // Agora, processar os dados completos com a função existente
      console.log('🔄 Processando dados completos dos mecânicos...');
      const processedData = processMechanicsData({ orders: allOrders });
      
      console.log('📊 Processamento concluído:', {
        totalWarranties: processedData.totalWarranties,
        mechanicsCount: processedData.mechanicsStats.length,
        firstMechanic: processedData.mechanicsStats[0]
      });

      return processedData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
};

// Função para processar dados dos mecânicos a partir de uma lista de ordens
const processMechanicsData = (data: { orders: ServiceOrder[] }) => {
  if (!data.orders || !Array.isArray(data.orders)) {
    console.warn('⚠️ processMechanicsData chamado com dados de ordens inválidos.');
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
  const mechanicGroups = data.orders.reduce((acc: any, order: ServiceOrder) => {
    const mechanicName = order.responsible_mechanic || 'Não Informado';
    
    if (!acc[mechanicName]) {
      acc[mechanicName] = {
        name: mechanicName,
        orders: [],
        totalWarranties: 0,
        totalCost: 0,
        defectTypes: new Set<string>(),
        manufacturers: new Set<string>(),
        models: new Set<string>()
      };
    }
    
    const group = acc[mechanicName];
    group.orders.push(order);
    group.totalWarranties++;
    
    // Cálculo de custo para mecânicos - usar parts_total (valor já dividido por 2)
    const partsCost = parseFloat(order.parts_total || 0);
    const laborCost = parseFloat(order.labor_total || 0);
    group.totalCost += partsCost + laborCost;
    
    if (order.raw_defect_description) {
      group.defectTypes.add(order.raw_defect_description);
    }
    if (order.engine_manufacturer) {
      group.manufacturers.add(order.engine_manufacturer);
    }
    if (order.engine_description) {
      group.models.add(order.engine_description);
    }
    
    return acc;
  }, {});

  // Converter para array e calcular estatísticas detalhadas
  const mechanicsStats = Object.values(mechanicGroups)
    .map((mechanic: any) => {
      const sortedOrders = mechanic.orders.sort((a: ServiceOrder, b: ServiceOrder) => 
        new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
      );

      return {
        ...mechanic,
        avgCostPerWarranty: mechanic.totalWarranties > 0 ? mechanic.totalCost / mechanic.totalWarranties : 0,
        defectTypes: Array.from(mechanic.defectTypes),
        manufacturers: Array.from(mechanic.manufacturers),
        models: Array.from(mechanic.models),
        lastWarranty: sortedOrders.length > 0 ? sortedOrders[0].order_date : null,
        orders: sortedOrders // Adiciona as ordens de serviço ao objeto do mecânico
      };
    })
    .sort((a: any, b: any) => b.totalWarranties - a.totalWarranties);

  // Estatísticas gerais
  const totalWarranties = mechanicsStats.reduce((sum: number, m: any) => sum + m.totalWarranties, 0);
  const totalCost = mechanicsStats.reduce((sum: number, m: any) => sum + m.totalCost, 0);
  const averageCost = totalWarranties > 0 ? totalCost / totalWarranties : 0;

  // Estatísticas de defeitos
  const defectGroups = data.orders.reduce((acc: any, order: ServiceOrder) => {
    const defect = order.raw_defect_description || 'Não Informado';
    if (!acc[defect]) {
      acc[defect] = { defectType: defect, totalWarranties: 0, totalCost: 0 };
    }
    acc[defect].totalWarranties++;
    acc[defect].totalCost += parseFloat(order.parts_total || 0) + parseFloat(order.labor_total || 0);
    return acc;
  }, {});

  const defectStats = Object.values(defectGroups)
    .map((defect: any) => ({
      ...defect,
      avgCost: defect.totalWarranties > 0 ? defect.totalCost / defect.totalWarranties : 0
    }))
    .sort((a: any, b: any) => b.totalWarranties - a.totalWarranties);

  // Estatísticas de fabricantes
  const manufacturerGroups = data.orders.reduce((acc: any, order: ServiceOrder) => {
    const manufacturer = order.engine_manufacturer || 'Não Informado';
    if (!acc[manufacturer]) {
      acc[manufacturer] = { 
        name: manufacturer, 
        totalWarranties: 0, 
        totalCost: 0,
        mechanics: new Set<string>(),
        defectTypes: new Set<string>()
      };
    }
    acc[manufacturer].totalWarranties++;
    acc[manufacturer].totalCost += parseFloat(order.parts_total || 0) + parseFloat(order.labor_total || 0);
    if(order.responsible_mechanic) acc[manufacturer].mechanics.add(order.responsible_mechanic);
    if(order.raw_defect_description) acc[manufacturer].defectTypes.add(order.raw_defect_description);
    return acc;
  }, {});

  const manufacturerStats = Object.values(manufacturerGroups)
    .map((mfg: any) => ({
      ...mfg,
      avgCost: mfg.totalWarranties > 0 ? mfg.totalCost / mfg.totalWarranties : 0,
      mechanicsCount: mfg.mechanics.size,
      defectTypesCount: mfg.defectTypes.size,
      defectTypes: Array.from(mfg.defectTypes),
      mechanics: Array.from(mfg.mechanics)
    }))
    .sort((a: any, b: any) => b.totalWarranties - a.totalWarranties);

  const uniqueDefects = new Set(data.orders.map(o => o.raw_defect_description).filter(Boolean)).size;

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