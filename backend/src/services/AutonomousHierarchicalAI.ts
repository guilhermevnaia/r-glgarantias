import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface HierarchicalNode {
  id: number;
  name: string;
  description: string;
  level: number; // 1=Grupo, 2=Subgrupo, 3=Subsubgrupo
  parent_id?: number;
  color_hex: string;
  icon: string;
  keywords: string[];
  ai_confidence: number;
  total_occurrences: number;
  is_active: boolean;
}

export interface HierarchicalClassification {
  service_order_id: number;
  original_defect_description: string;
  group_id: number;
  subgroup_id?: number;
  subsubgroup_id?: number;
  ai_confidence: number;
  ai_reasoning: string;
  classification_path: string;
  is_reviewed: boolean;
}

/**
 * IA Hierárquica Totalmente Autônoma
 * 
 * Funcionalidades:
 * 1. Classifica defeitos em 3 níveis (Grupo > Subgrupo > Subsubgrupo)
 * 2. Cria automaticamente novas categorias quando necessário
 * 3. Funciona em tempo real sem intervenção manual
 * 4. Auto-evolui baseada nos dados
 */
export class AutonomousHierarchicalAI {
  private static instance: AutonomousHierarchicalAI;
  private hierarchy: Map<number, HierarchicalNode> = new Map();
  private isInitialized = false;
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.7;
  private readonly MIN_OCCURRENCES_TO_CREATE_SUBGROUP = 5;
  private readonly MIN_OCCURRENCES_TO_CREATE_SUBSUBGROUP = 3;

  private constructor() {
    this.initializeHierarchy();
  }

  public static getInstance(): AutonomousHierarchicalAI {
    if (!AutonomousHierarchicalAI.instance) {
      AutonomousHierarchicalAI.instance = new AutonomousHierarchicalAI();
    }
    return AutonomousHierarchicalAI.instance;
  }

  /**
   * Carrega hierarquia do banco
   */
  private async initializeHierarchy(): Promise<void> {
    try {
      const { data: nodes, error } = await supabase
        .from('defect_hierarchy')
        .select('*')
        .eq('is_active', true)
        .order('level')
        .order('total_occurrences', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar hierarquia:', error);
        return;
      }

      this.hierarchy.clear();
      nodes?.forEach(node => {
        this.hierarchy.set(node.id, node);
      });

      this.isInitialized = true;
      console.log(`🤖 AutonomousHierarchicalAI: ${this.hierarchy.size} nós carregados`);
      
      // Log da estrutura
      this.logHierarchyStructure();
    } catch (error) {
      console.error('❌ Erro na inicialização da IA hierárquica:', error);
    }
  }

  /**
   * Log da estrutura hierárquica atual
   */
  private logHierarchyStructure(): void {
    const groups = Array.from(this.hierarchy.values()).filter(n => n.level === 1);
    console.log(`📊 Estrutura: ${groups.length} grupos`);
    
    groups.forEach(group => {
      const subgroups = Array.from(this.hierarchy.values()).filter(n => n.level === 2 && n.parent_id === group.id);
      console.log(`  📁 ${group.name} (${group.total_occurrences} ocorrências) - ${subgroups.length} subgrupos`);
      
      subgroups.forEach(subgroup => {
        const subsubgroups = Array.from(this.hierarchy.values()).filter(n => n.level === 3 && n.parent_id === subgroup.id);
        console.log(`    📂 ${subgroup.name} (${subgroup.total_occurrences}) - ${subsubgroups.length} subsubgrupos`);
      });
    });
  }

