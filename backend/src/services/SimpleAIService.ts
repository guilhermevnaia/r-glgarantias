import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface DefectClassification {
  service_order_id: number;
  original_defect_description: string;
  category_id: number;
  category_name: string;
  ai_confidence: number;
  ai_reasoning: string;
  is_reviewed: boolean;
}

export interface DefectCategory {
  id: number;
  category_name: string;
  description: string;
  color_hex: string;
  icon: string;
  keywords: string[];
  total_occurrences: number;
}

/**
 * Novo Sistema de IA Simples e Eficiente
 * 
 * Características:
 * - Algoritmo único e robusto
 * - Sem duplicações ou confusões
 * - Fácil manutenção
 * - Performance otimizada
 */
export class SimpleAIService {
  private static instance: SimpleAIService;
  private categories: DefectCategory[] = [];
  private isInitialized = false;

  private constructor() {
    this.initializeCategories();
  }

  public static getInstance(): SimpleAIService {
    if (!SimpleAIService.instance) {
      SimpleAIService.instance = new SimpleAIService();
    }
    return SimpleAIService.instance;
  }

  /**
   * Carrega categorias do banco
   */
  private async initializeCategories(): Promise<void> {
    try {
      const { data: categories, error } = await supabase
        .from('defect_categories')
        .select('*')
        .eq('is_active', true)
        .order('id');

      if (error) {
        console.error('❌ Erro ao carregar categorias:', error);
        return;
      }

      this.categories = categories || [];
      this.isInitialized = true;
      console.log(`🤖 SimpleAI: ${this.categories.length} categorias carregadas`);
    } catch (error) {
      console.error('❌ Erro na inicialização:', error);
    }
  }

