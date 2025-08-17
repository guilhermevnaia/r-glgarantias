const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkNewDefects() {
  console.log('=== STATUS ATUAL DE CLASSIFICAÇÕES ===');
  
  // Total de OS
  const { count: totalOrders } = await supabase
    .from('service_orders')
    .select('*', { count: 'exact', head: true });
  
  // Total de classificações
  const { count: totalClassifications } = await supabase
    .from('defect_classifications')
    .select('*', { count: 'exact', head: true });

  // Buscar os mais recentes (últimos 50)
  const { data: recentOrders } = await supabase
    .from('service_orders')
    .select('id, order_number, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  // Verificar quais dos recentes estão classificados
  const recentIds = recentOrders.map(o => o.id);
  const { data: recentClassifications } = await supabase
    .from('defect_classifications')
    .select('service_order_id')
    .in('service_order_id', recentIds);

  const classifiedRecentSet = new Set(recentClassifications.map(c => c.service_order_id));
  const unclassifiedRecent = recentOrders.filter(o => !classifiedRecentSet.has(o.id));

  console.log('Total OS:', totalOrders);
  console.log('Total classificações:', totalClassifications);
  console.log('Taxa geral:', Math.round((totalClassifications/totalOrders)*100) + '%');
  console.log('');
  console.log('Dos 50 registros mais recentes:');
  console.log('- Classificados:', recentOrders.length - unclassifiedRecent.length);
  console.log('- Não classificados:', unclassifiedRecent.length);
  
  if (unclassifiedRecent.length > 0) {
    console.log('\nNão classificados mais recentes:');
    unclassifiedRecent.slice(0, 5).forEach(o => {
      console.log('- OS', o.order_number, 'criada em', o.created_at);
    });
  }
}

checkNewDefects();