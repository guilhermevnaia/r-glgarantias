const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function analyzeClassificationIssues() {
  console.log('=== ANÁLISE DETALHADA DE CLASSIFICAÇÕES ===\n');
  
  try {
    // 1. Total de defeitos únicos
    const { data: allOrders, count: totalOrders } = await supabase
      .from('service_orders')
      .select('id, raw_defect_description', { count: 'exact' })
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    console.log('📊 Total de defeitos com descrição:', totalOrders);
    
    // 2. Total de classificações
    const { data: allClassifications, count: totalClassifications } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact' });
    
    console.log('🤖 Total de classificações:', totalClassifications);
    console.log('📈 Diferença:', totalClassifications - totalOrders);
    
    // 3. Verificar duplicatas nas classificações
    const { data: duplicateQuery } = await supabase
      .rpc('get_classification_duplicates');
    
    if (duplicateQuery && duplicateQuery.length > 0) {
      console.log('🔄 Duplicatas encontradas:', duplicateQuery.length);
      console.log('Primeiras 5 duplicatas:');
      duplicateQuery.slice(0, 5).forEach(dup => {
        console.log(`  OS ${dup.service_order_id}: ${dup.count} classificações`);
      });
    }
    
    // 4. Classificações órfãs (referem IDs que não existem)
    const classifiedOrderIds = allClassifications?.map(c => c.service_order_id) || [];
    const existingOrderIds = allOrders?.map(o => o.id) || [];
    
    const orphanedIds = classifiedOrderIds.filter(id => !existingOrderIds.includes(id));
    
    console.log('👻 Classificações órfãs:', orphanedIds.length);
    if (orphanedIds.length > 0) {
      console.log('Primeiras 5 órfãs:', orphanedIds.slice(0, 5));
    }
    
    // 5. Defeitos não classificados
    const unclassified = allOrders?.filter(o => !classifiedOrderIds.includes(o.id)) || [];
    
    console.log('⏳ Defeitos não classificados:', unclassified.length);
    
    if (unclassified.length > 0) {
      console.log('Primeiros 5 não classificados:');
      unclassified.slice(0, 5).forEach(order => {
        console.log(`  OS ${order.id}: ${order.raw_defect_description?.substring(0, 60)}...`);
      });
    }
    
    // 6. Verificar estrutura hierárquica atual
    const { data: categories } = await supabase
      .from('defect_categories')
      .select('*')
      .eq('is_active', true);
    
    console.log('\n🏷️ CATEGORIAS ATUAIS:');
    categories?.forEach(cat => {
      console.log(`  ${cat.id}: ${cat.category_name} (${cat.total_occurrences || 0} ocorrências)`);
      if (cat.parent_category_id) {
        console.log(`    └── Pai: ${cat.parent_category_id}`);
      }
    });
    
    // 7. Verificar se existe estrutura hierárquica
    const hasHierarchy = categories?.some(cat => cat.parent_category_id != null);
    console.log('\n📊 Sistema hierárquico:', hasHierarchy ? 'SIM' : 'NÃO');
    
    console.log('\n=== RESUMO ===');
    console.log('✅ Correções necessárias:');
    if (orphanedIds.length > 0) console.log('  - Remover', orphanedIds.length, 'classificações órfãs');
    if (unclassified.length > 0) console.log('  - Classificar', unclassified.length, 'defeitos pendentes');
    if (!hasHierarchy) console.log('  - Implementar sistema hierárquico');
    
  } catch (error) {
    console.error('❌ Erro na análise:', error.message);
  }
}

// Executar análise
analyzeClassificationIssues();