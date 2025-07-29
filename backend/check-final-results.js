const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkResults() {
  console.log('=== VERIFICAÇÃO FINAL DOS DADOS ===');
  
  // Total no banco
  const { count } = await supabase
    .from('service_orders')
    .select('*', { count: 'exact', head: true });
  
  console.log('📊 Total de registros no banco:', count);
  
  // Distribuição por status
  const { data: statusData } = await supabase
    .from('service_orders')
    .select('order_status')
    .order('order_status');
  
  const statusCount = {};
  statusData.forEach(row => {
    statusCount[row.order_status] = (statusCount[row.order_status] || 0) + 1;
  });
  
  console.log('📈 Por status:', statusCount);
  
  // Distribuição por ano
  const { data: yearData } = await supabase
    .from('service_orders')
    .select('order_date')
    .order('order_date', { ascending: true });
  
  const yearCount = {};
  yearData.forEach(row => {
    const year = new Date(row.order_date).getFullYear();
    yearCount[year] = (yearCount[year] || 0) + 1;
  });
  
  console.log('📅 Por ano:', yearCount);
  
  // Distribuição por mês de 2019
  const { data: monthData2019 } = await supabase
    .from('service_orders')
    .select('order_date')
    .gte('order_date', '2019-01-01')
    .lt('order_date', '2020-01-01')
    .order('order_date');
  
  const monthCount2019 = {};
  monthData2019.forEach(row => {
    const month = new Date(row.order_date).getMonth() + 1;
    monthCount2019[month] = (monthCount2019[month] || 0) + 1;
  });
  
  console.log('📅 2019 por mês:', monthCount2019);
  
  // Primeiros e últimos registros
  const { data: firstRecords } = await supabase
    .from('service_orders')
    .select('order_number, order_date, order_status')
    .order('order_date', { ascending: true })
    .limit(3);
  
  const { data: lastRecords } = await supabase
    .from('service_orders')
    .select('order_number, order_date, order_status')
    .order('order_date', { ascending: false })
    .limit(3);
  
  console.log('📅 Primeiros registros:');
  firstRecords.forEach(r => console.log(`  ${r.order_number} - ${r.order_date} - ${r.order_status}`));
  
  console.log('📅 Últimos registros:');
  lastRecords.forEach(r => console.log(`  ${r.order_number} - ${r.order_date} - ${r.order_status}`));
}

checkResults();