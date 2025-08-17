const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findUnclassified() {
  console.log('🔍 BUSCANDO DEFEITOS NÃO CLASSIFICADOS...');
  
  // Primeiro, vamos buscar ordens de serviço que não têm classificações
  const { data: allOrders, error } = await supabase
    .from('service_orders')
    .select(`
      id,
      order_number,
      raw_defect_description,
      defect_classifications (
        id
      )
    `)
    .not('raw_defect_description', 'is', null)
    .limit(50);

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  // Filtrar apenas os que não têm classificações
  const unclassified = allOrders.filter(order => 
    !order.defect_classifications || order.defect_classifications.length === 0
  );

  console.log(`📊 Total analisado: ${allOrders.length}`);
  console.log(`❌ Não classificados: ${unclassified.length}`);
  console.log(`✅ Classificados: ${allOrders.length - unclassified.length}`);

  if (unclassified.length > 0) {
    console.log('\n🎯 DEFEITOS NÃO CLASSIFICADOS:');
    unclassified.forEach((order, i) => {
      console.log(`${i+1}. OS ${order.order_number} (ID: ${order.id})`);
      console.log(`   Defeito: ${order.raw_defect_description.substring(0, 80)}...`);
    });
    
    return unclassified;
  }

  console.log('\n✅ TODOS OS DEFEITOS ESTÃO CLASSIFICADOS!');
  return [];
}

findUnclassified();