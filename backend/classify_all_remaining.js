const { createClient } = require('@supabase/supabase-js');
const { SimpleAIService } = require('./dist/services/SimpleAIService');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function classifyAllRemaining() {
  console.log('=== CLASSIFICAÇÃO MASSIVA DE TODOS OS RESTANTES ===');
  
  try {
    // 1. Buscar IDs já classificados
    const { data: classifiedIds } = await supabase
      .from('defect_classifications')
      .select('service_order_id');

    const classifiedSet = new Set((classifiedIds || []).map(c => c.service_order_id));
    console.log('IDs já classificados:', classifiedSet.size);
    
    // 2. Buscar TODOS os defeitos não classificados (sem limites)
    const { data: allOrders } = await supabase
      .from('service_orders')
      .select('id, order_number, raw_defect_description, created_at')
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '')
      .order('created_at', { ascending: false });

    const unclassifiedOrders = (allOrders || [])
      .filter(order => !classifiedSet.has(order.id));

    console.log('Total ordens com defeitos válidos:', allOrders.length);
    console.log('Total não classificadas:', unclassifiedOrders.length);
    
    if (unclassifiedOrders.length === 0) {
      console.log('✅ TODOS OS DEFEITOS JÁ ESTÃO CLASSIFICADOS!');
      return;
    }

    // 3. Mostrar alguns exemplos
    console.log('\nPrimeiros 10 não classificados:');
    unclassifiedOrders.slice(0, 10).forEach((order, i) => {
      console.log(`${i+1}. OS ${order.order_number}: ${order.raw_defect_description.substring(0, 80)}...`);
    });

    // 4. Classificar todos usando SimpleAIService
    console.log('\n🚀 Iniciando classificação massiva...');
    const aiService = SimpleAIService.getInstance();
    
    let successful = 0;
    let failed = 0;
    
    const batchSize = 20;
    
    for (let i = 0; i < unclassifiedOrders.length; i += batchSize) {
      const batch = unclassifiedOrders.slice(i, i + batchSize);
      
      console.log(`\n📦 Lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(unclassifiedOrders.length/batchSize)} (${batch.length} defeitos):`);
      
      for (const order of batch) {
        try {
          const classification = await aiService.classifyDefect(order.raw_defect_description);
          
          if (classification) {
            const saved = await aiService.saveClassification(order.id, classification);
            if (saved) {
              successful++;
              console.log(`✅ OS ${order.order_number} classificada como ${classification.category_name}`);
            } else {
              failed++;
              console.log(`❌ OS ${order.order_number} falhou ao salvar`);
            }
          } else {
            failed++;
            console.log(`❌ OS ${order.order_number} falhou na classificação`);
          }
          
        } catch (error) {
          failed++;
          console.log(`❌ OS ${order.order_number} erro:`, error.message);
        }
      }
      
      const progress = ((successful + failed) / unclassifiedOrders.length * 100).toFixed(1);
      console.log(`📈 Progresso: ${progress}% (${successful}✅ ${failed}❌)`);
      
      // Pequena pausa entre lotes
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n🎉 CLASSIFICAÇÃO MASSIVA COMPLETA!');
    console.log(`📊 Total processados: ${successful + failed}`);
    console.log(`✅ Sucessos: ${successful}`);
    console.log(`❌ Falhas: ${failed}`);
    console.log(`📈 Taxa de sucesso: ${(successful / (successful + failed) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Erro na classificação massiva:', error);
  }
}

classifyAllRemaining();