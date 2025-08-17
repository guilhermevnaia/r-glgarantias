const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCountingIssue() {
  console.log('🔍 === INVESTIGAÇÃO DO PROBLEMA DE CONTAGEM ===\n');
  
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
    
    // 2. Verificar se há problemas de dados
    console.log('\n2. 🔍 VERIFICANDO QUALIDADE DOS DADOS...');
    
    // Verificar se há classificações com valores nulos ou inválidos
    const nullCategoryIds = allClassifications.filter(c => !c.category_id || c.category_id === null);
    const nullOrderIds = allClassifications.filter(c => !c.service_order_id || c.service_order_id === null);
    
    console.log(`🚨 Classificações com category_id nulo: ${nullCategoryIds.length}`);
    console.log(`🚨 Classificações com service_order_id nulo: ${nullOrderIds.length}`);
    
    if (nullCategoryIds.length > 0) {
      console.log('🔍 Exemplos de classificações com category_id nulo:');
      nullCategoryIds.slice(0, 3).forEach(c => {
        console.log(`   ID ${c.id}: OS ${c.service_order_id}, category_id: ${c.category_id}`);
      });
    }
    
    if (nullOrderIds.length > 0) {
      console.log('🔍 Exemplos de classificações com service_order_id nulo:');
      nullOrderIds.slice(0, 3).forEach(c => {
        console.log(`   ID ${c.id}: OS ${c.service_order_id}, category_id: ${c.category_id}`);
      });
    }
    
    // 3. Verificar se há problemas de tipos de dados
    console.log('\n3. 🔍 VERIFICANDO TIPOS DE DADOS...');
    
    const invalidCategoryIds = allClassifications.filter(c => 
      typeof c.category_id !== 'number' || c.category_id <= 0
    );
    const invalidOrderIds = allClassifications.filter(c => 
      typeof c.service_order_id !== 'number' || c.service_order_id <= 0
    );
    
    console.log(`🚨 Classificações com category_id inválido: ${invalidCategoryIds.length}`);
    console.log(`🚨 Classificações com service_order_id inválido: ${invalidOrderIds.length}`);
    
    // 4. Verificar se há problemas de contagem por categoria
    console.log('\n4. 📊 VERIFICANDO CONTAGEM POR CATEGORIA...');
    
    // Filtrar apenas classificações válidas
    const validClassifications = allClassifications.filter(c => 
      c.category_id && 
      c.service_order_id && 
      typeof c.category_id === 'number' && 
      typeof c.service_order_id === 'number' &&
      c.category_id > 0 && 
      c.service_order_id > 0
    );
    
    console.log(`✅ Classificações válidas para contagem: ${validClassifications.length}`);
    console.log(`🚨 Classificações inválidas para contagem: ${allClassifications.length - validClassifications.length}`);
    
    // Contar por categoria
    const categoryCounts = {};
    validClassifications.forEach(classification => {
      const categoryId = classification.category_id;
      categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
    });
    
    console.log('📈 Contagens por categoria (classificações válidas):');
    Object.entries(categoryCounts).forEach(([categoryId, count]) => {
      console.log(`   Categoria ${categoryId}: ${count} ocorrências`);
    });
    
    const totalValidCount = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
    console.log(`\n📊 Total de classificações válidas contadas: ${totalValidCount}`);
    
    // 5. Verificar se há problemas de banco de dados
    console.log('\n5. 🗄️ VERIFICANDO INTEGRIDADE DO BANCO...');
    
    // Tentar uma query SQL direta
    const { data: sqlCount, error: sqlError } = await supabase
      .rpc('count_classifications_by_category');
    
    if (sqlError) {
      console.log('ℹ️  Função RPC não disponível, tentando query alternativa...');
      
      // Tentar uma query mais simples
      const { data: simpleCount, error: simpleError } = await supabase
        .from('defect_classifications')
        .select('category_id')
        .not('category_id', 'is', null);
      
      if (simpleError) {
        console.error('❌ Erro na query simples:', simpleError.message);
      } else {
        console.log(`📊 Classificações com category_id não nulo: ${simpleCount.length}`);
      }
    } else {
      console.log('📊 Contagem via RPC:', sqlCount);
    }
    
    // 6. Verificar se há problemas de cache ou transações
    console.log('\n6. 🔄 VERIFICANDO PROBLEMAS DE CACHE...');
    
    // Fazer uma nova query para ver se os dados mudaram
    const { data: freshClassifications, error: freshError } = await supabase
      .from('defect_classifications')
      .select('id, category_id, service_order_id')
      .limit(10);
    
    if (freshError) {
      console.error('❌ Erro ao buscar dados frescos:', freshError.message);
    } else {
      console.log(`📊 Dados frescos carregados: ${freshClassifications.length} registros`);
      console.log('🔍 Primeiros 3 registros:');
      freshClassifications.slice(0, 3).forEach(c => {
        console.log(`   ID ${c.id}: OS ${c.service_order_id}, category_id ${c.category_id}`);
      });
    }
    
    // 7. Resumo final
    console.log('\n7. 📋 RESUMO FINAL:');
    console.log(`📊 Total de classificações no banco: ${allClassifications.length}`);
    console.log(`✅ Classificações válidas para contagem: ${validClassifications.length}`);
    console.log(`🚨 Classificações inválidas para contagem: ${allClassifications.length - validClassifications.length}`);
    console.log(`📈 Total contado por categoria: ${totalValidCount}`);
    
    if (allClassifications.length !== totalValidCount) {
      console.log(`⚠️  INCONSISTÊNCIA PRINCIPAL: ${allClassifications.length} ≠ ${totalValidCount}`);
      console.log(`   Diferença: ${Math.abs(allClassifications.length - totalValidCount)}`);
      
      if (nullCategoryIds.length > 0) {
        console.log('💡 PROBLEMA: Classificações com category_id nulo');
      }
      if (nullOrderIds.length > 0) {
        console.log('💡 PROBLEMA: Classificações com service_order_id nulo');
      }
      if (invalidCategoryIds.length > 0) {
        console.log('💡 PROBLEMA: Classificações com category_id inválido');
      }
      if (invalidOrderIds.length > 0) {
        console.log('💡 PROBLEMA: Classificações com service_order_id inválido');
      }
    } else {
      console.log('✅ Todas as classificações são válidas para contagem!');
    }

  } catch (error) {
    console.error('❌ Erro crítico na investigação:', error);
  }
}

// Executar investigação
debugCountingIssue();

