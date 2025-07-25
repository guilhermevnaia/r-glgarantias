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
      const month = req.query.month ? parseInt(req.query.month as string) : null;
      const year = req.query.year ? parseInt(req.query.year as string) : null;
      
      console.log(`📊 Carregando dados completos...`);
      
      // Buscar contagem total primeiro
      const { count: totalCount } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true });

      console.log(`🔢 Total de registros no banco: ${totalCount}`);

      // Buscar todos os registros em batches
      let allOrders: any[] = [];
      
      try {
        const [page1, page2, page3] = await Promise.all([
          supabase.from('service_orders').select('*').range(0, 999),
          supabase.from('service_orders').select('*').range(1000, 1999),
          supabase.from('service_orders').select('*').range(2000, 2999)
        ]);

        if (page1.data) {
          allOrders = allOrders.concat(page1.data);
          console.log(`📄 Página 1: ${page1.data.length} registros`);
        }
        
        if (page2.data) {
          allOrders = allOrders.concat(page2.data);
          console.log(`📄 Página 2: ${page2.data.length} registros`);
        }
        
        if (page3.data) {
          allOrders = allOrders.concat(page3.data);
          console.log(`📄 Página 3: ${page3.data.length} registros`);
        }

        console.log(`✅ Total carregado: ${allOrders.length}`);

      } catch (error) {
        console.error('❌ Erro ao buscar dados:', error);
        return res.status(500).json({ error: 'Erro ao buscar dados' });
      }

      // Aplicar filtro se necessário
      let orders = allOrders;
      
      if (month && year) {
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
        
        orders = allOrders.filter(order => {
          if (!order.order_date) return false;
          const orderDate = order.order_date.split('T')[0];
          return orderDate >= startDate && orderDate <= endDate;
        });
        
        console.log(`🔍 Filtrado para ${month}/${year}: ${orders.length} registros`);
      }

      if (orders.length === 0) {
        console.log('⚠️ Nenhum dado encontrado');
        return res.json({
          totalOrders: 0,
          statusDistribution: { G: 0, GO: 0, GU: 0 },
          yearDistribution: {},
          topManufacturers: [],
          financialSummary: { totalValue: 0, averageValue: 0, partsTotal: 0, laborTotal: 0 },
          monthlyTrend: [],
          mechanicsCount: 0,
          defectsCount: 0,
          orders: []
        });
      }

      // Calcular estatísticas
      const statusDistribution = {
        G: orders.filter(o => o.order_status === 'G').length,
        GO: orders.filter(o => o.order_status === 'GO').length,
        GU: orders.filter(o => o.order_status === 'GU').length
      };

      const totalValue = orders.reduce((sum, order) => {
        const parts = parseFloat(order.original_parts_value || order.parts_total || 0);
        const labor = parseFloat(order.labor_total || 0);
        return sum + parts + labor;
      }, 0);

      const partsTotal = orders.reduce((sum, order) => sum + parseFloat(order.original_parts_value || order.parts_total || 0), 0);
      const laborTotal = orders.reduce((sum, order) => sum + parseFloat(order.labor_total || 0), 0);

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

      const uniqueMechanics = new Set(orders.map(o => o.responsible_mechanic).filter(Boolean));
      const uniqueDefects = new Set(orders.map(o => o.raw_defect_description).filter(Boolean));

      // Distribuição por ano (baseado em TODOS os dados)
      const yearDistribution: Record<string, number> = {};
      allOrders.forEach(order => {
        if (order.order_date) {
          const orderYear = new Date(order.order_date).getFullYear().toString();
          yearDistribution[orderYear] = (yearDistribution[orderYear] || 0) + 1;
        }
      });

      // Tendência mensal
      const monthlyData: Record<string, { count: number; value: number }> = {};
      allOrders.forEach(order => {
        if (order.order_date) {
          const orderDate = new Date(order.order_date);
          const monthKey = `${orderDate.getMonth() + 1}/${orderDate.getFullYear()}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { count: 0, value: 0 };
          }
          
          monthlyData[monthKey].count++;
          const parts = parseFloat(order.original_parts_value || order.parts_total || 0);
          const labor = parseFloat(order.labor_total || 0);
          monthlyData[monthKey].value += parts + labor;
        }
      });

      const monthlyTrend = Object.entries(monthlyData)
        .map(([month, data]) => ({ month, count: data.count, value: data.value }))
        .sort((a, b) => {
          const [monthA, yearA] = a.month.split('/').map(Number);
          const [monthB, yearB] = b.month.split('/').map(Number);
          return yearA - yearB || monthA - monthB;
        });

      const stats = {
        totalOrders: orders.length,
        statusDistribution,
        yearDistribution,
        topManufacturers,
        financialSummary: {
          totalValue,
          averageValue: orders.length > 0 ? totalValue / orders.length : 0,
          partsTotal,
          laborTotal
        },
        monthlyTrend,
        mechanicsCount: uniqueMechanics.size,
        defectsCount: uniqueDefects.size,
        orders: orders.slice(0, 50)
      };

      console.log(`✅ Estatísticas calculadas: ${stats.totalOrders} ordens`);
      res.json(stats);

    } catch (error) {
      console.error('❌ Erro geral:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Manter outros métodos iguais
  async getServiceOrders(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const { count } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true });

      const { data: orders, error } = await supabase
        .from('service_orders')
        .select('*')
        .order('order_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return res.status(500).json({ error: 'Erro ao buscar ordens' });
      }

      res.json({
        data: orders || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      });

    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getUploadLogs(req: Request, res: Response) {
    try {
      const { data: logs, error } = await supabase
        .from('upload_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        return res.status(500).json({ error: 'Erro ao buscar logs' });
      }

      res.json(logs || []);

    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}