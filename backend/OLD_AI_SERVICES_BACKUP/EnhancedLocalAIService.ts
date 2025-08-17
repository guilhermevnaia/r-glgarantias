import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface DefectClassification {
  original_defect_description: string;
  category_id: number;
  category_name: string;
  ai_confidence: number;
  ai_reasoning: string;
  alternative_categories: number[];
}

export class EnhancedLocalAIService {
  private static instance: EnhancedLocalAIService;
  private categories: any[] = [];

  private constructor() {
    this.loadCategories();
  }

  public static getInstance(): EnhancedLocalAIService {
    if (!EnhancedLocalAIService.instance) {
      EnhancedLocalAIService.instance = new EnhancedLocalAIService();
    }
    return EnhancedLocalAIService.instance;
  }

  /**
   * Carrega categorias do banco de dados
   */
  private async loadCategories(): Promise<void> {
    try {
      const { data: categories, error } = await supabase
        .from('defect_categories')
        .select('*')
        .eq('is_active', true)
        .order('total_occurrences', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar categorias:', error);
        return;
      }

      this.categories = categories || [];
      console.log(`🚀 EnhancedLocalAI: ${this.categories.length} categorias carregadas`);
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error);
    }
  }

  /**
   * Sistema de classificação avançado - ALTAMENTE OTIMIZADO
   */
  public async classifyDefect(defectDescription: string): Promise<DefectClassification | null> {
    try {
      if (!defectDescription || defectDescription.trim().length === 0) {
        return null;
      }

      console.log(`🎯 EnhancedLocalAI: Classificando "${defectDescription}"`);
      
      await this.loadCategories();
      
      const normalizedText = this.normalizeText(defectDescription);
      const categoryScores: { [key: number]: number } = {};

      // Inicializar scores
      for (const category of this.categories) {
        categoryScores[category.id] = 0;
      }

      // ESTRATÉGIA 1: Análise de palavras-chave diretas (peso alto)
      this.analyzeDirectKeywords(normalizedText, categoryScores);

      // ESTRATÉGIA 2: Regras específicas por categoria
      this.applySpecificRules(normalizedText, categoryScores);

      // ESTRATÉGIA 3: Análise de padrões comuns da indústria
      this.applyIndustryPatterns(normalizedText, categoryScores);

      // ESTRATÉGIA 4: Análise semântica e contexto
      this.applyContextualAnalysis(normalizedText, categoryScores);

      // ESTRATÉGIA 5: Fallback inteligente
      const maxScore = Math.max(...Object.values(categoryScores));
      if (maxScore === 0) {
        this.applyIntelligentFallback(normalizedText, categoryScores);
      }

      // Encontrar melhor classificação
      const bestMatch = this.findBestMatch(categoryScores);
      
      if (!bestMatch) {
        return this.createDefaultClassification(defectDescription);
      }

      const confidence = this.calculateConfidence(bestMatch.score, normalizedText);
      
      console.log(`✅ EnhancedLocalAI: "${bestMatch.category.category_name}" (Score: ${bestMatch.score.toFixed(1)}, Confiança: ${(confidence * 100).toFixed(1)}%)`);

      return {
        original_defect_description: defectDescription,
        category_id: bestMatch.category.id,
        category_name: bestMatch.category.category_name,
        ai_confidence: confidence,
        ai_reasoning: `Classificação avançada com múltiplas estratégias. Score: ${bestMatch.score.toFixed(1)}. Análise de padrões, palavras-chave e contexto semântico.`,
        alternative_categories: this.findAlternatives(categoryScores, bestMatch.category.id)
      };

    } catch (error) {
      console.error('❌ Erro na classificação EnhancedLocalAI:', error);
      return null;
    }
  }

  /**
   * Normaliza o texto removendo acentos e caracteres especiais
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[áàâãäå]/g, 'a')
      .replace(/[éèêë]/g, 'e')
      .replace(/[íìîï]/g, 'i')
      .replace(/[óòôõöø]/g, 'o')
      .replace(/[úùûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Análise de palavras-chave diretas
   */
  private analyzeDirectKeywords(text: string, scores: { [key: number]: number }): void {
    for (const category of this.categories) {
      const keywords = category.keywords || [];
      
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          scores[category.id] += 4; // Alto peso para keywords diretas
        }
      }
    }
  }

  /**
   * Regras específicas otimizadas por categoria
   */
  private applySpecificRules(text: string, scores: { [key: number]: number }): void {
    // Mapeamento de padrões avançados
    const categoryPatterns = {
      'Vazamentos': {
        primary: ['vazamento', 'vaza', 'gotej', 'ping', 'escorr', 'oleo', 'agua', 'liquido'],
        secondary: ['retentor', 'junta', 'vedacao', 'selo', 'anel'],
        bonus: ['carter', 'cabecote', 'tampa']
      },
      'Superaquecimento': {
        primary: ['esquent', 'quent', 'temperatura', 'superaque', 'calor', 'fervend'],
        secondary: ['vapor', 'termico', 'resfri', 'radiador', 'ventoinha'],
        bonus: ['termostato', 'bomba', 'agua']
      },
      'Ruídos Anômalos': {
        primary: ['barulh', 'ruido', 'som', 'estalo', 'batid', 'zunid'],
        secondary: ['chiado', 'apito', 'rangend', 'batend', 'vibrac'],
        bonus: ['motor', 'funciona', 'anormal']
      },
      'Problemas Elétricos': {
        primary: ['eletric', 'vela', 'bobina', 'bateria', 'alternador'],
        secondary: ['sensor', 'chicote', 'fio', 'curto', 'circuito'],
        bonus: ['ignicao', 'centelha', 'faísca']
      },
      'Desgaste de Componentes': {
        primary: ['desgast', 'gast', 'desgast', 'worn', 'usado'],
        secondary: ['troca', 'substitui', 'pistao', 'bronzina', 'anel'],
        bonus: ['cilindro', 'valvula', 'sede']
      },
      'Falhas de Ignição': {
        primary: ['nao pega', 'nao liga', 'falha', 'ignicao', 'partida'],
        secondary: ['combustao', 'mistura', 'ar', 'combustivel'],
        bonus: ['arranque', 'motor', 'partida']
      }
    };

    for (const category of this.categories) {
      const patterns = categoryPatterns[category.category_name as keyof typeof categoryPatterns];
      if (!patterns) continue;

      let categoryScore = 0;

      // Padrões primários (peso alto)
      for (const pattern of patterns.primary) {
        if (text.includes(pattern)) {
          categoryScore += 6;
        }
      }

      // Padrões secundários (peso médio)
      for (const pattern of patterns.secondary) {
        if (text.includes(pattern)) {
          categoryScore += 3;
        }
      }

      // Padrões bônus (peso baixo)
      for (const pattern of patterns.bonus) {
        if (text.includes(pattern)) {
          categoryScore += 1;
        }
      }

      scores[category.id] += categoryScore;
    }
  }

  /**
   * Análise de padrões comuns da indústria automotiva
   */
  private applyIndustryPatterns(text: string, scores: { [key: number]: number }): void {
    const industryPatterns = [
      // Padrões de vazamento
      { pattern: /vaz[a-z]*|got[a-z]*|ping[a-z]*|oleo|agua/gi, categories: ['Vazamentos'] },
      
      // Padrões térmicos
      { pattern: /esquent[a-z]*|quent[a-z]*|temperatura|calor/gi, categories: ['Superaquecimento'] },
      
      // Padrões mecânicos
      { pattern: /quebr[a-z]*|rachad[a-z]*|partit[a-z]*|danific[a-z]*/gi, categories: ['Desgaste de Componentes'] },
      
      // Padrões elétricos
      { pattern: /eletric[a-z]*|vela|bobina|bateria|sensor/gi, categories: ['Problemas Elétricos'] },
      
      // Padrões de som
      { pattern: /barulh[a-z]*|ruido|som|estalo|batid[a-z]*/gi, categories: ['Ruídos Anômalos'] },
      
      // Padrões operacionais
      { pattern: /test[a-z]*|verifica[a-z]*|erro|falha/gi, categories: ['Testes e Verificações', 'Erros de Teste'] }
    ];

    for (const patternInfo of industryPatterns) {
      const matches = text.match(patternInfo.pattern);
      if (matches && matches.length > 0) {
        for (const category of this.categories) {
          if (patternInfo.categories.some(cat => category.category_name.includes(cat))) {
            scores[category.id] += matches.length * 2;
          }
        }
      }
    }
  }

  /**
   * Análise contextual e semântica
   */
  private applyContextualAnalysis(text: string, scores: { [key: number]: number }): void {
    const words = text.split(' ');
    const wordCount = words.length;

    // Análise de contexto baseada no comprimento da descrição
    if (wordCount > 10) {
      // Descrições longas geralmente são mais específicas
      for (const category of this.categories) {
        if (scores[category.id] > 0) {
          scores[category.id] += 1; // Bonus para categorias que já têm match
        }
      }
    }

    // Análise de negação (palavras como "não", "sem", "falta")
    const negationWords = ['nao', 'sem', 'falta', 'ausente', 'perdeu'];
    const hasNegation = negationWords.some(word => text.includes(word));
    
    if (hasNegation) {
      // Boost para categorias relacionadas a falhas ou perdas
      for (const category of this.categories) {
        if (category.category_name.includes('Falha') || 
            category.category_name.includes('Perda') ||
            category.category_name.includes('Problema')) {
          scores[category.id] += 2;
        }
      }
    }

    // Análise de intensificadores
    const intensifiers = ['muito', 'bastante', 'excessiv', 'extremament'];
    const hasIntensifier = intensifiers.some(word => text.includes(word));
    
    if (hasIntensifier) {
      // Boost para categorias com problemas sérios
      for (const category of this.categories) {
        if (scores[category.id] > 3) { // Já tem um score bom
          scores[category.id] += 1;
        }
      }
    }
  }

  /**
   * Fallback inteligente quando não encontra correspondências
   */
  private applyIntelligentFallback(text: string, scores: { [key: number]: number }): void {
    console.log('🔄 Aplicando fallback inteligente...');
    
    const words = text.split(' ').filter(word => word.length > 3);
    
    // Classificação baseada em heurísticas
    for (const category of this.categories) {
      let fallbackScore = 0;
      
      // Score base por tamanho do texto
      if (words.length > 5) fallbackScore += 1;
      if (words.length > 10) fallbackScore += 1;
      
      // Boost para categorias mais genéricas (mais prováveis)
      if (category.category_name.includes('Testes') || 
          category.category_name.includes('Verificações') ||
          category.category_name.includes('Problema')) {
        fallbackScore += 3;
      }
      
      // Boost para categorias com mais ocorrências históricas
      if (category.total_occurrences > 0) {
        fallbackScore += Math.log(category.total_occurrences + 1) * 0.5;
      }
      
      scores[category.id] = Math.max(scores[category.id], fallbackScore);
    }
  }

  /**
   * Encontra a melhor correspondência
   */
  private findBestMatch(scores: { [key: number]: number }): { category: any, score: number } | null {
    let bestScore = 0;
    let bestCategory = null;

    for (const category of this.categories) {
      const score = scores[category.id] || 0;
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    if (!bestCategory || bestScore === 0) {
      return null;
    }

    return { category: bestCategory, score: bestScore };
  }

  /**
   * Calcula confiança baseada no score e características do texto
   */
  private calculateConfidence(score: number, text: string): number {
    let confidence = Math.min(score / 15, 0.95); // Normalizar score
    
    // Ajustes baseados no texto
    const wordCount = text.split(' ').length;
    if (wordCount > 8) confidence += 0.05; // Textos longos são mais confiáveis
    if (wordCount < 3) confidence -= 0.1;  // Textos curtos são menos confiáveis
    
    // Mínimo e máximo
    confidence = Math.max(0.2, Math.min(0.98, confidence));
    
    return confidence;
  }

  /**
   * Encontra categorias alternativas
   */
  private findAlternatives(scores: { [key: number]: number }, bestCategoryId: number): number[] {
    return Object.entries(scores)
      .filter(([id, score]) => parseInt(id) !== bestCategoryId && score > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => parseInt(id));
  }

  /**
   * Cria classificação padrão
   */
  private createDefaultClassification(defectDescription: string): DefectClassification {
    const defaultCategory = this.categories.find(cat => 
      cat.category_name.includes('Testes') || 
      cat.category_name.includes('Verificações')
    ) || this.categories[0];

    if (!defaultCategory) {
      return null as any;
    }

    return {
      original_defect_description: defectDescription,
      category_id: defaultCategory.id,
      category_name: defaultCategory.category_name,
      ai_confidence: 0.4,
      ai_reasoning: 'Classificação padrão - aplicada quando o defeito não corresponde a padrões específicos conhecidos.',
      alternative_categories: []
    };
  }

  /**
   * Salva classificação no banco
   */
  public async saveClassification(serviceOrderId: number, classification: DefectClassification): Promise<boolean> {
    try {
      const insertData = {
        service_order_id: serviceOrderId,
        original_defect_description: classification.original_defect_description,
        category_id: classification.category_id,
        ai_confidence: classification.ai_confidence,
        ai_reasoning: classification.ai_reasoning,
        alternative_categories: classification.alternative_categories || [],
        is_reviewed: false
      };

      const { error } = await supabase
        .from('defect_classifications')
        .insert(insertData);

      if (error) {
        console.error('❌ Erro ao salvar:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar classificação:', error);
      return false;
    }
  }

  /**
   * Classificação em massa SUPER OTIMIZADA
   */
  public async classifyAllExistingDefects(): Promise<void> {
    try {
      console.log('🚀 EnhancedLocalAI: Iniciando classificação em massa otimizada...');

      // Buscar defeitos não classificados
      const { data: classifiedIds } = await supabase
        .from('defect_classifications')
        .select('service_order_id');

      const classifiedSet = new Set((classifiedIds || []).map(item => item.service_order_id));

      const { data: allOrders } = await supabase
        .from('service_orders')
        .select('id, raw_defect_description')
        .not('raw_defect_description', 'is', null)
        .not('raw_defect_description', 'eq', '');

      const unclassifiedOrders = (allOrders || []).filter(order => !classifiedSet.has(order.id));
      
      console.log(`📊 ${unclassifiedOrders.length} defeitos para classificar`);

      let processed = 0;
      let successful = 0;
      const batchSize = 10; // Processar em lotes

      for (let i = 0; i < unclassifiedOrders.length; i += batchSize) {
        const batch = unclassifiedOrders.slice(i, i + batchSize);
        
        // Processar lote em paralelo
        const promises = batch.map(async (order) => {
          try {
            const classification = await this.classifyDefect(order.raw_defect_description);
            
            if (classification) {
              const saved = await this.saveClassification(order.id, classification);
              return saved ? 1 : 0;
            }
            return 0;
          } catch (error) {
            console.error(`❌ Erro ao processar OS ${order.id}:`, error);
            return 0;
          }
        });

        const results = await Promise.all(promises);
        successful += results.reduce((sum: number, result: number) => sum + result, 0);
        processed += batch.length;

        console.log(`📈 Progresso: ${processed}/${unclassifiedOrders.length} (${successful} sucessos) - ${((processed / unclassifiedOrders.length) * 100).toFixed(1)}%`);

        // Pausa pequena entre lotes para não sobrecarregar
        if (i + batchSize < unclassifiedOrders.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`🎉 Classificação em massa concluída: ${successful}/${processed} defeitos classificados com sucesso!`);
      
    } catch (error) {
      console.error('❌ Erro na classificação em massa:', error);
    }
  }
}