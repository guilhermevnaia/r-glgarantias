const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testControllerQuery() {
  console.log('🧪 TESTANDO QUERY EXATA DO CONTROLLER...');
  
  // Cópia exata da query do StatsController
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
  
  console.log('📍 Executando query...');
  const dataResult = await query.range(offset, offset + limit - 1);
  
  if (dataResult.error) {
    console.error('❌ ERRO NA QUERY:', dataResult.error);
    console.error('   Código:', dataResult.error.code);
    console.error('   Mensagem:', dataResult.error.message);
    console.error('   Detalhes:', dataResult.error.details);
    return;
  }

  const orders = dataResult.data;
  console.log(`✅ Query executada com sucesso - ${orders.length} registros`);
  
  if (orders.length > 0) {
    const firstOrder = orders[0];
    console.log('🔍 PRIMEIRO REGISTRO:');
    console.log('   OS:', firstOrder.order_number);
    console.log('   Campos:', Object.keys(firstOrder));
    console.log('   defect_classifications presente:', !!firstOrder.defect_classifications);
    console.log('   defect_classifications valor:', firstOrder.defect_classifications);
    
    if (firstOrder.defect_classifications && firstOrder.defect_classifications.length > 0) {
      console.log('   ✅ TEM CLASSIFICAÇÕES!');
    } else {
      console.log('   ❌ SEM CLASSIFICAÇÕES - PROBLEMA AQUI!');
    }
  }
}

testControllerQuery();