  /**
   * Normaliza texto para classificação
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[áàâãäå]/g, 'a')
      .replace(/[éèêë]/g, 'e')
      .replace(/[íìîï]/g, 'i')
      .replace(/[óòôõöø]/g, 'o')
      .replace(/[úùûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calcula score de matching para um nó
   */
  private calculateMatchScore(text: string, node: HierarchicalNode): number {
    const normalizedText = this.normalizeText(text);
    let score = 0;

    for (const keyword of node.keywords) {
      const normalizedKeyword = this.normalizeText(keyword);
      
      if (normalizedText.includes(normalizedKeyword)) {
        // Score base pela palavra
        score += normalizedKeyword.length > 4 ? 3 : 2;
        
        // Bonus se aparece no início
        if (normalizedText.indexOf(normalizedKeyword) < 10) {
          score += 1;
        }
        
        // Bonus se é palavra completa (não apenas substring)
        const regex = new RegExp(`\\b${normalizedKeyword}\\b`);
        if (regex.test(normalizedText)) {
          score += 2;
        }
      }
    }

    return score;
  }

  /**
   * Encontra o melhor grupo para um defeito
   */
  private findBestGroup(text: string): { node: HierarchicalNode | null; score: number } {
    const groups = Array.from(this.hierarchy.values()).filter(n => n.level === 1);
    let bestGroup: HierarchicalNode | null = null;
    let bestScore = 0;

    for (const group of groups) {
      const score = this.calculateMatchScore(text, group);
      if (score > bestScore) {
        bestScore = score;
        bestGroup = group;
      }
    }

    return { node: bestGroup, score: bestScore };
  }

  /**
   * Encontra o melhor subgrupo dentro de um grupo
   */
  private findBestSubgroup(text: string, groupId: number): { node: HierarchicalNode | null; score: number } {
    const subgroups = Array.from(this.hierarchy.values())
      .filter(n => n.level === 2 && n.parent_id === groupId);
    
    let bestSubgroup: HierarchicalNode | null = null;
    let bestScore = 0;

    for (const subgroup of subgroups) {
      const score = this.calculateMatchScore(text, subgroup);
      if (score > bestScore) {
        bestScore = score;
        bestSubgroup = subgroup;
      }
    }

    return { node: bestSubgroup, score: bestScore };
  }

  /**
   * Encontra o melhor subsubgrupo dentro de um subgrupo
   */
  private findBestSubsubgroup(text: string, subgroupId: number): { node: HierarchicalNode | null; score: number } {
    const subsubgroups = Array.from(this.hierarchy.values())
      .filter(n => n.level === 3 && n.parent_id === subgroupId);
    
    let bestSubsubgroup: HierarchicalNode | null = null;
    let bestScore = 0;

    for (const subsubgroup of subsubgroups) {
      const score = this.calculateMatchScore(text, subsubgroup);
      if (score > bestScore) {
        bestScore = score;
        bestSubsubgroup = subsubgroup;
      }
    }

    return { node: bestSubsubgroup, score: bestScore };
  }

  /**
   * Extrai palavras-chave de um texto usando análise simples
   */
  private extractKeywords(text: string): string[] {
    const normalized = this.normalizeText(text);
    const words = normalized.split(' ').filter(w => w.length >= 3);
    
    // Palavras comuns que devem ser ignoradas
    const stopWords = ['que', 'para', 'com', 'por', 'uma', 'ser', 'ter', 'seu', 'sua', 'foi', 'esta', 'este'];
    
    return words
      .filter(word => !stopWords.includes(word))
      .slice(0, 5); // Máximo 5 palavras-chave
  }

