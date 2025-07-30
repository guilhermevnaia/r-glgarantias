const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function find3Extra() {
  console.log('=== INVESTIGANDO OS 3 REGISTROS EXTRAS ===');
  
  // 1. Verificar duplicatas por order_number
  const { data: allOrders } = await supabase
    .from('service_orders')
    .select('order_number');
  
  const orderCounts = {};
  allOrders.forEach(order => {
    orderCounts[order.order_number] = (orderCounts[order.order_number] || 0) + 1;
  });
  
  const duplicateNumbers = Object.keys(orderCounts).filter(key => orderCounts[key] > 1);
  console.log('Possíveis duplicatas:', duplicateNumbers.length);
  
  if (duplicateNumbers.length > 0) {
    console.log('Orders duplicadas:', duplicateNumbers.slice(0, 10));
    
    // Mostrar detalhes das duplicatas
    for (const orderNum of duplicateNumbers.slice(0, 3)) {
      const { data: orderDetails } = await supabase
        .from('service_orders')
        .select('id, order_number, order_date, order_status, created_at')
        .eq('order_number', orderNum);
      
      console.log(`\nDuplicatas para OS ${orderNum}:`);
      orderDetails.forEach(detail => {
        console.log(`  ID: ${detail.id}, Data: ${detail.order_date}, Status: ${detail.order_status}, Criado: ${detail.created_at}`);
      });
    }
  }
  
  // 2. Verificar registros com calculation_verified = false
  const { count: calcErrors } = await supabase
    .from('service_orders')
    .select('*', { count: 'exact', head: true })
    .eq('calculation_verified', false);
  
  console.log(`\nRegistros com cálculos incorretos: ${calcErrors}`);
  
  // 3. Verificar registros com campos obrigatórios nulos
  const { count: missingOrderNum } = await supabase
    .from('service_orders')
    .select('*', { count: 'exact', head: true })
    .is('order_number', null);
  
  const { count: missingDate } = await supabase
    .from('service_orders')
    .select('*', { count: 'exact', head: true })
    .is('order_date', null);
  
  const { count: missingStatus } = await supabase
    .from('service_orders')
    .select('*', { count: 'exact', head: true })
    .is('order_status', null);
  
  console.log(`Registros com order_number nulo: ${missingOrderNum}`);
  console.log(`Registros com order_date nulo: ${missingDate}`);
  console.log(`Registros com order_status nulo: ${missingStatus}`);
  
  // 4. Verificar últimos registros inseridos
  const { data: recentRecords } = await supabase
    .from('service_orders')
    .select('id, order_number, order_date, order_status, created_at')
    .order('id', { ascending: false })
    .limit(10);
  
  console.log('\nÚltimos 10 registros inseridos:');
  recentRecords.forEach(record => {
    console.log(`  ID: ${record.id}, OS: ${record.order_number}, Data: ${record.order_date}, Status: ${record.order_status}`);
  });
}

find3Extra();