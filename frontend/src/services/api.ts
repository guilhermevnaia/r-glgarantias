import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3010';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for large files
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Erro no interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('❌ Erro na resposta:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      console.error('🔒 Token expirado ou inválido');
      // Token expirado ou inválido
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user');
      
      // Só redireciona se não estiver já na tela de login
      if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
        console.warn('🔄 Redirecionando para login devido a erro 401');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export interface ServiceOrder {
  id: number;
  order_number: string;
  order_date: string;
  engine_manufacturer: string;
  engine_description: string;
  vehicle_model: string;
  raw_defect_description: string;
  original_defect_description?: string; // ✅ DEFEITO ORIGINAL COMO CHEGA DO EXCEL
  responsible_mechanic: string;
  parts_total: number;
  labor_total: number;
  grand_total: number;
  order_status: 'G' | 'GO' | 'GU';
  created_at: string;
  updated_at: string;
  // ✅ CAMPOS DE PROTEÇÃO DE EDIÇÕES
  manually_edited?: boolean;
  protected_fields?: Record<string, boolean>;
  last_edited_by?: string;
  last_edit_date?: string;
  edit_count?: number;
  // 🤖 CAMPOS DE IA - CLASSIFICAÇÕES DE DEFEITOS
  defect_classifications?: Array<{
    id: number;
    category_id: number;
    ai_confidence: number;
    ai_reasoning?: string;
    original_defect_description?: string; // ✅ DEFEITO ORIGINAL DA CLASSIFICAÇÃO
    defect_categories: {
      category_name: string;
      color_hex: string;
      icon?: string;
    };
  }>;
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

export interface Mechanic {
  id: number;
  name: string;
  email?: string;
  active: boolean;
  totalOrders: number;
  created_at: string;
  updated_at?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  permissions?: string[];
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  last_login?: string;
  login_count?: number;
  email_verified?: boolean;
  // Campos legacy para compatibilidade
  active?: boolean;
}

export const apiService = {
  // Buscar estatísticas do dashboard - COM FILTROS OPCIONAIS
  async getStats(month?: number | null, year?: number | null): Promise<DashboardStats> {
    try {
      const params = new URLSearchParams();
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      const response = await api.get(`/api/v1/stats${queryString}`);
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

  // Buscar ordens de serviço com paginação - COM FILTROS DE DATA
  async getServiceOrders(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    year?: number;
    month?: number;
    manufacturer?: string;
    mechanic?: string;
    model?: string;
  } = {}): Promise<ServiceOrdersResponse> {
    try {
            const response = await api.get('/api/v1/service-orders', { params });
            
      // 🐛 DEBUG: Verificar se classificações estão chegando
      if (response.data.data && response.data.data.length > 0) {
        const firstOrder = response.data.data[0];

      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar ordens de serviço:', error);
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
      
      // 🏆 USAR SISTEMA DEFINITIVO Node.js v1
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
  },

  // Métodos de integridade de dados
  async checkDataIntegrity(): Promise<any> {
        
    try {
      const response = await api.post('/api/v1/integrity/check/complete');
            return response.data;
    } catch (error) {
      console.error('❌ Erro ao verificar integridade:', error);
      throw error;
    }
  },

  async getIntegrityHealth(): Promise<any> {
        
    try {
      const response = await api.get('/api/v1/integrity/health');
            return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar status de integridade:', error);
      throw error;
    }
  },

  async getIntegrityLogs(limit: number = 50): Promise<any[]> {
        
    try {
      const response = await api.get(`/api/v1/integrity/logs?limit=${limit}`);
            return response.data.data?.logs || [];
    } catch (error) {
      console.error('❌ Erro ao buscar logs de integridade:', error);
      throw error;
    }
  },

  // Atualizar ordem de serviço
  async updateServiceOrder(id: number, updateData: Partial<ServiceOrder>): Promise<ServiceOrder> {
            
    try {
      const response = await api.put(`/api/v1/service-orders/${id}`, updateData);
            return response.data.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar OS:', error);
      throw error;
    }
  },

  // === MÉTODOS DE MECÂNICOS ===
  
  // Buscar todos os mecânicos
  async getMechanics(): Promise<Mechanic[]> {
        
    try {
      const response = await api.get('/api/v1/mechanics');
            return response.data.data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar mecânicos:', error);
      throw error;
    }
  },

  // Adicionar novo mecânico
  async addMechanic(mechanicData: { name: string; email?: string }): Promise<Mechanic> {
        
    try {
      const response = await api.post('/api/v1/mechanics', mechanicData);
            return response.data.data;
    } catch (error) {
      console.error('❌ Erro ao adicionar mecânico:', error);
      throw error;
    }
  },

  // Atualizar mecânico
  async updateMechanic(id: number, updateData: Partial<Mechanic>): Promise<Mechanic> {
        
    try {
      const response = await api.put(`/api/v1/mechanics/${id}`, updateData);
            return response.data.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar mecânico:', error);
      throw error;
    }
  },

  // Remover mecânico
  async removeMechanic(id: number): Promise<void> {
        
    try {
      await api.delete(`/api/v1/mechanics/${id}`);
          } catch (error) {
      console.error('❌ Erro ao remover mecânico:', error);
      throw error;
    }
  },

  // === MÉTODOS DE USUÁRIOS ===
  
  // Buscar todos os usuários
  async getUsers(): Promise<User[]> {
        
    try {
      const response = await api.get('/api/v1/users');
            return response.data.data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar usuários (usando dados mock):', error);
      
      // Retornar usuários mock temporariamente
      const mockUsers: User[] = [
        {
          id: 1,
          name: 'Administrador',
          email: 'admin@glgarantias.com',
          role: 'admin',
          permissions: ['*'],
          is_active: true,
          created_at: '2025-08-01T10:00:00Z',
          last_login: '2025-08-01T14:30:00Z',
          login_count: 25,
          email_verified: true
        },
        {
          id: 2,
          name: 'Gerente de Operações',
          email: 'manager@glgarantias.com',
          role: 'manager',
          permissions: ['view_dashboard', 'view_reports', 'manage_service_orders', 'manage_mechanics', 'export_data', 'view_ai_classifications'],
          is_active: true,
          created_at: '2025-08-01T10:15:00Z',
          last_login: '2025-08-01T13:45:00Z',
          login_count: 12,
          email_verified: true
        },
        {
          id: 3,
          name: 'João Silva',
          email: 'user@glgarantias.com',
          role: 'user',
          permissions: ['view_dashboard', 'view_reports', 'view_service_orders'],
          is_active: true,
          created_at: '2025-08-01T10:30:00Z',
          last_login: '2025-08-01T12:20:00Z',
          login_count: 8,
          email_verified: true
        },
        {
          id: 4,
          name: 'Maria Santos',
          email: 'maria@glgarantias.com',
          role: 'user',
          permissions: ['view_dashboard', 'view_reports'],
          is_active: false,
          created_at: '2025-07-28T15:00:00Z',
          last_login: '2025-07-30T09:15:00Z',
          login_count: 3,
          email_verified: true
        },
        {
          id: 5,
          name: 'Carlos Pereira',
          email: 'carlos@glgarantias.com',
          role: 'manager',
          permissions: ['view_dashboard', 'manage_mechanics', 'export_data'],
          is_active: true,
          created_at: '2025-07-25T08:30:00Z',
          email_verified: false
        }
      ];
      
            return mockUsers;
    }
  },

  // Adicionar novo usuário
  async addUser(userData: { name: string; email: string; role: 'admin' | 'manager' | 'user' }): Promise<User> {
        
    try {
      const response = await api.post('/api/v1/users', userData);
            return response.data.data;
    } catch (error) {
      console.error('❌ Erro ao adicionar usuário:', error);
      throw error;
    }
  },

  // Atualizar usuário
  async updateUser(id: number, updateData: Partial<User>): Promise<User> {
        
    try {
      const response = await api.put(`/api/v1/users/${id}`, updateData);
            return response.data.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      throw error;
    }
  },

  // Remover usuário
  async removeUser(id: number): Promise<void> {
        
    try {
      await api.delete(`/api/v1/users/${id}`);
          } catch (error) {
      console.error('❌ Erro ao remover usuário:', error);
      throw error;
    }
  },

  // === MÉTODOS DE PROTEÇÃO DE DADOS EDITADOS ===
  
  // Buscar relatório de dados editados
  async getEditedDataReport(): Promise<any> {
        
    try {
      const response = await api.get('/api/v2/edited-data-report');
            return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar relatório de dados editados:', error);
      throw error;
    }
  },

  // Resetar proteção de uma ordem específica
  async resetOrderProtection(orderNumber: string): Promise<any> {
        
    try {
      const response = await api.post(`/api/v2/reset-protection/${orderNumber}`);
            return response.data;
    } catch (error) {
      console.error('❌ Erro ao resetar proteção:', error);
      throw error;
    }
  }
};

export default apiService;
export { api };

