const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRealData() {
  console.log('🔍 VERIFICANDO DADOS REAIS...\n');
  
  // Check service_orders table
  const { data: orders, count: totalOrders } = await supabase
    .from('service_orders')
    .select('id, raw_defect_description', { count: 'exact' })
    .not('raw_defect_description', 'is', null)
    .not('raw_defect_description', 'eq', '');
  
  console.log(`📋 Total service_orders com defeitos: ${totalOrders}`);
  
  // Filter valid defects (>3 chars)
  const validDefects = orders?.filter(o => 
    o.raw_defect_description && 
    o.raw_defect_description.trim().length > 3
  ) || [];
  
  console.log(`✅ Defeitos válidos (>3 chars): ${validDefects.length}`);
  
  // Check classifications
  const { count: classified } = await supabase
    .from('defect_classifications')
    .select('*', { count: 'exact', head: true });
  
  console.log(`🏷️ Total classificações existentes: ${classified}`);
  
  // Find unclassified
  const { data: existingClassifications } = await supabase
    .from('defect_classifications')
    .select('service_order_id');
    
  const classifiedIds = new Set(existingClassifications?.map(c => c.service_order_id) || []);
  const unclassified = validDefects.filter(d => !classifiedIds.has(d.id));
  
  console.log(`❌ Defeitos não classificados: ${unclassified.length}`);
  console.log(`📊 Cobertura atual: ${((classified / validDefects.length) * 100).toFixed(1)}%`);
  
  if (unclassified.length > 0) {
    console.log('\n📝 Primeiros 5 defeitos não classificados:');
    unclassified.slice(0, 5).forEach((d, i) => {
      console.log(`${i+1}. OS ${d.id}: ${d.raw_defect_description.substring(0, 60)}...`);
    });
  }
  
  return {
    totalValid: validDefects.length,
    classified: classified,
    unclassified: unclassified.length,
    coverage: (classified / validDefects.length) * 100,
    unclassifiedList: unclassified
  };
}

checkRealData().then(result => {
  console.log('\n✅ Análise concluída!', {
    totalValid: result.totalValid,
    classified: result.classified,
    unclassified: result.unclassified,
    coverage: result.coverage.toFixed(1) + '%'
  });
}).catch(console.error);