const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTestRecords() {
  console.log('=== VERIFICANDO REGISTROS DE TESTE ===');
  
  // Buscar registros com 'TESTE' no nome
  const { data: testRecords } = await supabase
    .from('service_orders')
    .select('*')
    .ilike('order_number', '%TESTE%');
  
  console.log('Registros de teste encontrados:', testRecords.length);
  
  testRecords.forEach(record => {
    console.log(`OS: ${record.order_number}, Data: ${record.order_date}, Status: ${record.order_status}, ID: ${record.id}`);
  });
  
  // Calcular total sem registros de teste
  const totalWithoutTests = 2522 - testRecords.length;
  console.log(`Total sem testes: ${totalWithoutTests}`);
  console.log(`Diferença para 2519: ${totalWithoutTests - 2519}`);
  
  // Verificar também outros padrões suspeitos
  const { data: suspiciousRecords } = await supabase
    .from('service_orders')
    .select('order_number, order_date, order_status, id')
    .or('order_number.ilike.%TEST%,order_number.ilike.%DEMO%,order_number.eq.0,order_number.eq.1,order_number.eq.9999');
  
  console.log('\nOutros registros suspeitos:', suspiciousRecords.length);
  suspiciousRecords.forEach(record => {
    console.log(`OS: ${record.order_number}, Data: ${record.order_date}, Status: ${record.order_status}, ID: ${record.id}`);
  });
}

checkTestRecords();