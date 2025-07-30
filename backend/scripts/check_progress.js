const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkProgress() {
  const { count } = await supabase
    .from('service_orders')
    .select('*', { count: 'exact', head: true });
  
  console.log('Registros atualmente no banco:', count);
  
  if (count > 0) {
    const { data: sample } = await supabase
      .from('service_orders')
      .select('order_number, order_date, order_status')
      .order('id', { ascending: false })
      .limit(5);
    
    console.log('Últimos registros inseridos:');
    sample.forEach(r => console.log(`  OS: ${r.order_number}, Data: ${r.order_date}, Status: ${r.order_status}`));
  }
}

checkProgress();