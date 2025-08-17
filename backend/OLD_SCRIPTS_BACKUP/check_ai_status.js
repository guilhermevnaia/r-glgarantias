const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAIStatus() {
  console.log('🔍 === VERIFICAÇÃO DO STATUS DA IA ===\n');

  try {
    // 1. Verificar tabelas existentes
    console.log('1. 📋 Verificando estrutura das tabelas...');
    
    const { data: categories, error: catError } = await supabase
      .from('defect_categories')
      .select('*')
      .order('hierarchy_level', { ascending: true });

    if (catError) {
      console.log('❌ Erro ao buscar categorias:', catError.message);
    } else {
      console.log(`✅ Tabela defect_categories: ${categories?.length || 0} categorias encontradas`);
      
      if (categories && categories.length > 0) {
        console.log('   📊 Estrutura hierárquica:');
        const byLevel = {};
        categories.forEach(cat => {
          const level = cat.hierarchy_level || 1;
          if (!byLevel[level]) byLevel[level] = [];
          byLevel[level].push(cat.category_name);
        });
        
        Object.keys(byLevel).sort().forEach(level => {
          console.log(`   Nível ${level}: ${byLevel[level].join(', ')}`);
        });
      }
    }

    // 2. Verificar classificações existentes
    console.log('\n2. 🧠 Verificando classificações da IA...');
    
    const { data: classifications, error: classError } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact' });

    if (classError) {
      console.log('❌ Erro ao buscar classificações:', classError.message);
    } else {
      console.log(`✅ Tabela defect_classifications: ${classifications?.length || 0} classificações encontradas`);
    }

    // 3. Verificar ordens de serviço com defeitos
    console.log('\n3. 📋 Verificando ordens de serviço...');
    
    const { data: orders, error: ordersError, count: totalOrders } = await supabase
      .from('service_orders')
      .select('id, raw_defect_description', { count: 'exact' })
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');

    if (ordersError) {
      console.log('❌ Erro ao buscar ordens:', ordersError.message);
    } else {
      console.log(`✅ Total de ordens com defeitos: ${totalOrders || 0}`);
      
      // Verificar quantas já foram classificadas
      const { data: classifiedIds } = await supabase
        .from('defect_classifications')
        .select('service_order_id');
      
      const classifiedSet = new Set((classifiedIds || []).map(item => item.service_order_id));
      const unclassifiedCount = (totalOrders || 0) - classifiedSet.size;
      
      console.log(`   📊 Classificadas: ${classifiedSet.size}`);
      console.log(`   📊 Não classificadas: ${unclassifiedCount}`);
      console.log(`   📊 Taxa de classificação: ${totalOrders > 0 ? ((classifiedSet.size / totalOrders) * 100).toFixed(1) : 0}%`);
    }

    // 4. Verificar estrutura hierárquica
    console.log('\n4. 🏗️ Verificando estrutura hierárquica...');
    
    if (categories && categories.length > 0) {
      const hierarchicalCategories = categories.filter(cat => cat.hierarchy_level > 1);
      const parentCategories = categories.filter(cat => cat.hierarchy_level === 1);
      
      console.log(`   📊 Categorias principais (nível 1): ${parentCategories.length}`);
      console.log(`   📊 Grupos e subgrupos (níveis 2+): ${hierarchicalCategories.length}`);
      
      if (hierarchicalCategories.length > 0) {
        console.log('   📋 Exemplos de hierarquia:');
        hierarchicalCategories.slice(0, 5).forEach(cat => {
          console.log(`      ${cat.hierarchy_path || `${cat.category_name} (nível ${cat.hierarchy_level})`}`);
        });
      }
    }

    // 5. Verificar performance da IA
    console.log('\n5. 📈 Verificando performance da IA...');
    
    if (classifications && classifications.length > 0) {
      const confidenceStats = classifications.reduce((acc, classif) => {
        const confidence = classif.ai_confidence || 0;
        if (confidence >= 0.8) acc.high++;
        else if (confidence >= 0.5) acc.medium++;
        else acc.low++;
        return acc;
      }, { high: 0, medium: 0, low: 0 });

      console.log(`   📊 Confiança alta (≥80%): ${confidenceStats.high}`);
      console.log(`   📊 Confiança média (50-79%): ${confidenceStats.medium}`);
      console.log(`   📊 Confiança baixa (<50%): ${confidenceStats.low}`);
      
      const avgConfidence = classifications.reduce((sum, classif) => sum + (classif.ai_confidence || 0), 0) / classifications.length;
      console.log(`   📊 Confiança média geral: ${(avgConfidence * 100).toFixed(1)}%`);
    }

    // 6. Verificar categorias mais utilizadas
    console.log('\n6. 🎯 Verificando categorias mais utilizadas...');
    
    if (categories && categories.length > 0) {
      const topCategories = categories
        .filter(cat => cat.total_occurrences > 0)
        .sort((a, b) => (b.total_occurrences || 0) - (a.total_occurrences || 0))
        .slice(0, 5);
      
      if (topCategories.length > 0) {
        console.log('   📊 Top 5 categorias por uso:');
        topCategories.forEach((cat, index) => {
          console.log(`      ${index + 1}. ${cat.category_name}: ${cat.total_occurrences} ocorrências`);
        });
      } else {
        console.log('   ⚠️ Nenhuma categoria com ocorrências registradas');
      }
    }

    // 7. Resumo geral
    console.log('\n7. 📋 RESUMO GERAL');
    console.log('   =================');
    
    const totalDefects = totalOrders || 0;
    const totalClassified = classifications?.length || 0;
    const totalCategories = categories?.length || 0;
    const hierarchicalCategories = categories?.filter(cat => cat.hierarchy_level > 1).length || 0;
    
    console.log(`   🎯 Total de defeitos: ${totalDefects.toLocaleString()}`);
    console.log(`   🧠 Classificados pela IA: ${totalClassified.toLocaleString()}`);
    console.log(`   📊 Taxa de classificação: ${totalDefects > 0 ? ((totalClassified / totalDefects) * 100).toFixed(1) : 0}%`);
    console.log(`   🏗️ Categorias totais: ${totalCategories}`);
    console.log(`   🔗 Categorias hierárquicas: ${hierarchicalCategories}`);
    
    if (totalDefects > 0 && totalClassified < totalDefects) {
      console.log(`   ⚠️  FALTAM CLASSIFICAR: ${(totalDefects - totalClassified).toLocaleString()} defeitos`);
      console.log(`   💡 Execute a classificação em massa para processar os defeitos restantes`);
    } else if (totalDefects > 0 && totalClassified >= totalDefects) {
      console.log(`   ✅ Todos os defeitos foram classificados!`);
    }

  } catch (error) {
    console.error('❌ Erro geral na verificação:', error);
  }
}

// Executar verificação
checkAIStatus().then(() => {
  console.log('\n🔍 Verificação concluída!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

