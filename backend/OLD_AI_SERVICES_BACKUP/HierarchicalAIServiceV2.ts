import { createClient } from '@supabase/supabase-js';
import { GroqAIService } from './GroqAIService';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface HierarchicalClassification {
  original_defect_description: string;
  
  // Classificação hierárquica
  primary_group: {
    id: number;
    name: string;
    confidence: number;
  };
  
  secondary_subgroup: {
    id?: number;
    name: string;
    confidence: number;
  };
  
  tertiary_specific: {
    id?: number;
    name: string;
    confidence: number;
  };
  
  // Metadata
  full_hierarchy_path: string;
  overall_confidence: number;
  ai_reasoning: string;
  classification_method: 'groq' | 'local' | 'hybrid';
}

export class HierarchicalAIServiceV2 {
  private static instance: HierarchicalAIServiceV2;
  private categories: any[] = [];
  private groqService: GroqAIService;
  
  private constructor() {
    this.groqService = GroqAIService.getInstance();
    this.loadCategories();
  }

  public static getInstance(): HierarchicalAIServiceV2 {
    if (!HierarchicalAIServiceV2.instance) {
      HierarchicalAIServiceV2.instance = new HierarchicalAIServiceV2();
    }
    return HierarchicalAIServiceV2.instance;
  }

