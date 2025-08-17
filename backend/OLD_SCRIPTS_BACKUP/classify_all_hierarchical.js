const { HierarchicalAIServiceV2 } = require('./dist/services/HierarchicalAIServiceV2');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function classifyAllHierarchical() {
  console.log('🚀 CLASSIFICAÇÃO HIERÁRQUICA EM MASSA\n');
  
  try {
    const aiService = HierarchicalAIServiceV2.getInstance();
    
    // 1. Buscar todos os defeitos válidos (sem classificação ainda)
    console.log('1️⃣ Buscando defeitos válidos...');
    
    const { data: allDefects } = await supabase
      .from('service_orders')
      .select('id, raw_defect_description')
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    // Filtrar apenas defeitos com conteúdo real
    const validDefects = allDefects?.filter(defect => 
      defect.raw_defect_description && 
      defect.raw_defect_description.trim().length > 3
    ) || [];
    
    console.log(`📊 Total de defeitos válidos: ${validDefects.length}`);
    
    // 2. Verificar quais já estão classificados
    const { data: existingClassifications } = await supabase
      .from('defect_classifications')
      .select('service_order_id');
    
    const classifiedIds = new Set(existingClassifications?.map(c => c.service_order_id) || []);
    
    const unclassifiedDefects = validDefects.filter(defect => !classifiedIds.has(defect.id));
    
    console.log(`⏳ Defeitos não classificados: ${unclassifiedDefects.length}`);
    console.log(`✅ Defeitos já classificados: ${classifiedIds.size}`);
    
    if (unclassifiedDefects.length === 0) {
      console.log('🎉 Todos os defeitos já estão classificados!');
      return;
    }
    
    // 3. Classificar em lotes
    console.log(`\n2️⃣ Iniciando classificação hierárquica de ${unclassifiedDefects.length} defeitos...\n`);
    
    let processed = 0;
    let successful = 0;
    let failed = 0;
    const batchSize = 5; // Lotes menores para evitar sobrecarga
    
    for (let i = 0; i < unclassifiedDefects.length; i += batchSize) {
      const batch = unclassifiedDefects.slice(i, i + batchSize);
      
      console.log(`🔄 Processando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(unclassifiedDefects.length/batchSize)}`);
      
      // Processar lote sequencial (para evitar rate limits)
      for (const defect of batch) {
        try {
          console.log(`   📝 OS ${defect.id}: ${defect.raw_defect_description.substring(0, 50)}...`);
          
          // Classificar hierarquicamente
          const classification = await aiService.classifyDefectHierarchical(defect.raw_defect_description);
          
          if (classification) {
            // Salvar classificação
            const saved = await aiService.saveHierarchicalClassification(defect.id, classification);
            
            if (saved) {
              successful++;
              console.log(`      ✅ ${classification.full_hierarchy_path} (${(classification.overall_confidence * 100).toFixed(1)}%)`);
            } else {
              failed++;
              console.log(`      ❌ Erro ao salvar`);
            }
          } else {
            failed++;
            console.log(`      ❌ Falha na classificação`);
          }
          
          processed++;
          
          // Pequena pausa para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          failed++;
          processed++;
          console.error(`      ❌ Erro: ${error.message}`);
        }
      }
      
      // Progress report
      const progressPercent = ((processed / unclassifiedDefects.length) * 100).toFixed(1);
      console.log(`\n📈 Progresso: ${processed}/${unclassifiedDefects.length} (${progressPercent}%) | ✅ ${successful} | ❌ ${failed}\n`);
      
      // Pausa entre lotes
      if (i + batchSize < unclassifiedDefects.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 4. Verificar resultado final
    console.log('\n3️⃣ Verificando resultado final...');
    
    const { count: finalClassifications } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalDefects } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '')
      .gte('char_length(raw_defect_description)', 4);
    
    console.log('\n=== RESULTADO FINAL ===');
    console.log(`🎯 Defeitos válidos processáveis: ${validDefects.length}`);
    console.log(`🤖 Total de classificações: ${finalClassifications}`);
    console.log(`✅ Sucessos nesta execução: ${successful}`);
    console.log(`❌ Falhas nesta execução: ${failed}`);
    console.log(`📊 Taxa de sucesso: ${((successful / processed) * 100).toFixed(1)}%`);
    console.log(`📈 Cobertura total: ${((finalClassifications / validDefects.length) * 100).toFixed(1)}%`);
    
    return {
      processed,
      successful,
      failed,
      totalClassifications: finalClassifications,
      totalValidDefects: validDefects.length,
      coverage: (finalClassifications / validDefects.length) * 100
    };
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    throw error;
  }
}

classifyAllHierarchical()
  .then(result => {
    console.log('\n🎉 CLASSIFICAÇÃO HIERÁRQUICA CONCLUÍDA!', result);
  })
  .catch(console.error);