  /**
   * Normaliza texto removendo acentos e caracteres especiais
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      // Remover acentos
      .replace(/[áàâãäå]/g, 'a')
      .replace(/[éèêë]/g, 'e')
      .replace(/[íìîï]/g, 'i')
      .replace(/[óòôõöø]/g, 'o')
      .replace(/[úùûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      // Remover caracteres especiais mas manter espaços
      .replace(/[^a-z0-9\s]/g, ' ')
      // Normalizar espaços múltiplos
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Classifica um defeito usando algoritmo simples mas eficaz
   */
  public async classifyDefect(defectDescription: string): Promise<DefectClassification | null> {
    if (!defectDescription || defectDescription.trim().length < 3) {
      return null;
    }

    if (!this.isInitialized) {
      await this.initializeCategories();
    }

    const normalizedText = this.normalizeText(defectDescription);
    console.log(`🎯 Classificando: "${defectDescription.substring(0, 50)}..."`);

    let bestCategory: DefectCategory | null = null;
    let bestScore = 0;

    // Analisar cada categoria
    for (const category of this.categories) {
      let score = 0;

      // Score por palavras-chave
      for (const keyword of category.keywords) {
        const normalizedKeyword = this.normalizeText(keyword);
        
        if (normalizedText.includes(normalizedKeyword)) {
          // Score maior para palavras maiores (mais específicas)
          score += normalizedKeyword.length > 4 ? 3 : 2;
          
          // Bonus se aparece no início do texto
          if (normalizedText.indexOf(normalizedKeyword) < 10) {
            score += 1;
          }
        }
      }

      // Atualizar melhor match
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    // Se não encontrou match específico, usar categoria padrão
    if (!bestCategory || bestScore === 0) {
      bestCategory = this.categories.find(c => c.category_name === 'Operacional') || null;
      bestScore = 1; // Score baixo para classificação genérica
    }

    if (!bestCategory) {
      console.log('❌ Nenhuma categoria encontrada');
      return null;
    }

    // Calcular confiança baseada no score
    const confidence = Math.min(bestScore / 8, 0.95); // Normalizar para 0-0.95

    const classification: DefectClassification = {
      service_order_id: 0, // Será definido ao salvar
      original_defect_description: defectDescription,
      category_id: bestCategory.id,
      category_name: bestCategory.category_name,
      ai_confidence: confidence,
      ai_reasoning: `Classificação baseada em ${bestScore} correspondências de palavras-chave. Categoria: ${bestCategory.category_name}`,
      is_reviewed: false
    };

    console.log(`✅ Classificado como: ${bestCategory.category_name} (${(confidence * 100).toFixed(1)}%)`);
    return classification;
  }

  /**
   * Salva classificação no banco
   */
  public async saveClassification(serviceOrderId: number, classification: DefectClassification): Promise<boolean> {
    try {
      // Verificar se já existe classificação para esta order
      const { data: existing } = await supabase
        .from('defect_classifications')
        .select('id')
        .eq('service_order_id', serviceOrderId)
        .single();

      if (existing) {
        console.log(`⚠️ OS ${serviceOrderId} já classificada, pulando...`);
        return true;
      }

      // Inserir nova classificação
      const insertData = {
        service_order_id: serviceOrderId,
        original_defect_description: classification.original_defect_description,
        category_id: classification.category_id,
        ai_confidence: classification.ai_confidence,
        ai_reasoning: classification.ai_reasoning,
        alternative_categories: [], // Array vazio por simplicidade
        is_reviewed: false
      };

      const { error } = await supabase
        .from('defect_classifications')
        .insert(insertData);

      if (error) {
        console.error(`❌ Erro ao salvar OS ${serviceOrderId}:`, error.message);
        return false;
      }

      // Incrementar contador da categoria
      await this.incrementCategoryCounter(classification.category_id);

      console.log(`✅ OS ${serviceOrderId} salva com sucesso`);
      return true;

    } catch (error) {
      console.error(`❌ Exceção ao salvar OS ${serviceOrderId}:`, error);
      return false;
    }
  }

  /**
   * Incrementa contador de uma categoria
   */
  private async incrementCategoryCounter(categoryId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('defect_categories')
        .update({
          total_occurrences: (await supabase
            .from('defect_classifications')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', categoryId)
          ).count || 0
        })
        .eq('id', categoryId);

      if (error) {
        console.error(`❌ Erro ao atualizar contador da categoria ${categoryId}:`, error);
      }
    } catch (error) {
      console.error(`❌ Exceção ao atualizar contador:`, error);
    }
  }

