const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDeepInvestigation() {
  console.log('🔍 === INVESTIGAÇÃO PROFUNDA DAS INCONSISTÊNCIAS ===\n');
  
  try {
    // 1. Verificar todas as classificações
    console.log('1. 📊 ANALISANDO TODAS AS CLASSIFICAÇÕES...');
    
    const { data: allClassifications, error: fetchError } = await supabase
      .from('defect_classifications')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Erro ao buscar classificações:', fetchError.message);
      return;
    }
    
    console.log(`📊 Total de classificações: ${allClassifications.length}`);
    
    // 2. Verificar se há classificações com category_id inválido
    console.log('\n2. 🔍 VERIFICANDO CATEGORY_IDS INVÁLIDOS...');
    
    const { data: allCategories, error: categoriesError } = await supabase
      .from('defect_categories')
      .select('id');
    
    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias:', categoriesError.message);
      return;
    }
    
    const validCategoryIds = new Set(allCategories.map(cat => cat.id));
    const invalidClassifications = allClassifications.filter(c => !validCategoryIds.has(c.category_id));
    
    console.log(`📊 Categorias válidas: ${validCategoryIds.size}`);
    console.log(`🚨 Classificações com category_id inválido: ${invalidClassifications.length}`);
    
    if (invalidClassifications.length > 0) {
      console.log('🔍 Exemplos de classificações inválidas:');
      invalidClassifications.slice(0, 5).forEach(c => {
        console.log(`   ID ${c.id}: OS ${c.service_order_id}, category_id ${c.category_id}`);
      });
    }
    
    // 3. Verificar se há classificações duplicadas por ID
    console.log('\n3. 🔍 VERIFICANDO DUPLICATAS POR ID...');
    
    const classificationIds = allClassifications.map(c => c.id);
    const uniqueIds = [...new Set(classificationIds)];
    
    console.log(`📊 IDs únicos: ${uniqueIds.length}`);
    console.log(`🚨 IDs duplicados: ${classificationIds.length - uniqueIds.length}`);
    
    if (classificationIds.length !== uniqueIds.length) {
      // Encontrar IDs duplicados
      const idCounts = {};
      classificationIds.forEach(id => {
        idCounts[id] = (idCounts[id] || 0) + 1;
      });
      
      const duplicateIds = Object.entries(idCounts).filter(([id, count]) => count > 1);
      console.log('🔍 IDs duplicados encontrados:');
      duplicateIds.slice(0, 5).forEach(([id, count]) => {
        console.log(`   ID ${id}: ${count} ocorrências`);
      });
    }
    
    // 4. Verificar se há classificações com service_order_id inválido
    console.log('\n4. 🔍 VERIFICANDO SERVICE_ORDER_IDS INVÁLIDOS...');
    
    const { data: allOrders, error: ordersError } = await supabase
      .from('service_orders')
      .select('id');
    
    if (ordersError) {
      console.error('❌ Erro ao buscar ordens:', ordersError.message);
      return;
    }
    
    const validOrderIds = new Set(allOrders.map(order => order.id));
    const invalidOrderClassifications = allClassifications.filter(c => !validOrderIds.has(c.service_order_id));
    
    console.log(`📊 Ordens válidas: ${validOrderIds.size}`);
    console.log(`🚨 Classificações com service_order_id inválido: ${invalidOrderClassifications.length}`);
    
    if (invalidOrderClassifications.length > 0) {
      console.log('🔍 Exemplos de classificações com OS inválida:');
      invalidOrderClassifications.slice(0, 5).forEach(c => {
        console.log(`   ID ${c.id}: OS ${c.service_order_id}, category_id ${c.category_id}`);
      });
    }
    
    // 5. Verificar se há problemas de sincronização
    console.log('\n5. 🔍 VERIFICANDO SINCRONIZAÇÃO...');
    
    // Contar classificações válidas (com category_id e service_order_id válidos)
    const validClassifications = allClassifications.filter(c => 
      validCategoryIds.has(c.category_id) && validOrderIds.has(c.service_order_id)
    );
    
    console.log(`📊 Classificações válidas: ${validClassifications.length}`);
    console.log(`📊 Classificações inválidas: ${allClassifications.length - validClassifications.length}`);
    
    // 6. Verificar se há problemas de contagem por categoria
    console.log('\n6. 📊 VERIFICANDO CONTAGEM POR CATEGORIA...');
    
    const categoryCounts = {};
    validClassifications.forEach(classification => {
      const categoryId = classification.category_id;
      categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
    });
    
    console.log('📈 Contagens por categoria (classificações válidas):');
    Object.entries(categoryCounts).forEach(([categoryId, count]) => {
      const category = allCategories.find(cat => cat.id == categoryId);
      if (category) {
        console.log(`   Categoria ${categoryId}: ${count} ocorrências`);
      }
    });
    
    const totalValidCount = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
    console.log(`\n📊 Total de classificações válidas contadas: ${totalValidCount}`);
    
    // 7. Verificar se há problemas de banco de dados
    console.log('\n7. 🗄️ VERIFICANDO INTEGRIDADE DO BANCO...');
    
    // Tentar uma query mais simples
    const { data: simpleCount, error: simpleError } = await supabase
      .from('defect_classifications')
      .select('id', { count: 'exact', head: true });
    
    if (simpleError) {
      console.error('❌ Erro na contagem simples:', simpleError.message);
    } else {
      console.log(`📊 Contagem simples: ${simpleCount}`);
    }
    
    // 8. Resumo final
    console.log('\n8. 📋 RESUMO FINAL:');
    console.log(`📊 Total de classificações no banco: ${allClassifications.length}`);
    console.log(`✅ Classificações válidas: ${validClassifications.length}`);
    console.log(`🚨 Classificações inválidas: ${allClassifications.length - validClassifications.length}`);
    console.log(`📈 Total contado por categoria: ${totalValidCount}`);
    
    if (allClassifications.length !== totalValidCount) {
      console.log(`⚠️  INCONSISTÊNCIA PRINCIPAL: ${allClassifications.length} ≠ ${totalValidCount}`);
      console.log(`   Diferença: ${Math.abs(allClassifications.length - totalValidCount)}`);
      
      if (invalidClassifications.length > 0) {
        console.log('💡 PROBLEMA: Classificações com category_id inválido');
      }
      if (invalidOrderClassifications.length > 0) {
        console.log('💡 PROBLEMA: Classificações com service_order_id inválido');
      }
      if (classificationIds.length !== uniqueIds.length) {
        console.log('💡 PROBLEMA: IDs duplicados na tabela');
      }
    } else {
      console.log('✅ Todas as classificações são válidas!');
    }

  } catch (error) {
    console.error('❌ Erro crítico na investigação:', error);
  }
}

// Executar investigação
debugDeepInvestigation();

