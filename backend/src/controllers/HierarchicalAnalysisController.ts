import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class HierarchicalAnalysisController {
  /**
   * Obter análise hierárquica completa (Grupos > Subgrupos > Dados específicos)
   */
  async getHierarchicalAnalysis(req: Request, res: Response) {
    try {
      const { month, year, search, status, manufacturer, mechanic, model } = req.query;
      console.log('🔍 Iniciando análise hierárquica com filtros:', { month, year, search, status, manufacturer, mechanic, model });

      // 1. Buscar todas as categorias com informação hierárquica (isso não muda)
      const { data: categories, error: categoriesError } = await supabase
        .from('defect_categories')
        .select('*')
        .order('total_occurrences', { ascending: false });

      if (categoriesError) {
        console.error('❌ Erro ao buscar categorias:', categoriesError);
        return res.status(500).json({ 
          success: false, 
          error: 'Erro ao buscar categorias' 
        });
      }

      // 2. Processar hierarquia: identificar grupos principais e subgrupos
      const hierarchyMap = new Map();
      const subgroups: any[] = [];
      const mainGroups: any[] = [];

      categories?.forEach(category => {
        const description = category.description || '';
        const groupMatch = description.match(/\[GRUPO: (.+?)\]/);
        const isSubgroup = description.includes('[SUBGRUPO');

        if (isSubgroup && groupMatch) {
          const mainGroupName = groupMatch[1];
          subgroups.push({
            ...category,
            main_group: mainGroupName,
            level: 'subgroup'
          });

          if (!hierarchyMap.has(mainGroupName)) {
            hierarchyMap.set(mainGroupName, {
              name: mainGroupName,
              total_occurrences: 0,
              subgroups: [],
              color: this.getGroupColor(mainGroupName),
              icon: this.getGroupIcon(mainGroupName)
            });
          }

          const group = hierarchyMap.get(mainGroupName);
          group.subgroups.push(category);
          group.total_occurrences += category.total_occurrences || 0;

        } else if (groupMatch && !isSubgroup) {
          const groupName = groupMatch[1];
          mainGroups.push({
            ...category,
            main_group: groupName,
            level: 'main_group'
          });
        }
      });

      // 3. Buscar dados de ordens de serviço com filtros
      let query = supabase
        .from('service_orders')
        .select(`
          id,
          order_date,
          engine_manufacturer,
          vehicle_model,
          raw_defect_description,
          grand_total,
          defect_classifications!inner(
            category_id,
            category_name,
            ai_confidence
          )
        `);

      // Aplicar filtros de data
      if (year) {
        const yearNum = parseInt(year as string);
        const monthNum = month ? parseInt(month as string) : null;
        const startDate = monthNum ? `${yearNum}-${String(monthNum).padStart(2, '0')}-01` : `${yearNum}-01-01`;
        const lastDayOfMonth = monthNum ? new Date(yearNum, monthNum, 0).getDate() : 31;
        const endDate = monthNum ? `${yearNum}-${String(monthNum).padStart(2, '0')}-${lastDayOfMonth}` : `${yearNum}-12-31`;
        query = query.gte('order_date', startDate).lte('order_date', endDate);
      }

      // Aplicar outros filtros
      if (status && status !== 'all') query = query.eq('order_status', status as string);
      if (manufacturer && manufacturer !== 'all') query = query.eq('engine_manufacturer', manufacturer as string);
      if (mechanic && mechanic !== 'all') query = query.eq('responsible_mechanic', mechanic as string);
      if (model && model !== 'all') query = query.eq('vehicle_model', model as string);
      if (search && (search as string).trim()) {
        const searchQuery = search as string;
        query = query.or(`raw_defect_description.ilike.%${searchQuery}%,vehicle_model.ilike.%${searchQuery}%`);
      }

      const { data: serviceOrders, error: serviceOrdersError } = await query.limit(5000);

      if (serviceOrdersError) {
        console.error('❌ Erro ao buscar ordens de serviço:', serviceOrdersError);
        return res.status(500).json({ success: false, error: 'Erro ao buscar ordens de serviço' });
      }

      // 4. Calcular métricas por subgrupo
      const subgroupMetrics = await this.calculateSubgroupMetrics(subgroups, serviceOrders || []);

      // 5. Preparar resposta estruturada
      const hierarchy = Array.from(hierarchyMap.values()).map(group => ({
        ...group,
        subgroups: group.subgroups.map((subgroup: any) => ({
          ...subgroup,
          metrics: subgroupMetrics.get(subgroup.id) || {
            total_cases: 0,
            avg_cost: 0,
            top_manufacturers: [],
            monthly_trend: []
          }
        }))
      }));

      // 6. Estatísticas gerais
      const totalSubgroups = subgroups.length;
      const totalMainGroups = Array.from(hierarchyMap.keys()).length;
      const totalCases = hierarchy.reduce((sum, group) => sum + group.total_occurrences, 0);

      console.log(`✅ Análise concluída: ${totalMainGroups} grupos, ${totalSubgroups} subgrupos`);

      res.json({
        success: true,
        data: {
          hierarchy,
          statistics: {
            total_main_groups: totalMainGroups,
            total_subgroups: totalSubgroups,
            total_cases: totalCases,
            coverage_percentage: serviceOrders ? (totalCases / serviceOrders.length * 100) : 0
          },
          subgroups: subgroups.map(sg => ({
            ...sg,
            metrics: subgroupMetrics.get(sg.id)
          }))
        }
      });

    } catch (error) {
      console.error('❌ Erro na análise hierárquica:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * Obter drill-down específico de um subgrupo
   */
  async getSubgroupDrillDown(req: Request, res: Response) {
    try {
      const { subgroupId } = req.params;
      
      console.log(`🔍 Drill-down para subgrupo ${subgroupId}...`);

      // 1. Buscar informações do subgrupo
      const { data: subgroup } = await supabase
        .from('defect_categories')
        .select('*')
        .eq('id', subgroupId)
        .single();

      if (!subgroup) {
        return res.status(404).json({
          success: false,
          error: 'Subgrupo não encontrado'
        });
      }

      // 2. Buscar ordens de serviço relacionadas a este subgrupo
      const { data: relatedOrders } = await supabase
        .from('service_orders')
        .select(`
          id,
          order_number,
          order_date,
          engine_manufacturer,
          vehicle_model,
          raw_defect_description,
          parts_total,
          labor_total,
          grand_total,
          defect_classifications!inner(
            category_id,
            category_name,
            ai_confidence,
            ai_reasoning
          )
        `)
        .eq('defect_classifications.category_name', subgroup.category_name)
        .order('order_date', { ascending: false })
        .limit(200);

      // 3. Calcular métricas detalhadas
      const metrics = this.calculateDetailedMetrics(relatedOrders || []);

      // 4. Identificar padrões específicos
      const patterns = this.identifyPatterns(relatedOrders || [], subgroup);

      // 5. Análise temporal
      const temporalAnalysis = this.calculateTemporalTrends(relatedOrders || []);

      res.json({
        success: true,
        data: {
          subgroup,
          metrics,
          patterns,
          temporal_analysis: temporalAnalysis,
          recent_cases: (relatedOrders || []).slice(0, 10),
          total_cases: relatedOrders?.length || 0
        }
      });

    } catch (error) {
      console.error('❌ Erro no drill-down:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * Comparar subgrupos dentro do mesmo grupo principal
   */
  async compareSubgroups(req: Request, res: Response) {
    try {
      const { mainGroup } = req.params;
      
      console.log(`📊 Comparando subgrupos do grupo: ${mainGroup}`);

      // 1. Buscar todos os subgrupos do grupo principal
      const { data: subgroups } = await supabase
        .from('defect_categories')
        .select('*')
        .ilike('description', `%[GRUPO: ${mainGroup}]%`)
        .ilike('description', '%[SUBGRUPO%')
        .order('total_occurrences', { ascending: false });

      if (!subgroups || subgroups.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Nenhum subgrupo encontrado para este grupo'
        });
      }

      // 2. Calcular métricas comparativas
      const comparisons = await Promise.all(
        subgroups.map(async (subgroup) => {
          const { data: orders } = await supabase
            .from('service_orders')
            .select(`
              id,
              order_date,
              engine_manufacturer,
              vehicle_model,
              grand_total,
              defect_classifications!inner(category_name)
            `)
            .eq('defect_classifications.category_name', subgroup.category_name)
            .limit(500);

          const metrics = this.calculateDetailedMetrics(orders || []);
          
          return {
            subgroup,
            metrics,
            recent_trend: this.calculateRecentTrend(orders || [])
          };
        })
      );

      res.json({
        success: true,
        data: {
          main_group: mainGroup,
          subgroups_comparison: comparisons,
          total_subgroups: subgroups.length,
          summary: {
            total_cases: comparisons.reduce((sum, comp) => sum + comp.metrics.total_cases, 0),
            avg_cost: comparisons.reduce((sum, comp) => sum + comp.metrics.avg_cost, 0) / comparisons.length,
            most_frequent: comparisons[0]?.subgroup.category_name || 'N/A'
          }
        }
      });

    } catch (error) {
      console.error('❌ Erro na comparação:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }
  }

  // Métodos auxiliares privados
  private async calculateSubgroupMetrics(subgroups: any[], serviceOrders: any[]) {
    const metrics = new Map();

    for (const subgroup of subgroups) {
      const relatedOrders = serviceOrders.filter(order => 
        order.defect_classifications?.some((dc: any) => 
          dc.category_name === subgroup.category_name
        )
      );

      const totalCases = relatedOrders.length;
      const avgCost = totalCases > 0 
        ? relatedOrders.reduce((sum, order) => sum + (order.grand_total || 0), 0) / totalCases 
        : 0;

      // Top 3 fabricantes
      const manufacturerCount = new Map();
      relatedOrders.forEach(order => {
        const manufacturer = order.engine_manufacturer;
        if (manufacturer) {
          manufacturerCount.set(manufacturer, (manufacturerCount.get(manufacturer) || 0) + 1);
        }
      });

      const topManufacturers = Array.from(manufacturerCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

      // Tendência mensal (últimos 6 meses)
      const monthlyTrend = this.calculateMonthlyTrend(relatedOrders);

      metrics.set(subgroup.id, {
        total_cases: totalCases,
        avg_cost: avgCost,
        top_manufacturers: topManufacturers,
        monthly_trend: monthlyTrend
      });
    }

    return metrics;
  }

  private calculateDetailedMetrics(orders: any[]) {
    if (!orders || orders.length === 0) {
      return {
        total_cases: 0,
        avg_cost: 0,
        total_cost: 0,
        cost_distribution: {},
        manufacturer_distribution: {},
        model_distribution: {}
      };
    }

    const totalCases = orders.length;
    const totalCost = orders.reduce((sum, order) => sum + (order.grand_total || 0), 0);
    const avgCost = totalCost / totalCases;

    // Distribuições
    const manufacturerDist = new Map();
    const modelDist = new Map();
    const costRanges = { low: 0, medium: 0, high: 0 };

    orders.forEach(order => {
      // Fabricantes
      if (order.engine_manufacturer) {
        manufacturerDist.set(order.engine_manufacturer, 
          (manufacturerDist.get(order.engine_manufacturer) || 0) + 1);
      }

      // Modelos
      if (order.vehicle_model) {
        modelDist.set(order.vehicle_model, 
          (modelDist.get(order.vehicle_model) || 0) + 1);
      }

      // Faixas de custo
      const cost = order.grand_total || 0;
      if (cost < 500) costRanges.low++;
      else if (cost < 1500) costRanges.medium++;
      else costRanges.high++;
    });

    return {
      total_cases: totalCases,
      avg_cost: avgCost,
      total_cost: totalCost,
      cost_distribution: costRanges,
      manufacturer_distribution: Object.fromEntries(manufacturerDist),
      model_distribution: Object.fromEntries(modelDist)
    };
  }

  private identifyPatterns(orders: any[], subgroup: any) {
    // Identificar padrões nos defeitos
    const keywords = subgroup.keywords || [];
    const descriptions = orders.map(o => o.raw_defect_description || '').filter(Boolean);
    
    const patterns = {
      common_keywords: keywords.slice(0, 5),
      description_patterns: this.extractCommonPhrases(descriptions),
      severity_indicators: this.identifySeverityIndicators(descriptions)
    };

    return patterns;
  }

  private calculateTemporalTrends(orders: any[]) {
    // Calcular tendências temporais dos últimos 12 meses
    const monthlyData = new Map();
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = month.toISOString().substr(0, 7); // YYYY-MM
      monthlyData.set(monthKey, { count: 0, cost: 0 });
    }

    orders.forEach(order => {
      const orderDate = new Date(order.order_date);
      const monthKey = orderDate.toISOString().substr(0, 7);
      
      if (monthlyData.has(monthKey)) {
        const data = monthlyData.get(monthKey);
        data.count++;
        data.cost += order.grand_total || 0;
      }
    });

    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      count: data.count,
      cost: data.cost,
      avg_cost: data.count > 0 ? data.cost / data.count : 0
    }));
  }

  private calculateMonthlyTrend(orders: any[]) {
    // Últimos 6 meses
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = month.toISOString().substr(0, 7);
      const count = orders.filter(order => 
        order.order_date.startsWith(monthKey)
      ).length;
      
      months.push({ month: monthKey, count });
    }
    
    return months;
  }

  private calculateRecentTrend(orders: any[]) {
    // Tendência dos últimos 30 dias vs 30 dias anteriores
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recent = orders.filter(order => new Date(order.order_date) >= thirtyDaysAgo).length;
    const previous = orders.filter(order => {
      const date = new Date(order.order_date);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    }).length;

    const trend = previous > 0 ? ((recent - previous) / previous * 100) : 0;
    
    return {
      recent_count: recent,
      previous_count: previous,
      trend_percentage: trend,
      trend_direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable'
    };
  }

  private extractCommonPhrases(descriptions: string[]) {
    // Extrair frases comuns das descrições
    const phrases = new Map();
    
    descriptions.forEach(desc => {
      const words = desc.toLowerCase().split(/\s+/);
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = `${words[i]} ${words[i + 1]}`;
        if (phrase.length > 6) {
          phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
        }
      }
    });

    return Array.from(phrases.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([phrase, count]) => ({ phrase, count }));
  }

  private identifySeverityIndicators(descriptions: string[]) {
    const severityWords = {
      high: ['urgente', 'crítico', 'parado', 'quebrado', 'travado'],
      medium: ['problema', 'defeito', 'falha', 'ruim'],
      low: ['verificar', 'ajustar', 'revisar', 'manutenção']
    };

    const severity = { high: 0, medium: 0, low: 0 };

    descriptions.forEach(desc => {
      const lowerDesc = desc.toLowerCase();
      for (const [level, words] of Object.entries(severityWords)) {
        if (words.some(word => lowerDesc.includes(word))) {
          severity[level as keyof typeof severity]++;
          break; // Contar apenas uma vez por descrição
        }
      }
    });

    return severity;
  }

  private getGroupColor(groupName: string): string {
    const colorMap: { [key: string]: string } = {
      'Vazamentos': '#ef4444',
      'Problemas Mecânicos': '#f97316',
      'Ruídos Anômalos': '#eab308',
      'Superaquecimento': '#dc2626',
      'Problemas Elétricos': '#2563eb',
      'Operacional': '#059669'
    };
    return colorMap[groupName] || '#6b7280';
  }

  private getGroupIcon(groupName: string): string {
    const iconMap: { [key: string]: string } = {
      'Vazamentos': 'droplets',
      'Problemas Mecânicos': 'wrench',
      'Ruídos Anômalos': 'volume-2',
      'Superaquecimento': 'thermometer',
      'Problemas Elétricos': 'zap',
      'Operacional': 'settings'
    };
    return iconMap[groupName] || 'settings';
  }
}

export const hierarchicalAnalysisController = new HierarchicalAnalysisController();