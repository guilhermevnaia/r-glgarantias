const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function investigateSpecific() {
  console.log('🔍 INVESTIGAÇÃO PROFUNDA DO PROBLEMA...');
  
  // Buscar exatamente o registro específico que está problemático
  const { data: specificOrder, error1 } = await supabase
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
    .eq('id', 42093); // ID específico do problema

  if (error1) {
    console.error('❌ Erro 1:', error1);
    return;
  }

  console.log('📊 REGISTRO ESPECÍFICO (ID 42093):');
  if (specificOrder && specificOrder.length > 0) {
    const order = specificOrder[0];
    console.log(`   OS: ${order.order_number}`);
    console.log(`   Defeito: ${order.raw_defect_description}`);
    console.log(`   Classifications array: ${JSON.stringify(order.defect_classifications, null, 2)}`);
  }

  // Buscar na tabela de classificações diretamente
  const { data: directClassifications, error2 } = await supabase
    .from('defect_classifications')
    .select(`
      id,
      service_order_id,
      category_id,
      ai_confidence,
      defect_categories (
        category_name,
        color_hex
      )
    `)
    .eq('service_order_id', 42093);

  console.log('\n🔍 CLASSIFICAÇÕES DIRETAS NA TABELA:');
  console.log(`   Encontradas: ${directClassifications?.length || 0}`);
  if (directClassifications && directClassifications.length > 0) {
    directClassifications.forEach((cl, i) => {
      console.log(`   ${i+1}. Categoria: ${cl.defect_categories?.category_name}`);
      console.log(`       Confiança: ${(cl.ai_confidence * 100).toFixed(1)}%`);
    });
  }

  // Testar a query exata do backend
  console.log('\n🧪 TESTANDO QUERY EXATA DO BACKEND:');
  const { data: backendQuery, error3 } = await supabase
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
    .eq('id', 42093)
    .order('order_date', { ascending: false });

  if (backendQuery && backendQuery.length > 0) {
    const order = backendQuery[0];
    console.log(`   OS: ${order.order_number}`);
    console.log(`   Classifications retornadas: ${order.defect_classifications?.length || 0}`);
    console.log(`   Estrutura: ${JSON.stringify(order.defect_classifications, null, 2)}`);
  }
}

investigateSpecific();