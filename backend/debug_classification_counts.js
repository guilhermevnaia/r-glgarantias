const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugClassificationCounts() {
  console.log('🔍 === DIAGNÓSTICO DE CONTAGENS DE CLASSIFICAÇÃO ===\n');
  
  let totalDefects = 0;
  let totalClassified = 0;
  let uniqueIds = [];
  let duplicateCount = 0;
  let totalFromCategories = 0;
  
  try {
    // 1. Verificar contagem total de service_orders com defeitos
    console.log('1. 📊 CONTAGEM DE SERVICE_ORDERS COM DEFEITOS:');
    const { count: defectsCount, error: defectsError } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    if (defectsError) {
      console.log('❌ Erro ao contar defeitos:', defectsError.message);
    } else {
      totalDefects = defectsCount || 0;
      console.log(`✅ Total de OS com defeitos: ${totalDefects}`);
    }

    // 2. Verificar contagem total de classificações
    console.log('\n2. 🧠 CONTAGEM DE CLASSIFICAÇÕES:');
    const { count: classifiedCount, error: classifiedError } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });
    
    if (classifiedError) {
      console.log('❌ Erro ao contar classificações:', classifiedError.message);
    } else {
      totalClassified = classifiedCount || 0;
      console.log(`✅ Total de classificações: ${totalClassified}`);
    }

    // 3. Verificar IDs únicos de service_orders classificadas
    console.log('\n3. 🔍 VERIFICANDO IDs ÚNICOS:');
    const { data: classifiedIds, error: idsError } = await supabase
      .from('defect_classifications')
      .select('service_order_id');
    
    if (idsError) {
      console.log('❌ Erro ao buscar IDs:', idsError.message);
    } else {
      uniqueIds = [...new Set(classifiedIds.map(item => item.service_order_id))];
      console.log(`✅ IDs únicos classificados: ${uniqueIds.length}`);
      console.log(`📝 Primeiros 10 IDs: ${uniqueIds.slice(0, 10).join(', ')}`);
    }

    // 4. Verificar se há duplicatas
    console.log('\n4. 🚨 VERIFICANDO DUPLICATAS:');
    if (classifiedIds && totalClassified) {
      duplicateCount = totalClassified - uniqueIds.length;
      if (duplicateCount > 0) {
        console.log(`⚠️  ENCONTRADAS ${duplicateCount} DUPLICATAS!`);
        
        // Encontrar duplicatas específicas
        const idCounts = {};
        classifiedIds.forEach(item => {
          idCounts[item.service_order_id] = (idCounts[item.service_order_id] || 0) + 1;
        });
        
        const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 1);
        console.log('🔍 Duplicatas encontradas:');
        duplicates.slice(0, 5).forEach(([id, count]) => {
          console.log(`   OS ${id}: ${count} classificações`);
        });
      } else {
        console.log('✅ Nenhuma duplicata encontrada');
      }
    }

    // 5. Verificar total_occurrences das categorias
    console.log('\n5. 📈 VERIFICANDO TOTAL_OCCURRENCES DAS CATEGORIAS:');
    const { data: categories, error: categoriesError } = await supabase
      .from('defect_categories')
      .select('id, category_name, total_occurrences')
      .eq('is_active', true);
    
    if (categoriesError) {
      console.log('❌ Erro ao buscar categorias:', categoriesError.message);
    } else {
      console.log('📊 Categorias e suas ocorrências:');
      categories.forEach(cat => {
        console.log(`   ${cat.category_name}: ${cat.total_occurrences} ocorrências`);
      });
      
      totalFromCategories = categories.reduce((sum, cat) => sum + cat.total_occurrences, 0);
      console.log(`\n📊 Soma total de total_occurrences: ${totalFromCategories}`);
      console.log(`📊 Total de classificações reais: ${totalClassified}`);
      
      if (totalFromCategories !== totalClassified) {
        console.log(`⚠️  INCONSISTÊNCIA: total_occurrences (${totalFromCategories}) ≠ classificações (${totalClassified})`);
        console.log(`   Diferença: ${Math.abs(totalFromCategories - totalClassified)}`);
      } else {
        console.log('✅ Contagens consistentes!');
      }
    }

    // 6. Verificar se há service_orders sem classificação
    console.log('\n6. ❓ VERIFICANDO OS SEM CLASSIFICAÇÃO:');
    if (classifiedIds && totalDefects) {
      const classifiedIdSet = new Set(classifiedIds.map(item => item.service_order_id));
      
      // Buscar algumas OS sem classificação para exemplo
      const { data: unclassifiedSample, error: unclassifiedError } = await supabase
        .from('service_orders')
        .select('id, raw_defect_description')
        .not('raw_defect_description', 'is', null)
        .not('raw_defect_description', 'eq', '')
        .limit(10);
      
      if (unclassifiedError) {
        console.log('❌ Erro ao buscar amostra:', unclassifiedError.message);
      } else {
        const unclassifiedCount = unclassifiedSample.filter(order => !classifiedIdSet.has(order.id)).length;
        console.log(`📝 Amostra de OS sem classificação: ${unclassifiedCount}/${unclassifiedSample.length}`);
        
        if (unclassifiedCount > 0) {
          console.log('🔍 Exemplos de OS sem classificação:');
          unclassifiedSample
            .filter(order => !classifiedIdSet.has(order.id))
            .slice(0, 3)
            .forEach(order => {
              console.log(`   OS ${order.id}: "${order.raw_defect_description?.substring(0, 50)}..."`);
            });
        }
      }
    }

    // 7. Resumo final
    console.log('\n7. 📋 RESUMO FINAL:');
    console.log(`📊 Total de OS com defeitos: ${totalDefects}`);
    console.log(`🧠 Total de classificações: ${totalClassified}`);
    console.log(`🔍 IDs únicos classificados: ${uniqueIds.length}`);
    console.log(`📈 Soma de total_occurrences: ${totalFromCategories}`);
    
    if (totalDefects && totalClassified) {
      const rate = ((totalClassified / totalDefects) * 100).toFixed(1);
      console.log(`📊 Taxa de classificação: ${rate}%`);
    }

    // 8. Recomendações
    console.log('\n8. 💡 RECOMENDAÇÕES:');
    if (duplicateCount > 0) {
      console.log('🚨 PRIORIDADE ALTA: Remover duplicatas das classificações');
    }
    if (Math.abs(totalFromCategories - totalClassified) > 0) {
      console.log('⚠️  PRIORIDADE MÉDIA: Sincronizar total_occurrences com classificações reais');
    }
    if (totalDefects && totalClassified && (totalClassified / totalDefects) < 0.8) {
      console.log('📈 PRIORIDADE MÉDIA: Executar classificação em massa para OS pendentes');
    }

  } catch (error) {
    console.error('❌ Erro crítico no diagnóstico:', error);
  }
}

// Executar diagnóstico
debugClassificationCounts();
