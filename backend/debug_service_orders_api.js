const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugServiceOrdersAPI() {
  console.log('🔍 DEBUG: Testando API de service_orders exatamente como o backend faz');
  
  // Simular exatamente a query do backend
  let query = supabase
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
    .order('order_date', { ascending: false });

  const { data: orders, error } = await query.range(0, 4); // Primeiros 5 registros

  if (error) {
    console.error('❌ ERRO:', error);
    return;
  }

  console.log(`📊 Retornados ${orders.length} registros da API:`);

  orders.forEach((order, i) => {
    console.log(`\n${i+1}. OS ${order.order_number}:`);
    console.log(`   ID: ${order.id}`);
    console.log(`   Defeito: ${(order.raw_defect_description || '').substring(0, 50)}...`);
    console.log(`   defect_classifications presente: ${!!order.defect_classifications}`);
    console.log(`   defect_classifications length: ${order.defect_classifications?.length || 0}`);
    
    if (order.defect_classifications && order.defect_classifications.length > 0) {
      const cl = order.defect_classifications[0];
      console.log(`   ✅ CLASSIFICAÇÃO ENCONTRADA:`);
      console.log(`       Categoria: ${cl.defect_categories?.category_name}`);
      console.log(`       Confiança: ${(cl.ai_confidence * 100).toFixed(1)}%`);
      console.log(`       Cor: ${cl.defect_categories?.color_hex}`);
    } else {
      console.log(`   ❌ SEM CLASSIFICAÇÃO NO RESULTADO DA API`);
    }
  });

  console.log('\n🎯 CONCLUSÃO:');
  const withClassifications = orders.filter(o => o.defect_classifications && o.defect_classifications.length > 0).length;
  const withoutClassifications = orders.length - withClassifications;
  
  console.log(`   Com classificações: ${withClassifications}`);
  console.log(`   Sem classificações: ${withoutClassifications}`);
  
  if (withoutClassifications > 0) {
    console.log('\n❌ PROBLEMA: Backend não está retornando classificações para todas as ordens');
  } else {
    console.log('\n✅ SUCESSO: Backend está retornando todas as classificações');
  }
}

debugServiceOrdersAPI();