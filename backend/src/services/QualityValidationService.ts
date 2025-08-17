import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface QualityMetrics {
  classificationId: number;
  serviceOrderId: number;
  confidenceScore: number;
  consistencyScore: number;
  relevanceScore: number;
  overallQualityScore: number;
  issues: string[];
  recommendations: string[];
}

export interface ValidationResult {
  totalAnalyzed: number;
  highQuality: number;
  mediumQuality: number;
  lowQuality: number;
  averageQuality: number;
  flaggedClassifications: QualityMetrics[];
}

export class QualityValidationService {
  private static instance: QualityValidationService;

  private constructor() {}

  public static getInstance(): QualityValidationService {
    if (!QualityValidationService.instance) {
      QualityValidationService.instance = new QualityValidationService();
    }
    return QualityValidationService.instance;
  }

  /**
   * Valida a qualidade de uma classificação específica
   */
  public async validateClassification(classificationId: number): Promise<QualityMetrics | null> {
    try {
      // Buscar classificação com detalhes
      const { data: classification, error } = await supabase
        .from('defect_classifications')
        .select(`
          *,
          defect_categories (
            category_name,
            keywords,
            description
          ),
          service_orders (
            raw_defect_description,
            engine_manufacturer,
            engine_model
          )
        `)
        .eq('id', classificationId)
        .single();

      if (error || !classification) {
        console.error('❌ Classificação não encontrada:', error);
        return null;
      }

      const defectText = classification.service_orders?.raw_defect_description || '';
      const category = classification.defect_categories;
      
      // Calcular métricas de qualidade
      const confidenceScore = this.calculateConfidenceScore(classification.ai_confidence);
      const consistencyScore = await this.calculateConsistencyScore(defectText, category);
      const relevanceScore = this.calculateRelevanceScore(defectText, category);
      
      const overallQualityScore = (confidenceScore + consistencyScore + relevanceScore) / 3;
      
      // Identificar problemas e recomendações
      const issues = this.identifyIssues(classification, defectText, overallQualityScore);
      const recommendations = this.generateRecommendations(issues, overallQualityScore);

      return {
        classificationId,
        serviceOrderId: classification.service_order_id,
        confidenceScore,
        consistencyScore,
        relevanceScore,
        overallQualityScore,
        issues,
        recommendations
      };

    } catch (error) {
      console.error('❌ Erro na validação de qualidade:', error);
      return null;
    }
  }

