const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Implementação básica do LocalAI para classificação em massa
class LocalAIService {
  constructor() {
    this.categories = [];
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

        if (category.category_name === 'Falhas de Ignição') {
          if (text.includes('não pega') || text.includes('não liga') || text.includes('partida') ||
              text.includes('motor de arranque') || text.includes('ignição')) {
            score += 3;
          }
        }

        if (category.category_name === 'Desgaste de Componentes') {
          if (text.includes('desgast') || text.includes('gasto') || text.includes('troca') ||
              text.includes('substitui') || text.includes('danific') || text.includes('quebr')) {
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
      // Verificar se já existe classificação para esta OS
      const { data: existing } = await supabase
        .from('defect_classifications')
        .select('id')
        .eq('service_order_id', serviceOrderId)
        .single();

      if (existing) {
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

      // Incrementar contador da categoria será feito depois em lote
      // (removido para evitar erro do supabase.sql)

      return true;

    } catch (error) {
      console.error('❌ LocalAI: Erro ao salvar classificação:', error);
      return false;
    }
  }

  /**
   * Classifica todos os defeitos existentes
   */
  async classifyAllExistingDefects() {
    try {
      console.log('🚀 LocalAI: Iniciando classificação massiva...');

      // Carregar categorias
      await this.loadCategories();

      // Buscar IDs das OS já classificadas
      const { data: classifiedIds } = await supabase
        .from('defect_classifications')
        .select('service_order_id');

      const classifiedSet = new Set((classifiedIds || []).map(item => item.service_order_id));

      // Buscar todas as OS com defeitos válidos não classificadas
      const { data: orders, error } = await supabase
        .from('service_orders')
        .select('id, raw_defect_description')
        .not('raw_defect_description', 'is', null)
        .not('raw_defect_description', 'eq', '');

      if (error) {
        console.error('❌ LocalAI: Erro ao buscar ordens:', error);
        return;
      }

      // Filtrar ordens não classificadas
      const unclassifiedOrders = (orders || []).filter(order => !classifiedSet.has(order.id));

      if (unclassifiedOrders.length === 0) {
        console.log('✅ LocalAI: Todos os defeitos já foram classificados!');
        return;
      }

      console.log(`📊 LocalAI: ${unclassifiedOrders.length} ordens para classificar`);

      let processed = 0;
      let succeeded = 0;
      let failed = 0;

      // Processar em lotes menores para melhor performance
      const batchSize = 10;
      
      for (let i = 0; i < unclassifiedOrders.length; i += batchSize) {
        const batch = unclassifiedOrders.slice(i, i + batchSize);
        
        // Processar lote sequencialmente
        for (const order of batch) {
          try {
            const classification = await this.classifyDefect(order.raw_defect_description);
            
            if (classification) {
              const saved = await this.saveClassification(order.id, classification);
              if (saved) {
                succeeded++;
              } else {
                failed++;
              }
            } else {
              failed++;
            }
            
            processed++;
            
            // Log de progresso a cada 50 processadas
            if (processed % 50 === 0) {
              const percent = Math.round((processed / unclassifiedOrders.length) * 100);
              console.log(`📈 LocalAI: Progresso ${percent}% (${succeeded} sucessos, ${failed} falhas)`);
            }

            // Pequena pausa para não sobrecarregar o sistema
            await new Promise(resolve => setTimeout(resolve, 50));

          } catch (error) {
            console.error(`❌ LocalAI: Erro ao processar OS ${order.id}:`, error);
            failed++;
            processed++;
          }
        }

        // Pausa entre lotes
        if (i + batchSize < unclassifiedOrders.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      console.log(`🎉 LocalAI: Classificação massiva concluída!`);
      console.log(`📊 Resumo final:`);
      console.log(`  ✅ Sucessos: ${succeeded}`);
      console.log(`  ❌ Falhas: ${failed}`);
      console.log(`  📈 Taxa de sucesso: ${Math.round((succeeded / processed) * 100)}%`);
      console.log(`  🎯 Total processado: ${processed}/${unclassifiedOrders.length}`);

    } catch (error) {
      console.error('❌ LocalAI: Erro na classificação massiva:', error);
    }
  }
}

async function executeMassClassification() {
  console.log('🚀 === CLASSIFICAÇÃO EM MASSA ===');
  
  const localAI = new LocalAIService();
  
  console.log('⚠️  Esta operação irá classificar TODOS os defeitos não classificados.');
  console.log('📝 Pressione Ctrl+C nos próximos 3 segundos para cancelar...');
  
  // Pausa de 3 segundos para permitir cancelamento
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('🚀 Iniciando classificação em massa...');
  await localAI.classifyAllExistingDefects();
  
  console.log('🎯 Operação concluída!');
}

executeMassClassification().catch(console.error);