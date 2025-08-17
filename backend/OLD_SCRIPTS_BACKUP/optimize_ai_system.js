const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function optimizeAISystem() {
  console.log('🔧 === OTIMIZAÇÃO COMPLETA DO SISTEMA DE IA ===\n');
  
  try {
    // 1. REMOVER DUPLICATAS
    console.log('1️⃣ REMOVENDO DUPLICATAS DE CLASSIFICAÇÕES...');
    
    const { data: duplicates } = await supabase
      .from('defect_classifications')
      .select('service_order_id, id, created_at')
      .order('service_order_id')
      .order('created_at', { ascending: false });
    
    const seenOrders = new Set();
    const duplicateIds = [];
    
    duplicates?.forEach(classification => {
      if (seenOrders.has(classification.service_order_id)) {
        duplicateIds.push(classification.id);
      } else {
        seenOrders.add(classification.service_order_id);
      }
    });
    
    console.log(`📊 Duplicatas encontradas: ${duplicateIds.length}`);
    
    if (duplicateIds.length > 0) {
      const batchSize = 100;
      let removed = 0;
      
      for (let i = 0; i < duplicateIds.length; i += batchSize) {
        const batch = duplicateIds.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('defect_classifications')
          .delete()
          .in('id', batch);
        
        if (!error) {
          removed += batch.length;
          console.log(`  ✅ Removidos ${batch.length} duplicatas (total: ${removed})`);
        } else {
          console.error(`  ❌ Erro ao remover lote:`, error.message);
        }
        
        // Pequena pausa entre lotes
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`✅ Total de duplicatas removidas: ${removed}`);
    }
    
    // 2. OTIMIZAR CATEGORIAS
    console.log('\n2️⃣ OTIMIZANDO CATEGORIAS...');
    
    // Recalcular total_occurrences das categorias
    const { data: categories } = await supabase
      .from('defect_categories')
      .select('id, category_name');
    
    for (const category of categories || []) {
      const { count } = await supabase
        .from('defect_classifications')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id);
      
      await supabase
        .from('defect_categories')
        .update({ total_occurrences: count || 0 })
        .eq('id', category.id);
      
      console.log(`  📊 ${category.category_name}: ${count || 0} ocorrências`);
    }
    
    // 3. DESATIVAR CATEGORIAS SEM USO
    console.log('\n3️⃣ DESATIVANDO CATEGORIAS SEM USO...');
    
    const { data: unusedCategories } = await supabase
      .from('defect_categories')
      .select('id, category_name, total_occurrences')
      .eq('total_occurrences', 0)
      .eq('is_active', true);
    
    if (unusedCategories && unusedCategories.length > 0) {
      const unusedIds = unusedCategories.map(cat => cat.id);
      
      await supabase
        .from('defect_categories')
        .update({ is_active: false })
        .in('id', unusedIds);
      
      console.log(`✅ Desativadas ${unusedCategories.length} categorias sem uso:`);
      unusedCategories.forEach(cat => {
        console.log(`  - ${cat.category_name} (ID: ${cat.id})`);
      });
    } else {
      console.log('✅ Todas as categorias ativas estão sendo utilizadas');
    }
    
    // 4. CONSOLIDAR CATEGORIAS SIMILARES
    console.log('\n4️⃣ ANALISANDO CATEGORIAS SIMILARES...');
    
    const { data: activeCategories } = await supabase
      .from('defect_categories')
      .select('*')
      .eq('is_active', true)
      .gt('total_occurrences', 0);
    
    // Detectar categorias com nomes similares
    const similarCategories = [];
    activeCategories?.forEach((cat1, i) => {
      activeCategories.slice(i + 1).forEach(cat2 => {
        const similarity = calculateSimilarity(cat1.category_name, cat2.category_name);
        if (similarity > 0.7) {
          similarCategories.push({
            cat1: cat1.category_name,
            cat2: cat2.category_name,
            similarity: similarity.toFixed(2)
          });
        }
      });
    });
    
    if (similarCategories.length > 0) {
      console.log('⚠️ Categorias similares encontradas (revisar manualmente):');
      similarCategories.forEach(pair => {
        console.log(`  - "${pair.cat1}" vs "${pair.cat2}" (${(pair.similarity * 100).toFixed(0)}% similar)`);
      });
    } else {
      console.log('✅ Nenhuma categoria similar encontrada');
    }
    
    // 5. ESTATÍSTICAS FINAIS
    console.log('\n5️⃣ ESTATÍSTICAS FINAIS...');
    
    const { count: finalClassifications } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalDefects } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    const { data: finalCategories } = await supabase
      .from('defect_categories')
      .select('category_name, total_occurrences, is_active')
      .eq('is_active', true)
      .order('total_occurrences', { ascending: false });
    
    console.log('\n📊 RESUMO DA OTIMIZAÇÃO:');
    console.log('=' .repeat(50));
    console.log(`🎯 Total de defeitos: ${finalDefects}`);
    console.log(`✅ Total classificado: ${finalClassifications}`);
    console.log(`📈 Taxa de cobertura: ${((finalClassifications / finalDefects) * 100).toFixed(1)}%`);
    console.log(`🏷️ Categorias ativas: ${finalCategories?.length || 0}`);
    
    console.log('\n🏆 TOP 5 CATEGORIAS:');
    finalCategories?.slice(0, 5).forEach((cat, i) => {
      console.log(`${i + 1}. ${cat.category_name}: ${cat.total_occurrences} ocorrências`);
    });
    
    console.log('\n🎉 OTIMIZAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('✅ Sistema de IA otimizado e pronto para produção');
    
    return {
      duplicatesRemoved: duplicateIds.length,
      finalClassifications,
      finalDefects,
      coverageRate: (finalClassifications / finalDefects) * 100,
      activeCategories: finalCategories?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Erro na otimização:', error);
    throw error;
  }
}

// Função auxiliar para calcular similaridade entre strings
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

optimizeAISystem()
  .then(result => {
    console.log('\n🎯 RESULTADO DA OTIMIZAÇÃO:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 ERRO NA OTIMIZAÇÃO:', error);
    process.exit(1);
  });