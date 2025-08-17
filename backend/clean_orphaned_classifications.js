const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanOrphanedClassifications() {
  console.log('🧹 === LIMPEZA DE CLASSIFICAÇÕES ÓRFÃS ===\n');
  
  try {
    // 1. Verificar estado atual
    console.log('1. 📊 VERIFICANDO ESTADO ATUAL...');
    
    const { data: allClassifications, error: fetchError } = await supabase
      .from('defect_classifications')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Erro ao buscar classificações:', fetchError.message);
      return;
    }
    
    console.log(`📊 Total de classificações: ${allClassifications.length}`);
    
    // 2. Identificar service_order_ids válidos
    console.log('\n2. 🔍 IDENTIFICANDO OS VÁLIDAS...');
    
    const { data: allOrders, error: ordersError } = await supabase
      .from('service_orders')
      .select('id');
    
    if (ordersError) {
      console.error('❌ Erro ao buscar ordens:', ordersError.message);
      return;
    }
    
    const validOrderIds = new Set(allOrders.map(order => order.id));
    console.log(`📊 Total de OS válidas: ${validOrderIds.size}`);
    
    // 3. Identificar classificações órfãs
    console.log('\n3. 🚨 IDENTIFICANDO CLASSIFICAÇÕES ÓRFÃS...');
    
    const orphanedClassifications = allClassifications.filter(c => !validOrderIds.has(c.service_order_id));
    const validClassifications = allClassifications.filter(c => validOrderIds.has(c.service_order_id));
    
    console.log(`✅ Classificações válidas: ${validClassifications.length}`);
    console.log(`🚨 Classificações órfãs: ${orphanedClassifications.length}`);
    
    if (orphanedClassifications.length > 0) {
      console.log('🔍 Exemplos de classificações órfãs:');
      orphanedClassifications.slice(0, 5).forEach(c => {
        console.log(`   ID ${c.id}: OS ${c.service_order_id}, category_id ${c.category_id}`);
      });
    }
    
    // 4. Limpar classificações órfãs
    console.log('\n4. 🧹 LIMPANDO CLASSIFICAÇÕES ÓRFÃS...');
    
    if (orphanedClassifications.length > 0) {
      const orphanedIds = orphanedClassifications.map(c => c.id);
      
      console.log(`🗑️  Removendo ${orphanedClassifications.length} classificações órfãs...`);
      
      const { error: deleteError } = await supabase
        .from('defect_classifications')
        .delete()
        .in('id', orphanedIds);
      
      if (deleteError) {
        console.error('❌ Erro ao remover classificações órfãs:', deleteError.message);
        return;
      }
      
      console.log('✅ Classificações órfãs removidas com sucesso!');
    } else {
      console.log('✅ Nenhuma classificação órfã encontrada');
    }
    
    // 5. Recarregar classificações válidas
    console.log('\n5. 📊 RECARREGANDO CLASSIFICAÇÕES VÁLIDAS...');
    
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
    console.log(`🚨 Classificações órfãs removidas: ${orphanedClassifications.length}`);
    console.log(`✅ Classificações válidas restantes: ${finalClassified}`);
    console.log(`✅ total_occurrences sincronizados`);
    
    // 9. Verificar se há OS sem classificação
    console.log('\n9. ❓ VERIFICANDO OS SEM CLASSIFICAÇÃO...');
    
    const { count: totalDefects } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    if (totalDefects) {
      const rate = ((finalClassified / totalDefects) * 100).toFixed(1);
      console.log(`📊 Total de OS com defeitos: ${totalDefects}`);
      console.log(`🧠 OS classificadas: ${finalClassified}`);
      console.log(`📊 Taxa de classificação: ${rate}%`);
      
      if (finalClassified < totalDefects) {
        const pending = totalDefects - finalClassified;
        console.log(`\n💡 PRÓXIMOS PASSOS:`);
        console.log(`   Execute a classificação em massa para processar ${pending} OS pendentes`);
      }
    }

  } catch (error) {
    console.error('❌ Erro crítico na limpeza:', error);
  }
}

// Executar limpeza
cleanOrphanedClassifications();

