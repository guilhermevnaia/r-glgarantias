const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixClassificationInconsistenciesV2() {
  console.log('🔧 === CORREÇÃO DE INCONSISTÊNCIAS V2 ===\n');
  
  try {
    // 1. Verificar estado atual
    console.log('1. 📊 VERIFICANDO ESTADO ATUAL...');
    
    const { count: totalDefects } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    const { count: totalClassified } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total de OS com defeitos: ${totalDefects}`);
    console.log(`🧠 Total de classificações: ${totalClassified}`);
    
    // 2. Buscar todas as classificações para análise detalhada
    console.log('\n2. 🔍 ANALISANDO CLASSIFICAÇÕES...');
    
    const { data: allClassifications, error: fetchError } = await supabase
      .from('defect_classifications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Erro ao buscar classificações:', fetchError.message);
      return;
    }
    
    // 3. Identificar duplicatas por service_order_id
    console.log('\n3. 🚨 IDENTIFICANDO DUPLICATAS...');
    
    const orderIdCounts = {};
    allClassifications.forEach(classification => {
      const orderId = classification.service_order_id;
      orderIdCounts[orderId] = (orderIdCounts[orderId] || 0) + 1;
    });
    
    const duplicates = Object.entries(orderIdCounts).filter(([id, count]) => count > 1);
    const uniqueOrderIds = Object.keys(orderIdCounts);
    
    console.log(`📊 IDs únicos de OS: ${uniqueOrderIds.length}`);
    console.log(`🚨 Duplicatas encontradas: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
      console.log('🔍 Exemplos de duplicatas:');
      duplicates.slice(0, 5).forEach(([orderId, count]) => {
        console.log(`   OS ${orderId}: ${count} classificações`);
      });
    }
    
    // 4. Remover duplicatas mantendo apenas a mais recente
    console.log('\n4. 🧹 REMOVENDO DUPLICATAS...');
    
    if (duplicates.length > 0) {
      // Para cada OS com duplicatas, manter apenas a classificação mais recente
      for (const [orderId, count] of duplicates) {
        const orderClassifications = allClassifications.filter(c => c.service_order_id == orderId);
        
        // Ordenar por data de criação (mais recente primeiro)
        orderClassifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Manter apenas a primeira (mais recente)
        const toKeep = orderClassifications[0];
        const toDelete = orderClassifications.slice(1);
        
        console.log(`🔄 OS ${orderId}: mantendo 1, removendo ${toDelete.length}`);
        
        // Remover as duplicatas
        for (const duplicate of toDelete) {
          const { error: deleteError } = await supabase
            .from('defect_classifications')
            .delete()
            .eq('id', duplicate.id);
          
          if (deleteError) {
            console.error(`❌ Erro ao remover duplicata ${duplicate.id}:`, deleteError.message);
          }
        }
      }
      
      console.log('✅ Duplicatas removidas');
    }
    
    // 5. Recarregar classificações após limpeza
    console.log('\n5. 📊 RECARREGANDO CLASSIFICAÇÕES...');
    
    const { data: cleanClassifications, error: reloadError } = await supabase
      .from('defect_classifications')
      .select('*');
    
    if (reloadError) {
      console.error('❌ Erro ao recarregar classificações:', reloadError.message);
      return;
    }
    
    console.log(`✅ Classificações após limpeza: ${cleanClassifications.length}`);
    
    // 6. Sincronizar total_occurrences das categorias
    console.log('\n6. 📈 SINCRONIZANDO TOTAL_OCCURRENCES...');
    
    const { data: categories, error: categoriesError } = await supabase
      .from('defect_categories')
      .select('*');
    
    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias:', categoriesError.message);
      return;
    }
    
    // Contar ocorrências reais de cada categoria
    const categoryCounts = {};
    cleanClassifications.forEach(classification => {
      const categoryId = classification.category_id;
      categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
    });
    
    console.log('📊 Contagens reais por categoria:');
    Object.entries(categoryCounts).forEach(([categoryId, count]) => {
      const category = categories.find(cat => cat.id == categoryId);
      if (category) {
        console.log(`   ${category.category_name}: ${count} ocorrências`);
      }
    });
    
    // Atualizar total_occurrences de cada categoria
    for (const category of categories) {
      const realCount = categoryCounts[category.id] || 0;
      
      if (category.total_occurrences !== realCount) {
        console.log(`🔄 Atualizando ${category.category_name}: ${category.total_occurrences} → ${realCount}`);
        
        const { error: updateError } = await supabase
          .from('defect_categories')
          .update({ total_occurrences: realCount })
          .eq('id', category.id);
        
        if (updateError) {
          console.error(`❌ Erro ao atualizar ${category.category_name}:`, updateError.message);
        } else {
          console.log(`✅ ${category.category_name} atualizada`);
        }
      }
    }
    
    // 7. Verificar estado final
    console.log('\n7. ✅ VERIFICANDO ESTADO FINAL...');
    
    const { count: finalClassified } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });
    
    const { data: finalCategories } = await supabase
      .from('defect_categories')
      .select('total_occurrences');
    
    const finalTotalOccurrences = finalCategories?.reduce((sum, cat) => sum + cat.total_occurrences, 0) || 0;
    
    console.log(`📊 Classificações finais: ${finalClassified}`);
    console.log(`📈 Soma de total_occurrences: ${finalTotalOccurrences}`);
    
    if (finalClassified === finalTotalOccurrences) {
      console.log('✅ Sincronização concluída com sucesso!');
    } else {
      console.log(`⚠️  Ainda há inconsistência: ${Math.abs(finalClassified - finalTotalOccurrences)}`);
    }
    
    // 8. Resumo final
    console.log('\n8. 📋 RESUMO FINAL:');
    console.log(`🚨 Duplicatas removidas: ${duplicates.length > 0 ? duplicates.length : 0}`);
    console.log(`✅ Classificações únicas: ${finalClassified}`);
    console.log(`✅ total_occurrences sincronizados`);
    console.log(`📊 Taxa de classificação: ${((finalClassified / totalDefects) * 100).toFixed(1)}%`);
    
    if (finalClassified < totalDefects) {
      const pending = totalDefects - finalClassified;
      console.log(`\n💡 PRÓXIMOS PASSOS:`);
      console.log(`   Execute a classificação em massa para processar ${pending} OS pendentes`);
    }

  } catch (error) {
    console.error('❌ Erro crítico na correção:', error);
  }
}

// Executar correção
fixClassificationInconsistenciesV2();

