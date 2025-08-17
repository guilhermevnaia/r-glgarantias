import { createClient } from '@supabase/supabase-js';
import { GroqAIService } from './GroqAIService';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface EnhancedHierarchicalClassification {
  original_defect_description: string;
  
  // Classificação principal
  primary_category: {
    id: number;
    name: string;
    confidence: number;
    keywords_matched: string[];
  };
  
  // Subcategorias inferidas
  subcategory: {
    name: string;
    confidence: number;
    reasoning: string;
  };
  
  // Componentes identificados
  components_identified: Array<{
    name: string;
    confidence: number;
    category: string;
  }>;
  
  // Severidade inferida
  severity: {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidence: number;
    indicators: string[];
  };
  
  // Contexto operacional
  operational_context: {
    urgency: 'LOW' | 'MEDIUM' | 'HIGH';
    cost_impact: 'LOW' | 'MEDIUM' | 'HIGH';
    safety_impact: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  
  // Metadata
  full_hierarchy_path: string;
  overall_confidence: number;
  classification_method: 'enhanced_hierarchical';
  analysis_details: string;
}

export class EnhancedHierarchicalAIService {
  private static instance: EnhancedHierarchicalAIService;
  private categories: any[] = [];
  private groqService: GroqAIService;
  
  // Dicionário expandido de componentes mecânicos
  private componentDictionary = {
    motor: ['motor', 'engine', 'propulsor'],
    pistao: ['pistao', 'piston', 'embolo'],
    cilindro: ['cilindro', 'cylinder', 'camisa'],
    cabecote: ['cabecote', 'cabeçote', 'head', 'tampa'],
    bloco: ['bloco', 'block', 'carcaça'],
    virabrequim: ['virabrequim', 'vira', 'crankshaft'],
    biela: ['biela', 'connecting', 'rod'],
    valvula: ['valvula', 'válvula', 'valve'],
    retentor: ['retentor', 'seal', 'vedação'],
    junta: ['junta', 'gasket', 'vedante'],
    bomba: ['bomba', 'pump', 'sistema'],
    filtro: ['filtro', 'filter', 'elemento'],
    radiador: ['radiador', 'radiator', 'trocador'],
    ventoinha: ['ventoinha', 'ventilador', 'fan'],
    correia: ['correia', 'belt', 'cinta'],
    turbo: ['turbo', 'compressor', 'soprador'],
    intercooler: ['intercooler', 'inter', 'resfriador']
  };

  private constructor() {
    this.groqService = GroqAIService.getInstance();
    this.loadCategories();
  }

  public static getInstance(): EnhancedHierarchicalAIService {
    if (!EnhancedHierarchicalAIService.instance) {
      EnhancedHierarchicalAIService.instance = new EnhancedHierarchicalAIService();
    }
    return EnhancedHierarchicalAIService.instance;
  }

  private async loadCategories(): Promise<void> {
    try {
      const { data: categories, error } = await supabase
        .from('defect_categories')
        .select('*')
        .eq('is_active', true)
        .order('total_occurrences', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar categorias:', error);
        return;
      }

      this.categories = categories || [];
      console.log(`🏗️ EnhancedHierarchicalAI: ${this.categories.length} categorias carregadas`);
      
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error);
    }
  }

  /**
   * Classifica um defeito com análise hierárquica aprimorada
   */
  public async classifyDefectEnhanced(defectDescription: string): Promise<EnhancedHierarchicalClassification | null> {
    try {
      if (!defectDescription || defectDescription.trim().length <= 3) {
        return null;
      }

      console.log(`🎯 EnhancedHierarchicalAI: Analisando "${defectDescription}"`);
      
      await this.loadCategories();
      
      const normalizedText = this.normalizeText(defectDescription);
      
      // ETAPA 1: Identificar categoria principal
      const primaryCategory = await this.identifyPrimaryCategory(normalizedText, defectDescription);
      
      // ETAPA 2: Analisar subcategorias
      const subcategory = this.analyzeSubcategory(normalizedText, primaryCategory);
      
      // ETAPA 3: Identificar componentes
      const components = this.identifyComponents(normalizedText);
      
      // ETAPA 4: Determinar severidade
      const severity = this.determineSeverity(normalizedText, primaryCategory);
      
      // ETAPA 5: Avaliar contexto operacional
      const operationalContext = this.evaluateOperationalContext(normalizedText, severity);
      
      // ETAPA 6: Calcular confiança geral
      const overallConfidence = this.calculateOverallConfidence(
        primaryCategory.confidence,
        subcategory.confidence,
        components.length > 0 ? 0.8 : 0.5,
        severity.confidence
      );
      
      // ETAPA 7: Gerar caminho hierárquico
      const hierarchyPath = this.buildHierarchyPath(primaryCategory, subcategory, components);
      
      // ETAPA 8: Análise detalhada
      const analysisDetails = this.generateAnalysisDetails(
        defectDescription, primaryCategory, subcategory, components, severity
      );

      const result: EnhancedHierarchicalClassification = {
        original_defect_description: defectDescription,
        primary_category: primaryCategory,
        subcategory: subcategory,
        components_identified: components,
        severity: severity,
        operational_context: operationalContext,
        full_hierarchy_path: hierarchyPath,
        overall_confidence: overallConfidence,
        classification_method: 'enhanced_hierarchical',
        analysis_details: analysisDetails
      };
      
      console.log(`✅ Classificação aprimorada: ${hierarchyPath} (${(overallConfidence * 100).toFixed(1)}%)`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Erro na classificação hierárquica aprimorada:', error);
      return null;
    }
  }

  /**
   * Identifica a categoria principal com análise de keywords expandida
   */
  private async identifyPrimaryCategory(normalizedText: string, originalText: string): Promise<any> {
    const scores: { [key: number]: { score: number, matchedKeywords: string[] } } = {};
    
    // Inicializar scores
    this.categories.forEach(cat => {
      scores[cat.id] = { score: 0, matchedKeywords: [] };
    });
    
    // Análise de palavras-chave com pesos
    this.categories.forEach(category => {
      const keywords = category.keywords || [];
      keywords.forEach((keyword: string) => {
        const keywordNormalized = keyword.toLowerCase();
        
        if (normalizedText.includes(keywordNormalized)) {
          // Peso baseado na frequência da categoria
          const weight = Math.log(category.total_occurrences + 1) + 1;
          scores[category.id].score += weight;
          scores[category.id].matchedKeywords.push(keyword);
          
          // Bonus se a palavra aparece no início
          if (normalizedText.indexOf(keywordNormalized) < 10) {
            scores[category.id].score += weight * 0.5;
          }
        }
      });
    });
    
    // Análise contextual aprimorada
    this.applyEnhancedPatterns(normalizedText, scores);
    
    // Encontrar melhor categoria
    let bestCategory = null;
    let bestScore = 0;
    
    this.categories.forEach(category => {
      const categoryScore = scores[category.id];
      if (categoryScore.score > bestScore) {
        bestScore = categoryScore.score;
        bestCategory = {
          id: category.id,
          name: category.category_name,
          confidence: Math.min(categoryScore.score / 15, 0.95),
          keywords_matched: categoryScore.matchedKeywords
        };
      }
    });
    
    // Se não encontrou categoria com confiança suficiente, usar IA como backup
    if (!bestCategory || bestCategory.confidence < 0.4) {
      const groqClassification = await this.groqService.classifyDefect(originalText);
      
      if (groqClassification) {
        const groqCategory = this.categories.find(cat => 
          cat.category_name === groqClassification.category_name
        );
        
        if (groqCategory) {
          bestCategory = {
            id: groqCategory.id,
            name: groqCategory.category_name,
            confidence: groqClassification.ai_confidence,
            keywords_matched: ['IA_GROQ']
          };
        }
      }
    }
    
    return bestCategory || {
      id: 600, // Operacionais como fallback
      name: 'Operacionais',
      confidence: 0.3,
      keywords_matched: []
    };
  }

  /**
   * Análise de padrões aprimorada
   */
  private applyEnhancedPatterns(text: string, scores: { [key: number]: { score: number, matchedKeywords: string[] } }): void {
    const enhancedPatterns = [
      // Vazamentos - Padrões mais específicos
      {
        categoryId: 100,
        patterns: [
          { regex: /vaz[a-z]*|got[a-z]*|ping[a-z]*|escorr[a-z]*/gi, weight: 5 },
          { regex: /oleo|agua|liquido|fluido|combustivel/gi, weight: 3 },
          { regex: /retentor|junta|vedacao|selo/gi, weight: 4 },
          { regex: /carter|radiador|bomba.*vaz|mangueira.*vaz/gi, weight: 6 }
        ]
      },
      
      // Problemas Mecânicos - Detecção melhorada
      {
        categoryId: 200,
        patterns: [
          { regex: /quebr[a-z]*|rachad[a-z]*|partit[a-z]*|danific[a-z]*/gi, weight: 6 },
          { regex: /desgast[a-z]*|gast[a-z]*|usado|worn/gi, weight: 4 },
          { regex: /pistao|anel|bronzina|cilindro|biela/gi, weight: 5 },
          { regex: /fundiu|derret[a-z]*|solda[a-z]*/gi, weight: 7 }
        ]
      },
      
      // Problemas Térmicos - Padrões expandidos
      {
        categoryId: 300,
        patterns: [
          { regex: /esquent[a-z]*|quent[a-z]*|temperatura|calor/gi, weight: 5 },
          { regex: /superaque[a-z]*|fervend[a-z]*|vapor/gi, weight: 7 },
          { regex: /resfri[a-z]*|radiador|ventoinha|termostato/gi, weight: 4 },
          { regex: /fumaca.*preta|fumaca.*branca|fumaca.*azul/gi, weight: 6 }
        ]
      },
      
      // Problemas Elétricos - Detecção aprimorada
      {
        categoryId: 400,
        patterns: [
          { regex: /eletric[a-z]*|vela|bobina|bateria/gi, weight: 5 },
          { regex: /sensor|chicote|fio|cabo|conector/gi, weight: 4 },
          { regex: /ignicao|centelha|faisca|partida/gi, weight: 5 },
          { regex: /alternador|gerador|eletrica/gi, weight: 4 }
        ]
      },
      
      // Ruídos e Vibrações - Padrões específicos
      {
        categoryId: 500,
        patterns: [
          { regex: /barulh[a-z]*|ruido|som[a-z]*|zunido/gi, weight: 5 },
          { regex: /estalo|batid[a-z]*|pancad[a-z]*|baque/gi, weight: 4 },
          { regex: /vibrac[a-z]*|trepid[a-z]*|balanc[a-z]*/gi, weight: 5 },
          { regex: /motor.*bate|cabecote.*bate|pistao.*bate/gi, weight: 6 }
        ]
      }
    ];
    
    enhancedPatterns.forEach(({ categoryId, patterns }) => {
      patterns.forEach(({ regex, weight }) => {
        const matches = text.match(regex);
        if (matches) {
          scores[categoryId].score += matches.length * weight;
        }
      });
    });
  }

  /**
   * Analisa subcategorias baseado na categoria principal
   */
  private analyzeSubcategory(text: string, primaryCategory: any): any {
    const subcategoryMappings: { [key: number]: Array<{name: string, keywords: string[], confidence: number}> } = {
      100: [ // Vazamentos
        { name: 'Vazamento de Óleo', keywords: ['oleo', 'oil', 'lubrificante'], confidence: 0.9 },
        { name: 'Vazamento de Água', keywords: ['agua', 'water', 'liquido', 'arrefecimento'], confidence: 0.9 },
        { name: 'Vazamento de Combustível', keywords: ['combustivel', 'diesel', 'gasolina', 'fuel'], confidence: 0.9 },
        { name: 'Vazamento Interno', keywords: ['interno', 'combustao', 'cilindro'], confidence: 0.8 }
      ],
      200: [ // Problemas Mecânicos
        { name: 'Componente Quebrado', keywords: ['quebr', 'rachad', 'partit'], confidence: 0.9 },
        { name: 'Desgaste Excessivo', keywords: ['desgast', 'gast', 'usado'], confidence: 0.8 },
        { name: 'Componente Fundido', keywords: ['fundiu', 'derret', 'solda'], confidence: 0.95 },
        { name: 'Desalinhamento', keywords: ['desalinha', 'torto', 'empena'], confidence: 0.8 }
      ],
      300: [ // Problemas Térmicos
        { name: 'Superaquecimento', keywords: ['superaque', 'muito quent', 'fervend'], confidence: 0.9 },
        { name: 'Sistema de Arrefecimento', keywords: ['radiador', 'ventoinha', 'bomba agua'], confidence: 0.8 }
      ],
      500: [ // Ruídos e Vibrações
        { name: 'Ruído Metálico', keywords: ['estalo', 'batid', 'metalico'], confidence: 0.8 },
        { name: 'Vibração Excessiva', keywords: ['vibrac', 'trepid', 'balanc'], confidence: 0.8 }
      ]
    };
    
    const subcategories = subcategoryMappings[primaryCategory.id] || [];
    let bestSubcategory = { name: 'Genérico', confidence: 0.5, reasoning: 'Subcategoria não identificada especificamente' };
    
    subcategories.forEach(subcategory => {
      let score = 0;
      const matchedKeywords: string[] = [];
      
      subcategory.keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          score += 1;
          matchedKeywords.push(keyword);
        }
      });
      
      if (score > 0) {
        const adjustedConfidence = (score / subcategory.keywords.length) * subcategory.confidence;
        
        if (adjustedConfidence > bestSubcategory.confidence) {
          bestSubcategory = {
            name: subcategory.name,
            confidence: adjustedConfidence,
            reasoning: `Identificado por: ${matchedKeywords.join(', ')}`
          };
        }
      }
    });
    
    return bestSubcategory;
  }

  /**
   * Identifica componentes específicos no texto
   */
  private identifyComponents(text: string): Array<{name: string, confidence: number, category: string}> {
    const components: Array<{name: string, confidence: number, category: string}> = [];
    
    Object.entries(this.componentDictionary).forEach(([componentType, variants]) => {
      variants.forEach(variant => {
        if (text.includes(variant)) {
          const confidence = variant.length > 4 ? 0.9 : 0.7; // Palavras maiores = maior confiança
          
          components.push({
            name: componentType.charAt(0).toUpperCase() + componentType.slice(1),
            confidence: confidence,
            category: this.categorizeComponent(componentType)
          });
        }
      });
    });
    
    // Remover duplicatas e ordenar por confiança
    const uniqueComponents = components.reduce((acc, comp) => {
      const existing = acc.find(c => c.name === comp.name);
      if (!existing || comp.confidence > existing.confidence) {
        acc = acc.filter(c => c.name !== comp.name);
        acc.push(comp);
      }
      return acc;
    }, [] as Array<{name: string, confidence: number, category: string}>);
    
    return uniqueComponents.sort((a, b) => b.confidence - a.confidence).slice(0, 5); // Top 5 componentes
  }

  /**
   * Categoriza componente por tipo
   */
  private categorizeComponent(componentType: string): string {
    const categories = {
      'motor': 'Sistema Principal',
      'pistao': 'Sistema de Combustão',
      'cilindro': 'Sistema de Combustão', 
      'cabecote': 'Sistema de Válvulas',
      'bloco': 'Sistema Principal',
      'virabrequim': 'Sistema de Transmissão',
      'biela': 'Sistema de Transmissão',
      'valvula': 'Sistema de Válvulas',
      'retentor': 'Sistema de Vedação',
      'junta': 'Sistema de Vedação',
      'bomba': 'Sistema Auxiliar',
      'filtro': 'Sistema de Filtragem',
      'radiador': 'Sistema de Arrefecimento',
      'ventoinha': 'Sistema de Arrefecimento',
      'correia': 'Sistema de Transmissão',
      'turbo': 'Sistema de Sobrealimentação',
      'intercooler': 'Sistema de Sobrealimentação'
    };
    
    return categories[componentType as keyof typeof categories] || 'Sistema Não Identificado';
  }

  /**
   * Determina severidade do defeito
   */
  private determineSeverity(text: string, primaryCategory: any): any {
    const severityIndicators = {
      critical: ['fundiu', 'quebrou', 'explodiu', 'travou', 'parou', 'emergencia'],
      high: ['muito', 'excessiv', 'grave', 'serio', 'critico', 'urgent'],
      medium: ['problem', 'defeito', 'falha', 'irregular'],
      low: ['pequen', 'leve', 'minimo', 'ajust']
    };
    
    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
    let confidence = 0.5;
    const indicators: string[] = [];
    
    // Verificar indicadores de severidade
    Object.entries(severityIndicators).forEach(([severityLevel, keywords]) => {
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          indicators.push(keyword);
          
          if (severityLevel === 'critical') {
            level = 'CRITICAL';
            confidence = 0.9;
          } else if (severityLevel === 'high' && level !== 'CRITICAL') {
            level = 'HIGH';
            confidence = 0.8;
          } else if (severityLevel === 'medium' && level === 'MEDIUM') {
            confidence = 0.7;
          } else if (severityLevel === 'low' && level === 'MEDIUM') {
            level = 'LOW';
            confidence = 0.6;
          }
        }
      });
    });
    
    // Ajustar severidade baseado na categoria
    if (primaryCategory.name === 'Problemas Mecânicos' && level === 'MEDIUM') {
      level = 'HIGH';
      confidence = Math.min(confidence + 0.2, 0.9);
    }
    
    return { level, confidence, indicators };
  }

  /**
   * Avalia contexto operacional
   */
  private evaluateOperationalContext(text: string, severity: any): any {
    // Mapear severidade para contexto operacional
    const severityToContext = {
      'CRITICAL': { urgency: 'HIGH', cost_impact: 'HIGH', safety_impact: 'HIGH' },
      'HIGH': { urgency: 'HIGH', cost_impact: 'MEDIUM', safety_impact: 'MEDIUM' },
      'MEDIUM': { urgency: 'MEDIUM', cost_impact: 'MEDIUM', safety_impact: 'LOW' },
      'LOW': { urgency: 'LOW', cost_impact: 'LOW', safety_impact: 'LOW' }
    };
    
    const baseContext = severityToContext[severity.level];
    
    // Ajustar baseado em palavras-chave específicas
    if (text.includes('urgent') || text.includes('emergenc') || text.includes('parou')) {
      baseContext.urgency = 'HIGH';
    }
    
    if (text.includes('caro') || text.includes('expensive') || text.includes('motor')) {
      baseContext.cost_impact = 'HIGH';
    }
    
    if (text.includes('segur') || text.includes('perig') || text.includes('risco')) {
      baseContext.safety_impact = 'HIGH';
    }
    
    return baseContext;
  }

  /**
   * Calcula confiança geral
   */
  private calculateOverallConfidence(...confidences: number[]): number {
    // Média ponderada das confianças
    const weights = [0.4, 0.3, 0.2, 0.1]; // Peso decrescente
    let weightedSum = 0;
    let totalWeight = 0;
    
    confidences.forEach((conf, index) => {
      const weight = weights[index] || 0.1;
      weightedSum += conf * weight;
      totalWeight += weight;
    });
    
    return Math.min(weightedSum / totalWeight, 0.95);
  }

  /**
   * Constrói caminho hierárquico
   */
  private buildHierarchyPath(primaryCategory: any, subcategory: any, components: any[]): string {
    const parts = [
      primaryCategory.name,
      subcategory.name !== 'Genérico' ? subcategory.name : null,
      components.length > 0 ? components[0].name : null
    ].filter(Boolean);
    
    return parts.join(' > ');
  }

  /**
   * Gera análise detalhada
   */
  private generateAnalysisDetails(
    originalText: string, 
    primaryCategory: any, 
    subcategory: any, 
    components: any[], 
    severity: any
  ): string {
    return `Análise: Defeito classificado como '${primaryCategory.name}' com ${(primaryCategory.confidence * 100).toFixed(1)}% de confiança. ` +
           `Subcategoria identificada: '${subcategory.name}'. ` +
           (components.length > 0 ? `Componentes afetados: ${components.map(c => c.name).join(', ')}. ` : '') +
           `Severidade: ${severity.level}. ` +
           `Palavras-chave correspondentes: ${primaryCategory.keywords_matched.join(', ')}.`;
  }

  /**
   * Normaliza texto para análise
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
}