  /**
   * Carrega categorias hierárquicas do banco
   */
  private async loadCategories(): Promise<void> {
    try {
      const { data: categories, error } = await supabase
        .from('defect_categories')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (error) {
        console.error('❌ Erro ao carregar categorias:', error);
        return;
      }

      this.categories = categories || [];
      console.log(`🏗️ HierarchicalAI: ${this.categories.length} categorias carregadas`);
      
      // Log das categorias para debug
      this.categories.forEach(cat => {
        console.log(`  📂 ${cat.id}: ${cat.category_name} (${cat.keywords?.length || 0} keywords)`);
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error);
    }
  }

  /**
   * Classifica um defeito hierarquicamente
   */
  public async classifyDefectHierarchical(defectDescription: string): Promise<HierarchicalClassification | null> {
    try {
      if (!defectDescription || defectDescription.trim().length <= 3) {
        return null;
      }

      console.log(`🎯 HierarchicalAI: Classificando "${defectDescription}"`);
      
      await this.loadCategories();
      
      // ETAPA 1: Análise local rápida
      const localResult = await this.analyzeDefectLocally(defectDescription);
      
      // ETAPA 2: Se confiança local for baixa, usar Groq para refinamento
      let finalResult = localResult;
      if (localResult.overall_confidence < 0.7) {
        console.log('🤖 Confiança local baixa, consultando Groq...');
        const groqResult = await this.enhanceWithGroq(defectDescription, localResult);
        if (groqResult) {
          finalResult = groqResult;
        }
      }
      
      console.log(`✅ Classificação final: ${finalResult.full_hierarchy_path} (${(finalResult.overall_confidence * 100).toFixed(1)}%)`);
      
      return finalResult;
      
    } catch (error) {
      console.error('❌ Erro na classificação hierárquica:', error);
      return null;
    }
  }

  /**
   * Análise local baseada em palavras-chave e padrões
   */
  private async analyzeDefectLocally(description: string): Promise<HierarchicalClassification> {
    const normalizedText = this.normalizeText(description);
    const scores: { [key: number]: number } = {};
    
    // Inicializar scores
    this.categories.forEach(cat => {
      scores[cat.id] = 0;
    });
    
    // Análise de palavras-chave
    this.categories.forEach(category => {
      const keywords = category.keywords || [];
      keywords.forEach((keyword: string) => {
        if (normalizedText.includes(keyword.toLowerCase())) {
          scores[category.id] += 5; // Score alto para match direto
        }
      });
    });
    
    // Análise de padrões específicos
    this.applySpecificPatterns(normalizedText, scores);
    
    // Encontrar melhor match
    const bestCategory = this.findBestCategory(scores);
    
    if (!bestCategory) {
      return this.createDefaultClassification(description);
    }
    
    // Gerar classificação hierárquica
    return this.createHierarchicalClassification(description, bestCategory, scores);
  }

  /**
   * Aplica padrões específicos para cada categoria
   */
  private applySpecificPatterns(text: string, scores: { [key: number]: number }): void {
    const patterns = [
      // Vazamentos (100)
      {
        categoryId: 100,
        patterns: [
          /vaz[a-z]*|got[a-z]*|ping[a-z]*|escorr[a-z]*/gi,
          /oleo|agua|liquido|fluido/gi,
          /retentor|junta|vedacao/gi
        ]
      },
      
      // Problemas Mecânicos (200)  
      {
        categoryId: 200,
        patterns: [
          /quebr[a-z]*|rachad[a-z]*|partit[a-z]*|danific[a-z]*/gi,
          /desgast[a-z]*|gast[a-z]*|worn/gi,
          /pistao|anel|bronzina|cilindro/gi
        ]
      },
      
      // Problemas Térmicos (300)
      {
        categoryId: 300,
        patterns: [
          /esquent[a-z]*|quent[a-z]*|temperatura|calor/gi,
          /superaque[a-z]*|fervend[a-z]*|vapor/gi,
          /resfri[a-z]*|radiador|ventoinha/gi
        ]
      },
      
      // Problemas Elétricos (400)
      {
        categoryId: 400,
        patterns: [
          /eletric[a-z]*|vela|bobina|bateria/gi,
          /sensor|chicote|fio|cabo/gi,
          /ignicao|centelha|faisca/gi
        ]
      },
      
      // Ruídos e Vibrações (500)
      {
        categoryId: 500,
        patterns: [
          /barulh[a-z]*|ruido|som[a-z]*/gi,
          /estalo|batid[a-z]*|zunid[a-z]*/gi,
          /vibrac[a-z]*|trepid[a-z]*/gi
        ]
      },
      
      // Operacionais (600)
      {
        categoryId: 600,
        patterns: [
          /test[a-z]*|verifica[a-z]*|checag[a-z]*/gi,
          /nao pega|nao liga|falha/gi,
          /manutencao|ajust[a-z]*|reparo/gi
        ]
      }
    ];
    
    patterns.forEach(({ categoryId, patterns: categoryPatterns }) => {
      categoryPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          scores[categoryId] += matches.length * 3;
        }
      });
    });
  }

  /**
   * Encontra a melhor categoria baseada nos scores
   */
  private findBestCategory(scores: { [key: number]: number }): any | null {
    let bestScore = 0;
    let bestCategory = null;

    this.categories.forEach(category => {
      const score = scores[category.id] || 0;
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    });

    return bestScore > 0 ? bestCategory : null;
  }

  /**
   * Cria classificação hierárquica detalhada
   */
  private createHierarchicalClassification(
    description: string, 
    primaryCategory: any, 
    scores: { [key: number]: number }
  ): HierarchicalClassification {
    
    // Por enquanto, usar só o grupo principal
    // Em implementação futura, adicionar subgrupos e subsubgrupos
    const confidence = Math.min((scores[primaryCategory.id] || 0) / 15, 0.95);
    
    const subgroup = this.determineSubgroup(description, primaryCategory);
    const specific = this.determineSpecific(description, primaryCategory, subgroup);
    
    const hierarchyPath = [
      primaryCategory.category_name,
      subgroup.name,
      specific.name
    ].filter(name => name && name.length > 0).join(' > ');
    
    return {
      original_defect_description: description,
      
      primary_group: {
        id: primaryCategory.id,
        name: primaryCategory.category_name,
        confidence: confidence
      },
      
      secondary_subgroup: subgroup,
      tertiary_specific: specific,
      
      full_hierarchy_path: hierarchyPath,
      overall_confidence: confidence,
      ai_reasoning: `Classificação hierárquica baseada em análise de padrões. Score: ${scores[primaryCategory.id]?.toFixed(1)}. Método: Local + Padrões.`,
      classification_method: 'local'
    };
  }

  /**
   * Determina subgrupo baseado no grupo principal
   */
  private determineSubgroup(description: string, primaryCategory: any): { id?: number; name: string; confidence: number } {
    const normalizedText = this.normalizeText(description);
    
    // Mapeamentos de subgrupos por categoria principal
    const subgroupMappings: { [key: number]: Array<{id?: number, name: string, keywords: string[]}> } = {
      100: [ // Vazamentos
        { name: 'Vazamentos Externos', keywords: ['retentor', 'junta', 'vedacao', 'carter', 'tampa', 'externo'] },
        { name: 'Vazamentos Internos', keywords: ['interno', 'combustao', 'cilindro', 'pistao', 'camara'] }
      ],
      200: [ // Problemas Mecânicos
        { name: 'Desgaste de Componentes', keywords: ['desgast', 'gast', 'usado', 'worn'] },
        { name: 'Componentes Quebrados', keywords: ['quebr', 'rachad', 'partit', 'danific'] },
        { name: 'Perda de Peças', keywords: ['perdeu', 'falta', 'ausente', 'sem'] }
      ],
      300: [ // Problemas Térmicos
        { name: 'Superaquecimento', keywords: ['superaque', 'muito quente', 'fervend'] },
        { name: 'Problemas de Resfriamento', keywords: ['resfri', 'radiador', 'ventoinha'] }
      ],
      400: [ // Problemas Elétricos
        { name: 'Sistema de Ignição', keywords: ['ignicao', 'vela', 'bobina', 'centelha'] },
        { name: 'Sistema Elétrico', keywords: ['bateria', 'alternador', 'chicote', 'sensor'] }
      ],
      500: [ // Ruídos e Vibrações
        { name: 'Ruídos Anômalos', keywords: ['barulh', 'ruido', 'som', 'chiado'] },
        { name: 'Vibrações', keywords: ['vibrac', 'trepid', 'balanc'] }
      ],
      600: [ // Operacionais
        { name: 'Testes e Verificações', keywords: ['test', 'verifica', 'checagem'] },
        { name: 'Falhas Operacionais', keywords: ['nao pega', 'nao liga', 'falha'] }
      ]
    };
    
    const subgroups = subgroupMappings[primaryCategory.id] || [];
    let bestSubgroup = { name: '', confidence: 0 };
    
    subgroups.forEach(subgroup => {
      let score = 0;
      subgroup.keywords.forEach(keyword => {
        if (normalizedText.includes(keyword)) {
          score += 1;
        }
      });
      
      if (score > bestSubgroup.confidence) {
        bestSubgroup = { name: subgroup.name, confidence: score / subgroup.keywords.length };
      }
    });
    
    return bestSubgroup;
  }

  /**
   * Determina especificação (subsubgrupo)
   */
  private determineSpecific(
    description: string, 
    primaryCategory: any, 
    subgroup: { name: string; confidence: number }
  ): { id?: number; name: string; confidence: number } {
    
    const normalizedText = this.normalizeText(description);
    
    // Especificações por subgrupo
    if (subgroup.name === 'Vazamentos Externos') {
      if (normalizedText.includes('retentor dianteiro') || normalizedText.includes('retentor da frente')) {
        return { name: 'Retentor Dianteiro', confidence: 0.9 };
      }
      if (normalizedText.includes('retentor traseiro') || normalizedText.includes('retentor de tras')) {
        return { name: 'Retentor Traseiro', confidence: 0.9 };
      }
      if (normalizedText.includes('tampa de valvula') || normalizedText.includes('tampa superior')) {
        return { name: 'Tampa de Válvulas', confidence: 0.9 };
      }
    }
    
    // Se não encontrou especificação, retornar vazio
    return { name: '', confidence: 0 };
  }

  /**
   * Melhora classificação com Groq AI
   */
  private async enhanceWithGroq(
    description: string, 
    localResult: HierarchicalClassification
  ): Promise<HierarchicalClassification | null> {
    
    try {
      // Preparar prompt hierárquico para Groq
      const hierarchicalPrompt = `
Analise este defeito mecânico e classifique hierarquicamente em 3 níveis:

DEFEITO: "${description}"

CATEGORIAS DISPONÍVEIS:
1. Vazamentos (vazamento, gotejamento, óleo, água)
2. Problemas Mecânicos (quebra, desgaste, peças danificadas)  
3. Problemas Térmicos (superaquecimento, temperatura alta)
4. Problemas Elétricos (velas, bateria, sistema elétrico)
5. Ruídos e Vibrações (barulhos, sons anômalos)
6. Operacionais (testes, verificações, falhas de funcionamento)

RESPONDA EM JSON:
{
  "grupo": "nome do grupo principal",
  "subgrupo": "subgrupo específico", 
  "subsubgrupo": "especificação detalhada (opcional)",
  "confianca": 0.95,
  "justificativa": "explicação da classificação"
}
`;

      const groqResult = await this.groqService.classifyDefect(hierarchicalPrompt + '\n\nDEFEITO: ' + description);
      
      if (groqResult && groqResult.ai_confidence > 0.6) {
        // Parse da resposta Groq e conversão para formato hierárquico
        return this.parseGroqResponse(description, groqResult, localResult);
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Erro no Groq enhancement:', error);
      return null;
    }
  }

  /**
   * Faz parse da resposta do Groq
   */
  private parseGroqResponse(
    description: string,
    groqResult: any,
    fallback: HierarchicalClassification
  ): HierarchicalClassification {
    
    try {
      // Tentar fazer parse da resposta JSON do Groq
      const response = typeof groqResult.ai_reasoning === 'string' ? 
        JSON.parse(groqResult.ai_reasoning) : groqResult.ai_reasoning;
      
      // Mapear nome do grupo para ID
      const groupMapping: { [key: string]: number } = {
        'Vazamentos': 100,
        'Problemas Mecânicos': 200,
        'Problemas Térmicos': 300,
        'Problemas Elétricos': 400,
        'Ruídos e Vibrações': 500,
        'Operacionais': 600
      };
      
      const groupId = groupMapping[response.grupo] || fallback.primary_group.id;
      
      return {
        original_defect_description: description,
        
        primary_group: {
          id: groupId,
          name: response.grupo || fallback.primary_group.name,
          confidence: response.confianca || fallback.primary_group.confidence
        },
        
        secondary_subgroup: {
          name: response.subgrupo || '',
          confidence: response.confianca * 0.8 || 0.7
        },
        
        tertiary_specific: {
          name: response.subsubgrupo || '',
          confidence: response.confianca * 0.6 || 0.5
        },
        
        full_hierarchy_path: [response.grupo, response.subgrupo, response.subsubgrupo]
          .filter(item => item && item.length > 0)
          .join(' > '),
          
        overall_confidence: response.confianca || fallback.overall_confidence,
        ai_reasoning: `Classificação hierárquica Groq: ${response.justificativa}`,
        classification_method: 'groq'
      };
      
    } catch (parseError) {
      console.error('❌ Erro no parse Groq:', parseError);
      return fallback;
    }
  }

  /**
   * Cria classificação padrão
   */
  private createDefaultClassification(description: string): HierarchicalClassification {
    return {
      original_defect_description: description,
      
      primary_group: {
        id: 600, // Operacionais como padrão
        name: 'Operacionais',
        confidence: 0.3
      },
      
      secondary_subgroup: {
        name: 'Não Classificado',
        confidence: 0.3
      },
      
      tertiary_specific: {
        name: '',
        confidence: 0
      },
      
      full_hierarchy_path: 'Operacionais > Não Classificado',
      overall_confidence: 0.3,
      ai_reasoning: 'Classificação padrão - defeito não corresponde a padrões conhecidos',
      classification_method: 'local'
    };
  }

  /**
   * Normaliza texto
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[áàâãäå]/g, 'a')
      .replace(/[éèêë]/g, 'e')
      .replace(/[íìîï]/g, 'i')
      .replace(/[óòôõöø]/g, 'o')
      .replace(/[úùûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Salva classificação hierárquica no banco
   */
  public async saveHierarchicalClassification(
    serviceOrderId: number, 
    classification: HierarchicalClassification
  ): Promise<boolean> {
    
    try {
      const insertData = {
        service_order_id: serviceOrderId,
        category_id: classification.primary_group.id,
        original_defect_description: classification.original_defect_description,
        ai_confidence: classification.overall_confidence,
        ai_reasoning: `${classification.ai_reasoning} | HIERÁRQUICO: ${classification.full_hierarchy_path}`,
        alternative_categories: [],
        is_reviewed: false
      };

      const { error } = await supabase
        .from('defect_classifications')
        .insert(insertData);

      if (error) {
        console.error('❌ Erro ao salvar classificação hierárquica:', error.message);
        return false;
      }

      console.log(`✅ Classificação hierárquica salva: OS ${serviceOrderId} -> ${classification.full_hierarchy_path}`);
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      return false;
    }
  }
}