  /**
   * Executa validação em lote de classificações
   */
  public async validateBatchClassifications(limit: number = 100): Promise<ValidationResult> {
    try {
      console.log(`🔍 Iniciando validação de qualidade em lote (${limit} classificações)...`);

      // Buscar classificações recentes ou com baixa confiança
      const { data: classifications, error } = await supabase
        .from('defect_classifications')
        .select(`
          *,
          defect_categories (
            category_name,
            keywords,
            description
          ),
          service_orders (
            raw_defect_description
          )
        `)
        .or('ai_confidence.lt.0.7,is_reviewed.eq.false')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Erro ao buscar classificações: ${error.message}`);
      }

      const results: QualityMetrics[] = [];
      let totalAnalyzed = 0;
      let highQuality = 0;
      let mediumQuality = 0;
      let lowQuality = 0;
      let qualitySum = 0;

      for (const classification of classifications || []) {
        const metrics = await this.validateClassification(classification.id);
        
        if (metrics) {
          results.push(metrics);
          totalAnalyzed++;
          qualitySum += metrics.overallQualityScore;

          if (metrics.overallQualityScore >= 0.8) {
            highQuality++;
          } else if (metrics.overallQualityScore >= 0.6) {
            mediumQuality++;
          } else {
            lowQuality++;
          }
        }

        // Pausa pequena para não sobrecarregar
        if (totalAnalyzed % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const averageQuality = totalAnalyzed > 0 ? qualitySum / totalAnalyzed : 0;
      const flaggedClassifications = results.filter(r => r.overallQualityScore < 0.6);

      console.log(`✅ Validação concluída: ${totalAnalyzed} analisadas, ${flaggedClassifications.length} flagadas`);

      return {
        totalAnalyzed,
        highQuality,
        mediumQuality,
        lowQuality,
        averageQuality,
        flaggedClassifications
      };

    } catch (error) {
      console.error('❌ Erro na validação em lote:', error);
      throw error;
    }
  }

  /**
   * Calcula score de confiança baseado na confiança da IA
   */
  private calculateConfidenceScore(aiConfidence: number): number {
    // Normalizar confiança da IA (0-1) para score (0-1)
    if (aiConfidence >= 0.9) return 1.0;
    if (aiConfidence >= 0.8) return 0.9;
    if (aiConfidence >= 0.7) return 0.8;
    if (aiConfidence >= 0.6) return 0.7;
    if (aiConfidence >= 0.5) return 0.6;
    return aiConfidence; // Baixa confiança mantém o valor original
  }

  /**
   * Calcula consistência comparando com classificações similares
   */
  private async calculateConsistencyScore(defectText: string, category: any): Promise<number> {
    try {
      // Buscar classificações similares (mesmo texto ou palavras-chave)
      const keywords = category?.keywords || [];
      
      if (keywords.length === 0) return 0.5; // Sem palavras-chave para comparar

      // Contar quantas palavras-chave aparecem no texto
      const normalizedText = defectText.toLowerCase();
      const matchingKeywords = keywords.filter((keyword: string) => 
        normalizedText.includes(keyword.toLowerCase())
      );

      const keywordMatchRatio = matchingKeywords.length / keywords.length;
      
      // Score baseado na proporção de palavras-chave encontradas
      if (keywordMatchRatio >= 0.5) return 1.0;
      if (keywordMatchRatio >= 0.3) return 0.8;
      if (keywordMatchRatio >= 0.1) return 0.6;
      return 0.3; // Poucas palavras-chave encontradas

    } catch (error) {
      console.error('❌ Erro no cálculo de consistência:', error);
      return 0.5;
    }
  }

  /**
   * Calcula relevância baseada na correspondência entre defeito e categoria
   */
  private calculateRelevanceScore(defectText: string, category: any): number {
    if (!defectText || !category) return 0.0;

    const normalizedText = defectText.toLowerCase();
    const categoryName = category.category_name.toLowerCase();
    const description = (category.description || '').toLowerCase();
    const keywords = category.keywords || [];

    let relevanceScore = 0;

    // 1. Correspondência com nome da categoria (peso 0.3)
    if (this.textContainsSimilarWords(normalizedText, categoryName)) {
      relevanceScore += 0.3;
    }

    // 2. Correspondência com descrição (peso 0.2)
    if (description && this.textContainsSimilarWords(normalizedText, description)) {
      relevanceScore += 0.2;
    }

    // 3. Correspondência com palavras-chave (peso 0.5)
    const matchingKeywords = keywords.filter((keyword: string) => 
      normalizedText.includes(keyword.toLowerCase())
    );
    
    if (keywords.length > 0) {
      const keywordScore = matchingKeywords.length / keywords.length;
      relevanceScore += keywordScore * 0.5;
    }

    return Math.min(relevanceScore, 1.0);
  }

  /**
   * Verifica se o texto contém palavras similares
   */
  private textContainsSimilarWords(text: string, reference: string): boolean {
    const textWords = text.split(/\s+/);
    const referenceWords = reference.split(/\s+/);

    return referenceWords.some(refWord => 
      textWords.some(textWord => 
        textWord.includes(refWord) || refWord.includes(textWord)
      )
    );
  }

  /**
   * Identifica problemas na classificação
   */
  private identifyIssues(classification: any, defectText: string, qualityScore: number): string[] {
    const issues: string[] = [];

    // 1. Confiança baixa
    if (classification.ai_confidence < 0.6) {
      issues.push('Confiança da IA muito baixa (<60%)');
    }

    // 2. Texto muito curto
    if (defectText.length < 10) {
      issues.push('Descrição do defeito muito curta');
    }

    // 3. Texto muito genérico
    const genericTerms = ['problema', 'defeito', 'erro', 'falha', 'não funciona'];
    if (genericTerms.some(term => defectText.toLowerCase().includes(term))) {
      issues.push('Descrição muito genérica');
    }

    // 4. Score geral baixo
    if (qualityScore < 0.5) {
      issues.push('Score de qualidade geral muito baixo');
    }

    // 5. Classificação não revisada há muito tempo
    if (!classification.is_reviewed) {
      const createdDate = new Date(classification.created_at);
      const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceCreated > 7) {
        issues.push('Classificação não revisada há mais de 7 dias');
      }
    }

    return issues;
  }

  /**
   * Gera recomendações baseadas nos problemas identificados
   */
  private generateRecommendations(issues: string[], qualityScore: number): string[] {
    const recommendations: string[] = [];

    if (issues.includes('Confiança da IA muito baixa (<60%)')) {
      recommendations.push('Revisar manualmente esta classificação');
      recommendations.push('Considerar treinar a IA com mais exemplos desta categoria');
    }

    if (issues.includes('Descrição do defeito muito curta')) {
      recommendations.push('Solicitar descrição mais detalhada do defeito');
    }

    if (issues.includes('Descrição muito genérica')) {
      recommendations.push('Pedir informações mais específicas sobre o defeito');
    }

    if (qualityScore < 0.5) {
      recommendations.push('Marcar para revisão prioritária');
      recommendations.push('Verificar se a categoria está correta');
    }

    if (issues.includes('Classificação não revisada há mais de 7 dias')) {
      recommendations.push('Priorizar revisão desta classificação');
    }

    // Recomendações gerais
    if (qualityScore >= 0.8) {
      recommendations.push('Classificação de alta qualidade - pode ser aprovada automaticamente');
    } else if (qualityScore >= 0.6) {
      recommendations.push('Classificação de qualidade média - revisar quando possível');
    } else {
      recommendations.push('Classificação de baixa qualidade - requer atenção imediata');
    }

    return recommendations;
  }

  /**
   * Salva métricas de qualidade no banco
   */
  public async saveQualityMetrics(metrics: QualityMetrics): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('classification_quality_metrics')
        .upsert({
          classification_id: metrics.classificationId,
          service_order_id: metrics.serviceOrderId,
          confidence_score: metrics.confidenceScore,
          consistency_score: metrics.consistencyScore,
          relevance_score: metrics.relevanceScore,
          overall_quality_score: metrics.overallQualityScore,
          identified_issues: metrics.issues,
          recommendations: metrics.recommendations,
          analyzed_at: new Date().toISOString()
        }, {
          onConflict: 'classification_id'
        });

      if (error) {
        console.error('❌ Erro ao salvar métricas:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar métricas:', error);
      return false;
    }
  }

  /**
   * Obter estatísticas de qualidade geral
   */
  public async getQualityStats(): Promise<any> {
    try {
      const { data: stats, error } = await supabase
        .from('classification_quality_metrics')
        .select('overall_quality_score, confidence_score, consistency_score, relevance_score');

      if (error) throw error;

      if (!stats || stats.length === 0) {
        return {
          total: 0,
          averageQuality: 0,
          highQuality: 0,
          mediumQuality: 0,
          lowQuality: 0
        };
      }

      const total = stats.length;
      const averageQuality = stats.reduce((sum, s) => sum + s.overall_quality_score, 0) / total;
      
      const highQuality = stats.filter(s => s.overall_quality_score >= 0.8).length;
      const mediumQuality = stats.filter(s => s.overall_quality_score >= 0.6 && s.overall_quality_score < 0.8).length;
      const lowQuality = stats.filter(s => s.overall_quality_score < 0.6).length;

      return {
        total,
        averageQuality,
        highQuality,
        mediumQuality,
        lowQuality,
        highQualityPercentage: (highQuality / total) * 100,
        mediumQualityPercentage: (mediumQuality / total) * 100,
        lowQualityPercentage: (lowQuality / total) * 100
      };

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de qualidade:', error);
      return null;
    }
  }
}