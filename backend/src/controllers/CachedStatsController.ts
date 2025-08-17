import { Request, Response } from 'express';
import { cache, cacheKeys } from '../config/cache';
import supabase from '../config/supabase';

export class CachedStatsController {
  // Cache de estatísticas com 5 minutos
  static async getStats(req: Request, res: Response) {
    try {
      const { month, year } = req.query;
      const monthNum = month ? parseInt(month as string) : undefined;
      const yearNum = year ? parseInt(year as string) : undefined;

      // Verificar cache primeiro
      const cacheKey = cacheKeys.stats(monthNum, yearNum);
      const cachedStats = await cache.get(cacheKey);
      
      if (cachedStats) {
        console.log('📦 Cache HIT - Stats:', cacheKey);
        return res.json(cachedStats);
      }

      console.log('🔄 Cache MISS - Carregando stats:', cacheKey);

      // Construir filtros
      let query = supabase.from('service_orders').select('*');
      
      if (yearNum) {
        query = query.gte('order_date', `${yearNum}-01-01`);
        query = query.lt('order_date', `${yearNum + 1}-01-01`);
      }
      
      if (monthNum && yearNum) {
        const startDate = `${yearNum}-${monthNum.toString().padStart(2, '0')}-01`;
        const endDate = monthNum === 12 
          ? `${yearNum + 1}-01-01` 
          : `${yearNum}-${(monthNum + 1).toString().padStart(2, '0')}-01`;
        query = query.gte('order_date', startDate);
        query = query.lt('order_date', endDate);
      }

      const { data: orders, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar ordens:', error);
        return res.status(500).json({ success: false, error: error.message });
      }

      // Calcular estatísticas
      const stats = {
        totalOrders: orders?.length || 0,
        statusDistribution: orders?.reduce((acc: any, order: any) => {
          acc[order.order_status] = (acc[order.order_status] || 0) + 1;
          return acc;
        }, { G: 0, GO: 0, GU: 0 }) || { G: 0, GO: 0, GU: 0 },
        
        yearDistribution: orders?.reduce((acc: any, order: any) => {
          const year = new Date(order.order_date).getFullYear();
          acc[year] = (acc[year] || 0) + 1;
          return acc;
        }, {}) || {},
        
        topManufacturers: Object.entries(
          orders?.reduce((acc: any, order: any) => {
            const manufacturer = order.engine_manufacturer || 'Não informado';
            acc[manufacturer] = (acc[manufacturer] || 0) + 1;
            return acc;
          }, {}) || {}
        ).sort(([,a], [,b]) => (b as number) - (a as number))
         .slice(0, 10)
         .map(([name, count]) => ({ name, count })),
        
        financialSummary: (() => {
          const partsTotal = orders?.reduce((sum: number, order: any) => sum + (order.parts_total || 0), 0) || 0;
          const laborTotal = orders?.reduce((sum: number, order: any) => sum + (order.labor_total || 0), 0) || 0;
          const totalValue = partsTotal + laborTotal;
          const averageValue = orders?.length ? totalValue / orders.length : 0;

          return {
            totalValue,
            averageValue,
            partsTotal,
            laborTotal,
          };
        })(),
        
        monthlyTrend: this.calculateMonthlyTrend(orders || []),
        mechanicsCount: new Set(orders?.map((order: any) => order.responsible_mechanic)).size || 0,
        defectsCount: orders?.length || 0,
        orders: orders || []
      };

      // Salvar no cache por 5 minutos
      await cache.set(cacheKey, stats, 300);
      
      console.log('✅ Stats calculadas e cacheadas:', {
        key: cacheKey,
        totalOrders: stats.totalOrders,
        cacheTime: '5min'
      });

      res.json(stats);
    } catch (error) {
      console.error('❌ Erro no CachedStatsController:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }
  }

  private static calculateMonthlyTrend(orders: any[]) {
    const monthlyData: { [key: string]: { count: number; value: number } } = {};
    
    orders.forEach(order => {
      const date = new Date(order.order_date);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, value: 0 };
      }
      
      monthlyData[monthKey].count++;
      monthlyData[monthKey].value += order.grand_total || 0;
    });
    
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        count: data.count,
        value: data.value
      }));
  }

  // Cache de service orders com 2 minutos
  static async getServiceOrders(req: Request, res: Response) {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        search: req.query.search as string,
        status: req.query.status as string,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        month: req.query.month ? parseInt(req.query.month as string) : undefined,
        manufacturer: req.query.manufacturer as string,
        mechanic: req.query.mechanic as string,
        model: req.query.model as string
      };

      // Verificar cache
      const cacheKey = cacheKeys.serviceOrders(params);
      const cachedOrders = await cache.get(cacheKey);
      
      if (cachedOrders) {
        console.log('📦 Cache HIT - Service Orders:', cacheKey);
        return res.json(cachedOrders);
      }

      console.log('🔄 Cache MISS - Carregando service orders:', cacheKey);

      // Construir query
      let query = supabase
        .from('service_orders')
        .select(`
          *,
          defect_classifications(
            id,
            category_id,
            ai_confidence,
            ai_reasoning,
            defect_categories(
              category_name,
              color_hex,
              icon
            )
          )
        `, { count: 'exact' });

      // Aplicar filtros
      if (params.search) {
        query = query.or(`order_number.ilike.%${params.search}%,raw_defect_description.ilike.%${params.search}%,responsible_mechanic.ilike.%${params.search}%`);
      }
      
      if (params.status && params.status !== 'all') {
        query = query.eq('order_status', params.status);
      }
      
      if (params.year) {
        query = query.gte('order_date', `${params.year}-01-01`);
        query = query.lt('order_date', `${params.year + 1}-01-01`);
      }
      
      if (params.month && params.year) {
        const startDate = `${params.year}-${params.month.toString().padStart(2, '0')}-01`;
        const endDate = params.month === 12 
          ? `${params.year + 1}-01-01` 
          : `${params.year}-${(params.month + 1).toString().padStart(2, '0')}-01`;
        query = query.gte('order_date', startDate);
        query = query.lt('order_date', endDate);
      }
      
      if (params.manufacturer && params.manufacturer !== 'all') {
        query = query.eq('engine_manufacturer', params.manufacturer);
      }
      
      if (params.mechanic && params.mechanic !== 'all') {
        query = query.eq('responsible_mechanic', params.mechanic);
      }
      
      if (params.model && params.model !== 'all') {
        query = query.eq('vehicle_model', params.model);
      }

      // Paginação
      const offset = (params.page - 1) * params.limit;
      query = query.range(offset, offset + params.limit - 1);
      query = query.order('order_date', { ascending: false });

      const { data: orders, error, count } = await query;

      if (error) {
        console.error('❌ Erro ao buscar service orders:', error);
        return res.status(500).json({ success: false, error: error.message });
      }

      const result = {
        data: orders || [],
        pagination: {
          page: params.page,
          limit: params.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / params.limit)
        }
      };

      // Cache por 2 minutos
      await cache.set(cacheKey, result, 120);
      
      console.log('✅ Service Orders carregadas e cacheadas:', {
        key: cacheKey,
        count: orders?.length || 0,
        total: count,
        cacheTime: '2min'
      });

      res.json(result);
    } catch (error) {
      console.error('❌ Erro no getServiceOrders:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }
  }

  // Limpar cache específico
  static async clearCache(req: Request, res: Response) {
    try {
      const { type } = req.body;
      
      if (type === 'all') {
        await cache.clear();
        console.log('🧹 Cache completo limpo');
      } else if (type === 'stats') {
        // Limpar apenas caches de stats
        await cache.del('stats:all:all');
        console.log('🧹 Cache de stats limpo');
      }
      
      res.json({ 
        success: true, 
        message: 'Cache limpo com sucesso' 
      });
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao limpar cache' 
      });
    }
  }

  // Status do cache para monitoramento
  static async getCacheStatus(req: Request, res: Response) {
    try {
      const status = cache.getStatus();
      res.json({ 
        success: true, 
        cache: status 
      });
    } catch (error) {
      console.error('❌ Erro ao obter status do cache:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao obter status do cache' 
      });
    }
  }
}