import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export class StatsController {
  async getStats(req: Request, res: Response) {
    try {
      const { month, year, search, status, manufacturer, mechanic, model } = req.query;

      console.log('📊 Carregando estatísticas com filtros:', { month, year, search, status, manufacturer, mechanic, model });

      // OTIMIZAÇÃO: Usar consultas separadas e mais eficientes
      let baseQuery = supabase.from('service_orders');
      
      // Construir filtros base
      const filters: any[] = [];
      if (year) {
        const yearNum = parseInt(year as string);
        if (yearNum < 2019 || yearNum > 2025) {
          return res.status(400).json({ error: 'Ano deve estar entre 2019 e 2025' });
        }
        const monthNum = month ? parseInt(month as string) : null;
        if (monthNum && (monthNum < 1 || monthNum > 12)) {
          return res.status(400).json({ error: 'Mês deve estar entre 1 e 12' });
        }

        const startDate = monthNum ? `${yearNum}-${String(monthNum).padStart(2, '0')}-01` : `${yearNum}-01-01`;
        const lastDayOfMonth = monthNum ? new Date(yearNum, monthNum, 0).getDate() : 31;
        const endDate = monthNum ? `${yearNum}-${String(monthNum).padStart(2, '0')}-${lastDayOfMonth}` : `${yearNum}-12-31`;
        
        filters.push(['order_date', 'gte', startDate]);
        filters.push(['order_date', 'lte', endDate]);
      } else {
        filters.push(['order_date', 'gte', '2019-01-01']);
        filters.push(['order_date', 'lte', '2025-12-31']);
      }

      // Aplicar outros filtros
      if (status && status !== 'all') filters.push(['order_status', 'eq', status as string]);
      if (manufacturer && manufacturer !== 'all') filters.push(['engine_manufacturer', 'eq', manufacturer as string]);
      if (mechanic && mechanic !== 'all') filters.push(['responsible_mechanic', 'eq', mechanic as string]);
      if (model && model !== 'all') filters.push(['vehicle_model', 'eq', model as string]);

      // CONSULTA 1: Contar total e distribuição por status (mais eficiente)
      let countQuery = baseQuery.select('order_status', { count: 'exact', head: true });
      for (const [field, op, value] of filters) {
        countQuery = (countQuery as any)[op](field, value);
      }
      
      if (search && (search as string).trim()) {
        const searchQuery = search as string;
        countQuery = countQuery.or(`order_number.ilike.%${searchQuery}%,engine_manufacturer.ilike.%${searchQuery}%,engine_description.ilike.%${searchQuery}%,vehicle_model.ilike.%${searchQuery}%,raw_defect_description.ilike.%${searchQuery}%,responsible_mechanic.ilike.%${searchQuery}%`);
      }

      // CONSULTA 2: Buscar apenas os campos necessários para os dados completos
      let dataQuery = baseQuery.select('id, order_number, order_date, order_status, engine_manufacturer, responsible_mechanic, vehicle_model, parts_total, labor_total, raw_defect_description, grand_total');
      for (const [field, op, value] of filters) {
        dataQuery = (dataQuery as any)[op](field, value);
      }
      
      if (search && (search as string).trim()) {
        const searchQuery = search as string;
        dataQuery = dataQuery.or(`order_number.ilike.%${searchQuery}%,engine_manufacturer.ilike.%${searchQuery}%,engine_description.ilike.%${searchQuery}%,vehicle_model.ilike.%${searchQuery}%,raw_defect_description.ilike.%${searchQuery}%,responsible_mechanic.ilike.%${searchQuery}%`);
      }

      // Executar ambas consultas em paralelo
      const [countResult, dataResult] = await Promise.all([
        countQuery,
        dataQuery.limit(1000) // Limitar para não trazer muitos dados
      ]);

      if (countResult.error || dataResult.error) {
        console.error('❌ Erro ao buscar dados:', countResult.error || dataResult.error);
        return res.status(500).json({ error: 'Erro ao buscar dados' });
      }

      const totalCount = countResult.count || 0;
      const orders = dataResult.data || [];

      console.log(`✅ Total de registros encontrados: ${orders.length} (de ${totalCount} total)`);

      if (totalCount === 0) {
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

      const partsTotal = orders.reduce((sum, order) => sum + parseFloat(order.parts_total || 0), 0);
      const laborTotal = orders.reduce((sum, order) => sum + parseFloat(order.labor_total || 0), 0);
      const totalValue = partsTotal + laborTotal;

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
          // Usar parts_total + labor_total
          const parts = parseFloat(order.parts_total || 0);
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

      // Buscar classificações para as ordens que serão retornadas
      const ordersToReturn = orders.slice(0, 50);
      const orderIds = ordersToReturn.map(order => order.id).filter(id => id && !isNaN(id));
      
      console.log(`🔍 Buscando classificações para ${orderIds.length} ordens:`, orderIds.slice(0, 5));
      
      let classifications = [];
      if (orderIds.length > 0) {
        // Buscar classificações para esses IDs
        const result = await supabase
          .from('defect_classifications')
          .select(`
            service_order_id,
            id,
            category_id,
            ai_confidence,
            ai_reasoning,
            is_reviewed,
            defect_categories (
              category_name,
              color_hex,
              icon
            )
          `)
          .in('service_order_id', orderIds);
          
        classifications = result.data || [];
        console.log(`✅ Encontradas ${classifications.length} classificações`);
      }
      
      // Mapear classificações por service_order_id
      const classificationsMap = new Map();
      if (classifications) {
        classifications.forEach(classification => {
          if (!classificationsMap.has(classification.service_order_id)) {
            classificationsMap.set(classification.service_order_id, []);
          }
          classificationsMap.get(classification.service_order_id).push(classification);
        });
      }
      
      // Adicionar classificações aos dados das ordens
      const ordersWithClassifications = ordersToReturn.map(order => ({
        ...order,
        defect_classifications: classificationsMap.get(order.id) || []
      }));
      
      console.log(`🤖 Adicionadas classificações para ${classificationsMap.size} ordens de ${ordersToReturn.length}`);

      const stats = {
        totalOrders: totalCount, // Usar o count total da base de dados
        totalShown: orders.length, // Quantos registros estão sendo mostrados
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
        orders: ordersWithClassifications
      };

      console.log(`✅ Estatísticas calculadas: ${stats.totalOrders} ordens total, ${stats.totalShown} mostradas`);
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
      
      // Extrair parâmetros de filtro
      const search = req.query.search as string;
      const status = req.query.status as string;
      const month = req.query.month ? parseInt(req.query.month as string) : null;
      const year = req.query.year ? parseInt(req.query.year as string) : null;
      const manufacturer = req.query.manufacturer as string;
      const mechanic = req.query.mechanic as string;
      const model = req.query.model as string;

      console.log('🔄 Buscando ordens com filtros:', { 
        page, limit, search, status, month, year, manufacturer, mechanic, model 
      });

      // OTIMIZAÇÃO: Usar consultas mais eficientes
      console.log('🔍 Construindo query otimizada...');
      let query = supabase
        .from('service_orders')
        .select('id, order_number, order_date, order_status, engine_manufacturer, responsible_mechanic, vehicle_model, parts_total, labor_total, raw_defect_description, grand_total, engine_description')
        .order('order_date', { ascending: false });
      
      console.log('✅ Query construída com sucesso');


      // Aplicar todos os filtros usando um helper function
      const applyFilters = (q: any) => {
        if (year) {
          const startDate = month 
            ? `${year}-${month.toString().padStart(2, '0')}-01`
            : `${year}-01-01`;
          const lastDayOfMonth = month ? new Date(year, month, 0).getDate() : 31;
          const endDate = month 
            ? `${year}-${month.toString().padStart(2, '0')}-${lastDayOfMonth}`
            : `${year}-12-31`;
          q = q.gte('order_date', startDate).lte('order_date', endDate);
        } else {
          q = q.gte('order_date', '2019-01-01').lte('order_date', '2025-12-31');
        }

        if (status && status !== 'all') q = q.eq('order_status', status);
        if (manufacturer && manufacturer !== 'all') q = q.eq('engine_manufacturer', manufacturer);
        if (mechanic && mechanic !== 'all') q = q.eq('responsible_mechanic', mechanic);
        if (model && model !== 'all') q = q.eq('vehicle_model', model);
        if (search && search.trim()) {
          q = q.or(`order_number.ilike.%${search}%,engine_manufacturer.ilike.%${search}%,engine_description.ilike.%${search}%,vehicle_model.ilike.%${search}%,raw_defect_description.ilike.%${search}%,responsible_mechanic.ilike.%${search}%`);
        }
        return q;
      };

      // Aplicar filtros à query principal
      query = applyFilters(query);

      // Criar query de contagem mais eficiente
      let countQuery = supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true });
      countQuery = applyFilters(countQuery);

      // Buscar contagem e dados em paralelo
      console.log('🚀 Executando queries em paralelo...');
      const [countResult, dataResult] = await Promise.all([
        countQuery,
        query.range(offset, offset + limit - 1)
      ]);

      if (countResult.error) {
        console.error('❌ Erro ao contar registros filtrados:', countResult.error);
        return res.status(500).json({ error: 'Erro ao contar registros filtrados' });
      }

      if (dataResult.error) {
        console.error('❌ Erro ao buscar ordens:', dataResult.error);
        console.error('   Detalhes do erro:', dataResult.error.details);
        console.error('   Código:', dataResult.error.code);
        return res.status(500).json({ error: 'Erro ao buscar ordens' });
      }

      console.log('✅ Queries executadas com sucesso');
      const filteredCount = countResult.count || 0;
      const orders = dataResult.data || [];

      // Buscar classificações apenas para os registros retornados
      let ordersWithClassifications = orders;
      if (orders.length > 0) {
        const orderIds = orders.map(order => order.id).filter(id => id && !isNaN(id));
        
        console.log(`🔍 Service Orders - Buscando classificações para ${orderIds.length} ordens:`, orderIds.slice(0, 3));
        
        let classifications = [];
        if (orderIds.length > 0) {
          const result = await supabase
            .from('defect_classifications')
            .select(`
              service_order_id,
              id,
              category_id,
              ai_confidence,
              ai_reasoning,
              is_reviewed,
              defect_categories (
                category_name,
                color_hex,
                icon
              )
            `)
            .in('service_order_id', orderIds);
            
          classifications = result.data || [];
          console.log(`✅ Service Orders - Encontradas ${classifications.length} classificações`);
        }
        
        // Mapear classificações por service_order_id
        const classificationsMap = new Map();
        if (classifications) {
          classifications.forEach(classification => {
            if (!classificationsMap.has(classification.service_order_id)) {
              classificationsMap.set(classification.service_order_id, []);
            }
            classificationsMap.get(classification.service_order_id).push(classification);
          });
        }
        
        // Adicionar classificações aos dados das ordens
        ordersWithClassifications = orders.map(order => ({
          ...order,
          defect_classifications: classificationsMap.get(order.id) || []
        }));
      }

      const totalCount = filteredCount || 0;
      const totalPages = Math.ceil(totalCount / limit);

      console.log(`✅ Encontradas ${totalCount} ordens filtradas, retornando página ${page} com ${ordersWithClassifications.length} registros`);

      res.json({
        data: ordersWithClassifications,
        total: totalCount,
        page: page,
        limit: limit,
        totalPages: totalPages,
        pagination: {
          total: totalCount,
          page: page,
          totalPages: totalPages
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

  async updateServiceOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log(`🔄 Atualizando OS ID: ${id}`);
      console.log(`📝 Dados para atualizar:`, updateData);

      // Validar campos obrigatórios
      if (!id) {
        return res.status(400).json({ error: 'ID da OS é obrigatório' });
      }

      // Validar e processar dados antes da atualização
      const processedData: any = {};

      // Campos de texto
      if (updateData.order_number !== undefined) processedData.order_number = String(updateData.order_number).trim();
      if (updateData.engine_manufacturer !== undefined) processedData.engine_manufacturer = updateData.engine_manufacturer ? String(updateData.engine_manufacturer).trim() : null;
      if (updateData.engine_description !== undefined) processedData.engine_description = updateData.engine_description ? String(updateData.engine_description).trim() : null;
      if (updateData.vehicle_model !== undefined) processedData.vehicle_model = updateData.vehicle_model ? String(updateData.vehicle_model).trim() : null;
      if (updateData.raw_defect_description !== undefined) processedData.raw_defect_description = updateData.raw_defect_description ? String(updateData.raw_defect_description).trim() : null;
      if (updateData.responsible_mechanic !== undefined) processedData.responsible_mechanic = updateData.responsible_mechanic ? String(updateData.responsible_mechanic).trim() : null;

      // Campos numéricos com validação
      if (updateData.parts_total !== undefined) {
        const partsValue = parseFloat(updateData.parts_total);
        if (isNaN(partsValue) || partsValue < 0) {
          return res.status(400).json({ error: 'Total de peças deve ser um número positivo' });
        }
        processedData.parts_total = partsValue;
        // Manter consistência entre parts_total e original_parts_value
        processedData.original_parts_value = partsValue;
      }

      if (updateData.labor_total !== undefined) {
        const laborValue = parseFloat(updateData.labor_total);
        if (isNaN(laborValue) || laborValue < 0) {
          return res.status(400).json({ error: 'Total de serviços deve ser um número positivo' });
        }
        processedData.labor_total = laborValue;
      }

      if (updateData.grand_total !== undefined) {
        const grandValue = parseFloat(updateData.grand_total);
        if (isNaN(grandValue) || grandValue < 0) {
          return res.status(400).json({ error: 'Total geral deve ser um número positivo' });
        }
        processedData.grand_total = grandValue;
      }

      // Status com validação
      if (updateData.order_status !== undefined) {
        const validStatuses = ['G', 'GO', 'GU'];
        const status = String(updateData.order_status).trim().toUpperCase();
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ error: 'Status deve ser G, GO ou GU' });
        }
        processedData.order_status = status;
      }

      // Data com validação
      if (updateData.order_date !== undefined) {
        try {
          const date = new Date(updateData.order_date);
          if (isNaN(date.getTime())) {
            return res.status(400).json({ error: 'Data inválida' });
          }
          
          const year = date.getFullYear();
          if (year < 2019 || year > 2025) {
            return res.status(400).json({ error: 'Data deve estar entre 2019 e 2025' });
          }
          
          processedData.order_date = date.toISOString();
        } catch (error) {
          return res.status(400).json({ error: 'Formato de data inválido' });
        }
      }

      // Atualizar campo updated_at
      processedData.updated_at = new Date().toISOString();
      
      // ✅ MARCAR COMO EDITADO MANUALMENTE
      processedData.manually_edited = true;
      processedData.last_edit_date = new Date().toISOString();
      processedData.last_edited_by = 'user'; // TODO: Implementar sistema de usuários

      // Verificar se a OS existe
      const { data: existingOrder, error: fetchError } = await supabase
        .from('service_orders')
        .select('id, order_number')
        .eq('id', id)
        .single();

      if (fetchError || !existingOrder) {
        console.log(`❌ OS não encontrada: ${id}`);
        return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
      }

      // Executar atualização
      const { data: updatedOrder, error } = await supabase
        .from('service_orders')
        .update(processedData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error(`❌ Erro ao atualizar OS:`, error);
        return res.status(500).json({ error: 'Erro ao atualizar ordem de serviço' });
      }

      console.log(`✅ OS atualizada com sucesso: ${existingOrder.order_number}`);
      console.log(`📊 Campos atualizados: ${Object.keys(processedData).join(', ')}`);

      res.json({
        success: true,
        message: 'Ordem de serviço atualizada com sucesso',
        data: updatedOrder
      });

    } catch (error) {
      console.error('❌ Erro interno ao atualizar OS:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}