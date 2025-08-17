const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function deepInvestigateCounts() {
  console.log('🔍 INVESTIGAÇÃO PROFUNDA DAS CONTAGENS...\n');
  
  try {
    // 1. Contar defeitos com diferentes critérios
    console.log('1️⃣ ANÁLISE DE DEFEITOS:');
    
    // Total de service orders
    const { count: totalOrders } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true });
    console.log(`📊 Total de service orders: ${totalOrders}`);
    
    // Com descrição não nula
    const { count: withDescription } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .not('raw_defect_description', 'is', null);
    console.log(`📝 Com descrição não nula: ${withDescription}`);
    
    // Com descrição não vazia
    const { count: withNonEmptyDescription } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    console.log(`✏️ Com descrição não vazia: ${withNonEmptyDescription}`);
    
    // Com descrição com conteúdo real (mais de 3 caracteres)
    const { data: ordersWithRealContent } = await supabase
      .from('service_orders')
      .select('id, raw_defect_description')
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    const realContentCount = ordersWithRealContent?.filter(order => 
      order.raw_defect_description && 
      order.raw_defect_description.trim().length > 3
    ).length || 0;
    console.log(`🎯 Com conteúdo real (>3 chars): ${realContentCount}`);
    
    // 2. Análise de classificações
    console.log('\n2️⃣ ANÁLISE DE CLASSIFICAÇÕES:');
    
    const { count: totalClassifications } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });
    console.log(`🤖 Total de classificações: ${totalClassifications}`);
    
    // Classificações com service_order_id válido
    const { data: allClassifications } = await supabase
      .from('defect_classifications')
      .select('service_order_id');
    
    const validServiceOrderIds = new Set();
    let invalidCount = 0;
    
    for (const classification of allClassifications || []) {
      const { data: exists } = await supabase
        .from('service_orders')
        .select('id')
        .eq('id', classification.service_order_id)
        .single();
      
      if (exists) {
        validServiceOrderIds.add(classification.service_order_id);
      } else {
        invalidCount++;
      }
    }
    
    console.log(`✅ Classificações com OS válida: ${validServiceOrderIds.size}`);
    console.log(`❌ Classificações órfãs: ${invalidCount}`);
    
    // 3. Verificar se há service orders com múltiplas classificações
    const { data: duplicateCheck } = await supabase
      .from('defect_classifications')
      .select('service_order_id');
    
    const counts = {};
    duplicateCheck?.forEach(item => {
      counts[item.service_order_id] = (counts[item.service_order_id] || 0) + 1;
    });
    
    const duplicates = Object.entries(counts).filter(([_, count]) => count > 1);
    console.log(`🔄 Service orders com múltiplas classificações: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
      console.log('Primeiras 5:');
      duplicates.slice(0, 5).forEach(([id, count]) => {
        console.log(`  OS ${id}: ${count} classificações`);
      });
    }
    
    // 4. Buscar service orders que DEVERIAM ter classificação mas não têm
    console.log('\n3️⃣ DEFEITOS NÃO CLASSIFICADOS:');
    
    const classifiedIds = new Set(allClassifications?.map(c => c.service_order_id) || []);
    const unclassifiedOrders = ordersWithRealContent?.filter(order => 
      order.raw_defect_description && 
      order.raw_defect_description.trim().length > 3 &&
      !classifiedIds.has(order.id)
    ) || [];
    
    console.log(`⏳ Defeitos não classificados: ${unclassifiedOrders.length}`);
    
    if (unclassifiedOrders.length > 0) {
      console.log('Primeiros 5:');
      unclassifiedOrders.slice(0, 5).forEach(order => {
        console.log(`  OS ${order.id}: ${order.raw_defect_description?.substring(0, 60)}...`);
      });
    }
    
    // 5. RESUMO FINAL
    console.log('\n=== RESUMO DETALHADO ===');
    console.log(`📊 Service Orders totais: ${totalOrders}`);
    console.log(`🎯 Com defeito válido (>3 chars): ${realContentCount}`);
    console.log(`🤖 Classificações totais: ${totalClassifications}`);
    console.log(`✅ Classificações válidas: ${totalClassifications - invalidCount}`);
    console.log(`⏳ Defeitos não classificados: ${unclassifiedOrders.length}`);
    console.log(`🔄 Defeitos com múltiplas classificações: ${duplicates.length}`);
    
    console.log('\n📈 CÁLCULO CORRETO:');
    const expectedClassifications = realContentCount;
    const actualValidClassifications = totalClassifications - invalidCount;
    console.log(`Deveria ter: ${expectedClassifications} classificações`);
    console.log(`Tem atualmente: ${actualValidClassifications} classificações`);
    console.log(`Diferença: ${actualValidClassifications - expectedClassifications}`);
    
  } catch (error) {
    console.error('❌ Erro na investigação:', error.message);
  }
}

deepInvestigateCounts();