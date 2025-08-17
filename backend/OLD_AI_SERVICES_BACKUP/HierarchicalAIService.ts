import { createClient } from '@supabase/supabase-js';
import { LocalAIService } from './LocalAIService';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface HierarchicalClassification {
  original_defect_description: string;
  group_id: number;
  group_name: string;
  category_id: number;
  category_name: string;
  subgroup_id?: number;
  subgroup_name?: string;
  subsubgroup_id?: number;
  subsubgroup_name?: string;
  classification_level: 'group' | 'category' | 'subgroup' | 'subsubgroup';
  ai_confidence: number;
  hierarchy_confidence: number;
  ai_reasoning: string;
  alternative_categories: number[];
}

export class HierarchicalAIService {
  private static instance: HierarchicalAIService;
  private hierarchy: any = {};
  
  private constructor() {
    this.loadHierarchy();
  }

  public static getInstance(): HierarchicalAIService {
    if (!HierarchicalAIService.instance) {
      HierarchicalAIService.instance = new HierarchicalAIService();
    }
    return HierarchicalAIService.instance;
  }

  /**
   * Carrega toda a hierarquia de classificação
   */
  private async loadHierarchy(): Promise<void> {
    try {
      console.log('🏗️ Carregando estrutura hierárquica completa...');
      
      // Buscar grupos
      const { data: groups } = await supabase
        .from('defect_groups')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      // Buscar categorias
      const { data: categories } = await supabase
        .from('defect_categories_hierarchical')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      // Buscar subgrupos
      const { data: subgroups } = await supabase
        .from('defect_subgroups')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      // Buscar sub-subgrupos
      const { data: subsubgroups } = await supabase
        .from('defect_subsubgroups')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      // Organizar hierarquia
      this.hierarchy = {
        groups: groups || [],
        categories: categories || [],
        subgroups: subgroups || [],
        subsubgroups: subsubgroups || []
      };

      console.log(`✅ Hierarquia carregada: ${groups?.length} grupos, ${categories?.length} categorias, ${subgroups?.length} subgrupos, ${subsubgroups?.length} sub-subgrupos`);
    
    } catch (error) {
      console.error('❌ Erro ao carregar hierarquia:', error);
    }
  }

  /**
   * Classifica um defeito usando análise hierárquica avançada
   */
  public async classifyDefectHierarchical(defectDescription: string): Promise<HierarchicalClassification | null> {
    try {
      if (!defectDescription || defectDescription.trim().length === 0) {
        return null;
      }

      console.log(`🎯 Iniciando classificação hierárquica: "${defectDescription}"`);
      
      await this.loadHierarchy();
      
      const text = defectDescription.toLowerCase();
      const scores = this.calculateHierarchicalScores(text);
      
      if (scores.best.score === 0) {
        console.log('⚠️ Nenhuma classificação encontrada, usando classificação genérica');
        return this.createGenericClassification(defectDescription);
      }

      // Determinar o nível de classificação baseado na confiança
      const level = this.determineClassificationLevel(scores.best.score);
      
      return {
        original_defect_description: defectDescription,
        group_id: scores.best.group.id,
        group_name: scores.best.group.group_name,
        category_id: scores.best.category.id,
        category_name: scores.best.category.category_name,
        subgroup_id: scores.best.subgroup?.id,
        subgroup_name: scores.best.subgroup?.subgroup_name,
        subsubgroup_id: scores.best.subsubgroup?.id,
        subsubgroup_name: scores.best.subsubgroup?.subsubgroup_name,
        classification_level: level,
        ai_confidence: Math.min(scores.best.score / 10, 1.0), // Normalizar score
        hierarchy_confidence: this.calculateHierarchyConfidence(scores.best),
        ai_reasoning: `Classificação baseada em análise hierárquica. Score: ${scores.best.score.toFixed(1)}. Nível: ${level}. Palavras relevantes encontradas.`,
        alternative_categories: scores.alternatives.map((alt: any) => alt.category.id).slice(0, 3)
      };

    } catch (error) {
      console.error('❌ Erro na classificação hierárquica:', error);
      return null;
    }
  }

