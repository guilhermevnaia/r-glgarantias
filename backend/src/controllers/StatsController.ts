import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export class StatsController {
  async getStats(req: Request, res: Response) {
    try {
      console.log('📊 Carregando estatísticas gerais...');

      // Buscar estatísticas básicas
      const { data: orders, error } = await supabase
        .from('service_orders')
        .select('order_status, order_date, engine_manufacturer');

      if (error) {
        console.error('❌ Erro ao buscar dados:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao buscar estatísticas',
          details: error.message
        });
      }

      if (!orders || orders.length === 0) {
        return res.json({
          totalOrders: 0,
          statusDistribution: {},
          yearDistribution: {},
          topManufacturers: [],
          recentUploads: 0
        });
      }

      // Calcular distribuição por status
      const statusDistribution: Record<string, number> = {};
      orders.forEach(order => {
        statusDistribution[order.order_status] = (statusDistribution[order.order_status] || 0) + 1;
      });

      // Calcular distribuição por ano
      const yearDistribution: Record<string, number> = {};
      orders.forEach(order => {
        if (order.order_date) {
          const year = new Date(order.order_date).getFullYear().toString();
          yearDistribution[year] = (yearDistribution[year] || 0) + 1;
        }
      });

      // Calcular top fabricantes
      const manufacturerCount: Record<string, number> = {};
      orders.forEach(order => {
        if (order.engine_manufacturer) {
          manufacturerCount[order.engine_manufacturer] = 
            (manufacturerCount[order.engine_manufacturer] || 0) + 1;
        }
      });

      const topManufacturers = Object.entries(manufacturerCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Buscar uploads recentes (últimos 7 dias)
      const { data: recentUploadsData } = await supabase
        .from('upload_logs')
        .select('id')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const stats = {
        totalOrders: orders.length,
        statusDistribution,
        yearDistribution,
        topManufacturers,
        recentUploads: recentUploadsData?.length || 0
      };

      console.log('✅ Estatísticas carregadas:', {
        totalOrders: stats.totalOrders,
        manufacturers: stats.topManufacturers.length,
        years: Object.keys(stats.yearDistribution).length
      });

      res.json(stats);

    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async getServiceOrders(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      console.log(`📋 Carregando ordens de serviço - Página ${page}, Limite ${limit}`);

      // Buscar total de registros
      const { count } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true });

      // Buscar dados paginados
      const { data: orders, error } = await supabase
        .from('service_orders')
        .select('*')
        .order('order_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Erro ao buscar ordens:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao buscar ordens de serviço',
          details: error.message
        });
      }

      console.log(`✅ ${orders?.length || 0} ordens carregadas de ${count || 0} total`);

      res.json({
        data: orders || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      });

    } catch (error) {
      console.error('❌ Erro ao carregar ordens de serviço:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async getUploadLogs(req: Request, res: Response) {
    try {
      console.log('📝 Carregando logs de upload...');

      const { data: logs, error } = await supabase
        .from('upload_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Erro ao buscar logs:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao buscar logs de upload',
          details: error.message
        });
      }

      console.log(`✅ ${logs?.length || 0} logs carregados`);

      res.json(logs || []);

    } catch (error) {
      console.error('❌ Erro ao carregar logs:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}