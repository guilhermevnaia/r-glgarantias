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
      
      // Validar range de anos permitidos
      if (year && (year < 2019 || year > 2025)) {
        console.log(`❌ Ano inválido solicitado: ${year}`);
        return res.status(400).json({ error: 'Ano deve estar entre 2019 e 2025' });
      }
      
      // Validar mês
      if (month && (month < 1 || month > 12)) {
        console.log(`❌ Mês inválido solicitado: ${month}`);
        return res.status(400).json({ error: 'Mês deve estar entre 1 e 12' });
      }
      
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

      // Aplicar filtro base: apenas dados de 2019-2025
      const validYearOrders = allOrders.filter(order => {
        if (!order.order_date) return false;
        const orderYear = new Date(order.order_date).getFullYear();
        return orderYear >= 2019 && orderYear <= 2025;
      });

      console.log(`🗓️ Dados filtrados por ano (2019-2025): ${validYearOrders.length} registros`);

      // Aplicar filtro se necessário
      let orders = validYearOrders;
      
      if (month && year) {
        // Filtro por mês e ano específicos
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
        
        orders = validYearOrders.filter(order => {
          if (!order.order_date) return false;
          const orderDate = order.order_date.split('T')[0];
          return orderDate >= startDate && orderDate <= endDate;
        });
        
        console.log(`🔍 Filtrado para ${month}/${year}: ${orders.length} registros`);
      } else if (year) {
        // Filtro apenas por ano
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;
        
        orders = validYearOrders.filter(order => {
          if (!order.order_date) return false;
          const orderDate = order.order_date.split('T')[0];
          return orderDate >= startDate && orderDate <= endDate;
        });
        
        console.log(`🔍 Filtrado para ano ${year}: ${orders.length} registros`);
      } else if (month) {
        // Filtro apenas por mês (todos os anos)
        orders = validYearOrders.filter(order => {
          if (!order.order_date) return false;
          const orderMonth = new Date(order.order_date).getMonth() + 1;
          return orderMonth === month;
        });
        
        console.log(`🔍 Filtrado para mês ${month}: ${orders.length} registros`);
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
        const parts = parseFloat(order.original_parts_value || order.parts_total || 0) / 2; // Dividir peças por 2
        const labor = parseFloat(order.labor_total || 0);
        return sum + parts + labor;
      }, 0);

      const partsTotal = orders.reduce((sum, order) => sum + (parseFloat(order.original_parts_value || order.parts_total || 0) / 2), 0); // Dividir peças por 2
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

      // Distribuição por ano (baseado nos dados FILTRADOS)
      const yearDistribution: Record<string, number> = {};
      orders.forEach(order => {
        if (order.order_date) {
          const orderYear = new Date(order.order_date).getFullYear().toString();
          yearDistribution[orderYear] = (yearDistribution[orderYear] || 0) + 1;
        }
      });

      // Tendência mensal (baseado nos dados FILTRADOS)
      const monthlyData: Record<string, { count: number; value: number }> = {};
      orders.forEach(order => {
        if (order.order_date) {
          const orderDate = new Date(order.order_date);
          const monthKey = `${orderDate.getMonth() + 1}/${orderDate.getFullYear()}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { count: 0, value: 0 };
          }
          
          monthlyData[monthKey].count++;
          const parts = parseFloat(order.original_parts_value || order.parts_total || 0) / 2; // Dividir peças por 2
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

      // Buscar todos os dados em múltiplas requisições (Supabase limita a 1000 por requisição)
      console.log('🔄 Buscando todos os registros em múltiplas páginas...');
      let allOrders: any[] = [];
      let supabasePage = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data: pageData, error: fetchError } = await supabase
          .from('service_orders')
          .select('*')
          .order('order_date', { ascending: false })
          .range(supabasePage * pageSize, (supabasePage + 1) * pageSize - 1);

        if (fetchError) {
          console.error('❌ Erro ao buscar página:', supabasePage, fetchError);
          return res.status(500).json({ error: 'Erro ao buscar ordens' });
        }

        if (!pageData || pageData.length === 0) {
          break; // Não há mais dados
        }

        allOrders = allOrders.concat(pageData);
        console.log(`📄 Página ${supabasePage + 1}: ${pageData.length} registros (total: ${allOrders.length})`);
        
        if (pageData.length < pageSize) {
          break; // Última página
        }
        
        supabasePage++;
      }
      
      console.log(`✅ Total de registros carregados: ${allOrders.length}`);

      // Filtrar apenas dados de 2019-2025
      const validOrders = (allOrders || []).filter(order => {
        if (!order.order_date) return false;
        const orderYear = new Date(order.order_date).getFullYear();
        return orderYear >= 2019 && orderYear <= 2025;
      });

      // Se limit for muito alto (>=5000), retornar todos os dados sem paginação
      let finalOrders;
      let finalPage;
      let finalTotalPages;
      
      if (limit >= 5000) {
        finalOrders = validOrders; // Todos os dados
        finalPage = 1;
        finalTotalPages = 1;
        console.log(`📋 Service Orders: Retornando TODOS os ${validOrders.length} registros válidos (2019-2025) sem paginação`);
      } else {
        // Aplicar paginação normal
        finalOrders = validOrders.slice(offset, offset + limit);
        finalPage = page;
        finalTotalPages = Math.ceil(validOrders.length / limit);
        console.log(`📋 Service Orders: ${validOrders.length} válidas (2019-2025), página ${page} com ${finalOrders.length} registros`);
      }

      const totalCount = validOrders.length;

      res.json({
        data: finalOrders,
        total: totalCount,
        page: finalPage,
        limit: finalOrders.length,
        totalPages: finalTotalPages,
        pagination: {
          total: totalCount,
          page: finalPage,
          totalPages: finalTotalPages
        }
      });

    } catch (error) {
      console.error('❌ Erro no getServiceOrders:', error);
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