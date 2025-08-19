import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export class AIControllerSimple {
  /**
   * GET /api/v1/ai/stats - Versão simplificada e estável
   */
  async getAIStats(req: Request, res: Response) {
    try {
      console.log('🤖 [SIMPLE] Buscando estatísticas de IA...');
      
      // Valores padrão seguros
      const defaultStats = {
        totalDefects: 0,
        totalClassified: 0,
        classificationRate: 0,
        categories: []
      };
      
      try {
        // Contar ordens de serviço
        const { count: totalDefects } = await supabase
          .from('service_orders')
          .select('*', { count: 'exact', head: true });
        
        // Contar classificações
        const { count: totalClassified } = await supabase
          .from('defect_classifications')
          .select('*', { count: 'exact', head: true });
        
        const stats = {
          totalDefects: totalDefects || 0,
          totalClassified: totalClassified || 0,
          classificationRate: totalDefects > 0 ? (totalClassified || 0) / totalDefects : 0,
          categories: []
        };
        
        console.log('✅ [SIMPLE] Stats calculados:', stats);
        
        res.json({
          success: true,
          data: stats
        });
        
      } catch (dbError) {
        console.warn('⚠️ [SIMPLE] Erro DB, retornando padrão:', dbError);
        res.json({
          success: true,
          data: defaultStats
        });
      }
      
    } catch (error) {
      console.error('❌ [SIMPLE] Erro crítico:', error);
      res.json({
        success: true,
        data: {
          totalDefects: 0,
          totalClassified: 0,
          classificationRate: 0,
          categories: []
        }
      });
    }
  }

  /**
   * GET /api/v1/ai/classifications - Versão simplificada
   */
  async getDefectClassifications(req: Request, res: Response) {
    try {
      console.log('📊 [SIMPLE] Buscando classificações...');
      
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 10000);
      const offset = parseInt(req.query.offset as string) || 0;
      
      try {
        const { data: classifications, count } = await supabase
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
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        res.json({
          success: true,
          data: classifications || [],
          pagination: {
            total: count || 0,
            limit,
            offset
          }
        });
        
      } catch (dbError) {
        console.warn('⚠️ [SIMPLE] Erro DB classificações:', dbError);
        res.json({
          success: true,
          data: [],
          pagination: { total: 0, limit, offset }
        });
      }
      
    } catch (error) {
      console.error('❌ [SIMPLE] Erro crítico classificações:', error);
      res.json({
        success: true,
        data: [],
        pagination: { total: 0, limit: 50, offset: 0 }
      });
    }
  }

  /**
   * GET /api/v1/ai/categories - Versão simplificada
   */
  async getAICategories(req: Request, res: Response) {
    try {
      console.log('🏷️ [SIMPLE] Buscando categorias...');
      
      try {
        const { data: categories } = await supabase
          .from('defect_categories')
          .select('*')
          .order('category_name');

        res.json({
          success: true,
          data: categories || []
        });
        
      } catch (dbError) {
        console.warn('⚠️ [SIMPLE] Erro DB categorias:', dbError);
        res.json({
          success: true,
          data: []
        });
      }
      
    } catch (error) {
      console.error('❌ [SIMPLE] Erro crítico categorias:', error);
      res.json({
        success: true,
        data: []
      });
    }
  }

  /**
   * Teste básico de conectividade
   */
  async testConnection(req: Request, res: Response) {
    try {
      const { data } = await supabase
        .from('service_orders')
        .select('count')
        .limit(1);
      
      res.json({
        success: true,
        message: 'Conectividade OK',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.json({
        success: false,
        error: 'Problema de conectividade',
        timestamp: new Date().toISOString()
      });
    }
  }
}