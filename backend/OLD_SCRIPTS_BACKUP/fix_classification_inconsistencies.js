const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixClassificationInconsistencies() {
  console.log('🔧 === CORREÇÃO DE INCONSISTÊNCIAS NAS CLASSIFICAÇÕES ===\n');
  
  try {
    // 1. Remover duplicatas das classificações
    console.log('1. 🧹 REMOVENDO DUPLICATAS...');
    
    // Buscar todas as classificações
    const { data: allClassifications, error: fetchError } = await supabase
      .from('defect_classifications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Erro ao buscar classificações:', fetchError.message);
      return;
    }
    
    console.log(`📊 Total de classificações encontradas: ${allClassifications.length}`);
    
    // Agrupar por service_order_id e manter apenas a mais recente
    const groupedByOrder = {};
    allClassifications.forEach(classification => {
      const orderId = classification.service_order_id;
      if (!groupedByOrder[orderId] || 
          new Date(classification.created_at) > new Date(groupedByOrder[orderId].created_at)) {
        groupedByOrder[orderId] = classification;
      }
    });
    
    const uniqueClassifications = Object.values(groupedByOrder);
    const duplicatesToRemove = allClassifications.length - uniqueClassifications.length;
    
    console.log(`✅ Classificações únicas: ${uniqueClassifications.length}`);
    console.log(`🗑️  Duplicatas a remover: ${duplicatesToRemove}`);
    
    if (duplicatesToRemove > 0) {
      // Remover todas as classificações antigas
      const { error: deleteError } = await supabase
        .from('defect_classifications')
        .delete()
        .neq('id', 0); // Deletar todas
      
      if (deleteError) {
        console.error('❌ Erro ao deletar classificações antigas:', deleteError.message);
        return;
      }
      
      console.log('✅ Classificações antigas removidas');
      
      // Reinserir apenas as únicas
      const { error: insertError } = await supabase
        .from('defect_classifications')
        .insert(uniqueClassifications);
      
      if (insertError) {
        console.error('❌ Erro ao reinserir classificações únicas:', insertError.message);
        return;
      }
      
      console.log('✅ Classificações únicas reinseridas');
    }

    // 2. Sincronizar total_occurrences das categorias
    console.log('\n2. 📊 SINCRONIZANDO TOTAL_OCCURRENCES...');
    
    // Buscar todas as categorias
    const { data: categories, error: categoriesError } = await supabase
      .from('defect_categories')
      .select('*');
    
    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias:', categoriesError.message);
      return;
    }
    
    // Contar ocorrências reais de cada categoria
    const categoryCounts = {};
    uniqueClassifications.forEach(classification => {
      const categoryId = classification.category_id;
      categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
    });
    
    console.log('📈 Contagens reais por categoria:');
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

    // 3. Verificar se há service_orders sem classificação
    console.log('\n3. ❓ VERIFICANDO OS SEM CLASSIFICAÇÃO...');
    
    const { data: allOrders, error: ordersError } = await supabase
      .from('service_orders')
      .select('id, raw_defect_description')
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    if (ordersError) {
      console.error('❌ Erro ao buscar ordens:', ordersError.message);
      return;
    }
    
    const classifiedOrderIds = new Set(uniqueClassifications.map(c => c.service_order_id));
    const unclassifiedOrders = allOrders.filter(order => !classifiedOrderIds.has(order.id));
    
    console.log(`📊 Total de OS com defeitos: ${allOrders.length}`);
    console.log(`🧠 OS classificadas: ${uniqueClassifications.length}`);
    console.log(`❓ OS sem classificação: ${unclassifiedOrders.length}`);
    
    if (unclassifiedOrders.length > 0) {
      console.log('🔍 Exemplos de OS sem classificação:');
      unclassifiedOrders.slice(0, 5).forEach(order => {
        console.log(`   OS ${order.id}: "${order.raw_defect_description?.substring(0, 50)}..."`);
      });
    }

    // 4. Resumo final
    console.log('\n4. 📋 RESUMO FINAL:');
    console.log(`✅ Duplicatas removidas: ${duplicatesToRemove}`);
    console.log(`✅ Classificações únicas mantidas: ${uniqueClassifications.length}`);
    console.log(`✅ total_occurrences sincronizados`);
    console.log(`📊 Taxa de classificação: ${((uniqueClassifications.length / allOrders.length) * 100).toFixed(1)}%`);
    
    if (unclassifiedOrders.length > 0) {
      console.log('\n💡 PRÓXIMOS PASSOS:');
      console.log(`   Execute a classificação em massa para processar ${unclassifiedOrders.length} OS pendentes`);
    }

  } catch (error) {
    console.error('❌ Erro crítico na correção:', error);
  }
}

// Executar correção
fixClassificationInconsistencies();

