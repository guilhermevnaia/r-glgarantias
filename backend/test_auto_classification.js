const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAutoClassification() {
  console.log('=== TESTE DE CLASSIFICAÇÃO AUTOMÁTICA ===');
  
  try {
    // 1. Verificar quantos defeitos estão sem classificação
    console.log('\n1. Verificando defeitos não classificados...');
    
    // Buscar IDs já classificados
    const { data: classifiedIds } = await supabase
      .from('defect_classifications')
      .select('service_order_id');

    const classifiedSet = new Set((classifiedIds || []).map(c => c.service_order_id));
    
    // Buscar os mais recentes não classificados
    const { data: allOrders } = await supabase
      .from('service_orders')
      .select('id, order_number, raw_defect_description, created_at')
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '')
      .order('created_at', { ascending: false })
      .limit(50);

    const unclassifiedOrders = (allOrders || [])
      .filter(order => !classifiedSet.has(order.id));

    console.log(`Total defeitos não classificados: ${unclassifiedOrders.length}`);
    
    if (unclassifiedOrders.length > 0) {
      console.log('Primeiros 3 não classificados:');
      unclassifiedOrders.slice(0, 3).forEach(order => {
        console.log(`- OS ${order.order_number}: ${order.raw_defect_description.substring(0, 100)}...`);
      });
      
      // 2. Testar classificação de um defeito específico
      console.log('\n2. Testando classificação individual...');
      
      const testOrder = unclassifiedOrders[0];
      
      // Simular chamada para API de classificação automática
      const response = await fetch('http://localhost:3006/api/v2/test-classification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: testOrder.id,
          defectDescription: testOrder.raw_defect_description
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Classificação automática funcionou:', result);
      } else {
        console.log('❌ Erro na classificação:', response.status, response.statusText);
        
        // Fallback: testar classificação direta
        console.log('\n3. Testando classificação direta com SimpleAI...');
        
        const { SimpleAIService } = require('./dist/services/SimpleAIService');
        const aiService = SimpleAIService.getInstance();
        
        const classification = await aiService.classifyDefect(testOrder.raw_defect_description);
        
        if (classification) {
          console.log('✅ Classificação direta funcionou:', classification);
          
          // Tentar salvar
          const saved = await aiService.saveClassification(testOrder.id, classification);
          console.log('💾 Salvamento:', saved ? '✅ Sucesso' : '❌ Falhou');
        } else {
          console.log('❌ Classificação direta falhou');
        }
      }
    } else {
      console.log('✅ Todos os defeitos já estão classificados!');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testAutoClassification();