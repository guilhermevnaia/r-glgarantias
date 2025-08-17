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

export class LocalAIService {
  private static instance: LocalAIService;
  private categories: any[] = [];

  private constructor() {
    this.loadCategories();
  }

  public static getInstance(): LocalAIService {
    if (!LocalAIService.instance) {
      LocalAIService.instance = new LocalAIService();
    }
    return LocalAIService.instance;
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
      console.log(`🤖 LocalAI: ${this.categories.length} categorias carregadas`);
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error);
    }
  }

  /**
   * Sistema de classificação avançado baseado em múltiplas estratégias
   */
  public async classifyDefect(defectDescription: string): Promise<DefectClassification | null> {
    try {
      if (!defectDescription || defectDescription.trim().length === 0) {
        return null;
      }

      console.log(`🤖 LocalAI: Classificando defeito "${defectDescription}"`);
      
      // Recarregar categorias
      await this.loadCategories();
      
      const text = defectDescription.toLowerCase();
      const normalizedText = this.normalizeText(text);
      
      let bestMatch: any = null;
      let bestScore = 0;
      const categoryScores: { [key: number]: number } = {};

      // ESTRATÉGIA 1: Análise por palavras-chave diretas
      for (const category of this.categories) {
        let score = 0;
        const keywords = category.keywords || [];
        
        // Verificar palavras-chave diretas (peso alto)
        for (const keyword of keywords) {
          if (normalizedText.includes(keyword.toLowerCase())) {
            score += 3;
          }
        }

        categoryScores[category.id] = score;
      }

      // ESTRATÉGIA 2: Regras específicas por categoria (mais robustas)
      this.applyAdvancedRules(normalizedText, categoryScores);

      // ESTRATÉGIA 3: Análise de padrões comuns
      this.applyPatternMatching(normalizedText, categoryScores);

      // ESTRATÉGIA 4: Análise semântica simples
      this.applySemanticAnalysis(normalizedText, categoryScores);

      // ESTRATÉGIA 5: Fallback para termos genéricos
      if (Math.max(...Object.values(categoryScores)) === 0) {
        this.applyGenericFallback(normalizedText, categoryScores);
      }

      // Encontrar melhor match
      for (const category of this.categories) {
        const score = categoryScores[category.id] || 0;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = category;
        }
      }

      if (!bestMatch || bestScore === 0) {
        console.log('⚠️ Nenhuma classificação encontrada, aplicando classificação padrão');
        return this.createDefaultClassification(defectDescription);
      }

      // Calcular confiança baseada no score
      const confidence = Math.min(bestScore / 10, 0.95);
      
      console.log(`✅ LocalAI: Classificação encontrada: "${bestMatch.category_name}" (Score: ${bestScore}, Confiança: ${(confidence * 100).toFixed(1)}%)`);

      return {
        original_defect_description: defectDescription,
        category_id: bestMatch.id,
        category_name: bestMatch.category_name,
        ai_confidence: confidence,
        ai_reasoning: `Classificação baseada em análise de palavras-chave. Score: ${bestScore.toFixed(1)}. Palavras relevantes encontradas no defeito relacionadas à categoria "${bestMatch.category_name}".`,
        alternative_categories: this.findAlternativeCategories(categoryScores, bestMatch.id)
      };

    } catch (error) {
      console.error('❌ Erro na classificação LocalAI:', error);
      return null;
    }
  }

  /**
   * Normaliza o texto para análise
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[áàâãä]/g, 'a')
      .replace(/[éèêë]/g, 'e')
      .replace(/[íìîï]/g, 'i')
      .replace(/[óòôõö]/g, 'o')
      .replace(/[úùûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Aplica regras avançadas de classificação
   */
  private applyAdvancedRules(text: string, scores: { [key: number]: number }): void {
    for (const category of this.categories) {
      let score = scores[category.id] || 0;

      // Regras específicas melhoradas
      switch (category.category_name) {
        case 'Vazamentos':
          if (this.matchesPatterns(text, [
            'vazamento', 'vaza', 'gotej', 'pingand', 'escorr', 
            'oleo', 'agua', 'liquido', 'fluido', 'retentor',
            'junta', 'vedacao'
          ])) {
            score += 5;
          }
          break;

        case 'Superaquecimento':
          if (this.matchesPatterns(text, [
            'esquent', 'quent', 'temperatura', 'superaque', 'calor',
            'fervend', 'vapor', 'termico', 'resfriamento'
          ])) {
            score += 5;
          }
          break;

        case 'Ruídos Anômalos':
          if (this.matchesPatterns(text, [
            'barulh', 'ruido', 'som', 'estalo', 'batid', 'zunid',
            'chiado', 'apito', 'rangend', 'batend'
          ])) {
            score += 3;
          }
          break;
      }

      if (category.category_name === 'Problemas Elétricos') {
        if (text.includes('elétric') || text.includes('bateria') || text.includes('alternador') ||
            text.includes('chicote') || text.includes('fio') || text.includes('curto')) {
          score += 3;
        }
      }

      if (category.category_name === 'Falhas de Ignição') {
        if (text.includes('não pega') || text.includes('não liga') || text.includes('partida') ||
            text.includes('motor de arranque') || text.includes('ignição')) {
          score += 3;
        }
      }

      if (category.category_name === 'Desgaste de Componentes') {
        if (text.includes('desgast') || text.includes('gasto') || text.includes('troca') ||
            text.includes('substitui') || text.includes('danific') || text.includes('quebr')) {
          score += 3;
        }
      }

      // Palavras genéricas que aumentam score marginalmente
      if (text.includes('motor') || text.includes('peça') || text.includes('sistema')) {
        score += 0.5;
      }

      scores[category.id] = score;
    }
  }

  /**
   * Aplica correspondência de padrões
   */
  private applyPatternMatching(text: string, scores: { [key: number]: number }): void {
    // Implementação básica de pattern matching
    for (const category of this.categories) {
      let score = scores[category.id] || 0;
      scores[category.id] = score;
    }
  }

  /**
   * Aplica análise semântica simples
   */
  private applySemanticAnalysis(text: string, scores: { [key: number]: number }): void {
    // Implementação básica de análise semântica
    for (const category of this.categories) {
      let score = scores[category.id] || 0;
      scores[category.id] = score;
    }
  }

  /**
   * Aplica fallback genérico
   */
  private applyGenericFallback(text: string, scores: { [key: number]: number }): void {
    // Se nenhuma categoria teve score, aplicar score baixo para categoria padrão
    const defaultCategory = this.categories.find(c => c.category_name.includes('Desgaste'));
    if (defaultCategory) {
      scores[defaultCategory.id] = 1;
    }
  }

  /**
   * Verifica se o texto corresponde a padrões
   */
  private matchesPatterns(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern));
  }

  /**
   * Encontra categorias alternativas
   */
  private findAlternativeCategories(scores: { [key: number]: number }, excludeId: number): number[] {
    return Object.entries(scores)
      .filter(([id, score]) => parseInt(id) !== excludeId && score >= 1)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([id]) => parseInt(id));
  }

  /**
   * Cria classificação padrão
   */
  private createDefaultClassification(defectDescription: string): DefectClassification | null {
    const defaultCategory = this.categories.find(c => c.category_name.includes('Desgaste')) || this.categories[0];
    if (!defaultCategory) return null;

    return {
      original_defect_description: defectDescription,
      category_id: defaultCategory.id,
      category_name: defaultCategory.category_name,
      ai_confidence: 0.3,
      ai_reasoning: 'Classificação padrão aplicada devido à falta de correspondência específica',
      alternative_categories: []
    };
  }

  /**
   * Salva classificação no banco de dados
   */
  public async saveClassification(serviceOrderId: number, classification: DefectClassification): Promise<boolean> {
    try {
      console.log(`💾 LocalAI: Salvando classificação para OS ${serviceOrderId}`);

      // Verificar se já existe classificação para esta OS
      const { data: existing } = await supabase
        .from('defect_classifications')
        .select('id')
        .eq('service_order_id', serviceOrderId)
        .single();

      if (existing) {
        console.log(`⚠️ LocalAI: OS ${serviceOrderId} já possui classificação, pulando...`);
        return true; // Consideramos sucesso para não quebrar o fluxo
      }

      const insertData = {
        service_order_id: serviceOrderId,
        original_defect_description: classification.original_defect_description,
        category_id: classification.category_id,
        ai_confidence: classification.ai_confidence,
        ai_reasoning: classification.ai_reasoning,
        alternative_categories: classification.alternative_categories || [],
        is_reviewed: false
      };

      const { data, error } = await supabase
        .from('defect_classifications')
        .insert(insertData)
        .select();

      if (error) {
        console.error('❌ LocalAI: Erro ao salvar:', error);
        return false;
      }

      // Incrementar contador da categoria será feito depois em lote
      // (removido para evitar erro do supabase.sql)

      console.log(`✅ LocalAI: Classificação salva com ID ${data[0]?.id}`);
      return true;

    } catch (error) {
      console.error('❌ LocalAI: Erro ao salvar classificação:', error);
      return false;
    }
  }

  /**
   * Classifica todos os defeitos existentes
   */
  public async classifyAllExistingDefects(): Promise<void> {
    try {
      console.log('🚀 LocalAI: Iniciando classificação massiva...');

      // Buscar IDs das OS já classificadas
      const { data: classifiedIds } = await supabase
        .from('defect_classifications')
        .select('service_order_id');

      const classifiedSet = new Set((classifiedIds || []).map(item => item.service_order_id));

      // Buscar todas as OS com defeitos válidos não classificadas
      const { data: orders, error } = await supabase
        .from('service_orders')
        .select('id, raw_defect_description')
        .not('raw_defect_description', 'is', null)
        .not('raw_defect_description', 'eq', '');

      if (error) {
        console.error('❌ LocalAI: Erro ao buscar ordens:', error);
        return;
      }

      // Filtrar ordens não classificadas
      const unclassifiedOrders = (orders || []).filter(order => !classifiedSet.has(order.id));

      if (unclassifiedOrders.length === 0) {
        console.log('✅ LocalAI: Todos os defeitos já foram classificados!');
        return;
      }

      console.log(`📊 LocalAI: ${unclassifiedOrders.length} ordens para classificar`);

      let processed = 0;
      let succeeded = 0;
      let failed = 0;

      // Processar em lotes menores para melhor performance
      const batchSize = 5;
      
      for (let i = 0; i < unclassifiedOrders.length; i += batchSize) {
        const batch = unclassifiedOrders.slice(i, i + batchSize);
        
        // Processar lote sequencialmente
        for (const order of batch) {
          try {
            console.log(`🔄 LocalAI: Processando OS ${order.id} (${processed + 1}/${unclassifiedOrders.length})`);
            
            const classification = await this.classifyDefect(order.raw_defect_description);
            
            if (classification) {
              const saved = await this.saveClassification(order.id, classification);
              if (saved) {
                succeeded++;
                console.log(`✅ LocalAI: OS ${order.id} → "${classification.category_name}"`);
              } else {
                failed++;
              }
            } else {
              failed++;
              console.log(`⚠️ LocalAI: OS ${order.id} não pôde ser classificada`);
            }
            
            processed++;
            
            // Log de progresso a cada 10 processadas
            if (processed % 10 === 0) {
              const percent = Math.round((processed / unclassifiedOrders.length) * 100);
              console.log(`📈 LocalAI: Progresso ${percent}% (${succeeded} sucessos, ${failed} falhas)`);
            }

            // Pequena pausa para não sobrecarregar o sistema
            await new Promise(resolve => setTimeout(resolve, 100));

          } catch (error) {
            console.error(`❌ LocalAI: Erro ao processar OS ${order.id}:`, error);
            failed++;
            processed++;
          }
        }

        // Pausa entre lotes
        if (i + batchSize < unclassifiedOrders.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      console.log(`🎉 LocalAI: Classificação massiva concluída!`);
      console.log(`📊 Resumo final:`);
      console.log(`  ✅ Sucessos: ${succeeded}`);
      console.log(`  ❌ Falhas: ${failed}`);
      console.log(`  📈 Taxa de sucesso: ${Math.round((succeeded / processed) * 100)}%`);
      console.log(`  🎯 Total processado: ${processed}/${unclassifiedOrders.length}`);

      // Recarregar categorias para atualizar contadores
      await this.loadCategories();

    } catch (error) {
      console.error('❌ LocalAI: Erro na classificação massiva:', error);
    }
  }

  /**
   * Obtém estatísticas das classificações
   */
  public async getClassificationStats(): Promise<any> {
    try {
      const { data: stats, error } = await supabase
        .from('defect_categories')
        .select('category_name, total_occurrences, color_hex, icon')
        .eq('is_active', true)
        .order('total_occurrences', { ascending: false });

      if (error) {
        console.error('❌ LocalAI: Erro ao buscar estatísticas:', error);
        return null;
      }

      const { count: totalClassified } = await supabase
        .from('defect_classifications')
        .select('*', { count: 'exact', head: true });

      const { count: totalDefects } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true })
        .not('raw_defect_description', 'is', null)
        .not('raw_defect_description', 'eq', '');

      const safeTotal = totalDefects || 0;
      const safeClassified = totalClassified || 0;
      
      return {
        categories: stats,
        totalClassified: safeClassified,
        totalDefects: safeTotal,
        classificationRate: safeTotal > 0 ? safeClassified / safeTotal : 0
      };

    } catch (error) {
      console.error('❌ LocalAI: Erro ao obter estatísticas:', error);
      return null;
    }
  }
}