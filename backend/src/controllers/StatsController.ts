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
        // ✅ CORREÇÃO: Calcular corretamente o último dia do mês usando uma abordagem mais robusta
        const lastDayOfMonth = new Date(year, month, 0).getDate();
        const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDayOfMonth}`;
        
        console.log(`🔍 DEBUG: Filtrando para ${month}/${year}`);
        console.log(`🔍 DEBUG: startDate = ${startDate}`);
        console.log(`🔍 DEBUG: endDate = ${endDate}`);
        console.log(`🔍 DEBUG: lastDayOfMonth = ${lastDayOfMonth}`);
        
        // ✅ NOVA ABORDAGEM: Usar Date objects para comparação mais precisa
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        orders = validYearOrders.filter(order => {
          if (!order.order_date) return false;
          
          // Converter a data da ordem para Date object
          const orderDateObj = new Date(order.order_date);
          const orderDateStr = order.order_date.split('T')[0];
          
          // Comparar usando Date objects (mais preciso)
          const isInRange = orderDateObj >= startDateObj && orderDateObj <= endDateObj;
          
          // Log detalhado para debug (apenas primeiras 5 OS para não poluir o log)
          if (validYearOrders.indexOf(order) < 5) {
            if (isInRange) {
              console.log(`✅ DEBUG: OS ${order.order_number} - Data: ${orderDateStr} (INCLUÍDA) - DateObj: ${orderDateObj.toISOString()}`);
            } else {
              console.log(`❌ DEBUG: OS ${order.order_number} - Data: ${orderDateStr} (EXCLUÍDA) - DateObj: ${orderDateObj.toISOString()} - Range: ${startDateObj.toISOString()} até ${endDateObj.toISOString()}`);
            }
          }
          
          return isInRange;
        });
        
        console.log(`🔍 Filtrado para ${month}/${year}: ${orders.length} registros (${startDate} até ${endDate})`);
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

      // Construir query com filtros
      let query = supabase
        .from('service_orders')
        .select('*', { count: 'exact' })
        .order('order_date', { ascending: false });

      // Aplicar filtros de data
      if (year) {
        const startDate = month 
          ? `${year}-${month.toString().padStart(2, '0')}-01`
          : `${year}-01-01`;
        // ✅ CORREÇÃO: Calcular corretamente o último dia do mês
        const lastDayOfMonth = month ? new Date(year, month, 0).getDate() : 31;
        const endDate = month 
          ? `${year}-${month.toString().padStart(2, '0')}-${lastDayOfMonth}`
          : `${year}-12-31`;
        
        query = query.gte('order_date', startDate).lte('order_date', endDate);
        console.log(`📅 Filtro de data: ${startDate} até ${endDate}`);
      } else {
        // Filtrar sempre por range válido (2019-2025)
        query = query.gte('order_date', '2019-01-01').lte('order_date', '2025-12-31');
      }

      // Filtro por status
      if (status && status !== 'all') {
        query = query.eq('order_status', status);
        console.log(`🏷️ Filtro de status: ${status}`);
      }

      // Filtro por fabricante
      if (manufacturer && manufacturer !== 'all') {
        query = query.eq('engine_manufacturer', manufacturer);
        console.log(`🏭 Filtro de fabricante: ${manufacturer}`);
      }

      // Filtro por mecânico
      if (mechanic && mechanic !== 'all') {
        query = query.eq('responsible_mechanic', mechanic);
        console.log(`👨‍🔧 Filtro de mecânico: ${mechanic}`);
      }

      // Filtro por modelo
      if (model && model !== 'all') {
        query = query.eq('vehicle_model', model);
        console.log(`🚗 Filtro de modelo: ${model}`);
      }

      // Filtro de busca textual
      if (search && search.trim()) {
        query = query.or(`order_number.ilike.%${search}%,engine_manufacturer.ilike.%${search}%,engine_description.ilike.%${search}%,vehicle_model.ilike.%${search}%,raw_defect_description.ilike.%${search}%,responsible_mechanic.ilike.%${search}%`);
        console.log(`🔍 Filtro de busca: ${search}`);
      }

      // Criar query separada para contagem
      let countQuery = supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true })
        .order('order_date', { ascending: false });

      // Aplicar os mesmos filtros para contagem
      if (year) {
        const startDate = month 
          ? `${year}-${month.toString().padStart(2, '0')}-01`
          : `${year}-01-01`;
        // ✅ CORREÇÃO: Calcular corretamente o último dia do mês
        const lastDayOfMonth = month ? new Date(year, month, 0).getDate() : 31;
        const endDate = month 
          ? `${year}-${month.toString().padStart(2, '0')}-${lastDayOfMonth}`
          : `${year}-12-31`;
        
        countQuery = countQuery.gte('order_date', startDate).lte('order_date', endDate);
      } else {
        countQuery = countQuery.gte('order_date', '2019-01-01').lte('order_date', '2025-12-31');
      }

      if (status && status !== 'all') {
        countQuery = countQuery.eq('order_status', status);
      }

      if (manufacturer && manufacturer !== 'all') {
        countQuery = countQuery.eq('engine_manufacturer', manufacturer);
      }

      if (mechanic && mechanic !== 'all') {
        countQuery = countQuery.eq('responsible_mechanic', mechanic);
      }

      if (model && model !== 'all') {
        countQuery = countQuery.eq('vehicle_model', model);
      }

      if (search && search.trim()) {
        countQuery = countQuery.or(`order_number.ilike.%${search}%,engine_manufacturer.ilike.%${search}%,engine_description.ilike.%${search}%,vehicle_model.ilike.%${search}%,raw_defect_description.ilike.%${search}%,responsible_mechanic.ilike.%${search}%`);
      }

      // Buscar contagem e dados em paralelo
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
        return res.status(500).json({ error: 'Erro ao buscar ordens' });
      }

      const filteredCount = countResult.count || 0;
      const orders = dataResult.data;

      const totalCount = filteredCount || 0;
      const totalPages = Math.ceil(totalCount / limit);

      console.log(`✅ Encontradas ${totalCount} ordens filtradas, retornando página ${page} com ${orders?.length || 0} registros`);

      res.json({
        data: orders || [],
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