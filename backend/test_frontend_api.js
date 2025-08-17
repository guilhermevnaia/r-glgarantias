const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testFrontendAPI() {
  console.log('🧪 TESTANDO ENDPOINT EXATO QUE O FRONTEND USA...');
  
  // Simular exatamente o que o frontend faz
  const { data: orders, error } = await supabase
    .from('service_orders')
    .select(`
      *,
      defect_classifications (
        id,
        category_id,
        ai_confidence,
        ai_reasoning,
        defect_categories (
          category_name,
          color_hex,
          icon
        )
      )
    `, { count: 'exact' })
    .order('order_date', { ascending: false })
    .range(0, 4);

  if (error) {
    console.error('❌ ERRO:', error);
    return;
  }

  console.log(`📊 Frontend receberia ${orders.length} registros:`);
  
  orders.forEach((order, i) => {
    console.log(`\n${i+1}. OS ${order.order_number}:`);
    console.log(`   Raw defect: ${order.raw_defect_description?.substring(0, 50)}...`);
    console.log(`   defect_classifications: ${JSON.stringify(order.defect_classifications, null, 2)}`);
    
    if (order.defect_classifications && order.defect_classifications.length > 0) {
      const cl = order.defect_classifications[0];
      console.log(`   ✅ Frontend veria: ${cl.defect_categories?.category_name} (${(cl.ai_confidence * 100).toFixed(1)}%)`);
    } else {
      console.log(`   ❌ Frontend veria: PENDENTE`);
    }
  });
}

testFrontendAPI();