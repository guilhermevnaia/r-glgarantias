const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSpecificDefect() {
  console.log('🔍 VERIFICANDO DEFEITO ESPECÍFICO QUE APARECE COMO NÃO CLASSIFICADO');
  
  // Buscar o defeito específico mencionado
  const { data: orders, error } = await supabase
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
    .ilike('raw_defect_description', '%AZAMENTO NA ROSCA DO TUBO%')
    .limit(3);

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  console.log(`📊 Encontrados: ${orders.length} registros`);
  
  orders.forEach((order, i) => {
    console.log(`\n${i+1}. OS ${order.order_number}:`);
    console.log(`   ID: ${order.id}`);
    console.log(`   Defeito: ${order.raw_defect_description}`);
    console.log(`   Classifications: ${order.defect_classifications?.length || 0}`);
    
    if (order.defect_classifications && order.defect_classifications.length > 0) {
      const cl = order.defect_classifications[0];
      console.log(`   ✅ CLASSIFICADO: ${cl.defect_categories?.category_name}`);
      console.log(`   🎯 Confiança: ${(cl.ai_confidence * 100).toFixed(1)}%`);
      console.log(`   🎨 Cor: ${cl.defect_categories?.color_hex}`);
    } else {
      console.log(`   ❌ REALMENTE NÃO CLASSIFICADO - precisa processar`);
    }
  });

  // Também buscar alguns registros aleatórios para verificar
  console.log('\n🔍 VERIFICANDO REGISTROS ALEATÓRIOS:');
  const { data: randomOrders } = await supabase
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
    .not('raw_defect_description', 'is', null)
    .limit(5)
    .order('id', { ascending: false });

  let classified = 0;
  let unclassified = 0;

  randomOrders?.forEach((order, i) => {
    const hasClassification = order.defect_classifications && order.defect_classifications.length > 0;
    if (hasClassification) {
      classified++;
      console.log(`${i+1}. ✅ OS ${order.order_number}: ${order.defect_classifications[0].defect_categories?.category_name}`);
    } else {
      unclassified++;
      console.log(`${i+1}. ❌ OS ${order.order_number}: NÃO CLASSIFICADO`);
    }
  });

  console.log(`\n📊 RESUMO: ${classified} classificados, ${unclassified} não classificados`);
}

checkSpecificDefect();