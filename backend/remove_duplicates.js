const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function removeDuplicates() {
  console.log('🔍 PROCURANDO E REMOVENDO DUPLICATAS...\n');
  
  try {
    // 1. Buscar todas as classificações
    const { data: allClassifications } = await supabase
      .from('defect_classifications')
      .select('*')
      .order('service_order_id', { ascending: true })
      .order('created_at', { ascending: false }); // Mais recentes primeiro
    
    console.log('📊 Total de classificações:', allClassifications?.length || 0);
    
    // 2. Agrupar por service_order_id
    const grouped = {};
    allClassifications?.forEach(classification => {
      const key = classification.service_order_id;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(classification);
    });
    
    // 3. Encontrar duplicatas
    const duplicates = Object.entries(grouped).filter(([_, classifications]) => classifications.length > 1);
    
    console.log('🔄 Duplicatas encontradas:', duplicates.length);
    
    if (duplicates.length > 0) {
      console.log('Primeiras 10 duplicatas:');
      duplicates.slice(0, 10).forEach(([serviceOrderId, classifications]) => {
        console.log(`  OS ${serviceOrderId}: ${classifications.length} classificações`);
      });
      
      // 4. Remover duplicatas mantendo apenas a mais recente
      let totalRemoved = 0;
      
      for (const [serviceOrderId, classifications] of duplicates) {
        // Manter apenas a primeira (mais recente) e remover o resto
        const toRemove = classifications.slice(1);
        
        console.log(`\n🧹 Limpando OS ${serviceOrderId}: mantendo 1, removendo ${toRemove.length}`);
        
        for (const classification of toRemove) {
          const { error } = await supabase
            .from('defect_classifications')
            .delete()
            .eq('id', classification.id);
          
          if (error) {
            console.error(`❌ Erro ao remover ID ${classification.id}:`, error.message);
          } else {
            totalRemoved++;
            console.log(`    ✅ Removida duplicata ID ${classification.id}`);
          }
        }
      }
      
      console.log(`\n📈 Total de duplicatas removidas: ${totalRemoved}`);
    }
    
    // 5. Verificar contagem final
    const { count: finalCount } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalDefects } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    console.log('\n=== RESULTADO FINAL ===');
    console.log(`🎯 Total de defeitos: ${totalDefects}`);
    console.log(`🤖 Total classificados: ${finalCount}`);
    console.log(`⏳ Pendentes: ${totalDefects - finalCount}`);
    console.log(`📈 Taxa de conclusão: ${((finalCount / totalDefects) * 100).toFixed(2)}%`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

removeDuplicates();