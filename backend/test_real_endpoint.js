const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testRealEndpoint() {
  console.log('🧪 TESTANDO QUERY REAL DO ENDPOINT service-orders...');
  
  // Exatamente como está no StatsController.ts
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

  const page = 1;
  const limit = 5;
  const offset = (page - 1) * limit;
  
  const dataResult = await query.range(offset, offset + limit - 1);
  
  if (dataResult.error) {
    console.error('❌ Erro:', dataResult.error);
    return;
  }

  const orders = dataResult.data;
  console.log(`📊 Query retornou ${orders.length} registros`);
  
  if (orders.length > 0) {
    const firstOrder = orders[0];
    console.log('🎯 PRIMEIRO REGISTRO:');
    console.log('   OS:', firstOrder.order_number);
    console.log('   Campos presentes:', Object.keys(firstOrder));
    console.log('   defect_classifications:', firstOrder.defect_classifications);
    
    if (firstOrder.defect_classifications && firstOrder.defect_classifications.length > 0) {
      const cl = firstOrder.defect_classifications[0];
      console.log('   ✅ CLASSIFICAÇÃO ENCONTRADA:');
      console.log('       Categoria:', cl.defect_categories?.category_name);
      console.log('       Confiança:', (cl.ai_confidence * 100).toFixed(1) + '%');
    } else {
      console.log('   ❌ SEM CLASSIFICAÇÃO');
    }
  }

  console.log('\n💡 Se isso funciona mas o endpoint HTTP não, o problema está no controller!');
}

testRealEndpoint();