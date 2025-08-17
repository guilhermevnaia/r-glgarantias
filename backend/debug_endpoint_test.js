const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugServiceOrdersQuery() {
  console.log('🧪 SIMULANDO EXATAMENTE A QUERY DO ENDPOINT /api/v1/service-orders');
  
  try {
    // Esta é exatamente a query que o endpoint faz
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

    // Simular paginação
    const page = 1;
    const limit = 5;
    const offset = (page - 1) * limit;
    
    const dataResult = await query.range(offset, offset + limit - 1);
    
    if (dataResult.error) {
      console.error('❌ Erro na query:', dataResult.error);
      return;
    }

    const orders = dataResult.data;
    console.log(`📊 Query retornou ${orders.length} registros para o frontend`);
    
    // Verificar cada registro
    orders.forEach((order, i) => {
      console.log(`\n${i+1}. OS ${order.order_number}:`);
      console.log(`   Raw defect: ${order.raw_defect_description?.substring(0, 50)}...`);
      console.log(`   defect_classifications array: ${JSON.stringify(order.defect_classifications?.length || 'undefined')}`);
      
      if (order.defect_classifications && order.defect_classifications.length > 0) {
        const cl = order.defect_classifications[0];
        console.log(`   ✅ Frontend deve ver: ${cl.defect_categories?.category_name} (${(cl.ai_confidence * 100).toFixed(1)}%)`);
        console.log(`   🎨 Com cor: ${cl.defect_categories?.color_hex}`);
      } else {
        console.log(`   ❌ Frontend vai mostrar: PENDENTE (não tem classificação)`);
      }
    });

    console.log('\n🎯 RESPOSTA COMPLETA QUE FRONTEND RECEBERIA:');
    console.log(JSON.stringify({
      data: orders,
      pagination: {
        page: 1,
        limit: 5,
        total: orders.length
      }
    }, null, 2));

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

debugServiceOrdersQuery();