  /**
   * Classifica apenas os defeitos não classificados
   */
  public async classifyUnclassifiedDefects(): Promise<void> {
    try {
      console.log('🚀 SimpleAI: Iniciando classificação de defeitos não classificados...');

      // Buscar IDs já classificados
      const { data: classifiedIds } = await supabase
        .from('defect_classifications')
        .select('service_order_id');

      const classifiedSet = new Set((classifiedIds || []).map(c => c.service_order_id));

      // Buscar apenas defeitos não classificados
      const { data: unclassifiedDefects } = await supabase
        .from('service_orders')
        .select('id, order_number, raw_defect_description')
        .not('raw_defect_description', 'is', null)
        .not('raw_defect_description', 'eq', '');

      const defectsToClassify = (unclassifiedDefects || []).filter(d => !classifiedSet.has(d.id));

      if (defectsToClassify.length === 0) {
        console.log('✅ Todos os defeitos já estão classificados!');
        return;
      }

      console.log(`📊 Encontrados ${defectsToClassify.length} defeitos não classificados`);

      let processed = 0;
      let successful = 0;
      let failed = 0;

      const batchSize = 10;
      
      for (let i = 0; i < defectsToClassify.length; i += batchSize) {
        const batch = defectsToClassify.slice(i, i + batchSize);
        
        console.log(`\n📦 Lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(defectsToClassify.length/batchSize)}:`);

        for (const defect of batch) {
          try {
            const classification = await this.classifyDefect(defect.raw_defect_description);
            
            if (classification) {
              const saved = await this.saveClassification(defect.id, classification);
              if (saved) {
                successful++;
              } else {
                failed++;
              }
            } else {
              failed++;
            }
            
            processed++;

          } catch (error) {
            console.error(`❌ Erro na OS ${defect.order_number}:`, error);
            failed++;
            processed++;
          }
        }

        const progress = (processed / defectsToClassify.length * 100).toFixed(1);
        console.log(`📈 Progresso: ${progress}% (${successful}✅ ${failed}❌)`);

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('\n🎉 CLASSIFICAÇÃO DE NÃO CLASSIFICADOS COMPLETA!');
      console.log(`📊 Processados: ${processed}`);
      console.log(`✅ Sucessos: ${successful}`);
      console.log(`❌ Falhas: ${failed}`);
      console.log(`📈 Taxa de sucesso: ${(successful / processed * 100).toFixed(1)}%`);

    } catch (error) {
      console.error('❌ Erro na classificação de não classificados:', error);
    }
  }

  /**
   * Classifica todos os defeitos existentes (função original)
   */
  public async classifyAllDefects(): Promise<void> {
    try {
      console.log('🚀 SimpleAI: Iniciando classificação de todos os defeitos...');

      // Buscar todos os defeitos válidos
      const { data: defects } = await supabase
        .from('service_orders')
        .select('id, order_number, raw_defect_description')
        .not('raw_defect_description', 'is', null)
        .not('raw_defect_description', 'eq', '');

      if (!defects || defects.length === 0) {
        console.log('❌ Nenhum defeito encontrado');
        return;
      }

      console.log(`📊 Encontrados ${defects.length} defeitos para classificar`);

      let processed = 0;
      let successful = 0;
      let failed = 0;

      // Processar em lotes pequenos
      const batchSize = 10;
      
      for (let i = 0; i < defects.length; i += batchSize) {
        const batch = defects.slice(i, i + batchSize);
        
        console.log(`\n📦 Lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(defects.length/batchSize)}:`);

        for (const defect of batch) {
          try {
            const classification = await this.classifyDefect(defect.raw_defect_description);
            
            if (classification) {
              const saved = await this.saveClassification(defect.id, classification);
              if (saved) {
                successful++;
              } else {
                failed++;
              }
            } else {
              failed++;
            }
            
            processed++;

          } catch (error) {
            console.error(`❌ Erro na OS ${defect.order_number}:`, error);
            failed++;
            processed++;
          }
        }

        // Mostrar progresso
        const progress = (processed / defects.length * 100).toFixed(1);
        console.log(`📈 Progresso: ${progress}% (${successful}✅ ${failed}❌)`);

        // Pausa entre lotes
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('\n🎉 CLASSIFICAÇÃO COMPLETA!');
      console.log(`📊 Processados: ${processed}`);
      console.log(`✅ Sucessos: ${successful}`);
      console.log(`❌ Falhas: ${failed}`);
      console.log(`📈 Taxa de sucesso: ${(successful / processed * 100).toFixed(1)}%`);

    } catch (error) {
      console.error('❌ Erro na classificação em massa:', error);
    }
  }

  /**
   * Obtém estatísticas do sistema
   */
  public async getStats(): Promise<any> {
    try {
      const { count: totalClassified } = await supabase
        .from('defect_classifications')
        .select('*', { count: 'exact', head: true });

      const { count: totalDefects } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true })
        .not('raw_defect_description', 'is', null)
        .not('raw_defect_description', 'eq', '');

      const { data: categories } = await supabase
        .from('defect_categories')
        .select('category_name, total_occurrences, color_hex, icon')
        .eq('is_active', true)
        .order('total_occurrences', { ascending: false });

      return {
        totalClassified: totalClassified || 0,
        totalDefects: totalDefects || 0,
        classificationRate: totalDefects ? (totalClassified || 0) / totalDefects : 0,
        categories: categories || []
      };

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return null;
    }
  }
}