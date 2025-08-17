const { createClient } = require('@supabase/supabase-js');
const { EnhancedLocalAIService } = require('./dist/services/EnhancedLocalAIService');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function rebuildClassificationSystem() {
  console.log('🔥 === RECONSTRUÇÃO COMPLETA DO SISTEMA DE CLASSIFICAÇÃO ===\n');
  
  try {
    console.log('🧹 ETAPA 1: LIMPEZA COMPLETA DOS DADOS CORROMPIDOS');
    
    // 1. BACKUP das classificações atuais
    console.log('💾 Fazendo backup das classificações atuais...');
    const { data: currentClassifications } = await supabase
      .from('defect_classifications')
      .select('*');
    
    console.log(`   📦 Backup de ${currentClassifications?.length || 0} classificações salvo`);
    
    // 2. LIMPAR completamente a tabela de classificações
    console.log('🗑️  Removendo TODAS as classificações corrompidas...');
    const { error: deleteError } = await supabase
      .from('defect_classifications')
      .delete()
      .neq('id', 0); // Deleta todos
    
    if (deleteError) {
      console.error('❌ Erro na limpeza:', deleteError);
      return;
    }
    
    console.log('✅ Tabela de classificações completamente limpa!');
    
    // 3. RESETAR contadores das categorias
    console.log('🔄 Resetando contadores das categorias...');
    await supabase
      .from('defect_categories')
      .update({ total_occurrences: 0 })
      .neq('id', 0);
    
    console.log('✅ Contadores resetados!');
    
    console.log('\\n🚀 ETAPA 2: IDENTIFICAÇÃO CORRETA DOS DEFEITOS');
    
    // 4. Buscar TODOS os defeitos válidos (confirmar os 2353)
    const { data: validDefects, count: totalValidDefects } = await supabase
      .from('service_orders')
      .select('id, order_number, raw_defect_description', { count: 'exact' })
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    console.log(`📊 Defeitos válidos encontrados: ${totalValidDefects}`);
    console.log(`📋 Confirmando os ${totalValidDefects} defeitos para classificação`);
    
    if (totalValidDefects !== 2353) {
      console.log(`⚠️  Atenção: Esperávamos 2353, encontramos ${totalValidDefects}`);
    }
    
    console.log('\\n🤖 ETAPA 3: CLASSIFICAÇÃO LIMPA E SISTEMÁTICA');
    
    const localAI = EnhancedLocalAIService.getInstance();
    let processed = 0;
    let successful = 0;
    let failed = 0;
    
    const batchSize = 10;
    
    for (let i = 0; i < validDefects.length; i += batchSize) {
      const batch = validDefects.slice(i, i + batchSize);
      
      console.log(`\\n📦 Processando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(validDefects.length/batchSize)} (${batch.length} itens):`);
      
      for (const defect of batch) {
        try {
          console.log(`   🔄 [${processed + 1}/${validDefects.length}] OS ${defect.order_number}...`);
          
          const classification = await localAI.classifyDefect(defect.raw_defect_description);
          
          if (classification) {
            const saved = await localAI.saveClassification(defect.id, classification);
            
            if (saved) {
              successful++;
              console.log(`   ✅ OS ${defect.order_number} → ${classification.category_name} (${(classification.ai_confidence * 100).toFixed(1)}%)`);
            } else {
              failed++;
              console.log(`   ❌ Erro ao salvar OS ${defect.order_number}`);
            }
          } else {
            failed++;
            console.log(`   ⚠️  OS ${defect.order_number} não pôde ser classificada`);
          }
          
          processed++;
          
          // Pequena pausa para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 50));
          
        } catch (error) {
          console.error(`   ❌ Erro na OS ${defect.order_number}:`, error.message);
          failed++;
          processed++;
        }
      }
      
      // Relatório de progresso
      const progress = (processed / validDefects.length * 100).toFixed(1);
      console.log(`   📊 Progresso: ${progress}% (${successful} sucessos, ${failed} falhas)`);
      
      // Pausa entre lotes
      if (i + batchSize < validDefects.length) {
        console.log('   ⏱️  Pausa entre lotes...');
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log('\\n🔄 ETAPA 4: SINCRONIZAÇÃO FINAL DOS CONTADORES');
    
    // 5. Recalcular contadores das categorias
    const { data: finalCounts } = await supabase
      .from('defect_classifications')
      .select('category_id')
      .then(result => {
        const counts = {};
        (result.data || []).forEach(item => {
          counts[item.category_id] = (counts[item.category_id] || 0) + 1;
        });
        return { data: Object.entries(counts) };
      });
    
    console.log('🔄 Atualizando contadores finais das categorias:');
    for (const [categoryId, count] of finalCounts.data) {
      await supabase
        .from('defect_categories')
        .update({ total_occurrences: count })
        .eq('id', parseInt(categoryId));
      
      console.log(`   ✅ Categoria ${categoryId}: ${count} ocorrências`);
    }
    
    console.log('\\n📊 ETAPA 5: VERIFICAÇÃO FINAL DO SISTEMA RECONSTRUÍDO');
    
    // 6. Verificação final completa
    const { count: finalClassifications } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });
    
    const { data: finalClassifiedIds } = await supabase
      .from('defect_classifications')
      .select('service_order_id');
    
    const finalUniqueClassified = new Set(finalClassifiedIds.map(c => c.service_order_id)).size;
    
    const finalRate = (finalUniqueClassified / totalValidDefects * 100).toFixed(1);
    
    console.log('✅ === SISTEMA RECONSTRUÍDO COM SUCESSO ===');
    console.log(`📊 Total de defeitos válidos: ${totalValidDefects}`);
    console.log(`🤖 Total de classificações: ${finalClassifications}`);
    console.log(`🔢 Service Orders únicas classificadas: ${finalUniqueClassified}`);
    console.log(`📈 Taxa final de classificação: ${finalRate}%`);
    console.log(`🎯 Defeitos não classificados: ${totalValidDefects - finalUniqueClassified}`);
    console.log(`✅ Sucessos: ${successful}`);
    console.log(`❌ Falhas: ${failed}`);
    
    // Verificar se há duplicatas
    if (finalClassifications !== finalUniqueClassified) {
      console.log(`⚠️  ATENÇÃO: Ainda há ${finalClassifications - finalUniqueClassified} classificações duplicadas!`);
    } else {
      console.log('✅ Nenhuma duplicação encontrada - sistema íntegro!');
    }
    
    console.log('\\n🎉 RECONSTRUÇÃO COMPLETA FINALIZADA!');
    console.log('💡 Agora o frontend deve mostrar dados corretos e consistentes.');
    
  } catch (error) {
    console.error('🚨 Erro crítico na reconstrução:', error);
  }
}

// Confirmar antes de executar
console.log('⚠️  ATENÇÃO: Este script vai APAGAR TODAS as classificações atuais e refazer do zero!');
console.log('🕒 Aguarde 5 segundos para cancelar se necessário...');

setTimeout(() => {
  rebuildClassificationSystem();
}, 5000);