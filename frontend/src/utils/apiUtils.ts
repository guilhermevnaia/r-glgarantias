/**
 * Utilitários robustos para API com fallbacks e retry
 */

interface RetryOptions {
  maxRetries: number;
  delay: number;
  backoff: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  delay: 1000,
  backoff: 2
};

const API_URLS = [
  import.meta.env.VITE_API_URL || 'https://gl-garantias-backend.onrender.com',
  'https://gl-garantias-backend.onrender.com',
  // Fallback para desenvolvimento
  'http://localhost:3009',
  'http://localhost:3007',
  'http://localhost:3005'
];

/**
 * Testa conectividade com uma URL
 */
async function testConnection(baseUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${baseUrl}/health`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn(`❌ Falha ao conectar com ${baseUrl}:`, error);
    return false;
  }
}

/**
 * Encontra a primeira URL funcionando
 */
export async function findWorkingApiUrl(): Promise<string> {
  console.log('🔍 Procurando URL de API funcionando...');
  
  // Testa URLs em paralelo
  const tests = API_URLS.map(async (url) => {
    const isWorking = await testConnection(url);
    return { url, isWorking };
  });
  
  const results = await Promise.all(tests);
  
  for (const result of results) {
    if (result.isWorking) {
      console.log(`✅ API encontrada em: ${result.url}`);
      return result.url;
    }
  }
  
  // Se nenhuma funcionou, usar a primeira como fallback
  const fallback = API_URLS[0];
  console.warn(`⚠️ Nenhuma API respondeu, usando fallback: ${fallback}`);
  return fallback;
}

/**
 * Wrapper para fetch com retry e fallback automático
 */
export async function robustFetch(
  endpoint: string,
  options: RequestInit = {},
  retryOptions: Partial<RetryOptions> = {}
): Promise<Response> {
  const { maxRetries, delay, backoff } = { ...DEFAULT_RETRY_OPTIONS, ...retryOptions };
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // A cada retry, tenta uma URL diferente
      const baseUrl = await findWorkingApiUrl();
      const url = `${baseUrl}${endpoint}`;
      
      console.log(`🔄 Tentativa ${attempt + 1}/${maxRetries + 1}: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ Sucesso: ${url}`);
        return response;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      lastError = error as Error;
      console.warn(`❌ Tentativa ${attempt + 1} falhou:`, error);
      
      if (attempt < maxRetries) {
        const waitTime = delay * Math.pow(backoff, attempt);
        console.log(`⏳ Aguardando ${waitTime}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error('Todas as tentativas falharam');
}

/**
 * GET com retry robusto
 */
export async function robustGet(endpoint: string, retryOptions?: Partial<RetryOptions>): Promise<any> {
  const response = await robustFetch(endpoint, { method: 'GET' }, retryOptions);
  return response.json();
}

/**
 * POST com retry robusto
 */
export async function robustPost(
  endpoint: string, 
  data?: any, 
  retryOptions?: Partial<RetryOptions>
): Promise<any> {
  const options: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await robustFetch(endpoint, options, retryOptions);
  return response.json();
}

/**
 * Monitor de saúde da API em background
 */
class ApiHealthMonitor {
  private healthStatus = new Map<string, boolean>();
  private lastCheck = 0;
  private checkInterval = 60000; // 1 minuto
  
  async checkHealth(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCheck < this.checkInterval) {
      return;
    }
    
    console.log('🔍 Verificando saúde das APIs...');
    
    const checks = API_URLS.map(async (url) => {
      const isHealthy = await testConnection(url);
      this.healthStatus.set(url, isHealthy);
      return { url, isHealthy };
    });
    
    const results = await Promise.all(checks);
    
    const healthyUrls = results.filter(r => r.isHealthy).length;
    console.log(`💚 APIs saudáveis: ${healthyUrls}/${API_URLS.length}`);
    
    this.lastCheck = now;
  }
  
  getHealthyUrls(): string[] {
    return API_URLS.filter(url => this.healthStatus.get(url) === true);
  }
}

export const apiHealthMonitor = new ApiHealthMonitor();

// Iniciar monitoramento automaticamente
apiHealthMonitor.checkHealth();
setInterval(() => apiHealthMonitor.checkHealth(), 60000);