const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDuplicates() {
  console.log('=== VERIFICANDO DUPLICATAS ESPECÍFICAS ===');
  
  const testOrderNumbers = ['095743', '095742', '095740', '095737', '095727'];
  
  for (const orderNum of testOrderNumbers) {
    const { data: allRecords } = await supabase
      .from('service_orders')
      .select('order_number, created_at, id')
      .eq('order_number', orderNum)
      .order('created_at', { ascending: true });
    
    if (allRecords && allRecords.length > 1) {
      console.log(`DUPLICATA - OS ${orderNum}: ${allRecords.length} registros`);
      allRecords.forEach((record, i) => {
        console.log(`  ${i+1}: ID ${record.id} - Criado: ${record.created_at}`);
      });
    } else if (allRecords && allRecords.length === 1) {
      console.log(`OS ${orderNum}: Único (ID: ${allRecords[0].id})`);
    } else {
      console.log(`OS ${orderNum}: Não encontrado`);
    }
  }
  
  console.log('\n=== CONTAGEM TOTAL DE DUPLICATAS ===');
  const { data: allOrders } = await supabase
    .from('service_orders')
    .select('order_number');
  
  if (allOrders) {
    const orderCounts = {};
    allOrders.forEach(order => {
      orderCounts[order.order_number] = (orderCounts[order.order_number] || 0) + 1;
    });
    
    const duplicates = Object.entries(orderCounts).filter(([order, count]) => count > 1);
    console.log(`Total de OSs com duplicatas: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
      console.log('Primeiras 10 duplicatas:');
      duplicates.slice(0, 10).forEach(([order, count]) => {
        console.log(`  OS ${order}: ${count} registros`);
      });
    }
  }
}
checkDuplicates();