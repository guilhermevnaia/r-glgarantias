import axios from 'axios';
import type { ServiceOrder, UploadResult } from './types';

// URL do backend (porta 3006 conforme atual)
export const API_BASE_URL = 'http://localhost:3006';

// Configuração do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10 * 60 * 1000, // 10 minutos para uploads grandes
});

export const uploadService = {
  uploadExcel: async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/v1/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  getServiceOrders: async (page = 1, limit = 50): Promise<{ data: ServiceOrder[], total: number }> => {
    const response = await api.get(`/api/v1/service-orders?page=${page}&limit=${limit}`);
    return response.data;
  },

  getUploadLogs: async (): Promise<any[]> => {
    const response = await api.get('/api/v1/upload-logs');
    return response.data;
  },

  getStats: async (): Promise<any> => {
    const response = await api.get('/api/v1/stats');
    return response.data;
  }
};

export default api; 