import { Request, Response } from 'express';
import { AutonomousHierarchicalAI } from '../services/AutonomousHierarchicalAI';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export class HierarchicalAIController {
  private hierarchicalAI: AutonomousHierarchicalAI;

  constructor() {
    this.hierarchicalAI = AutonomousHierarchicalAI.getInstance();
  }

  /**
   * Classifica um defeito hierarquicamente
   */
  async classifyDefectHierarchically(req: Request, res: Response) {
    try {
      const { defectDescription, serviceOrderId } = req.body;

      if (!defectDescription) {
        return res.status(400).json({
          success: false,
          error: 'Descrição do defeito é obrigatória'
        });
      }

      console.log(`🌳 Classificação hierárquica via API: "${defectDescription.substring(0, 50)}..."`);

      const classification = await this.hierarchicalAI.classifyDefectHierarchically(defectDescription);

      if (!classification) {
        return res.status(500).json({
          success: false,
          error: 'Erro na classificação hierárquica do defeito'
        });
      }

      // Se forneceu serviceOrderId, salvar no banco
      if (serviceOrderId) {
        try {
          const saved = await this.hierarchicalAI.saveHierarchicalClassification(serviceOrderId, classification);
          
          if (!saved) {
            console.error(`❌ Falha ao salvar classificação hierárquica para OS ${serviceOrderId}`);
          }
        } catch (saveError) {
          console.error(`❌ Exceção ao salvar classificação hierárquica:`, saveError);
          
          return res.status(500).json({
            success: false,
            error: `Erro ao salvar classificação hierárquica: ${String(saveError)}`
          });
        }
      }

      res.json({
        success: true,
        data: classification,
        message: 'Defeito classificado hierarquicamente com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro na classificação hierárquica:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Inicia classificação hierárquica de todos os defeitos não classificados
   */
  async classifyAllHierarchically(req: Request, res: Response) {
    try {
      console.log('🚀 Iniciando classificação hierárquica massiva via API');

      // Executar em background para não travar a requisição
      this.hierarchicalAI.classifyUnclassifiedHierarchically().catch((error: any) => {
        console.error('❌ Erro na classificação hierárquica massiva:', error);
      });

      res.json({
        success: true,
        message: 'Classificação hierárquica de todos os defeitos iniciada em background',
        estimated_time: '10-15 minutos'
      });

    } catch (error) {
      console.error('❌ Erro ao iniciar classificação hierárquica massiva:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém estatísticas das classificações hierárquicas
   */
  async getHierarchicalStats(req: Request, res: Response) {
    try {
      const stats = await this.hierarchicalAI.getHierarchicalStats();

      if (!stats) {
        return res.status(500).json({
          success: false,
          error: 'Erro ao obter estatísticas hierárquicas'
        });
      }

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas hierárquicas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém toda a estrutura hierárquica
   */
  async getHierarchy(req: Request, res: Response) {
    try {
      const { data: hierarchy, error } = await supabase
        .from('defect_hierarchy')
        .select('*')
        .eq('is_active', true)
        .order('level')
        .order('total_occurrences', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar hierarquia:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao buscar hierarquia'
        });
      }

      // Organizar em estrutura hierárquica
      const groups = hierarchy?.filter(h => h.level === 1) || [];
      const subgroups = hierarchy?.filter(h => h.level === 2) || [];
      const subsubgroups = hierarchy?.filter(h => h.level === 3) || [];

      const structuredHierarchy = groups.map(group => ({
        ...group,
        subgroups: subgroups
          .filter(sub => sub.parent_id === group.id)
          .map(subgroup => ({
            ...subgroup,
            subsubgroups: subsubgroups.filter(subsub => subsub.parent_id === subgroup.id)
          }))
      }));

      res.json({
        success: true,
        data: {
          flat: hierarchy || [],
          structured: structuredHierarchy,
          counts: {
            groups: groups.length,
            subgroups: subgroups.length,
            subsubgroups: subsubgroups.length
          }
        }
      });

    } catch (error) {
      console.error('❌ Erro ao obter hierarquia:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém classificações hierárquicas com paginação
   */
  async getHierarchicalClassifications(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      
      const groupId = req.query.groupId as string;
      const subgroupId = req.query.subgroupId as string;
      const reviewed = req.query.reviewed as string;

      console.log('📊 Buscando classificações hierárquicas:', { page, limit, groupId, subgroupId, reviewed });

      // Construir query com joins
      let query = supabase
        .from('hierarchical_classifications')
        .select(`
          *,
          group:defect_hierarchy!group_id (
            id, name, color_hex, icon
          ),
          subgroup:defect_hierarchy!subgroup_id (
            id, name, color_hex, icon
          ),
          subsubgroup:defect_hierarchy!subsubgroup_id (
            id, name, color_hex, icon
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

      if (groupId) {
        query = query.eq('group_id', parseInt(groupId));
      }

      if (subgroupId) {
        query = query.eq('subgroup_id', parseInt(subgroupId));
      }

      const { data: classifications, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Erro ao buscar classificações hierárquicas:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao buscar classificações hierárquicas'
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
      console.error('❌ Erro ao obter classificações hierárquicas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Força refresh da hierarquia em cache
   */
  async refreshHierarchy(req: Request, res: Response) {
    try {
      await this.hierarchicalAI.refreshHierarchy();
      
      res.json({
        success: true,
        message: 'Cache da hierarquia atualizado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao atualizar cache da hierarquia:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém progresso da classificação hierárquica
   */
  async getHierarchicalProgress(req: Request, res: Response) {
    try {
      // Contar classificações hierárquicas existentes vs total de defeitos
      const { count: totalClassified } = await supabase
        .from('hierarchical_classifications')
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
      console.error('❌ Erro ao obter progresso hierárquico:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Status do sistema de IA hierárquica
   */
  async getHierarchicalAIStatus(req: Request, res: Response) {
    try {
      // Buscar estatísticas do banco
      const stats = await this.hierarchicalAI.getHierarchicalStats();

      res.json({
        success: true,
        data: {
          hierarchical_ai_status: 'online',
          database_status: 'online',
          hierarchical_stats: stats,
          last_updated: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Erro ao obter status da IA hierárquica:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Cria manualmente um novo nó da hierarquia
   */
  async createHierarchyNode(req: Request, res: Response) {
    try {
      const { 
        name, 
        description, 
        level, 
        parent_id, 
        color_hex, 
        icon, 
        keywords 
      } = req.body;

      if (!name || !description || !level) {
        return res.status(400).json({
          success: false,
          error: 'Nome, descrição e nível são obrigatórios'
        });
      }

      if (![1, 2, 3].includes(level)) {
        return res.status(400).json({
          success: false,
          error: 'Nível deve ser 1 (grupo), 2 (subgrupo) ou 3 (subsubgrupo)'
        });
      }

      console.log(`🆕 Criando nó hierárquico manual: ${name} (nível ${level})`);

      const { data: node, error } = await supabase
        .from('defect_hierarchy')
        .insert({
          name: name.trim(),
          description: description.trim(),
          level,
          parent_id,
          color_hex: color_hex || '#3B82F6',
          icon: icon || 'folder',
          keywords: keywords || [],
          ai_confidence: 1.0, // Máxima confiança para criação manual
          total_occurrences: 0
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar nó hierárquico:', error);
        return res.status(500).json({
          success: false,
          error: error.code === '23505' ? 'Nó já existe' : 'Erro ao criar nó'
        });
      }

      // Atualizar cache
      await this.hierarchicalAI.refreshHierarchy();

      res.json({
        success: true,
        data: node,
        message: 'Nó hierárquico criado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao criar nó hierárquico:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}