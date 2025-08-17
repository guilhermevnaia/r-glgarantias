const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function investigateDataChaos() {
  console.log('🚨 === INVESTIGAÇÃO COMPLETA DA CONFUSÃO NOS DADOS ===\n');
  
  try {
    console.log('1️⃣ VERIFICANDO TODAS AS CONTAGENS POSSÍVEIS...\n');
    
    // A. Service Orders - Total geral
    const { count: allServiceOrders } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total SERVICE ORDERS na tabela: ${allServiceOrders}`);
    
    // B. Service Orders - Com defeito não nulo
    const { count: withDefectNotNull } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .not('raw_defect_description', 'is', null);
    
    console.log(`📋 Service Orders com raw_defect_description NÃO NULO: ${withDefectNotNull}`);
    
    // C. Service Orders - Com defeito não nulo E não vazio
    const { count: withValidDefect } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    console.log(`✅ Service Orders com DEFEITO VÁLIDO: ${withValidDefect}`);
    
    // D. Service Orders - Apenas não vazios (incluindo nulos)
    const { count: notEmpty } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .not('raw_defect_description', 'eq', '');
    
    console.log(`📝 Service Orders com defeito NÃO VAZIO (inclui nulos): ${notEmpty}`);
    
    console.log('\n2️⃣ VERIFICANDO DADOS REAIS...\n');
    
    // E. Pegar uma amostra para verificar
    const { data: sampleOrders } = await supabase
      .from('service_orders')
      .select('id, order_number, raw_defect_description')
      .limit(10);
    
    console.log('📋 AMOSTRA DOS PRIMEIROS 10 REGISTROS:');
    sampleOrders.forEach((order, i) => {
      const defect = order.raw_defect_description;
      const status = defect === null ? 'NULL' : 
                    defect === '' ? 'VAZIO' : 
                    defect.length > 50 ? defect.substring(0, 50) + '...' : defect;
      console.log(`   ${i+1}. OS ${order.order_number} (ID: ${order.id}): ${status}`);
    });
    
    console.log('\n3️⃣ VERIFICANDO CLASSIFICAÇÕES...\n');
    
    // F. Total de classificações
    const { count: totalClassifications } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });
    
    console.log(`🤖 Total de CLASSIFICAÇÕES: ${totalClassifications}`);
    
    // G. Classificações com SERVICE_ORDER_IDs únicos
    const { data: classificationIds } = await supabase
      .from('defect_classifications')
      .select('service_order_id');
    
    const uniqueClassifiedOrders = new Set(classificationIds.map(c => c.service_order_id)).size;
    console.log(`🔢 Service Orders ÚNICAS classificadas: ${uniqueClassifiedOrders}`);
    
    console.log('\n4️⃣ VERIFICANDO TABELAS DE CATEGORIAS...\n');
    
    // H. Categorias de defeitos
    const { count: totalCategories } = await supabase
      .from('defect_categories')
      .select('*', { count: 'exact', head: true });
    
    const { count: activeCategories } = await supabase
      .from('defect_categories')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    console.log(`📂 Total categorias: ${totalCategories}`);
    console.log(`✅ Categorias ativas: ${activeCategories}`);
    
    console.log('\n5️⃣ INVESTIGANDO DISCREPÂNCIAS...\n');
    
    // I. Pegar alguns IDs de service orders para verificar
    const { data: firstOrders } = await supabase
      .from('service_orders')
      .select('id')
      .order('id', { ascending: true })
      .limit(5);
    
    const { data: lastOrders } = await supabase
      .from('service_orders')
      .select('id')
      .order('id', { ascending: false })
      .limit(5);
    
    console.log('🔍 Primeiro 5 IDs:', firstOrders.map(o => o.id));
    console.log('🔍 Últimos 5 IDs:', lastOrders.map(o => o.id));
    
    // J. Verificar range de IDs
    const minId = firstOrders[0]?.id;
    const maxId = lastOrders[0]?.id;
    console.log(`📊 Range de IDs: ${minId} até ${maxId} (diferença: ${maxId - minId + 1})`);
    
    console.log('\n6️⃣ VERIFICANDO POSSÍVEIS FILTROS OU VIEWS...\n');
    
    // K. Verificar se há alguma view ou filtro sendo aplicado
    const { data: ordersWithDefects } = await supabase
      .from('service_orders')
      .select('id, order_number, raw_defect_description')
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '')
      .order('id', { ascending: true })
      .limit(5);
    
    console.log('🔍 Primeiras 5 ordens COM defeito válido:');
    ordersWithDefects.forEach(order => {
      console.log(`   OS ${order.order_number} (ID: ${order.id}): ${order.raw_defect_description?.substring(0, 30)}...`);
    });
    
    console.log('\n7️⃣ RESUMO CRÍTICO...\n');
    
    console.log('📊 RESUMO DAS CONTAGENS:');
    console.log(`   • Total service orders: ${allServiceOrders}`);
    console.log(`   • Com defeito não nulo: ${withDefectNotNull}`);
    console.log(`   • Com defeito válido (não nulo E não vazio): ${withValidDefect}`);
    console.log(`   • Total classificações: ${totalClassifications}`);
    console.log(`   • Service orders únicas classificadas: ${uniqueClassifiedOrders}`);
    
    console.log('\n🚨 PROBLEMAS IDENTIFICADOS:');
    if (allServiceOrders !== 2353) {
      console.log(`   ❌ Total de service orders (${allServiceOrders}) ≠ 2353 esperado`);
    }
    
    if (withValidDefect !== 2353) {
      console.log(`   ❌ Defeitos válidos (${withValidDefect}) ≠ 2353 esperado`);
    }
    
    if (totalClassifications !== uniqueClassifiedOrders) {
      console.log(`   ❌ Classificações (${totalClassifications}) ≠ Orders classificadas únicas (${uniqueClassifiedOrders})`);
    }
    
    const expectedClassificationRate = withValidDefect > 0 ? (uniqueClassifiedOrders / withValidDefect * 100).toFixed(1) : 0;
    console.log(`\n📈 TAXA REAL DE CLASSIFICAÇÃO: ${expectedClassificationRate}%`);
    
    if (withValidDefect === 2353 && uniqueClassifiedOrders < 2353) {
      console.log(`🎯 DEFEITOS NÃO CLASSIFICADOS: ${2353 - uniqueClassifiedOrders}`);
    }
    
  } catch (error) {
    console.error('❌ Erro crítico na investigação:', error);
  }
}

investigateDataChaos();