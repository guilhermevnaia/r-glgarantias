const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPendingDefects() {
  console.log('🔍 Verificando defeitos pendentes de classificação...');
  
  try {
    // Buscar IDs já classificados
    const { data: classifiedIds } = await supabase
      .from('defect_classifications')
      .select('service_order_id');
    
    const classifiedSet = new Set((classifiedIds || []).map(item => item.service_order_id));
    
    // Buscar total de defeitos
    const { count: totalDefects } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    // Buscar alguns não classificados para exemplo
    const { data: unclassified } = await supabase
      .from('service_orders')
      .select('id, raw_defect_description')
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '')
      .limit(50);
    
    const pending = unclassified.filter(order => !classifiedSet.has(order.id));
    
    console.log('📊 RESULTADOS:');
    console.log(`  Total defeitos: ${totalDefects}`);
    console.log(`  Já classificados: ${classifiedSet.size}`);
    console.log(`  Pendentes: ${totalDefects - classifiedSet.size}`);
    
    if (pending.length > 0) {
      console.log('\n📝 Exemplos pendentes:');
      pending.slice(0, 3).forEach(order => {
        console.log(`  OS ${order.id}: ${order.raw_defect_description.substring(0, 60)}...`);
      });
      
      // Executar classificação para os pendentes
      console.log('\n🤖 Executando classificação para defeitos pendentes...');
      const { EnhancedLocalAIService } = require('./src/services/EnhancedLocalAIService.ts');
      const ai = EnhancedLocalAIService.getInstance();
      
      await ai.classifyAllExistingDefects();
    } else {
      console.log('\n✅ Todos os defeitos já foram classificados!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkPendingDefects();