const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAIStatus() {
  console.log('=== STATUS ATUAL DO SISTEMA DE IA ===\n');
  
  // 1. Contar defeitos totais
  const { count: totalDefects } = await supabase
    .from('service_orders')
    .select('*', { count: 'exact', head: true })
    .not('raw_defect_description', 'is', null)
    .not('raw_defect_description', 'eq', '');
  
  console.log('📊 DEFEITOS TOTAIS:', totalDefects);
  
  // 2. Contar classificações existentes
  const { count: classified } = await supabase
    .from('defect_classifications')
    .select('*', { count: 'exact', head: true });
  
  console.log('✅ JÁ CLASSIFICADOS:', classified);
  console.log('⏳ PENDENTES:', (totalDefects || 0) - (classified || 0));
  console.log('📈 TAXA COMPLETUDE:', (((classified || 0) / (totalDefects || 1)) * 100).toFixed(1) + '%\n');
  
  // 3. Categorias existentes
  const { data: categories } = await supabase
    .from('defect_categories')
    .select('id, category_name, total_occurrences')
    .eq('is_active', true)
    .order('total_occurrences', { ascending: false });
  
  console.log('🏷️ CATEGORIAS ATIVAS:', categories?.length || 0);
  categories?.slice(0, 5).forEach(cat => {
    console.log(`   ${cat.id}: ${cat.category_name} (${cat.total_occurrences} ocorrências)`);
  });
  
  // 4. Últimas classificações
  const { data: recent } = await supabase
    .from('defect_classifications')
    .select('service_order_id, original_defect_description, ai_confidence, created_at')
    .order('created_at', { ascending: false })
    .limit(3);
  
  console.log('\n🕐 ÚLTIMAS CLASSIFICAÇÕES:');
  recent?.forEach(r => {
    const desc = r.original_defect_description?.substring(0, 40) + '...';
    const conf = Math.round(r.ai_confidence * 100);
    console.log(`   OS ${r.service_order_id}: ${desc} (${conf}%)`);
  });
  
  // 5. Verificar integridade das tabelas
  console.log('\n🔍 VERIFICAÇÃO DE INTEGRIDADE:');
  
  // Verificar se existem classificações órfãs
  const { data: orphaned } = await supabase
    .from('defect_classifications')
    .select('service_order_id')
    .not('service_order_id', 'in', `(
      select id from service_orders where raw_defect_description is not null and raw_defect_description != ''
    )`);
  
  console.log('🚨 CLASSIFICAÇÕES ÓRFÃS:', orphaned?.length || 0);
  
  // Verificar se existem categorias sem classificações
  const { data: unusedCategories } = await supabase
    .from('defect_categories')
    .select('id, category_name, total_occurrences')
    .eq('total_occurrences', 0)
    .eq('is_active', true);
  
  console.log('📂 CATEGORIAS SEM USO:', unusedCategories?.length || 0);
}

checkAIStatus();