  /**
   * Cria automaticamente um novo grupo
   */
  private async createNewGroup(defectDescription: string): Promise<HierarchicalNode | null> {
    try {
      console.log(`🆕 Criando novo GRUPO baseado em: "${defectDescription.substring(0, 50)}..."`);
      
      const keywords = this.extractKeywords(defectDescription);
      const groupName = this.generateCategoryName(defectDescription, 1);
      
      const { data: newGroup, error } = await supabase
        .from('defect_hierarchy')
        .insert({
          name: groupName,
          description: `Grupo criado automaticamente pela IA baseado em padrões de defeitos`,
          level: 1,
          parent_id: null,
          color_hex: this.generateRandomColor(),
          icon: this.selectIconForDefect(defectDescription),
          keywords,
          ai_confidence: 0.8,
          total_occurrences: 1
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar grupo:', error);
        return null;
      }

      // Atualizar cache local
      this.hierarchy.set(newGroup.id, newGroup);
      console.log(`✅ Novo grupo criado: "${groupName}" (ID: ${newGroup.id})`);
      
      return newGroup;
    } catch (error) {
      console.error('❌ Erro na criação de grupo:', error);
      return null;
    }
  }

  /**
   * Cria automaticamente um novo subgrupo
   */
  private async createNewSubgroup(defectDescription: string, parentGroupId: number): Promise<HierarchicalNode | null> {
    try {
      console.log(`🆕 Criando novo SUBGRUPO no grupo ${parentGroupId}`);
      
      const keywords = this.extractKeywords(defectDescription);
      const subgroupName = this.generateCategoryName(defectDescription, 2);
      
      const parentGroup = this.hierarchy.get(parentGroupId);
      
      const { data: newSubgroup, error } = await supabase
        .from('defect_hierarchy')
        .insert({
          name: subgroupName,
          description: `Subgrupo criado automaticamente pela IA`,
          level: 2,
          parent_id: parentGroupId,
          color_hex: parentGroup?.color_hex || this.generateRandomColor(),
          icon: this.selectIconForDefect(defectDescription),
          keywords,
          ai_confidence: 0.8,
          total_occurrences: 1
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar subgrupo:', error);
        return null;
      }

      // Atualizar cache local
      this.hierarchy.set(newSubgroup.id, newSubgroup);
      console.log(`✅ Novo subgrupo criado: "${subgroupName}" (ID: ${newSubgroup.id})`);
      
      return newSubgroup;
    } catch (error) {
      console.error('❌ Erro na criação de subgrupo:', error);
      return null;
    }
  }

  /**
   * Cria automaticamente um novo subsubgrupo
   */
  private async createNewSubsubgroup(defectDescription: string, parentSubgroupId: number): Promise<HierarchicalNode | null> {
    try {
      console.log(`🆕 Criando novo SUBSUBGRUPO no subgrupo ${parentSubgroupId}`);
      
      const keywords = this.extractKeywords(defectDescription);
      const subsubgroupName = this.generateCategoryName(defectDescription, 3);
      
      const parentSubgroup = this.hierarchy.get(parentSubgroupId);
      
      const { data: newSubsubgroup, error } = await supabase
        .from('defect_hierarchy')
        .insert({
          name: subsubgroupName,
          description: `Subsubgrupo criado automaticamente pela IA`,
          level: 3,
          parent_id: parentSubgroupId,
          color_hex: parentSubgroup?.color_hex || this.generateRandomColor(),
          icon: this.selectIconForDefect(defectDescription),
          keywords,
          ai_confidence: 0.8,
          total_occurrences: 1
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar subsubgrupo:', error);
        return null;
      }

      // Atualizar cache local
      this.hierarchy.set(newSubsubgroup.id, newSubsubgroup);
      console.log(`✅ Novo subsubgrupo criado: "${subsubgroupName}" (ID: ${newSubsubgroup.id})`);
      
      return newSubsubgroup;
    } catch (error) {
      console.error('❌ Erro na criação de subsubgrupo:', error);
      return null;
    }
  }

  /**
   * Gera um nome para categoria baseado no defeito
   */
  private generateCategoryName(defectDescription: string, level: number): string {
    const words = this.extractKeywords(defectDescription);
    
    if (words.length === 0) {
      return level === 1 ? 'Novo Grupo' : level === 2 ? 'Novo Subgrupo' : 'Novo Subsubgrupo';
    }
    
    // Capitalizar primeira palavra
    const mainWord = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    
    if (level === 1) {
      return `${mainWord}s`; // Pluralizar grupos
    } else if (level === 2) {
      return `${mainWord}`;
    } else {
      return `${mainWord}`;
    }
  }

  /**
   * Seleciona ícone baseado no defeito
   */
  private selectIconForDefect(defectDescription: string): string {
    const normalized = this.normalizeText(defectDescription);
    
    if (normalized.includes('oleo') || normalized.includes('vazamento')) return 'droplet';
    if (normalized.includes('barulh') || normalized.includes('ruido')) return 'volume-2';
    if (normalized.includes('eletric') || normalized.includes('bateria')) return 'zap';
    if (normalized.includes('freio') || normalized.includes('pastilh')) return 'disc';
    if (normalized.includes('motor') || normalized.includes('pistao')) return 'engine';
    if (normalized.includes('temperatura') || normalized.includes('quent')) return 'thermometer';
    
    return 'wrench';
  }

  /**
   * Gera cor aleatória para nova categoria
   */
  private generateRandomColor(): string {
    const colors = [
      '#DC2626', '#EA580C', '#D97706', '#CA8A04', '#65A30D',
      '#16A34A', '#059669', '#0891B2', '#0284C7', '#2563EB',
      '#4F46E5', '#7C3AED', '#A21CAF', '#BE185D', '#E11D48'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Incrementa contador de ocorrências de um nó
   */
  private async incrementNodeOccurrences(nodeId: number): Promise<void> {
    try {
      // Primeiro buscar o valor atual
      const { data: currentNode } = await supabase
        .from('defect_hierarchy')
        .select('total_occurrences')
        .eq('id', nodeId)
        .single();

      const currentCount = currentNode?.total_occurrences || 0;

      const { error } = await supabase
        .from('defect_hierarchy')
        .update({ 
          total_occurrences: currentCount + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', nodeId);

      if (error) {
        console.error(`❌ Erro ao incrementar ocorrências do nó ${nodeId}:`, error);
      } else {
        // Atualizar cache local
        const node = this.hierarchy.get(nodeId);
        if (node) {
          node.total_occurrences += 1;
        }
      }
    } catch (error) {
      console.error(`❌ Exceção ao incrementar ocorrências:`, error);
    }
  }

  /**
   * Classifica um defeito hierarquicamente (FUNÇÃO PRINCIPAL)
   */
  public async classifyDefectHierarchically(defectDescription: string): Promise<HierarchicalClassification | null> {
    if (!defectDescription || defectDescription.trim().length < 3) {
      return null;
    }

    if (!this.isInitialized) {
      await this.initializeHierarchy();
    }

    console.log(`🎯 Classificação hierárquica: "${defectDescription.substring(0, 50)}..."`);

    try {
      // Etapa 1: Encontrar melhor grupo
      const { node: bestGroup, score: groupScore } = this.findBestGroup(defectDescription);
      let selectedGroup = bestGroup;
      
      // Se não encontrou grupo adequado OU confiança muito baixa, criar novo grupo
      if (!selectedGroup || groupScore < 4) {
        console.log(`⚡ Confiança baixa no grupo (${groupScore}), criando novo...`);
        selectedGroup = await this.createNewGroup(defectDescription);
        
        if (!selectedGroup) {
          console.log('❌ Falhou ao criar grupo, abortando classificação');
          return null;
        }
      }

      // Etapa 2: Encontrar melhor subgrupo
      const { node: bestSubgroup, score: subgroupScore } = this.findBestSubgroup(defectDescription, selectedGroup.id);
      let selectedSubgroup = bestSubgroup;
      
      // Se grupo tem subgrupos mas nenhum adequado, considerar criar novo
      const subgroupsInGroup = Array.from(this.hierarchy.values())
        .filter(n => n.level === 2 && n.parent_id === selectedGroup.id);
      
      if (subgroupsInGroup.length > 0 && (!selectedSubgroup || subgroupScore < 3)) {
        if (selectedGroup.total_occurrences >= this.MIN_OCCURRENCES_TO_CREATE_SUBGROUP) {
          console.log(`⚡ Criando novo subgrupo no grupo "${selectedGroup.name}"`);
          selectedSubgroup = await this.createNewSubgroup(defectDescription, selectedGroup.id);
        }
      }

      // Etapa 3: Encontrar melhor subsubgrupo (se tiver subgrupo)
      let selectedSubsubgroup: HierarchicalNode | null = null;
      
      if (selectedSubgroup) {
        const { node: bestSubsubgroup, score: subsubgroupScore } = this.findBestSubsubgroup(defectDescription, selectedSubgroup.id);
        selectedSubsubgroup = bestSubsubgroup;
        
        // Se subgrupo tem subsubgrupos mas nenhum adequado, considerar criar novo
        const subsubgroupsInSubgroup = Array.from(this.hierarchy.values())
          .filter(n => n.level === 3 && n.parent_id === selectedSubgroup.id);
        
        if (subsubgroupsInSubgroup.length > 0 && (!selectedSubsubgroup || subsubgroupScore < 2)) {
          if (selectedSubgroup.total_occurrences >= this.MIN_OCCURRENCES_TO_CREATE_SUBSUBGROUP) {
            console.log(`⚡ Criando novo subsubgrupo no subgrupo "${selectedSubgroup.name}"`);
            selectedSubsubgroup = await this.createNewSubsubgroup(defectDescription, selectedSubgroup.id);
          }
        }
      }

      // Calcular confiança final
      const totalScore = groupScore + (subgroupScore || 0) + (selectedSubsubgroup ? 2 : 0);
      const confidence = Math.min(totalScore / 15, 0.95); // Normalizar para 0-0.95

      // Montar caminho da classificação
      const pathParts = [selectedGroup.name];
      if (selectedSubgroup) pathParts.push(selectedSubgroup.name);
      if (selectedSubsubgroup) pathParts.push(selectedSubsubgroup.name);
      const classificationPath = pathParts.join(' > ');

      // Incrementar contadores
      await this.incrementNodeOccurrences(selectedGroup.id);
      if (selectedSubgroup) await this.incrementNodeOccurrences(selectedSubgroup.id);
      if (selectedSubsubgroup) await this.incrementNodeOccurrences(selectedSubsubgroup.id);

      const classification: HierarchicalClassification = {
        service_order_id: 0, // Será definido ao salvar
        original_defect_description: defectDescription,
        group_id: selectedGroup.id,
        subgroup_id: selectedSubgroup?.id,
        subsubgroup_id: selectedSubsubgroup?.id,
        ai_confidence: confidence,
        ai_reasoning: `Classificação hierárquica: ${classificationPath} (Score: ${totalScore})`,
        classification_path: classificationPath,
        is_reviewed: false
      };

      console.log(`✅ Classificado hierarquicamente: ${classificationPath} (${(confidence * 100).toFixed(1)}%)`);
      return classification;

    } catch (error) {
      console.error('❌ Erro na classificação hierárquica:', error);
      return null;
    }
  }

  /**
   * Salva classificação hierárquica no banco
   */
  public async saveHierarchicalClassification(serviceOrderId: number, classification: HierarchicalClassification): Promise<boolean> {
    try {
      // Verificar se já existe classificação
      const { data: existing } = await supabase
        .from('hierarchical_classifications')
        .select('id')
        .eq('service_order_id', serviceOrderId)
        .single();

      if (existing) {
        console.log(`⚠️ OS ${serviceOrderId} já tem classificação hierárquica, pulando...`);
        return true;
      }

      // Inserir nova classificação
      const { error } = await supabase
        .from('hierarchical_classifications')
        .insert({
          service_order_id: serviceOrderId,
          original_defect_description: classification.original_defect_description,
          group_id: classification.group_id,
          subgroup_id: classification.subgroup_id,
          subsubgroup_id: classification.subsubgroup_id,
          ai_confidence: classification.ai_confidence,
          ai_reasoning: classification.ai_reasoning,
          classification_path: classification.classification_path,
          is_reviewed: false
        });

      if (error) {
        console.error(`❌ Erro ao salvar classificação hierárquica OS ${serviceOrderId}:`, error.message);
        return false;
      }

      console.log(`✅ Classificação hierárquica salva: OS ${serviceOrderId}`);
      return true;

    } catch (error) {
      console.error(`❌ Exceção ao salvar classificação hierárquica:`, error);
      return false;
    }
  }

  /**
   * Classifica automaticamente defeitos não classificados hierarquicamente
   */
  public async classifyUnclassifiedHierarchically(): Promise<void> {
    try {
      console.log('🚀 AutonomousHierarchicalAI: Iniciando classificação hierárquica...');

      // Buscar IDs já classificados hierarquicamente
      const { data: classifiedIds } = await supabase
        .from('hierarchical_classifications')
        .select('service_order_id');

      const classifiedSet = new Set((classifiedIds || []).map(c => c.service_order_id));

      // Buscar apenas defeitos não classificados hierarquicamente
      const { data: unclassifiedDefects } = await supabase
        .from('service_orders')
        .select('id, order_number, raw_defect_description')
        .not('raw_defect_description', 'is', null)
        .not('raw_defect_description', 'eq', '');

      const defectsToClassify = (unclassifiedDefects || []).filter(d => !classifiedSet.has(d.id));

      if (defectsToClassify.length === 0) {
        console.log('✅ Todos os defeitos já estão classificados hierarquicamente!');
        return;
      }

      console.log(`📊 Encontrados ${defectsToClassify.length} defeitos não classificados hierarquicamente`);

      let processed = 0;
      let successful = 0;
      let failed = 0;

      for (const defect of defectsToClassify) {
        try {
          const classification = await this.classifyDefectHierarchically(defect.raw_defect_description);
          
          if (classification) {
            const saved = await this.saveHierarchicalClassification(defect.id, classification);
            if (saved) {
              successful++;
            } else {
              failed++;
            }
          } else {
            failed++;
          }
          
          processed++;

          // Log de progresso a cada 10 defeitos
          if (processed % 10 === 0) {
            const progress = (processed / defectsToClassify.length * 100).toFixed(1);
            console.log(`📈 Progresso hierárquico: ${progress}% (${successful}✅ ${failed}❌)`);
          }

          // Pausa pequena para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 50));

        } catch (error) {
          console.error(`❌ Erro na OS ${defect.order_number}:`, error);
          failed++;
          processed++;
        }
      }

      console.log('\n🎉 CLASSIFICAÇÃO HIERÁRQUICA COMPLETA!');
      console.log(`📊 Processados: ${processed}`);
      console.log(`✅ Sucessos: ${successful}`);
      console.log(`❌ Falhas: ${failed}`);
      console.log(`📈 Taxa de sucesso: ${(successful / processed * 100).toFixed(1)}%`);

      // Atualizar estrutura em cache
      await this.initializeHierarchy();

    } catch (error) {
      console.error('❌ Erro na classificação hierárquica:', error);
    }
  }

  /**
   * Obtém estatísticas da hierarquia
   */
  public async getHierarchicalStats(): Promise<any> {
    try {
      const { count: totalClassified } = await supabase
        .from('hierarchical_classifications')
        .select('*', { count: 'exact', head: true });

      const { count: totalDefects } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true })
        .not('raw_defect_description', 'is', null)
        .not('raw_defect_description', 'eq', '');

      const { data: hierarchyStats } = await supabase
        .from('defect_hierarchy')
        .select('level')
        .eq('is_active', true);

      const levelCounts = { 1: 0, 2: 0, 3: 0 };
      hierarchyStats?.forEach(h => {
        levelCounts[h.level as keyof typeof levelCounts]++;
      });

      return {
        totalClassified: totalClassified || 0,
        totalDefects: totalDefects || 0,
        classificationRate: totalDefects ? (totalClassified || 0) / totalDefects : 0,
        hierarchy: {
          groups: levelCounts[1],
          subgroups: levelCounts[2],
          subsubgroups: levelCounts[3]
        }
      };

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas hierárquicas:', error);
      return null;
    }
  }

  /**
   * Força atualização do cache da hierarquia
   */
  public async refreshHierarchy(): Promise<void> {
    this.isInitialized = false;
    await this.initializeHierarchy();
  }
}