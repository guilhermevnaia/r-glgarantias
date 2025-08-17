const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function forceMassClassification() {
  console.log('🚀 FORÇANDO CLASSIFICAÇÃO EM MASSA - ALGORITMO ROBUSTO');
  
  try {
    // 1. Buscar TODAS as ordens com defeitos
    console.log('📊 1. Buscando todas as ordens com defeitos...');
    const { data: allOrders, error: ordersError } = await supabase
      .from('service_orders')
      .select('id, raw_defect_description')
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');

    if (ordersError) {
      console.error('❌ Erro ao buscar ordens:', ordersError);
      return;
    }

    console.log(`📋 Total de ordens com defeitos: ${allOrders.length}`);

    // 2. Buscar IDs já classificados
    console.log('🔍 2. Identificando ordens já classificadas...');
    const { data: classifiedIds, error: classError } = await supabase
      .from('defect_classifications')
      .select('service_order_id');

    if (classError) {
      console.error('❌ Erro ao buscar classificações:', classError);
      return;
    }

    const classifiedSet = new Set((classifiedIds || []).map(item => item.service_order_id));
    console.log(`✅ Ordens já classificadas: ${classifiedSet.size}`);

    // 3. Filtrar ordens não classificadas
    const unclassifiedOrders = allOrders.filter(order => !classifiedSet.has(order.id));
    console.log(`🎯 Ordens para classificar: ${unclassifiedOrders.length}`);

    if (unclassifiedOrders.length === 0) {
      console.log('🎉 Todas as ordens já foram classificadas!');
      return;
    }

    // 4. Buscar categorias disponíveis
    console.log('📂 3. Carregando categorias...');
    const { data: categories, error: catError } = await supabase
      .from('defect_categories')
      .select('*')
      .eq('is_active', true)
      .order('total_occurrences', { ascending: false });

    if (catError || !categories || categories.length === 0) {
      console.error('❌ Erro ao carregar categorias:', catError);
      return;
    }

    console.log(`📋 Categorias disponíveis: ${categories.length}`);

    // 5. Função de classificação robusta
    function classifyDefectRobust(description) {
      const text = description.toLowerCase()
        .replace(/[áàâãä]/g, 'a')
        .replace(/[éèêë]/g, 'e')
        .replace(/[íìîï]/g, 'i')
        .replace(/[óòôõö]/g, 'o')
        .replace(/[úùûü]/g, 'u')
        .replace(/[ç]/g, 'c');
      
      const scores = {};
      
      // Inicializar scores
      categories.forEach(cat => {
        scores[cat.id] = 0;
      });

      // Regras robustas de classificação
      for (const category of categories) {
        let score = 0;

        // Palavras-chave diretas
        const keywords = category.keywords || [];
        keywords.forEach(keyword => {
          if (text.includes(keyword.toLowerCase())) {
            score += 4;
          }
        });

        // Regras específicas por categoria
        switch (category.category_name) {
          case 'Vazamentos':
            if (/vaz[a-z]*|got[a-z]*|ping[a-z]*|escorr[a-z]*|oleo|agua|liquido/i.test(text)) score += 6;
            if (/retentor|junta|vedacao|carter|cabecote/i.test(text)) score += 3;
            break;

          case 'Superaquecimento':
            if (/esquent[a-z]*|quent[a-z]*|temperatura|calor|fervend[a-z]*/i.test(text)) score += 6;
            if (/radiador|ventoinha|termostato|vapor/i.test(text)) score += 3;
            break;

          case 'Ruídos Anômalos':
          case 'Ruidos Anomalos':
            if (/barulh[a-z]*|ruido|som|estalo|batid[a-z]*|zunid[a-z]*/i.test(text)) score += 6;
            if (/chiado|apito|rangend|vibrac/i.test(text)) score += 3;
            break;

          case 'Problemas Elétricos':
          case 'Problemas Eletricos':
            if (/eletric[a-z]*|vela|bobina|bateria|alternador|sensor/i.test(text)) score += 6;
            if (/chicote|fio|curto|circuito/i.test(text)) score += 3;
            break;

          case 'Desgaste de Componentes':
            if (/desgast[a-z]*|gast[a-z]*|desgast[a-z]*|troca|substitui[a-z]*/i.test(text)) score += 6;
            if (/pistao|bronzina|anel|valvula|cilindro/i.test(text)) score += 3;
            break;

          case 'Falhas de Ignição':
          case 'Falhas de Ignicao':
            if (/nao pega|nao liga|falha|ignicao|partida|combustao/i.test(text)) score += 6;
            if (/arranque|motor|mistura/i.test(text)) score += 2;
            break;

          case 'Perda de Peças':
          case 'Perda de Pecas':
            if (/perd[a-z]*|falta|sumiu|desapareceu|ausente|nao tem/i.test(text)) score += 6;
            break;

          case 'Testes e Verificações':
          case 'Testes e Verificacoes':
            if (/test[a-z]*|verifica[a-z]*|inspecao|analise|revisao/i.test(text)) score += 5;
            break;

          case 'Erros de Teste':
            if (/erro|incorret[a-z]*|equivocad[a-z]*|falha.*test/i.test(text)) score += 5;
            break;

          case 'Problemas de Registro':
            if (/erro.*registro|codifica[a-z]*|administrativo|lancamento/i.test(text)) score += 5;
            break;
        }

        // Palavras genéricas dão score baixo
        if (/motor|peca|sistema|problema/i.test(text) && score === 0) {
          score += 1;
        }

        scores[category.id] = score;
      }

      // Encontrar melhor match
      let bestScore = 0;
      let bestCategory = null;

      for (const category of categories) {
        if (scores[category.id] > bestScore) {
          bestScore = scores[category.id];
          bestCategory = category;
        }
      }

      // Se não encontrou nada, usar categoria padrão (primeira disponível)
      if (!bestCategory || bestScore === 0) {
        bestCategory = categories.find(cat => 
          cat.category_name.includes('Testes') || 
          cat.category_name.includes('Problema')
        ) || categories[0];
        bestScore = 2; // Score mínimo
      }

      const confidence = Math.min(Math.max(bestScore / 10, 0.2), 0.95);

      return {
        category_id: bestCategory.id,
        category_name: bestCategory.category_name,
        ai_confidence: confidence,
        ai_reasoning: `Classificação robusta baseada em múltiplas regras. Score: ${bestScore.toFixed(1)}. Análise de padrões textuais específicos.`,
        score: bestScore
      };
    }

    // 6. Processar em lotes
    console.log('⚡ 4. Iniciando processamento em lotes...');
    let processed = 0;
    let successful = 0;
    const batchSize = 20;
    
    for (let i = 0; i < unclassifiedOrders.length; i += batchSize) {
      const batch = unclassifiedOrders.slice(i, i + batchSize);
      
      console.log(`📦 Processando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(unclassifiedOrders.length/batchSize)} (${batch.length} itens)`);
      
      for (const order of batch) {
        try {
          // Classificar
          const classification = classifyDefectRobust(order.raw_defect_description);
          
          // Salvar no banco
          const insertData = {
            service_order_id: order.id,
            original_defect_description: order.raw_defect_description,
            category_id: classification.category_id,
            ai_confidence: classification.ai_confidence,
            ai_reasoning: classification.ai_reasoning,
            alternative_categories: [],
            is_reviewed: false
          };

          const { error: insertError } = await supabase
            .from('defect_classifications')
            .insert(insertData);

          if (insertError) {
            console.log(`⚠️ Erro ao salvar OS ${order.id}:`, insertError.message);
          } else {
            successful++;
            // Atualizar contador da categoria
            await supabase
              .from('defect_categories')
              .update({ 
                total_occurrences: supabase.rpc('increment', { x: 1 }) 
              })
              .eq('id', classification.category_id);
          }

          processed++;

        } catch (error) {
          console.error(`❌ Erro ao processar OS ${order.id}:`, error.message);
          processed++;
        }
      }

      // Progress report
      const percentage = ((processed / unclassifiedOrders.length) * 100).toFixed(1);
      console.log(`📊 Progresso: ${processed}/${unclassifiedOrders.length} (${percentage}%) - Sucessos: ${successful}`);

      // Pequena pausa entre lotes
      if (i + batchSize < unclassifiedOrders.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`🎉 CLASSIFICAÇÃO FORÇADA CONCLUÍDA!`);
    console.log(`📈 Resultados finais:`);
    console.log(`   • Processados: ${processed}/${unclassifiedOrders.length}`);
    console.log(`   • Sucessos: ${successful}`);
    console.log(`   • Taxa de sucesso: ${((successful / processed) * 100).toFixed(1)}%`);

    // Verificar novo progresso
    const { count: newTotalClassified } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });

    const newRate = ((newTotalClassified / allOrders.length) * 100).toFixed(1);
    console.log(`🚀 NOVA TAXA DE CLASSIFICAÇÃO: ${newRate}% (${newTotalClassified}/${allOrders.length})`);

  } catch (error) {
    console.error('❌ Erro crítico:', error);
  }
}

forceMassClassification();