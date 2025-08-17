import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';
import { EnhancedLocalAIService } from './EnhancedLocalAIService';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Inicializar cliente Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export interface DefectCategory {
  id?: number;
  category_name: string;
  description: string;
  color_hex: string;
  icon: string;
  keywords: string[];
  sample_defects: string[];
  ai_confidence: number;
  total_occurrences: number;
}

export interface DefectClassification {
  original_defect_description: string;
  category_id: number;
  category_name: string;
  ai_confidence: number;
  ai_reasoning: string;
  alternative_categories: number[];
}

export class GroqAIService {
  private static instance: GroqAIService;
  private categories: DefectCategory[] = [];

  private constructor() {
    this.loadCategories();
  }

  public static getInstance(): GroqAIService {
    if (!GroqAIService.instance) {
      GroqAIService.instance = new GroqAIService();
    }
    return GroqAIService.instance;
  }

  /**
   * Carrega categorias existentes do banco de dados
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
      console.log(`✅ ${this.categories.length} categorias carregadas`);
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error);
    }
  }

  /**
   * Classifica um defeito usando IA (Groq API com fallback para LocalAI)
   */
  public async classifyDefect(defectDescription: string): Promise<DefectClassification | null> {
    try {
      if (!defectDescription || defectDescription.trim().length === 0) {
        return null;
      }

      console.log(`🤖 GroqAI: Classificando defeito: "${defectDescription}"`);

      // Recarregar categorias para ter dados atualizados
      await this.loadCategories();

      // Primeiro tentar usar Groq API
      try {
        const prompt = this.buildClassificationPrompt(defectDescription);
        
        // Timeout customizado para evitar travamentos
        const completionPromise = groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em classificação de defeitos mecânicos automotivos. Seja preciso e consistente.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'llama3-8b-8192',
          temperature: 0.1, // Baixa temperatura para consistência
          max_tokens: 1000,
          response_format: { type: 'json_object' }
        });

        // Timeout de 30 segundos para Groq API (mais estável)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout: API demorou mais que 30 segundos')), 30000);
        });

        const completion = await Promise.race([completionPromise, timeoutPromise]) as any;
        const response = completion.choices[0]?.message?.content;
        if (!response) {
          throw new Error('Resposta vazia da IA');
        }

        const result = JSON.parse(response);
        console.log('🎯 GroqAI: Classificação bem-sucedida:', result);

        // Validar e processar resultado
        return await this.processAIResult(defectDescription, result);

      } catch (groqError: any) {
        console.warn('⚠️ GroqAI falhou, usando LocalAI como fallback:', groqError.message);
        
        try {
          // Usar EnhancedLocalAI como fallback
          const localAI = EnhancedLocalAIService.getInstance();
          const localResult = await localAI.classifyDefect(defectDescription);
          
          if (localResult) {
            console.log('✅ LocalAI: Classificação de fallback bem-sucedida');
            return localResult;
          } else {
            console.error('❌ LocalAI também falhou na classificação');
            return null;
          }
        } catch (localError: any) {
          console.error('❌ Erro no LocalAI fallback:', localError.message);
          return null;
        }
      }

    } catch (error) {
      console.error('❌ Erro crítico na classificação:', error);
      return null;
    }
  }

  /**
   * Constrói o prompt para classificação
   */
  private buildClassificationPrompt(defectDescription: string): string {
    const categoriesText = this.categories.map(cat => 
      `- ${cat.category_name}: ${cat.description} (palavras-chave: ${cat.keywords.join(', ')})`
    ).join('\n');

    return `
TAREFA: Classifique o seguinte defeito mecânico em uma das categorias existentes ou sugira uma nova categoria.

DEFEITO: "${defectDescription}"

CATEGORIAS EXISTENTES:
${categoriesText}

INSTRUÇÕES:
1. Analise o defeito cuidadosamente
2. Se encaixar numa categoria existente, use ela
3. Se não encaixar bem, sugira uma nova categoria
4. Seja preciso na confiança (0.0 a 1.0)
5. Explique seu raciocínio

RETORNE APENAS UM JSON VÁLIDO COM ESTA ESTRUTURA:
{
  "action": "existing" ou "new",
  "existing_category_name": "nome da categoria existente" (se action = "existing"),
  "confidence": 0.85,
  "reasoning": "explicação detalhada",
  "new_category": {
    "name": "Nome da Nova Categoria",
    "description": "Descrição da categoria",
    "keywords": ["palavra1", "palavra2"],
    "color_hex": "#FF6B6B",
    "icon": "wrench"
  } (se action = "new"),
  "alternative_categories": ["categoria1", "categoria2"]
}`;
  }

  /**
   * Processa resultado da IA e salva no banco
   */
  private async processAIResult(defectDescription: string, aiResult: any): Promise<DefectClassification | null> {
    try {
      let categoryId: number;
      let categoryName: string;

      if (aiResult.action === 'existing') {
        // Usar categoria existente
        const category = this.categories.find(cat => 
          cat.category_name.toLowerCase() === aiResult.existing_category_name.toLowerCase()
        );

        if (!category) {
          console.warn('⚠️ Categoria não encontrada, criando nova');
          return await this.createNewCategory(defectDescription, aiResult);
        }

        categoryId = category.id!;
        categoryName = category.category_name;

        // Incrementar contador da categoria
        await supabase
          .from('defect_categories')
          .update({ total_occurrences: category.total_occurrences + 1 })
          .eq('id', categoryId);

      } else {
        // Criar nova categoria
        const newCategory = await this.createNewCategory(defectDescription, aiResult);
        if (!newCategory) return null;
        
        categoryId = newCategory.category_id;
        categoryName = newCategory.category_name;
      }

      // Buscar IDs das categorias alternativas
      const alternativeIds = await this.getAlternativeCategoryIds(aiResult.alternative_categories || []);

      return {
        original_defect_description: defectDescription,
        category_id: categoryId,
        category_name: categoryName,
        ai_confidence: aiResult.confidence || 0.5,
        ai_reasoning: aiResult.reasoning || 'Classificação automática',
        alternative_categories: alternativeIds
      };

    } catch (error) {
      console.error('❌ Erro ao processar resultado da IA:', error);
      return null;
    }
  }

  /**
   * Cria uma nova categoria baseada na sugestão da IA
   */
  private async createNewCategory(defectDescription: string, aiResult: any): Promise<DefectClassification | null> {
    try {
      const newCat = aiResult.new_category;
      if (!newCat) return null;

      console.log(`🆕 Criando nova categoria: ${newCat.name}`);

      const { data: category, error } = await supabase
        .from('defect_categories')
        .insert({
          category_name: newCat.name,
          description: newCat.description,
          color_hex: newCat.color_hex || '#3B82F6',
          icon: newCat.icon || 'wrench',
          keywords: newCat.keywords || [],
          sample_defects: [defectDescription],
          ai_confidence: aiResult.confidence || 0.5,
          total_occurrences: 1
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar categoria:', error);
        return null;
      }

      // Atualizar cache local
      this.categories.push(category);

      return {
        original_defect_description: defectDescription,
        category_id: category.id,
        category_name: category.category_name,
        ai_confidence: aiResult.confidence || 0.5,
        ai_reasoning: aiResult.reasoning || 'Nova categoria criada',
        alternative_categories: []
      };

    } catch (error) {
      console.error('❌ Erro ao criar nova categoria:', error);
      return null;
    }
  }

  /**
   * Converte nomes de categorias em IDs
   */
  private async getAlternativeCategoryIds(categoryNames: string[]): Promise<number[]> {
    if (!categoryNames || categoryNames.length === 0) return [];

    return this.categories
      .filter(cat => categoryNames.some(name => 
        name.toLowerCase() === cat.category_name.toLowerCase()
      ))
      .map(cat => cat.id!)
      .filter(id => id !== undefined);
  }

  /**
   * Teste simples de inserção direta
   */
  public async testDirectInsert(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('defect_classifications')
        .insert({
          service_order_id: 42088,
          original_defect_description: 'TESTE DIRETO VIA CÓDIGO',
          category_id: 1,
          ai_confidence: 0.99,
          ai_reasoning: 'Teste direto sem IA',
          alternative_categories: [] as number[],
          is_reviewed: false
        })
        .select();

      console.log('🧪 TESTE DIRETO - Data:', data);
      console.log('🧪 TESTE DIRETO - Error:', error);
      
      return !error;
    } catch (error) {
      console.error('🧪 TESTE DIRETO - Exception:', error);
      return false;
    }
  }

  /**
   * Salva classificação no banco de dados
   */
  public async saveClassification(serviceOrderId: number, classification: DefectClassification): Promise<boolean> {
    try {
      console.log(`🔍 Tentando salvar classificação para OS ${serviceOrderId}:`, {
        serviceOrderId,
        category_id: classification.category_id,
        original_defect_description: classification.original_defect_description?.substring(0, 50) + '...',
        ai_confidence: classification.ai_confidence
      });

      // Verificar se a categoria existe primeiro
      const { data: categoryExists } = await supabase
        .from('defect_categories')
        .select('id')
        .eq('id', classification.category_id)
        .single();

      if (!categoryExists) {
        console.error(`❌ Categoria ${classification.category_id} não existe!`);
        return false;
      }

      const insertData = {
        service_order_id: serviceOrderId,
        original_defect_description: classification.original_defect_description,
        category_id: classification.category_id,
        ai_confidence: classification.ai_confidence,
        ai_reasoning: classification.ai_reasoning || 'Classificação automática',
        alternative_categories: classification.alternative_categories || [],
        is_reviewed: false
      };

      console.log('📤 Dados sendo inseridos:', insertData);

      const { data, error } = await supabase
        .from('defect_classifications')
        .insert(insertData)
        .select();

      if (error) {
        console.error('❌ ERRO DETALHADO:', {
          error: error,
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          insertData: insertData
        });
        return false;
      }

      console.log(`✅ SUCESSO! Classificação salva para OS ${serviceOrderId}:`, data);
      return true;

    } catch (error) {
      console.error('❌ Erro de exceção ao salvar classificação:', {
        error,
        serviceOrderId,
        classification: classification?.original_defect_description?.substring(0, 50)
      });
      return false;
    }
  }

  /**
   * Classifica todos os defeitos existentes no banco (com fallback automático)
   */
  public async classifyAllExistingDefects(): Promise<void> {
    try {
      console.log('🚀 GroqAI: Iniciando classificação de todos os defeitos existentes...');

      // Primeiro, buscar IDs das OS já classificadas
      const { data: classifiedIds } = await supabase
        .from('defect_classifications')
        .select('service_order_id');

      const classifiedIdSet = new Set((classifiedIds || []).map(item => item.service_order_id));

      // Buscar todas as OS com defeitos válidos
      const { data: allOrders, error } = await supabase
        .from('service_orders')
        .select('id, raw_defect_description')
        .not('raw_defect_description', 'is', null)
        .not('raw_defect_description', 'eq', '');

      if (error) {
        console.error('❌ Erro ao buscar ordens:', error);
        return;
      }

      // Filtrar as que ainda não foram classificadas
      const orders = (allOrders || []).filter(order => !classifiedIdSet.has(order.id));

      if (!orders || orders.length === 0) {
        console.log('✅ Todos os defeitos já foram classificados!');
        return;
      }

      console.log(`📊 Encontradas ${orders.length} ordens para classificar`);

      // Usar EnhancedLocalAI diretamente para classificação em massa (mais rápido e confiável)
      console.log('🤖 Usando EnhancedLocalAI para classificação em massa por ser mais eficiente...');
      const localAI = EnhancedLocalAIService.getInstance();
      await localAI.classifyAllExistingDefects();

      console.log('🎉 Classificação em massa delegada para LocalAI concluída!');

    } catch (error) {
      console.error('❌ Erro na classificação em massa:', error);
      console.log('🔄 Tentando usar LocalAI como fallback...');
      
      try {
        const localAI = EnhancedLocalAIService.getInstance();
        await localAI.classifyAllExistingDefects();
        console.log('✅ Classificação em massa via EnhancedLocalAI (fallback) concluída!');
      } catch (fallbackError) {
        console.error('❌ Erro crítico: Tanto GroqAI quanto LocalAI falharam na classificação em massa:', fallbackError);
      }
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
        console.error('❌ Erro ao buscar estatísticas:', error);
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
      console.error('❌ Erro ao obter estatísticas:', error);
      return null;
    }
  }
}