  /**
   * Calcula scores para todos os níveis da hierarquia
   */
  private calculateHierarchicalScores(text: string): any {
    const results: any[] = [];
    
    for (const group of this.hierarchy.groups) {
      const groupScore = this.calculateGroupScore(text, group);
      
      // Buscar categorias do grupo
      const groupCategories = this.hierarchy.categories.filter((cat: any) => cat.group_id === group.id);
      
      for (const category of groupCategories) {
        const categoryScore = this.calculateCategoryScore(text, category);
        
        // Score base: grupo + categoria
        let totalScore = groupScore + categoryScore;
        
        let bestSubgroup = null;
        let bestSubsubgroup = null;
        
        // Buscar subgrupos da categoria
        const categorySubgroups = this.hierarchy.subgroups.filter((sub: any) => sub.category_id === category.id);
        
        if (categorySubgroups.length > 0) {
          for (const subgroup of categorySubgroups) {
            const subgroupScore = this.calculateSubgroupScore(text, subgroup);
            
            if (subgroupScore > 0) {
              totalScore += subgroupScore;
              
              // Buscar sub-subgrupos
              const subSubgroups = this.hierarchy.subsubgroups.filter((subsub: any) => subsub.subgroup_id === subgroup.id);
              
              if (subSubgroups.length > 0) {
                for (const subsubgroup of subSubgroups) {
                  const subsubScore = this.calculateSubsubgroupScore(text, subsubgroup);
                  
                  if (subsubScore > 0 && subsubScore > (bestSubsubgroup?.score || 0)) {
                    bestSubsubgroup = { ...subsubgroup, score: subsubScore };
                  }
                }
              }
              
              if (subgroupScore > (bestSubgroup?.score || 0)) {
                bestSubgroup = { ...subgroup, score: subgroupScore };
              }
            }
          }
        }
        
        // Adicionar bônus se encontrou subgrupo/subsubgrupo
        if (bestSubgroup) {
          totalScore += bestSubgroup.score;
        }
        if (bestSubsubgroup) {
          totalScore += bestSubsubgroup.score;
        }
        
        if (totalScore > 0) {
          results.push({
            score: totalScore,
            group,
            category,
            subgroup: bestSubgroup,
            subsubgroup: bestSubsubgroup
          });
        }
      }
    }
    
    // Ordenar por score
    results.sort((a, b) => b.score - a.score);
    
    return {
      best: results[0] || null,
      alternatives: results.slice(1, 4) // Top 3 alternativas
    };
  }

  /**
   * Calcula score para um grupo
   */
  private calculateGroupScore(text: string, group: any): number {
    let score = 0;
    
    // Análise específica por grupo
    switch (group.group_name) {
      case 'Problemas de Fluidos':
        if (text.includes('vazamento') || text.includes('vaza') || text.includes('óleo') || 
            text.includes('água') || text.includes('líquido') || text.includes('gotej')) {
          score += 3;
        }
        break;
        
      case 'Problemas Térmicos':
        if (text.includes('esquent') || text.includes('quent') || text.includes('temperatura') ||
            text.includes('superaque') || text.includes('calor') || text.includes('ferv')) {
          score += 3;
        }
        break;
        
      case 'Problemas Mecânicos':
        if (text.includes('quebr') || text.includes('desgast') || text.includes('gast') ||
            text.includes('barulh') || text.includes('ruído') || text.includes('som') ||
            text.includes('rachad') || text.includes('trincad')) {
          score += 3;
        }
        break;
        
      case 'Problemas Elétricos':
        if (text.includes('elétric') || text.includes('vela') || text.includes('bobina') ||
            text.includes('bateria') || text.includes('alternador') || text.includes('sensor')) {
          score += 3;
        }
        break;
        
      case 'Problemas de Combustão':
        if (text.includes('não pega') || text.includes('não liga') || text.includes('falha') ||
            text.includes('ignição') || text.includes('combustível') || text.includes('mistura')) {
          score += 3;
        }
        break;
        
      case 'Problemas Operacionais':
        if (text.includes('teste') || text.includes('verificação') || text.includes('erro') ||
            text.includes('registro') || text.includes('montag') || text.includes('instalação')) {
          score += 3;
        }
        break;
    }
    
    return score;
  }

  /**
   * Calcula score para uma categoria
   */
  private calculateCategoryScore(text: string, category: any): number {
    let score = 0;
    
    // Score por keywords
    if (category.keywords && category.keywords.length > 0) {
      for (const keyword of category.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          score += 2;
        }
      }
    }
    
