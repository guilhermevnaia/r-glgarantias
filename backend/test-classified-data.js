const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testClassifiedData() {
  console.log('🔍 TESTANDO DADOS COM CLASSIFICAÇÕES NO BANCO');
  
  try {
    const { data, error } = await supabase
      .from('service_orders')
      .select(`
        id,
        order_number,
        raw_defect_description,
        defect_classifications!left (
          id,
          category_id,
          ai_confidence,
          defect_categories (
            category_name,
            color_hex
          )
        )
      `)
      .limit(5);

    if (error) {
      console.error('❌ Erro:', error);
      return;
    }

    console.log('📊 RESULTADOS:');
    data.forEach((order, i) => {
      console.log(`\n${i+1}. OS ${order.order_number}:`);
      console.log(`   Defeito: ${order.raw_defect_description?.substring(0, 60)}...`);
      
      if (order.defect_classifications && order.defect_classifications.length > 0) {
        const classification = order.defect_classifications[0];
        console.log(`   ✅ CLASSIFICADO: ${classification.defect_categories?.category_name}`);
        console.log(`   🎯 Confiança: ${(classification.ai_confidence * 100).toFixed(1)}%`);
        console.log(`   🎨 Cor: ${classification.defect_categories?.color_hex}`);
      } else {
        console.log(`   ❌ SEM CLASSIFICAÇÃO`);
      }
    });
  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

testClassifiedData();