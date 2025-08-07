import { Request, Response } from 'express';
import { GroqAIService } from '../services/GroqAIService';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export class AIController {
  private aiService: GroqAIService;

  constructor() {
    this.aiService = GroqAIService.getInstance();
  }

  /**
   * Classifica um defeito específico
   */
  async classifyDefect(req: Request, res: Response) {
    try {
      const { defectDescription, serviceOrderId } = req.body;

      if (!defectDescription) {
        return res.status(400).json({
          success: false,
          error: 'Descrição do defeito é obrigatória'
        });
      }

      console.log(`🤖 Classificando defeito via API: "${defectDescription}"`);

      const classification = await this.aiService.classifyDefect(defectDescription);

      if (!classification) {
        return res.status(500).json({
          success: false,
          error: 'Erro na classificação do defeito'
        });
      }

      // Se forneceu serviceOrderId, salvar no banco
      if (serviceOrderId) {
        try {
          console.log(`⚡ AIController - Tentando salvar para OS ${serviceOrderId}`);
          const saved = await this.aiService.saveClassification(serviceOrderId, classification);
          console.log(`📊 AIController - Resultado do save:`, saved);
          
          if (!saved) {
            console.error(`❌ AIController - Falha ao salvar para OS ${serviceOrderId}`);
          }
        } catch (saveError) {
          console.error(`❌ AIController - Exceção ao salvar:`, saveError);
          
          // Se o erro de salvar for crítico, retornar erro
          return res.status(500).json({
            success: false,
            error: `Erro ao salvar classificação: ${String(saveError)}`
          });
        }
      }

      res.json({
        success: true,
        data: classification,
        message: 'Defeito classificado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro na classificação:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Inicia classificação de todos os defeitos existentes
   */
  async classifyAllDefects(req: Request, res: Response) {
    try {
      console.log('🚀 Iniciando classificação massiva via API');

      // Executar em background para não travar a requisição
      this.aiService.classifyAllExistingDefects().catch(error => {
        console.error('❌ Erro na classificação massiva:', error);
      });

      res.json({
        success: true,
        message: 'Classificação de todos os defeitos iniciada em background',
        estimated_time: '5-10 minutos'
      });

    } catch (error) {
      console.error('❌ Erro ao iniciar classificação massiva:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém estatísticas das classificações
   */
  async getClassificationStats(req: Request, res: Response) {
    try {
      const stats = await this.aiService.getClassificationStats();

      if (!stats) {
        return res.status(500).json({
          success: false,
          error: 'Erro ao obter estatísticas'
        });
      }

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém todas as categorias de defeitos
   */
  async getDefectCategories(req: Request, res: Response) {
    try {
      const { data: categories, error } = await supabase
        .from('defect_categories')
        .select('*')
        .eq('is_active', true)
        .order('total_occurrences', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar categorias:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao buscar categorias'
        });
      }

      res.json({
        success: true,
        data: categories || []
      });

    } catch (error) {
      console.error('❌ Erro ao obter categorias:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém classificações de defeitos com paginação
   */
  async getDefectClassifications(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      
      const reviewed = req.query.reviewed as string;
      const categoryId = req.query.categoryId as string;

      console.log('📊 Buscando classificações:', { page, limit, reviewed, categoryId });

      // Construir query com joins
      let query = supabase
        .from('defect_classifications')
        .select(`
          *,
          defect_categories (
            category_name,
            color_hex,
            icon
          ),
          service_orders (
            order_number,
            order_date,
            responsible_mechanic
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (reviewed === 'true') {
        query = query.eq('is_reviewed', true);
      } else if (reviewed === 'false') {
        query = query.eq('is_reviewed', false);
      }

      if (categoryId) {
        query = query.eq('category_id', parseInt(categoryId));
      }

      const { data: classifications, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Erro ao buscar classificações:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao buscar classificações'
        });
      }

      const totalPages = Math.ceil((count || 0) / limit);

      res.json({
        success: true,
        data: classifications || [],
        pagination: {
          total: count || 0,
          page,
          limit,
          totalPages
        }
      });

    } catch (error) {
      console.error('❌ Erro ao obter classificações:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Marca uma classificação como revisada
   */
  async reviewClassification(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { approved, newCategoryId, reviewerName } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID da classificação é obrigatório'
        });
      }

      console.log(`📝 Revisando classificação ${id}:`, { approved, newCategoryId });

      const updateData: any = {
        is_reviewed: true,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerName || 'Usuário'
      };

      // Se não aprovado e forneceu nova categoria, atualizar
      if (!approved && newCategoryId) {
        updateData.category_id = newCategoryId;
      }

      const { data: classification, error } = await supabase
        .from('defect_classifications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao revisar classificação:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao revisar classificação'
        });
      }

      res.json({
        success: true,
        data: classification,
        message: `Classificação ${approved ? 'aprovada' : 'corrigida'} com sucesso`
      });

    } catch (error) {
      console.error('❌ Erro ao revisar classificação:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Cria uma nova categoria manualmente
   */
  async createCategory(req: Request, res: Response) {
    try {
      const { 
        category_name, 
        description, 
        color_hex, 
        icon, 
        keywords 
      } = req.body;

      if (!category_name || !description) {
        return res.status(400).json({
          success: false,
          error: 'Nome e descrição da categoria são obrigatórios'
        });
      }

      console.log(`🆕 Criando categoria manual: ${category_name}`);

      const { data: category, error } = await supabase
        .from('defect_categories')
        .insert({
          category_name: category_name.trim(),
          description: description.trim(),
          color_hex: color_hex || '#3B82F6',
          icon: icon || 'wrench',
          keywords: keywords || [],
          sample_defects: [],
          ai_confidence: 1.0, // Máxima confiança para categorias manuais
          total_occurrences: 0
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar categoria:', error);
        return res.status(500).json({
          success: false,
          error: error.code === '23505' ? 'Categoria já existe' : 'Erro ao criar categoria'
        });
      }

      res.json({
        success: true,
        data: category,
        message: 'Categoria criada com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao criar categoria:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Atualiza uma categoria existente
   */
  async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { 
        category_name, 
        description, 
        color_hex, 
        icon, 
        keywords,
        is_active 
      } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID da categoria é obrigatório'
        });
      }

      console.log(`📝 Atualizando categoria ${id}`);

      const updateData: any = {};
      if (category_name) updateData.category_name = category_name.trim();
      if (description) updateData.description = description.trim();
      if (color_hex) updateData.color_hex = color_hex;
      if (icon) updateData.icon = icon;
      if (keywords) updateData.keywords = keywords;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data: category, error } = await supabase
        .from('defect_categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar categoria:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao atualizar categoria'
        });
      }

      res.json({
        success: true,
        data: category,
        message: 'Categoria atualizada com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao atualizar categoria:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém progresso da classificação em massa
   */
  async getClassificationProgress(req: Request, res: Response) {
    try {
      // Contar classificações existentes vs total de defeitos
      const { count: totalClassified } = await supabase
        .from('defect_classifications')
        .select('*', { count: 'exact', head: true });

      const { count: totalDefects } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true })
        .not('raw_defect_description', 'is', null)
        .not('raw_defect_description', 'eq', '');

      const progress = (totalDefects || 0) > 0 ? ((totalClassified || 0) / (totalDefects || 0)) : 0;

      res.json({
        success: true,
        data: {
          totalClassified: totalClassified || 0,
          totalDefects: totalDefects || 0,
          progress: Math.round(progress * 100),
          isComplete: progress >= 1.0,
          remainingCount: (totalDefects || 0) - (totalClassified || 0)
        }
      });

    } catch (error) {
      console.error('❌ Erro ao obter progresso:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Teste: Inserção direta no banco
   */
  async testDirectInsert(req: Request, res: Response) {
    try {
      const result = await this.aiService.testDirectInsert();
      
      res.json({
        success: true,
        data: { result }
      });

    } catch (error) {
      console.error('❌ Erro no teste direto:', error);
      res.status(500).json({
        success: false,
        error: String(error)
      });
    }
  }

  /**
   * Teste: Salva uma classificação específica
   */
  async testSaveClassification(req: Request, res: Response) {
    try {
      const testClassification = {
        original_defect_description: "TESTE DE CLASSIFICAÇÃO",
        category_id: 1,
        category_name: "Vazamentos",
        ai_confidence: 0.95,
        ai_reasoning: "Teste manual de classificação",
        alternative_categories: []
      };

      const saved = await this.aiService.saveClassification(42091, testClassification);
      
      res.json({
        success: true,
        data: {
          saved,
          testClassification
        }
      });

    } catch (error) {
      console.error('❌ Erro no teste:', error);
      res.status(500).json({
        success: false,
        error: String(error)
      });
    }
  }

  /**
   * Debug: Verifica quantas OS precisam ser classificadas
   */
  async getUnclassifiedCount(req: Request, res: Response) {
    try {
      // Primeiro, buscar IDs das OS já classificadas
      const { data: classifiedIds } = await supabase
        .from('defect_classifications')
        .select('service_order_id');

      const classified = classifiedIds?.map(item => item.service_order_id) || [];

      // Buscar todas as OS que ainda não foram classificadas
      let query = supabase
        .from('service_orders')
        .select('id, raw_defect_description')
        .not('raw_defect_description', 'is', null)
        .not('raw_defect_description', 'eq', '');

      // Se houver classificações, excluir essas IDs
      if (classified.length > 0) {
        query = query.not('id', 'in', `(${classified.join(',')})`);
      }

      const { data: orders, error: queryError, count } = await query;

      res.json({
        success: true,
        data: {
          totalClassified: classified.length,
          totalUnclassified: count || 0,
          classifiedIds: classified.slice(0, 10), // Primeiros 10 para debug
          sampleUnclassified: orders?.slice(0, 5) || [] // Primeiras 5 para debug
        }
      });

    } catch (error) {
      console.error('❌ Erro no debug:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Status do sistema de IA
   */
  async getAIStatus(req: Request, res: Response) {
    try {
      // Verificar conexão com Groq
      let groqStatus = 'online';
      try {
        // Fazer um teste simples
        await this.aiService.classifyDefect('teste');
        groqStatus = 'online';
      } catch (error) {
        groqStatus = 'offline';
      }

      // Buscar estatísticas do banco
      const stats = await this.aiService.getClassificationStats();

      res.json({
        success: true,
        data: {
          groq_status: groqStatus,
          database_status: 'online',
          classification_stats: stats,
          last_updated: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Erro ao obter status da IA:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}