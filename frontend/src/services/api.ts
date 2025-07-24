import axios from 'axios';

const API_BASE_URL = 'https://3006-ik6dp2fvn7ehl2ikq25i9-33e278d5.manusvm.computer';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await api.get('/api/v1/stats');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      // Retorna dados mock em caso de erro
      return {
        totalOrders: 2519,
        statusDistribution: { G: 2268, GO: 191, GU: 60 },
        yearDistribution: {
          '2019': 405,
          '2020': 457,
          '2021': 388,
          '2022': 325,
          '2023': 378,
          '2024': 346,
          '2025': 220
        },
        topManufacturers: [
          { name: 'MWM', count: 173 },
          { name: 'Mercedes-Benz', count: 153 },
          { name: 'Cummins', count: 151 },
          { name: 'Perkins', count: 75 },
          { name: 'Volkswagen', count: 56 }
        ],
        financialSummary: {
          totalValue: 2847392.50,
          averageValue: 1130.00,
          partsTotal: 1423696.25,
          laborTotal: 1423696.25
        },
        monthlyTrend: [
          { month: 'Jan', count: 210, value: 237300 },
          { month: 'Fev', count: 195, value: 220350 },
          { month: 'Mar', count: 225, value: 254250 },
          { month: 'Abr', count: 180, value: 203400 },
          { month: 'Mai', count: 240, value: 271200 },
          { month: 'Jun', count: 205, value: 231650 }
        ]
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

