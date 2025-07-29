import axios from 'axios';

const API_BASE_URL = 'http://localhost:3006';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

export interface ServiceOrder {
  id: number;
  order_number: string;
  order_date: string;
  engine_manufacturer: string;
  engine_description: string;
  vehicle_model: string;
  raw_defect_description: string;
  responsible_mechanic: string;
  parts_total: number;
  labor_total: number;
  grand_total: number;
  order_status: 'G' | 'GO' | 'GU';
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalOrders: number;
  statusDistribution: {
    G: number;
    GO: number;
    GU: number;
  };
  yearDistribution: Record<string, number>;
  topManufacturers: Array<{
    name: string;
    count: number;
  }>;
  financialSummary: {
    totalValue: number;
    averageValue: number;
    partsTotal: number;
    laborTotal: number;
  };
  monthlyTrend: Array<{
    month: string;
    count: number;
    value: number;
  }>;
  mechanicsCount: number;
  defectsCount: number;
  orders: Array<{
    order_number: string;
    engine_manufacturer: string;
    engine_description: string;
    vehicle_model: string;
    raw_defect_description: string;
    responsible_mechanic: string;
    parts_total: number;
    labor_total: number;
    original_parts_value: number;
    order_date: string;
  }>;
}

export interface ServiceOrdersResponse {
  data: ServiceOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const apiService = {
  // Buscar estatísticas do dashboard
  async getStats(month?: number, year?: number): Promise<DashboardStats> {
    try {
      const params: any = {};
      if (month) params.month = month;
      if (year) params.year = year;
      
      console.log("🚀 apiService.getStats chamado");
      console.log("📝 Parâmetros:", params);
      console.log("🔗 URL completa:", `${API_BASE_URL}/api/v1/stats`);
      
      console.log("🌐 Fazendo requisição axios...");
      const response = await api.get('/api/v1/stats', { params });
      console.log("📡 Resposta recebida:", response.status, response.statusText);
      console.log("📦 Total Orders na resposta:", response.data?.totalOrders);
      console.log("📦 Orders array length:", response.data?.orders?.length);
      console.log("📦 Primeiros 3 orders:", response.data?.orders?.slice(0, 3));
      const data = response.data;
      
      // Garantir que todos os campos necessários existam
      return {
        totalOrders: data.totalOrders || 0,
        statusDistribution: data.statusDistribution || { G: 0, GO: 0, GU: 0 },
        yearDistribution: data.yearDistribution || {},
        topManufacturers: data.topManufacturers || [],
        financialSummary: data.financialSummary || {
          totalValue: 0,
          averageValue: 0,
          partsTotal: 0,
          laborTotal: 0
        },
        monthlyTrend: data.monthlyTrend || [],
        mechanicsCount: data.mechanicsCount || 0,
        defectsCount: data.defectsCount || 0,
        orders: data.orders || []
      };
    } catch (error) {
      console.error('❌ ERRO CRÍTICO ao buscar estatísticas:', error);
      console.error('❌ Tipo do erro:', typeof error);
      console.error('❌ Mensagem:', error?.message);
      console.error('❌ Status:', error?.response?.status);
      console.error('❌ URL tentada:', `${API_BASE_URL}/api/v1/stats`);
      // Retorna dados padrão em caso de erro
      return {
        totalOrders: 0,
        statusDistribution: { G: 0, GO: 0, GU: 0 },
        yearDistribution: {},
        topManufacturers: [],
        financialSummary: {
          totalValue: 0,
          averageValue: 0,
          partsTotal: 0,
          laborTotal: 0
        },
        monthlyTrend: [],
        mechanicsCount: 0,
        defectsCount: 0,
        orders: []
      };
    }
  },

  // Buscar ordens de serviço com paginação
  async getServiceOrders(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}): Promise<ServiceOrdersResponse> {
    try {
      const response = await api.get('/api/v1/service-orders', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar ordens de serviço:', error);
      // Retorna dados mock em caso de erro
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        }
      };
    }
  },

  // Upload de arquivo Excel
  async uploadExcel(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/api/v1/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro no upload:', error);
      throw error;
    }
  },

  // Verificar saúde da API
  async healthCheck(): Promise<boolean> {
    try {
      const response = await api.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('API não está disponível:', error);
      return false;
    }
  }
};

export default apiService;

