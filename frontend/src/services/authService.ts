// Serviço para requisições autenticadas
class AuthService {
  private baseURL = 'http://localhost:3009/api/v1';

  private getAuthHeaders() {
    const token = localStorage.getItem('auth-token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async authenticatedFetch(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    // Se receber 401, usuário não está autenticado
    if (response.status === 401) {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user');
      window.location.reload(); // Força recarregar para mostrar tela de login
    }

    return response;
  }

  // Métodos de conveniência
  async get(endpoint: string) {
    return this.authenticatedFetch(endpoint);
  }

  async post(endpoint: string, data: any) {
    return this.authenticatedFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any) {
    return this.authenticatedFetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string) {
    return this.authenticatedFetch(endpoint, {
      method: 'DELETE',
    });
  }
}

export const authService = new AuthService();