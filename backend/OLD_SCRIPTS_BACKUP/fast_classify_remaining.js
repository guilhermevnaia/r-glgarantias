const { createClient } = require('@supabase/supabase-js');
const { EnhancedLocalAIService } = require('./dist/services/EnhancedLocalAIService');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fastClassifyRemaining() {
  console.log('🚀 CLASSIFICAÇÃO RÁPIDA DOS DEFEITOS RESTANTES\n');
  
  try {
    const localAI = EnhancedLocalAIService.getInstance();
    
    // 1. Buscar defeitos não classificados
    console.log('1️⃣ Buscando defeitos não classificados...');
    
    const { data: allDefects } = await supabase
      .from('service_orders')
      .select('id, raw_defect_description')
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    const validDefects = allDefects?.filter(defect => 
      defect.raw_defect_description && 
      defect.raw_defect_description.trim().length > 3 &&
      !isNonDefectDescription(defect.raw_defect_description)
    ) || [];
    
    // Buscar já classificados
    const { data: classified } = await supabase
      .from('defect_classifications')
      .select('service_order_id');
    
    const classifiedIds = new Set(classified?.map(c => c.service_order_id) || []);
    const unclassified = validDefects.filter(d => !classifiedIds.has(d.id));
    
    console.log(`📊 Total defeitos válidos: ${validDefects.length}`);
    console.log(`✅ Já classificados: ${classifiedIds.size}`);
    console.log(`❌ Restantes: ${unclassified.length}`);
    
    if (unclassified.length === 0) {
      console.log('🎉 TODOS OS DEFEITOS JÁ ESTÃO CLASSIFICADOS!');
      return;
    }
    
    // 2. Classificação em lotes pequenos
    console.log(`\\n2️⃣ Iniciando classificação de ${unclassified.length} defeitos...\\n`);
    
    let processed = 0;
    let successful = 0;
    let failed = 0;
    const startTime = Date.now();
    const batchSize = 10;
    
    for (let i = 0; i < unclassified.length; i += batchSize) {
      const batch = unclassified.slice(i, i + batchSize);
      
      console.log(`\\n🔄 LOTE ${Math.floor(i/batchSize) + 1}/${Math.ceil(unclassified.length/batchSize)}`);
      
      // Processar em paralelo dentro do lote (mais rápido)
      const promises = batch.map(async (defect) => {
        try {
          console.log(`   📝 OS ${defect.id}: ${defect.raw_defect_description.substring(0, 40)}...`);
          
          const classification = await localAI.classifyDefect(defect.raw_defect_description);
          
          if (classification) {
            const saved = await saveClassification(defect.id, classification);
            if (saved) {
              successful++;
              console.log(`      ✅ ${classification.category_name} (${(classification.ai_confidence * 100).toFixed(0)}%)`);
              return true;
            } else {
              failed++;
              console.log(`      ❌ Erro ao salvar`);
              return false;
            }
          } else {
            failed++;
            console.log(`      ❌ Falha na classificação`);
            return false;
          }
          
        } catch (error) {
          failed++;
          console.error(`      ❌ Erro: ${error.message}`);
          return false;
        }
      });
      
      // Aguardar conclusão do lote
      await Promise.all(promises);
      processed += batch.length;
      
      // Relatório de progresso
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = processed / elapsed;
      const eta = (unclassified.length - processed) / rate;
      const progressPercent = ((processed / unclassified.length) * 100).toFixed(1);
      
      console.log(`\\n📈 Progresso: ${processed}/${unclassified.length} (${progressPercent}%)`);
      console.log(`📊 Status: ✅ ${successful} | ❌ ${failed}`);
      console.log(`⏱️ Taxa: ${rate.toFixed(1)}/s | ETA: ${(eta/60).toFixed(1)}min\\n`);
      
      // Pausa para não sobrecarregar
      if (i + batchSize < unclassified.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // 3. Resultado final
    const totalTime = (Date.now() - startTime) / 1000;
    const finalRate = processed / totalTime;
    
    console.log('\\n' + '='.repeat(60));
    console.log('🎉 CLASSIFICAÇÃO RÁPIDA CONCLUÍDA!');
    console.log('='.repeat(60));
    console.log(`⏱️ Tempo total: ${(totalTime/60).toFixed(1)} minutos`);
    console.log(`📊 Processados: ${processed}`);
    console.log(`✅ Sucessos: ${successful}`);
    console.log(`❌ Falhas: ${failed}`);
    console.log(`📈 Taxa média: ${finalRate.toFixed(1)} defeitos/segundo`);
    console.log(`🎯 Taxa de sucesso: ${((successful/processed)*100).toFixed(1)}%`);
    
    // Verificação final
    const { count: finalCount } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });
    
    const finalCoverage = ((finalCount / validDefects.length) * 100).toFixed(1);
    console.log(`📈 Cobertura total: ${finalCoverage}% (${finalCount}/${validDefects.length})`);
    
    if (finalCoverage >= 99) {
      console.log('\\n🎉 OBJETIVO ATINGIDO! Cobertura de 99%+ alcançada!');
      console.log('✅ Sistema pronto para produção!');
    } else {
      console.log('\\n⚠️ Ainda restam alguns defeitos para classificar');
      console.log(`🔧 Recomendação: Revisar ${failed} falhas manualmente`);
    }
    
    return {
      processed,
      successful,
      failed,
      totalTime: totalTime / 60,
      finalCoverage: parseFloat(finalCoverage)
    };
    
  } catch (error) {
    console.error('❌ Erro crítico:', error);
    throw error;
  }
}

// Função auxiliar para identificar não-defeitos
function isNonDefectDescription(description) {
  const nonDefectPatterns = [
    /cortesia/i,
    /desconto/i, 
    /atendimento/i,
    /comercial/i,
    /administrativo/i,
    /cobranca/i,
    /entrega/i,
    /excluido para acerto/i,
    /apenas para controle/i
  ];
  
  return nonDefectPatterns.some(pattern => pattern.test(description));
}

// Função auxiliar para salvar classificação
async function saveClassification(serviceOrderId, classification) {
  try {
    const { error } = await supabase
      .from('defect_classifications')
      .insert({
        service_order_id: serviceOrderId,
        category_id: classification.category_id,
        original_defect_description: classification.original_defect_description,
        ai_confidence: classification.ai_confidence,
        ai_reasoning: classification.ai_reasoning,
        alternative_categories: classification.alternative_categories || [],
        is_reviewed: false
      });
    
    return !error;
  } catch (error) {
    console.error('❌ Erro ao salvar:', error);
    return false;
  }
}

// Executar
fastClassifyRemaining()
  .then(result => {
    console.log('\\n🎯 CLASSIFICAÇÃO RÁPIDA CONCLUÍDA!', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\\n💥 ERRO:', error);
    process.exit(1);
  });