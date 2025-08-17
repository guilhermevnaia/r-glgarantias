const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function quickStatus() {
  const { count: totalDefects } = await supabase
    .from('service_orders')
    .select('*', { count: 'exact', head: true })
    .not('raw_defect_description', 'is', null)
    .not('raw_defect_description', 'eq', '')
    .gte('char_length(raw_defect_description)', 4);
    
  const { count: classified } = await supabase
    .from('defect_classifications')
    .select('*', { count: 'exact', head: true });
    
  console.log('📊 PROGRESSO ATUAL:');
  console.log(`Total defeitos: ${totalDefects}`);
  console.log(`Classificados: ${classified}`);
  console.log(`Restantes: ${totalDefects - classified}`);
  console.log(`Cobertura: ${((classified / totalDefects) * 100).toFixed(1)}%`);
  
  if (classified > 0) {
    // Check recent classifications
    const { data: recent } = await supabase
      .from('defect_classifications')
      .select('ai_reasoning')
      .order('created_at', { ascending: false })
      .limit(3);
      
    console.log('\n🔄 Classificações recentes:');
    recent?.forEach((r, i) => {
      console.log(`${i+1}. ${r.ai_reasoning?.substring(0, 80)}...`);
    });
  }
}
quickStatus().catch(console.error);