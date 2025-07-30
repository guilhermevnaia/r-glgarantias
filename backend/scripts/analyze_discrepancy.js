const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function detailedComparison() {
  console.log('=== ANÁLISE DETALHADA POR ANO ===');
  
  const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
  let total = 0;
  
  for (const year of years) {
    const { count } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .gte('order_date', `${year}-01-01`)
      .lt('order_date', `${year + 1}-01-01`);
    
    console.log(`${year}: ${count} registros`);
    total += count;
  }
  
  console.log(`TOTAL: ${total}`);
  console.log(`DIFERENÇA: ${total - 2519} registros a mais que esperado`);
  
  // Possíveis cenários
  console.log('\n=== CENÁRIOS POSSÍVEIS ===');
  
  // Cenário 1: até 2021
  const until2021 = 368 + 409 + 183; // 2019 + 2020 + 2021
  console.log(`Se critério for até 2021: ${until2021} registros`);
  console.log(`Diferença: ${until2021 - 2519}`);
  
  // Cenário 2: até 2022
  const until2022 = until2021 + 21; // + 2022
  console.log(`Se critério for até 2022: ${until2022} registros`);
  console.log(`Diferença: ${until2022 - 2519}`);
  
  // Cenário 3: até 2023
  const until2023 = until2022 + 7; // + 2023
  console.log(`Se critério for até 2023: ${until2023} registros`);
  console.log(`Diferença: ${until2023 - 2519}`);
}

detailedComparison();