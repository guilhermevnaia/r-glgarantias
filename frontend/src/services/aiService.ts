// Serviço para integração com a IA de classificação de defeitos

interface DefectClassification {
  id: number;
  service_order_id: number;
  original_defect_description: string;
  category_id: number;
  ai_confidence: number;
  ai_reasoning: string;
  alternative_categories: number[];
  is_reviewed: boolean;
  created_at: string;
  defect_categories?: {
    category_name: string;
    color_hex: string;
    icon: string;
  };
}

interface AIStats {
  categories: Array<{
    category_name: string;
    total_occurrences: number;
    color_hex: string;
    icon: string;
  }>;
  totalClassified: number;
  totalDefects: number;
  classificationRate: number;
}

class AIService {
  private baseUrl = '/api/v1/ai';
  private classificationsCache = new Map<number, DefectClassification>();
  private lastCacheUpdate = 0;
  private cacheExpiry = 60000; // 1 minuto para atualização mais rápida do novo sistema
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Obtém headers de autenticação
   */
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Inicialização do cache na primeira chamada
   */
  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;
    
    if (!this.initializationPromise) {
      this.initializationPromise = this.refreshClassifications();
    }
    
    await this.initializationPromise;
    this.isInitialized = true;
  }

  /**
   * Busca classificações do cache ou servidor
   */
  async getClassifications(): Promise<DefectClassification[]> {
    await this.ensureInitialized();
    
    const now = Date.now();
    
    // Se cache expirou, recarregar
    if (now - this.lastCacheUpdate > this.cacheExpiry) {
      await this.refreshClassifications();
    }
    
    return Array.from(this.classificationsCache.values());
  }

  /**
   * Recarrega classificações do servidor
   */
  private async refreshClassifications(): Promise<void> {
    try {
            
      const response = await fetch(`${this.baseUrl}/classifications?limit=10000`, {
        headers: this.getAuthHeaders()
      });
      
      if (response.status === 401) {
                // Tentar sem autenticação em desenvolvimento
        const fallbackResponse = await fetch(`${this.baseUrl}/classifications?limit=10000`, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.success && fallbackData.data) {
            this.populateCache(fallbackData.data);
            return;
          }
        }
        return;
      }
      
      if (!response.ok) {
        console.error(`❌ Erro HTTP ${response.status}: ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
            
      if (data.success && data.data) {
        this.populateCache(data.data);
      } else {
              }
    } catch (error) {
      console.error('❌ Erro crítico ao carregar classificações da IA:', error);
    }
  }
  
  /**
   * Popula o cache com as classificações
   */
  private populateCache(classifications: DefectClassification[]): void {
    // Limpar cache e repovoar
    this.classificationsCache.clear();
    
    classifications.forEach((classification: DefectClassification) => {
      if (classification.service_order_id && classification.id) {
        this.classificationsCache.set(classification.service_order_id, classification);
      }
    });
    
    this.lastCacheUpdate = Date.now();
        
    // Log das primeiras 3 para debug
    const sample = classifications.slice(0, 3);
    console.log('🔍 Sample classifications cached:', sample);
  }

  /**
   * Obtém classificação para uma service order específica
   */
  async getClassificationForOrder(serviceOrderId: number): Promise<DefectClassification | null> {
    await this.ensureInitialized();
    
    const classification = this.classificationsCache.get(serviceOrderId);
    
    if (!classification) {
                  
      // Se não encontrou, force um refresh e tente novamente
      if (this.classificationsCache.size === 0) {
                await this.refreshClassifications();
        return this.classificationsCache.get(serviceOrderId) || null;
      }
    } else {
          }
    
    return classification || null;
  }

  /**
   * Obtém estatísticas da IA
   */
  async getStats(): Promise<AIStats | null> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`, {
        headers: this.getAuthHeaders()
      });
      
      if (response.status === 401) {
                return null;
      }
      
      const data = await response.json();
      
      return data.success ? data.data : null;
    } catch (error) {
            return null;
    }
  }

  /**
   * Obtém categoria por ID
   */
  async getCategory(categoryId: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/categories`, {
        headers: this.getAuthHeaders()
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data.find((cat: any) => cat.id === categoryId);
      }
    } catch (error) {
          }
    return null;
  }

  /**
   * Função utilitária para formatar defeito com IA (async para garantir inicialização)
   */
  async getDisplayDefect(order: any): Promise<{
    text: string;
    isClassified: boolean;
    category?: string;
    confidence?: number;
    color?: string;
  }> {
    await this.ensureInitialized();
    
    const classification = await this.getClassificationForOrder(order.id);
    
    if (classification && classification.defect_categories) {
      return {
        text: classification.defect_categories.category_name,
        isClassified: true,
        category: classification.defect_categories.category_name,
        confidence: classification.ai_confidence,
        color: classification.defect_categories.color_hex
      };
    }
    
    // Fallback para defeito bruto
    return {
      text: order.raw_defect_description || 'Não informado',
      isClassified: false
    };
  }

  /**
   * Força atualização do cache
   */
  async forceRefresh(): Promise<void> {
        this.lastCacheUpdate = 0;
    this.isInitialized = false;
    this.initializationPromise = null;
    await this.refreshClassifications();
    this.isInitialized = true;
  }
  
  /**
   * Obtém estatísticas do cache para debug
   */
  getCacheStats(): { size: number; lastUpdate: number; isInitialized: boolean } {
    return {
      size: this.classificationsCache.size,
      lastUpdate: this.lastCacheUpdate,
      isInitialized: this.isInitialized
    };
  }
}

// Singleton instance
export const aiService = new AIService();
export type { DefectClassification, AIStats };