const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const { SimpleAIService } = require('./dist/services/SimpleAIService');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function classifyOnlyMissingDefects() {
  console.log('🎯 === CLASSIFICANDO APENAS DEFEITOS NÃO CLASSIFICADOS ===\n');
  
  try {
    // 1. Primeiro, buscar TODOS os IDs já classificados
    console.log('🔍 Buscando todos os defeitos já classificados...');
    const { data: classifiedIds } = await supabase
      .from('defect_classifications')
      .select('service_order_id');
    
    const classifiedSet = new Set((classifiedIds || []).map(c => c.service_order_id));
    console.log(`✅ Encontrados ${classifiedSet.size} defeitos já classificados`);
    
    // 2. Buscar defeitos válidos que NÃO estão no conjunto classificado
    console.log('🔍 Buscando defeitos não classificados...');
    
    // Buscar em lotes para evitar limite de 1000
    let allDefects = [];
    let offset = 0;
    const limit = 1000;
    
    while (true) {
      const { data: batch } = await supabase
        .from('service_orders')
        .select('id, raw_defect_description')
        .not('raw_defect_description', 'is', null)
        .not('raw_defect_description', 'eq', '')
        .range(offset, offset + limit - 1);
      
      if (!batch || batch.length === 0) break;
      
      allDefects = allDefects.concat(batch);
      console.log(`   Carregados ${allDefects.length} defeitos...`);
      
      if (batch.length < limit) break;
      offset += limit;
    }
    
    // Filtrar apenas os não classificados
    const unclassifiedDefects = (allDefects || []).filter(defect => 
      !classifiedSet.has(defect.id)
    );
    
    console.log(`📊 ESTADO REAL:`);
    console.log(`   Total de defeitos válidos: ${allDefects.length}`);
    console.log(`   Já classificados: ${classifiedSet.size}`);
    console.log(`   NÃO classificados: ${unclassifiedDefects.length}`);
    console.log(`   Taxa atual: ${(classifiedSet.size / allDefects.length * 100).toFixed(1)}%`);
    
    if (unclassifiedDefects.length === 0) {
      console.log('🎉 TODOS OS DEFEITOS JÁ ESTÃO CLASSIFICADOS!');
      return;
    }
    
    // 3. Inicializar IA
    console.log('🤖 Inicializando SimpleAIService...');
    const aiService = SimpleAIService.getInstance();
    
    // 4. Classificar apenas os não classificados
    console.log(`🚀 Iniciando classificação de ${unclassifiedDefects.length} defeitos não classificados...\n`);
    
    let successful = 0;
    let failed = 0;
    const batchSize = 10;
    
    for (let i = 0; i < unclassifiedDefects.length; i += batchSize) {
      const batch = unclassifiedDefects.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(unclassifiedDefects.length / batchSize);
      
      console.log(`📦 Lote ${batchNum}/${totalBatches} (${batch.length} defeitos):`);
      
      for (const defect of batch) {
        try {
          const defectText = defect.raw_defect_description.substring(0, 100);
          console.log(`🎯 OS ${defect.id}: "${defectText}${defectText.length >= 100 ? '...' : ''}"`);
          
          // Classificar o defeito
          const classification = await aiService.classifyDefect(defect.raw_defect_description);
          
          if (classification) {
            // Salvar a classificação
            const saved = await aiService.saveClassification(defect.id, classification);
            
            if (saved) {
              console.log(`   ✅ Classificado como: ${classification.category_name} (${(classification.ai_confidence * 100).toFixed(1)}%)`);
              successful++;
            } else {
              console.log(`   ❌ Erro ao salvar classificação`);
              failed++;
            }
          } else {
            console.log(`   ❌ Erro na classificação`);
            failed++;
          }
          
          // Pequena pausa para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.log(`   ❌ Erro na OS ${defect.id}:`, error.message);
          failed++;
        }
      }
      
      const progress = ((i + batch.length) / unclassifiedDefects.length * 100).toFixed(1);
      console.log(`📈 Progresso: ${progress}% (${successful}✅ ${failed}❌)\n`);
      
      // Pausa entre lotes
      if (batchNum < totalBatches) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // 5. Verificação final
    console.log('\n🔍 === VERIFICAÇÃO FINAL ===');
    
    const { count: finalClassified } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalValid } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    const finalRate = (finalClassified / totalValid * 100).toFixed(1);
    
    console.log(`📊 RESULTADO FINAL:`);
    console.log(`   Defeitos processados: ${unclassifiedDefects.length}`);
    console.log(`   Classificações bem-sucedidas: ${successful}`);
    console.log(`   Falhas: ${failed}`);
    console.log(`   Total classificado agora: ${finalClassified}/${totalValid}`);
    console.log(`   Taxa final: ${finalRate}%`);
    
    if (finalRate >= 99) {
      console.log('\n🎉 PARABÉNS! Sistema com 99%+ de classificação!');
    } else {
      console.log(`\n📈 Sistema funcionando. Restam ${totalValid - finalClassified} defeitos para classificar.`);
    }
    
  } catch (error) {
    console.error('❌ Erro no processo:', error);
  }
}

classifyOnlyMissingDefects();