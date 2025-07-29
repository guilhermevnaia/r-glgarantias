const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔧 LIMPEZA FINAL DOS DADOS - SISTEMA LÚCIO');
console.log('🎯 Objetivo: Remover datas futuras e manter apenas 2019-2025');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function finalCleanup() {
  try {
    // 1. VERIFICAR DADOS ATUAIS
    console.log('\n📊 Verificando dados atuais...');
    const { count: totalCount } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Total atual: ${totalCount} registros`);
    
    // 2. IDENTIFICAR DATAS FUTURAS (>= 2026)
    console.log('\n🔍 Identificando datas futuras...');
    const { data: futureRecords, count: futureCount } = await supabase
      .from('service_orders')
      .select('id, order_number, order_date', { count: 'exact' })
      .gte('order_date', '2026-01-01');
    
    console.log(`Registros com datas futuras (>= 2026): ${futureCount}`);
    
    if (futureCount > 0) {
      console.log('📋 Primeiros 10 registros com datas futuras:');
      futureRecords.slice(0, 10).forEach(record => {
        console.log(`   ${record.order_number} - ${record.order_date}`);
      });
      
      // 3. REMOVER DATAS FUTURAS
      console.log(`\n🗑️ Removendo ${futureCount} registros com datas futuras...`);
      const { error: deleteError } = await supabase
        .from('service_orders')
        .delete()
        .gte('order_date', '2026-01-01');
      
      if (deleteError) {
        console.error('❌ Erro ao remover datas futuras:', deleteError);
        return;
      }
      
      console.log('✅ Datas futuras removidas com sucesso!');
    }
    
    // 4. VERIFICAR DADOS FINAIS
    console.log('\n📊 Verificando dados finais...');
    const { count: finalCount } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true });
    
    const { data: yearData } = await supabase
      .from('service_orders')
      .select('order_date')
      .order('order_date');
    
    const yearStats = {};
    yearData.forEach(row => {
      const year = new Date(row.order_date).getFullYear();
      yearStats[year] = (yearStats[year] || 0) + 1;
    });
    
    console.log(`\nTotal final: ${finalCount} registros`);
    console.log('\n📅 Distribuição final por ano:');
    Object.entries(yearStats).sort().forEach(([year, count]) => {
      const status = year >= 2026 ? '❌ FUTURO' : year >= 2019 ? '✅ VÁLIDO' : '⚠️ ANTIGO';
      console.log(`   ${status} ${year}: ${count} registros`);
    });
    
    // 5. VERIFICAR PRIMEIROS E ÚLTIMOS REGISTROS
    const { data: firstRecords } = await supabase
      .from('service_orders')
      .select('order_number, order_date, order_status')
      .order('order_date')
      .limit(3);
    
    const { data: lastRecords } = await supabase
      .from('service_orders')
      .select('order_number, order_date, order_status')
      .order('order_date', { ascending: false })
      .limit(3);
    
    console.log('\n📅 Primeiros registros:');
    firstRecords.forEach(r => console.log(`   ${r.order_number} - ${r.order_date} - ${r.order_status}`));
    
    console.log('\n📅 Últimos registros:');
    lastRecords.forEach(r => console.log(`   ${r.order_number} - ${r.order_date} - ${r.order_status}`));
    
    // 6. COMPARAR COM DOCUMENTAÇÃO
    const expectedCount = 2519;
    const difference = Math.abs(finalCount - expectedCount);
    
    if (difference <= 100) {
      console.log(`\n✅ SUCESSO! ${finalCount} registros estão próximos dos ${expectedCount} esperados (diferença: ${difference})`);
    } else {
      console.log(`\n⚠️ ATENÇÃO: ${finalCount} registros diferem significativamente dos ${expectedCount} esperados (diferença: ${difference})`);
    }
    
    // Verificar se ainda há datas futuras
    const { count: remainingFuture } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .gte('order_date', '2026-01-01');
    
    if (remainingFuture === 0) {
      console.log('\n🎉 LIMPEZA CONCLUÍDA COM SUCESSO!');
      console.log('✅ Não há mais datas futuras no banco');
      console.log(`✅ Total de ${finalCount} registros válidos`);
      console.log('✅ Dados prontos para uso no dashboard');
    } else {
      console.log(`\n❌ Ainda há ${remainingFuture} registros com datas futuras`);
    }
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
  }
}

finalCleanup();