const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Implementação básica do LocalAI para teste
class LocalAIService {
  constructor() {
    this.categories = [];
    this.loadCategories();
  }

  async loadCategories() {
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
      console.log(`🤖 LocalAI: ${this.categories.length} categorias carregadas`);
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error);
    }
  }

  async classifyDefect(defectDescription) {
    try {
      if (!defectDescription || defectDescription.trim().length === 0) {
        return null;
      }

      console.log(`🤖 LocalAI: Classificando defeito "${defectDescription}"`);
      
      // Recarregar categorias
      await this.loadCategories();
      
      const text = defectDescription.toLowerCase();
      const scores = {};
      let bestMatch = null;
      let bestScore = 0;

      // Análise baseada em palavras-chave
      for (const category of this.categories) {
        let score = 0;
        const keywords = category.keywords || [];
        
        // Verificar palavras-chave diretas
        for (const keyword of keywords) {
          if (text.includes(keyword.toLowerCase())) {
            score += 2; // Peso alto para keywords diretas
          }
        }

        // Regras específicas por categoria
        if (category.category_name === 'Vazamentos') {
          if (text.includes('vaza') || text.includes('gotej') || text.includes('óleo') || 
              text.includes('água') || text.includes('líquido') || text.includes('pinga')) {
            score += 3;
          }
        }

        if (category.category_name === 'Superaquecimento') {
          if (text.includes('quente') || text.includes('esquenta') || text.includes('temperatura') ||
              text.includes('superaquec') || text.includes('calor') || text.includes('fervendo')) {
            score += 3;
          }
        }

        if (category.category_name === 'Ruídos Anômalos') {
          if (text.includes('barulho') || text.includes('ruído') || text.includes('som') ||
              text.includes('estalo') || text.includes('batida') || text.includes('zunido')) {
            score += 3;
          }
        }

        if (category.category_name === 'Problemas Elétricos') {
          if (text.includes('elétric') || text.includes('bateria') || text.includes('alternador') ||
              text.includes('chicote') || text.includes('fio') || text.includes('curto')) {
            score += 3;
          }
        }

        // Palavras genéricas que aumentam score marginalmente
        if (text.includes('motor') || text.includes('peça') || text.includes('sistema')) {
          score += 0.5;
        }

        scores[category.id] = score;
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = category;
        }
      }

      // Se não encontrou uma correspondência boa, usar categoria genérica
      if (bestScore < 2) {
        bestMatch = this.categories.find(c => c.category_name.includes('Desgaste')) || this.categories[0];
        bestScore = 1;
      }

      if (!bestMatch) {
        console.log('❌ LocalAI: Nenhuma categoria encontrada');
        return null;
      }

      // Calcular confiança baseada no score
      const confidence = Math.min(bestScore / 5, 0.95); // Max 95% de confiança

      // Encontrar categorias alternativas (scores altos mas não o melhor)
      const alternativeIds = Object.entries(scores)
        .filter(([id, score]) => parseInt(id) !== bestMatch.id && score >= 1)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([id]) => parseInt(id));

      const reasoning = `Classificação baseada em análise de palavras-chave. Score: ${bestScore.toFixed(1)}. ` +
                       `Palavras relevantes encontradas no defeito relacionadas à categoria "${bestMatch.category_name}".`;

      console.log(`✅ LocalAI: Classificado como "${bestMatch.category_name}" (confiança: ${(confidence * 100).toFixed(1)}%)`);

      return {
        original_defect_description: defectDescription,
        category_id: bestMatch.id,
        category_name: bestMatch.category_name,
        ai_confidence: confidence,
        ai_reasoning: reasoning,
        alternative_categories: alternativeIds
      };

    } catch (error) {
      console.error('❌ LocalAI: Erro na classificação:', error);
      return null;
    }
  }

  async saveClassification(serviceOrderId, classification) {
    try {
      console.log(`💾 LocalAI: Salvando classificação para OS ${serviceOrderId}`);

      // Verificar se já existe classificação para esta OS
      const { data: existing } = await supabase
        .from('defect_classifications')
        .select('id')
        .eq('service_order_id', serviceOrderId)
        .single();

      if (existing) {
        console.log(`⚠️ LocalAI: OS ${serviceOrderId} já possui classificação, pulando...`);
        return true; // Consideramos sucesso para não quebrar o fluxo
      }

      const insertData = {
        service_order_id: serviceOrderId,
        original_defect_description: classification.original_defect_description,
        category_id: classification.category_id,
        ai_confidence: classification.ai_confidence,
        ai_reasoning: classification.ai_reasoning,
        alternative_categories: classification.alternative_categories || [],
        is_reviewed: false
      };

      const { data, error } = await supabase
        .from('defect_classifications')
        .insert(insertData)
        .select();

      if (error) {
        console.error('❌ LocalAI: Erro ao salvar:', error);
        return false;
      }

      console.log(`✅ LocalAI: Classificação salva com ID ${data[0]?.id}`);
      return true;

    } catch (error) {
      console.error('❌ LocalAI: Erro ao salvar classificação:', error);
      return false;
    }
  }
}

async function testLocalAI() {
  console.log('🧪 === TESTE DO LOCAL AI ===');
  
  const localAI = new LocalAIService();
  
  const testCases = [
    'Motor com vazamento de óleo na junta do cabeçote',
    'Alternador não carrega bateria',
    'Motor fazendo barulho estranho no ralenti',
    'Radiador superaquecendo'
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🔍 Testando: "${testCase}"`);
    const result = await localAI.classifyDefect(testCase);
    
    if (result) {
      console.log(`  ✅ Categoria: ${result.category_name}`);
      console.log(`  📊 Confiança: ${(result.ai_confidence * 100).toFixed(1)}%`);
      console.log(`  🧠 Raciocínio: ${result.ai_reasoning.substring(0, 80)}...`);
    } else {
      console.log('  ❌ Falha na classificação');
    }
  }
  
  console.log('\n🎯 Teste do LocalAI concluído!');
}

testLocalAI().catch(console.error);