    // Score por nome da categoria
    const categoryWords = category.category_name.toLowerCase().split(' ');
    for (const word of categoryWords) {
      if (word.length > 3 && text.includes(word)) {
        score += 1;
      }
    }
    
    return score;
  }

  /**
   * Calcula score para um subgrupo
   */
  private calculateSubgroupScore(text: string, subgroup: any): number {
    let score = 0;
    
    if (subgroup.keywords && subgroup.keywords.length > 0) {
      for (const keyword of subgroup.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          score += 1.5;
        }
      }
    }
    
    const subgroupWords = subgroup.subgroup_name.toLowerCase().split(' ');
    for (const word of subgroupWords) {
      if (word.length > 3 && text.includes(word)) {
        score += 0.5;
      }
    }
    
    return score;
  }

  /**
   * Calcula score para um sub-subgrupo
   */
  private calculateSubsubgroupScore(text: string, subsubgroup: any): number {
    let score = 0;
    
    if (subsubgroup.keywords && subsubgroup.keywords.length > 0) {
      for (const keyword of subsubgroup.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
    }
    
    const subsubgroupWords = subsubgroup.subsubgroup_name.toLowerCase().split(' ');
    for (const word of subsubgroupWords) {
      if (word.length > 3 && text.includes(word)) {
        score += 0.3;
      }
    }
    
    return score;
  }

  /**
   * Determina o nível de classificação baseado no score
   */
  private determineClassificationLevel(score: number): 'group' | 'category' | 'subgroup' | 'subsubgroup' {
    if (score >= 8) return 'subsubgroup';
    if (score >= 6) return 'subgroup';
    if (score >= 4) return 'category';
    return 'group';
  }

  /**
   * Calcula confiança da hierarquia
   */
  private calculateHierarchyConfidence(best: any): number {
    let confidence = 0.5;
    
    if (best.subsubgroup) confidence += 0.3;
    else if (best.subgroup) confidence += 0.2;
    else if (best.category) confidence += 0.1;
    
    if (best.score >= 8) confidence += 0.2;
    else if (best.score >= 6) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Cria uma classificação genérica quando não encontra match específico
   */
  private createGenericClassification(defectDescription: string): HierarchicalClassification {
    // Usar o primeiro grupo/categoria como padrão
    const defaultGroup = this.hierarchy.groups[0];
    const defaultCategory = this.hierarchy.categories.find((cat: any) => cat.group_id === defaultGroup.id);
    
    return {
      original_defect_description: defectDescription,
      group_id: defaultGroup.id,
      group_name: defaultGroup.group_name,
      category_id: defaultCategory.id,
      category_name: defaultCategory.category_name,
      classification_level: 'category',
      ai_confidence: 0.3,
      hierarchy_confidence: 0.2,
      ai_reasoning: 'Classificação genérica - defeito não correspondeu a padrões específicos',
      alternative_categories: []
    };
  }

  /**
   * Salva classificação hierárquica no banco
   */
  public async saveHierarchicalClassification(serviceOrderId: number, classification: HierarchicalClassification): Promise<boolean> {
    try {
      console.log(`💾 Salvando classificação hierárquica para OS ${serviceOrderId}`);
      
      const insertData = {
        service_order_id: serviceOrderId,
        original_defect_description: classification.original_defect_description,
        group_id: classification.group_id,
        category_id: classification.category_id,
        subgroup_id: classification.subgroup_id || null,
        subsubgroup_id: classification.subsubgroup_id || null,
        classification_level: classification.classification_level,
        ai_confidence: classification.ai_confidence,
        hierarchy_confidence: classification.hierarchy_confidence,
        ai_reasoning: classification.ai_reasoning,
        alternative_categories: classification.alternative_categories || [],
        is_reviewed: false
      };

      const { data, error } = await supabase
        .from('defect_classifications')
        .insert(insertData)
        .select();

      if (error) {
        console.error('❌ Erro ao salvar classificação hierárquica:', error);
        return false;
      }

      // Atualizar contadores
      await this.updateCounters(classification);

      console.log(`✅ Classificação hierárquica salva com sucesso para OS ${serviceOrderId}`);
      return true;

    } catch (error) {
      console.error('❌ Erro de exceção ao salvar classificação hierárquica:', error);
      return false;
    }
  }

  /**
   * Atualiza contadores na hierarquia
   */
  private async updateCounters(classification: HierarchicalClassification): Promise<void> {
    try {
      // Atualizar contador da categoria
      await supabase
        .from('defect_categories_hierarchical')
        .update({ total_occurrences: supabase.rpc('increment_occurrences') })
        .eq('id', classification.category_id);

      // Atualizar contador do subgrupo se existir
      if (classification.subgroup_id) {
        await supabase
          .from('defect_subgroups')
          .update({ total_occurrences: supabase.rpc('increment_occurrences') })
          .eq('id', classification.subgroup_id);
      }

      // Atualizar contador do sub-subgrupo se existir
      if (classification.subsubgroup_id) {
        await supabase
          .from('defect_subsubgroups')
          .update({ total_occurrences: supabase.rpc('increment_occurrences') })
          .eq('id', classification.subsubgroup_id);
      }

    } catch (error) {
      console.error('❌ Erro ao atualizar contadores:', error);
    }
  }

  /**
   * Classifica todos os defeitos usando o sistema hierárquico
   */
  public async massHierarchicalClassification(): Promise<void> {
    try {
      console.log('🚀 Iniciando classificação hierárquica em massa...');
      
      // Buscar defeitos não classificados
      const { data: classifiedIds } = await supabase
        .from('defect_classifications')
        .select('service_order_id');

      const classifiedIdSet = new Set((classifiedIds || []).map(item => item.service_order_id));

      const { data: allOrders } = await supabase
        .from('service_orders')
        .select('id, raw_defect_description')
        .not('raw_defect_description', 'is', null)
        .not('raw_defect_description', 'eq', '');

      const unclassifiedOrders = (allOrders || []).filter(order => !classifiedIdSet.has(order.id));
      
      console.log(`📊 Encontrados ${unclassifiedOrders.length} defeitos para classificar hierarquicamente`);

      let processed = 0;
      let successful = 0;

      for (const order of unclassifiedOrders) {
        try {
          const classification = await this.classifyDefectHierarchical(order.raw_defect_description);
          
          if (classification) {
            const saved = await this.saveHierarchicalClassification(order.id, classification);
            if (saved) successful++;
          }

          processed++;
          
          if (processed % 10 === 0) {
            console.log(`📈 Progresso: ${processed}/${unclassifiedOrders.length} (${successful} sucessos)`);
          }

          // Pequena pausa para não sobrecarregar o sistema
          await new Promise(resolve => setTimeout(resolve, 50));
          
        } catch (error) {
          console.error(`❌ Erro ao classificar OS ${order.id}:`, error);
        }
      }

      console.log(`🎉 Classificação hierárquica em massa concluída: ${successful}/${processed} sucessos`);
      
    } catch (error) {
      console.error('❌ Erro na classificação hierárquica em massa:', error);
    }
  }

  /**
   * Obtém estatísticas hierárquicas
   */
  public async getHierarchicalStats(): Promise<any> {
    try {
      // Stats por grupo
      const { data: groupStats } = await supabase
        .from('defect_classifications')
        .select(`
          group_id,
          defect_groups(group_name, color_hex, icon)
        `)
        .not('group_id', 'is', null);

      // Stats por nível de classificação
      const { data: levelStats } = await supabase
        .from('defect_classifications')
        .select('classification_level')
        .not('classification_level', 'is', null);

      // Contagem total
      const { count: totalClassified } = await supabase
        .from('defect_classifications')
        .select('*', { count: 'exact', head: true });

      const { count: totalDefects } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true })
        .not('raw_defect_description', 'is', null)
        .not('raw_defect_description', 'eq', '');

      // Processar estatísticas
      const groupCounts = (groupStats || []).reduce((acc: any, item: any) => {
        const groupName = item.defect_groups?.group_name || 'Desconhecido';
        acc[groupName] = (acc[groupName] || 0) + 1;
        return acc;
      }, {});

      const levelCounts = (levelStats || []).reduce((acc: any, item: any) => {
        acc[item.classification_level] = (acc[item.classification_level] || 0) + 1;
        return acc;
      }, {});

      return {
        totalClassified: totalClassified || 0,
        totalDefects: totalDefects || 0,
        classificationRate: (totalDefects || 0) > 0 ? (totalClassified || 0) / (totalDefects || 0) : 0,
        groupDistribution: groupCounts,
        levelDistribution: levelCounts,
        hierarchyEnabled: true
      };

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas hierárquicas:', error);
      return null;
    }
  }
}