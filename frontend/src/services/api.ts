import axios from 'axios';

const API_BASE_URL = 'http://localhost:3010';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for large files
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

// Interceptor para adicionar token de autenticação automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user');
      window.location.href = '/';
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
    month?: number;
    year?: number;
    manufacturer?: string;
    mechanic?: string;
    model?: string;
  } = {}): Promise<ServiceOrdersResponse> {
    try {
      console.log('🔄 apiService.getServiceOrders chamado com parâmetros:', params);
      const response = await api.get('/api/v1/service-orders', { params });
      console.log('✅ Resposta recebida:', response.data.pagination);
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
      
      // 🏆 USAR SISTEMA DEFINITIVO PYTHON v2
      const response = await api.post('/api/v2/upload', formData, {
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
    console.log('🔍 apiService.checkDataIntegrity chamado');
    
    try {
      const response = await api.post('/api/v1/integrity/check/complete');
      console.log('✅ Verificação de integridade concluída:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao verificar integridade:', error);
      throw error;
    }
  },

  async getIntegrityHealth(): Promise<any> {
    console.log('💚 apiService.getIntegrityHealth chamado');
    
    try {
      const response = await api.get('/api/v1/integrity/health');
      console.log('✅ Status de integridade recebido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar status de integridade:', error);
      throw error;
    }
  },

  async getIntegrityLogs(limit: number = 50): Promise<any[]> {
    console.log('📋 apiService.getIntegrityLogs chamado');
    
    try {
      const response = await api.get(`/api/v1/integrity/logs?limit=${limit}`);
      console.log('✅ Logs de integridade recebidos:', response.data);
      return response.data.data?.logs || [];
    } catch (error) {
      console.error('❌ Erro ao buscar logs de integridade:', error);
      throw error;
    }
  },

  // Atualizar ordem de serviço
  async updateServiceOrder(id: number, updateData: Partial<ServiceOrder>): Promise<ServiceOrder> {
    console.log('🔄 apiService.updateServiceOrder chamado');
    console.log('📝 ID:', id, 'Dados:', updateData);
    
    try {
      const response = await api.put(`/api/v1/service-orders/${id}`, updateData);
      console.log('✅ OS atualizada:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar OS:', error);
      throw error;
    }
  },

  // === MÉTODOS DE MECÂNICOS ===
  
  // Buscar todos os mecânicos
  async getMechanics(): Promise<Mechanic[]> {
    console.log('👨‍🔧 apiService.getMechanics chamado');
    
    try {
      const response = await api.get('/api/v1/mechanics');
      console.log('✅ Mecânicos recebidos:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar mecânicos:', error);
      throw error;
    }
  },

  // Adicionar novo mecânico
  async addMechanic(mechanicData: { name: string; email?: string }): Promise<Mechanic> {
    console.log('➕ apiService.addMechanic chamado:', mechanicData);
    
    try {
      const response = await api.post('/api/v1/mechanics', mechanicData);
      console.log('✅ Mecânico adicionado:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erro ao adicionar mecânico:', error);
      throw error;
    }
  },

  // Atualizar mecânico
  async updateMechanic(id: number, updateData: Partial<Mechanic>): Promise<Mechanic> {
    console.log('🔄 apiService.updateMechanic chamado:', id, updateData);
    
    try {
      const response = await api.put(`/api/v1/mechanics/${id}`, updateData);
      console.log('✅ Mecânico atualizado:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar mecânico:', error);
      throw error;
    }
  },

  // Remover mecânico
  async removeMechanic(id: number): Promise<void> {
    console.log('🗑️ apiService.removeMechanic chamado:', id);
    
    try {
      await api.delete(`/api/v1/mechanics/${id}`);
      console.log('✅ Mecânico removido');
    } catch (error) {
      console.error('❌ Erro ao remover mecânico:', error);
      throw error;
    }
  },

  // === MÉTODOS DE USUÁRIOS ===
  
  // Buscar todos os usuários
  async getUsers(): Promise<User[]> {
    console.log('👥 apiService.getUsers chamado');
    
    try {
      const response = await api.get('/api/v1/users');
      console.log('✅ Usuários recebidos:', response.data);
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
      
      console.log('🎭 Retornando usuários mock:', mockUsers);
      return mockUsers;
    }
  },

  // Adicionar novo usuário
  async addUser(userData: { name: string; email: string; role: 'admin' | 'user' }): Promise<User> {
    console.log('➕ apiService.addUser chamado:', userData);
    
    try {
      const response = await api.post('/api/v1/users', userData);
      console.log('✅ Usuário adicionado:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erro ao adicionar usuário:', error);
      throw error;
    }
  },

  // Atualizar usuário
  async updateUser(id: number, updateData: Partial<User>): Promise<User> {
    console.log('🔄 apiService.updateUser chamado:', id, updateData);
    
    try {
      const response = await api.put(`/api/v1/users/${id}`, updateData);
      console.log('✅ Usuário atualizado:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      throw error;
    }
  },

  // Remover usuário
  async removeUser(id: number): Promise<void> {
    console.log('🗑️ apiService.removeUser chamado:', id);
    
    try {
      await api.delete(`/api/v1/users/${id}`);
      console.log('✅ Usuário removido');
    } catch (error) {
      console.error('❌ Erro ao remover usuário:', error);
      throw error;
    }
  },

  // === MÉTODOS DE PROTEÇÃO DE DADOS EDITADOS ===
  
  // Buscar relatório de dados editados
  async getEditedDataReport(): Promise<any> {
    console.log('📊 apiService.getEditedDataReport chamado');
    
    try {
      const response = await api.get('/api/v2/edited-data-report');
      console.log('✅ Relatório de dados editados recebido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar relatório de dados editados:', error);
      throw error;
    }
  },

  // Resetar proteção de uma ordem específica
  async resetOrderProtection(orderNumber: string): Promise<any> {
    console.log('🔓 apiService.resetOrderProtection chamado:', orderNumber);
    
    try {
      const response = await api.post(`/api/v2/reset-protection/${orderNumber}`);
      console.log('✅ Proteção resetada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao resetar proteção:', error);
      throw error;
    }
  }
};

export default apiService;

