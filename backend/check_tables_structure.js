const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTablesStructure() {
  console.log('🔍 === VERIFICAÇÃO DA ESTRUTURA DAS TABELAS ===\n');

  try {
    // 1. Verificar se as tabelas existem
    console.log('1. 📋 Verificando existência das tabelas...');
    
    // Tentar buscar dados das tabelas principais
    const { data: categories, error: catError } = await supabase
      .from('defect_categories')
      .select('*')
      .limit(1);

    if (catError) {
      console.log('❌ Tabela defect_categories:', catError.message);
    } else {
      console.log('✅ Tabela defect_categories: EXISTE');
      if (categories && categories.length > 0) {
        console.log('   📊 Colunas disponíveis:', Object.keys(categories[0]));
      }
    }

    const { data: classifications, error: classError } = await supabase
      .from('defect_classifications')
      .select('*')
      .limit(1);

    if (classError) {
      console.log('❌ Tabela defect_classifications:', classError.message);
    } else {
      console.log('✅ Tabela defect_classifications: EXISTE');
      if (classifications && classifications.length > 0) {
        console.log('   📊 Colunas disponíveis:', Object.keys(classifications[0]));
      }
    }

    const { data: serviceOrders, error: ordersError } = await supabase
      .from('service_orders')
      .select('*')
      .limit(1);

    if (ordersError) {
      console.log('❌ Tabela service_orders:', ordersError.message);
    } else {
      console.log('✅ Tabela service_orders: EXISTE');
      if (serviceOrders && serviceOrders.length > 0) {
        console.log('   📊 Colunas disponíveis:', Object.keys(serviceOrders[0]));
      }
    }

    // 2. Verificar dados nas tabelas
    console.log('\n2. 📊 Verificando dados nas tabelas...');
    
    // Contar registros
    const { count: catCount } = await supabase
      .from('defect_categories')
      .select('*', { count: 'exact', head: true });

    const { count: classCount } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });

    const { count: ordersCount } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true });

    console.log(`   📋 defect_categories: ${catCount || 0} registros`);
    console.log(`   🧠 defect_classifications: ${classCount || 0} registros`);
    console.log(`   📋 service_orders: ${ordersCount || 0} registros`);

    // 3. Verificar estrutura específica das categorias
    if (catCount > 0) {
      console.log('\n3. 🏗️ Verificando estrutura das categorias...');
      
      const { data: allCategories } = await supabase
        .from('defect_categories')
        .select('*')
        .order('id', { ascending: true });

      if (allCategories && allCategories.length > 0) {
        console.log('   📋 Primeiras 5 categorias:');
        allCategories.slice(0, 5).forEach((cat, index) => {
          console.log(`      ${index + 1}. ID: ${cat.id}, Nome: ${cat.category_name}`);
          console.log(`         Descrição: ${cat.description || 'N/A'}`);
          console.log(`         Cor: ${cat.color_hex || 'N/A'}`);
          console.log(`         Ícone: ${cat.icon || 'N/A'}`);
          console.log(`         Ativa: ${cat.is_active ? 'Sim' : 'Não'}`);
          console.log(`         Ocorrências: ${cat.total_occurrences || 0}`);
          console.log(`         Criada em: ${cat.created_at || 'N/A'}`);
          console.log('');
        });
      }
    }

    // 4. Verificar classificações existentes
    if (classCount > 0) {
      console.log('\n4. 🧠 Verificando classificações existentes...');
      
      const { data: recentClassifications } = await supabase
        .from('defect_classifications')
        .select(`
          *,
          defect_categories (
            category_name,
            color_hex,
            icon
          )
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentClassifications && recentClassifications.length > 0) {
        console.log('   📊 Últimas 3 classificações:');
        recentClassifications.forEach((classif, index) => {
          console.log(`      ${index + 1}. OS: ${classif.service_order_id}`);
          console.log(`         Defeito: ${classif.original_defect_description?.substring(0, 50)}...`);
          console.log(`         Categoria: ${classif.defect_categories?.category_name || 'N/A'}`);
          console.log(`         Confiança: ${(classif.ai_confidence * 100).toFixed(1)}%`);
          console.log(`         Revisado: ${classif.is_reviewed ? 'Sim' : 'Não'}`);
          console.log(`         Criado em: ${classif.created_at}`);
          console.log('');
        });
      }
    }

    // 5. Verificar se há estrutura hierárquica
    console.log('\n5. 🔗 Verificando estrutura hierárquica...');
    
    // Tentar buscar campos hierárquicos
    try {
      const { data: hierarchicalTest } = await supabase
        .from('defect_categories')
        .select('hierarchy_level, hierarchy_path, parent_category_id')
        .limit(1);

      if (hierarchicalTest && hierarchicalTest.length > 0) {
        const hasHierarchy = hierarchicalTest[0].hierarchy_level || hierarchicalTest[0].hierarchy_path || hierarchicalTest[0].parent_category_id;
        if (hasHierarchy) {
          console.log('   ✅ Estrutura hierárquica detectada!');
          console.log('      Campos disponíveis:');
          if (hierarchicalTest[0].hierarchy_level) console.log('      - hierarchy_level');
          if (hierarchicalTest[0].hierarchy_path) console.log('      - hierarchy_path');
          if (hierarchicalTest[0].parent_category_id) console.log('      - parent_category_id');
        } else {
          console.log('   ⚠️ Campos hierárquicos existem mas estão vazios');
        }
      } else {
        console.log('   ❌ Estrutura hierárquica não encontrada');
        console.log('   💡 Execute o script hierarchical_schema.sql para criar a estrutura');
      }
    } catch (error) {
      console.log('   ❌ Erro ao verificar estrutura hierárquica:', error.message);
    }

    // 6. Resumo e recomendações
    console.log('\n6. 📋 RESUMO E RECOMENDAÇÕES');
    console.log('   =============================');
    
    if (catCount === 0) {
      console.log('   ⚠️  Nenhuma categoria encontrada');
      console.log('   💡 Execute o script simple_ai_tables.sql para criar as categorias básicas');
    }
    
    if (classCount === 0) {
      console.log('   ⚠️  Nenhuma classificação encontrada');
      console.log('   💡 Execute a classificação em massa após criar as categorias');
    }
    
    if (classCount > 0 && ordersCount > 0) {
      const classificationRate = (classCount / ordersCount) * 100;
      console.log(`   📊 Taxa de classificação atual: ${classificationRate.toFixed(1)}%`);
      
      if (classificationRate < 100) {
        console.log(`   ⚠️  Faltam classificar ${ordersCount - classCount} defeitos`);
        console.log('   💡 Execute a classificação em massa para processar os restantes');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral na verificação:', error);
  }
}

// Executar verificação
checkTablesStructure().then(() => {
  console.log('\n🔍 Verificação da estrutura concluída!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

