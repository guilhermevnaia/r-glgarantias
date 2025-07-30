const { CleanDataProcessor } = require('./dist/services/CleanDataProcessor');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

console.log('🔧 CORREÇÃO DE PROCESSAMENTO DE DADOS LÚCIO');
console.log('📋 Problema: Datas futuras (2026, 2027) no banco');
console.log('🎯 Objetivo: Reprocessar com filtro correto >= 2019');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const processor = new CleanDataProcessor();

async function fixDataProcessing() {
  try {
    // 1. LIMPAR BANCO COMPLETAMENTE
    console.log('\n🧹 Limpando banco de dados...');
    await supabase.from('service_orders').delete().neq('id', 0);
    console.log('✅ service_orders limpo');
    
    // 2. REPROCESSAR PLANILHA ORIGINAL
    const filePath = 'S:/comp-glgarantias/r-glgarantias/GLú-Garantias.xlsx';
    console.log(`\n📁 Reprocessando: ${filePath}`);
    
    const buffer = fs.readFileSync(filePath);
    console.log(`📊 Buffer: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    // 3. PROCESSAR COM FILTROS CORRETOS
    console.log('\n🔧 Iniciando processamento otimizado...');
    const result = await processor.processExcelData(buffer);
    
    console.log('\n📊 RESULTADO DO PROCESSAMENTO:');
    console.log(`Total de linhas processadas: ${result.data.length}`);
    console.log('Summary:', result.summary);
    
    if (result.data.length === 0) {
      console.log('❌ ERRO: Nenhum dado válido processado!');
      return;
    }
    
    // 4. VERIFICAR DATAS ANTES DE INSERIR
    console.log('\n🔍 Verificando datas processadas...');
    const dateStats = {};
    let futureCount = 0;
    let validCount = 0;
    
    result.data.forEach(item => {
      const year = new Date(item.order_date).getFullYear();
      dateStats[year] = (dateStats[year] || 0) + 1;
      
      if (year >= 2026) {
        futureCount++;
        console.log(`⚠️ Data futura encontrada: ${item.order_number} - ${item.order_date}`);
      } else if (year >= 2019) {
        validCount++;
      }
    });
    
    console.log('\n📅 Distribuição por ano:');
    Object.entries(dateStats).sort().forEach(([year, count]) => {
      const status = year >= 2026 ? '❌' : year >= 2019 ? '✅' : '⚠️';
      console.log(`   ${status} ${year}: ${count} registros`);
    });
    
    if (futureCount > 0) {
      console.log(`\n❌ ERRO: ${futureCount} datas futuras encontradas!`);
      console.log('🔧 O processamento de datas ainda tem problemas.');
      return;
    }
    
    // 5. INSERIR NO BANCO APENAS SE DATAS ESTÃO CORRETAS
    console.log(`\n💾 Inserindo ${validCount} registros válidos no banco...`);
    
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < result.data.length; i += batchSize) {
      const batch = result.data.slice(i, i + batchSize);
      
      try {
        const { error } = await supabase
          .from('service_orders')
          .upsert(batch, {
            onConflict: 'order_number'
          });

        if (error) {
          console.error(`❌ Erro no batch ${Math.floor(i/batchSize) + 1}:`, error);
        } else {
          insertedCount += batch.length;
          console.log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} registros`);
        }
      } catch (err) {
        console.error(`❌ Erro no batch ${Math.floor(i/batchSize) + 1}:`, err);
      }
    }
    
    // 6. VERIFICAÇÃO FINAL
    const { count } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n🎉 PROCESSAMENTO CONCLUÍDO!`);
    console.log(`📊 Total no banco: ${count} registros`);
    
    // Verificar distribuição final no banco
    const { data: finalData } = await supabase
      .from('service_orders')
      .select('order_date')
      .order('order_date', { ascending: true });
    
    const finalYearStats = {};
    finalData.forEach(row => {
      const year = new Date(row.order_date).getFullYear();
      finalYearStats[year] = (finalYearStats[year] || 0) + 1;
    });
    
    console.log('\n📅 Distribuição final no banco:');
    Object.entries(finalYearStats).sort().forEach(([year, count]) => {
      const status = year >= 2026 ? '❌ ERRO' : year >= 2019 ? '✅' : '⚠️ ANTIGO';
      console.log(`   ${status} ${year}: ${count} registros`);
    });
    
    // Verificar se devemos ter ~2519 registros conforme documentação
    if (count < 2000) {
      console.log(`\n⚠️ ATENÇÃO: Esperávamos ~2519 registros (conforme docs), mas temos ${count}`);
      console.log('🔍 Pode haver problema no filtro de datas ou na planilha original');
    } else {
      console.log(`\n✅ SUCESSO: ${count} registros processados corretamente!`);
    }
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('❌ Stack:', error.stack);
  }
}

fixDataProcessing();