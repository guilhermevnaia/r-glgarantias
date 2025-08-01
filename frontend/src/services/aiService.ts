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
  private baseUrl = 'http://localhost:3009/api/v1/ai';
  private classificationsCache = new Map<number, DefectClassification>();
  private lastCacheUpdate = 0;
  private cacheExpiry = 30000; // 30 segundos

  /**
   * Busca classificações do cache ou servidor
   */
  async getClassifications(): Promise<DefectClassification[]> {
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
      const response = await fetch(`${this.baseUrl}/classifications?limit=10000`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // Limpar cache e repovoar
        this.classificationsCache.clear();
        
        data.data.forEach((classification: DefectClassification) => {
          this.classificationsCache.set(classification.service_order_id, classification);
        });
        
        this.lastCacheUpdate = Date.now();
        console.log(`✅ AI Cache atualizado: ${data.data.length} classificações`);
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar classificações da IA:', error);
    }
  }

  /**
   * Obtém classificação para uma service order específica
   */
  async getClassificationForOrder(serviceOrderId: number): Promise<DefectClassification | null> {
    await this.getClassifications(); // Garante cache atualizado
    return this.classificationsCache.get(serviceOrderId) || null;
  }

  /**
   * Obtém estatísticas da IA
   */
  async getStats(): Promise<AIStats | null> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`);
      const data = await response.json();
      
      return data.success ? data.data : null;
    } catch (error) {
      console.warn('⚠️ Erro ao carregar stats da IA:', error);
      return null;
    }
  }

  /**
   * Obtém categoria por ID
   */
  async getCategory(categoryId: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/categories`);
      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data.find((cat: any) => cat.id === categoryId);
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar categoria:', error);
    }
    return null;
  }

  /**
   * Função utilitária para formatar defeito com IA
   */
  getDisplayDefect(order: any): {
    text: string;
    isClassified: boolean;
    category?: string;
    confidence?: number;
    color?: string;
  } {
    const classification = this.classificationsCache.get(order.id);
    
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
    await this.refreshClassifications();
  }
}

// Singleton instance
export const aiService = new AIService();
export type { DefectClassification, AIStats };