const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testActualQuery() {
  console.log('🧪 TESTANDO QUERY REAL DO BACKEND');
  
  const { data, error } = await supabase
    .from('service_orders')
    .select(`
      id,
      order_number,
      raw_defect_description,
      defect_classifications (
        id,
        category_id,
        ai_confidence,
        defect_categories (
          category_name,
          color_hex
        )
      )
    `)
    .limit(3);

  if (error) {
    console.error('❌ ERRO NA QUERY:', error);
    return;
  }

  console.log('📊 RESULTADO DA QUERY:');
  data.forEach((order, i) => {
    console.log(`\n${i+1}. OS ${order.order_number}:`);
    console.log(`   Defeito: ${order.raw_defect_description?.substring(0, 50)}...`);
    console.log(`   Classifications: ${order.defect_classifications?.length || 0} encontradas`);
    
    if (order.defect_classifications && order.defect_classifications.length > 0) {
      const cl = order.defect_classifications[0];
      console.log(`   ✅ Categoria: ${cl.defect_categories?.category_name}`);
      console.log(`   🎯 Confiança: ${(cl.ai_confidence * 100).toFixed(1)}%`);
    } else {
      console.log(`   ❌ SEM CLASSIFICAÇÃO`);
    }
  });
}

testActualQuery();