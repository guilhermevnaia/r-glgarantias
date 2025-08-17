const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixAIDataIntegrity() {
  console.log('🔧 CORRIGINDO INTEGRIDADE DOS DADOS DE IA\n');
  
  try {
    // 1. REMOVER CLASSIFICAÇÕES ÓRFÃS
    console.log('1️⃣ Removendo classificações órfãs...');
    
    const orphanedIds = [40639, 40650, 40662, 40646, 40644];
    
    for (const orphanId of orphanedIds) {
      const { error } = await supabase
        .from('defect_classifications')
        .delete()
        .eq('service_order_id', orphanId);
      
      if (error) {
        console.error(`❌ Erro ao remover OS ${orphanId}:`, error.message);
      } else {
        console.log(`✅ Removido: classificação órfã OS ${orphanId}`);
      }
    }
    
    // 2. VERIFICAR CONTAGEM APÓS LIMPEZA
    const { count: newTotal } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Nova contagem de classificações: ${newTotal}`);
    
    // 3. CLASSIFICAR DEFEITOS PENDENTES
    console.log('\n2️⃣ Identificando defeitos pendentes para classificação...');
    
    // Buscar todos os defeitos
    const { data: allOrders } = await supabase
      .from('service_orders')
      .select('id, raw_defect_description')
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    // Buscar IDs já classificados
    const { data: classifiedIds } = await supabase
      .from('defect_classifications')
      .select('service_order_id');
    
    const classified = new Set(classifiedIds?.map(c => c.service_order_id) || []);
    const unclassified = allOrders?.filter(o => !classified.has(o.id)) || [];
    
    console.log(`📝 Defeitos pendentes: ${unclassified.length}`);
    
    if (unclassified.length > 0) {
      console.log('Primeiros 10 pendentes:');
      unclassified.slice(0, 10).forEach(order => {
        console.log(`  OS ${order.id}: ${order.raw_defect_description?.substring(0, 60)}...`);
      });
    }
    
    // 4. VERIFICAR INTEGRIDADE FINAL
    const { count: totalDefects } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    const { count: totalClassified } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });
    
    console.log('\n=== RESULTADO FINAL ===');
    console.log(`🎯 Total de defeitos: ${totalDefects}`);
    console.log(`🤖 Total classificados: ${totalClassified}`);
    console.log(`⏳ Pendentes: ${totalDefects - totalClassified}`);
    console.log(`📈 Taxa de conclusão: ${((totalClassified / totalDefects) * 100).toFixed(1)}%`);
    
    return {
      totalDefects,
      totalClassified,
      pending: totalDefects - totalClassified,
      completionRate: (totalClassified / totalDefects) * 100
    };
    
  } catch (error) {
    console.error('❌ Erro na correção:', error.message);
    throw error;
  }
}

// Executar correção
fixAIDataIntegrity()
  .then(result => {
    console.log('\n✅ Correção concluída:', result);
  })
  .catch(console.error);