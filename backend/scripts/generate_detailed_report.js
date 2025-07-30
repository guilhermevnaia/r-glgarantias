const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function generateDetailedReport() {
  console.log('='.repeat(60));
  console.log('📊 RELATÓRIO DETALHADO - PROCESSAMENTO PLANILHA GLÚ-GARANTIAS');
  console.log('='.repeat(60));
  
  // 1. TOTAIS GERAIS
  const { count: totalRecords } = await supabase
    .from('service_orders')
    .select('*', { count: 'exact', head: true });
  
  console.log('\n🎯 TOTAIS GERAIS:');
  console.log(`   Total de registros processados: ${totalRecords}`);
  
  // 2. DISTRIBUIÇÃO POR STATUS
  console.log('\n📋 DISTRIBUIÇÃO POR STATUS:');
  const { data: statusData } = await supabase
    .from('service_orders')
    .select('order_status');
  
  const statusCount = {};
  statusData.forEach(row => {
    statusCount[row.order_status] = (statusCount[row.order_status] || 0) + 1;
  });
  
  Object.keys(statusCount).sort().forEach(status => {
    const percentage = ((statusCount[status] / totalRecords) * 100).toFixed(1);
    console.log(`   ${status}: ${statusCount[status]} registros (${percentage}%)`);
  });
  
  // 3. DISTRIBUIÇÃO POR ANO
  console.log('\n📅 DISTRIBUIÇÃO POR ANO:');
  const { data: dateData } = await supabase
    .from('service_orders')
    .select('order_date');
  
  const yearCount = {};
  dateData.forEach(row => {
    const year = new Date(row.order_date).getFullYear();
    yearCount[year] = (yearCount[year] || 0) + 1;
  });
  
  Object.keys(yearCount).sort().forEach(year => {
    const percentage = ((yearCount[year] / totalRecords) * 100).toFixed(1);
    console.log(`   ${year}: ${yearCount[year]} registros (${percentage}%)`);
  });
  
  // 4. DISTRIBUIÇÃO POR MÊS DO ANO MAIS RECENTE
  const latestYear = Math.max(...Object.keys(yearCount).map(Number));
  console.log(`\n📆 DISTRIBUIÇÃO POR MÊS EM ${latestYear}:`);
  
  const { data: monthData } = await supabase
    .from('service_orders')
    .select('order_date')
    .gte('order_date', `${latestYear}-01-01`)
    .lt('order_date', `${latestYear + 1}-01-01`);
  
  const monthCount = {};
  monthData.forEach(row => {
    const month = new Date(row.order_date).getMonth() + 1;
    monthCount[month] = (monthCount[month] || 0) + 1;
  });
  
  const monthNames = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  Object.keys(monthCount).sort((a, b) => a - b).forEach(month => {
    console.log(`   ${monthNames[month]}: ${monthCount[month]} registros`);
  });
  
  // 5. ANÁLISE DE CÁLCULOS
  console.log('\n🧮 ANÁLISE DE CÁLCULOS:');
  const { count: calcCorrect } = await supabase
    .from('service_orders')
    .select('*', { count: 'exact', head: true })
    .eq('calculation_verified', true);
  
  const { count: calcIncorrect } = await supabase
    .from('service_orders')
    .select('*', { count: 'exact', head: true })
    .eq('calculation_verified', false);
  
  const calcCorrectPerc = ((calcCorrect / totalRecords) * 100).toFixed(1);
  const calcIncorrectPerc = ((calcIncorrect / totalRecords) * 100).toFixed(1);
  
  console.log(`   Cálculos corretos: ${calcCorrect} registros (${calcCorrectPerc}%)`);
  console.log(`   Cálculos incorretos: ${calcIncorrect} registros (${calcIncorrectPerc}%)`);
  
  // 6. RANGE DE DATAS
  console.log('\n📊 RANGE DE DATAS:');
  const { data: dateRange } = await supabase
    .from('service_orders')
    .select('order_date')
    .order('order_date', { ascending: true });
  
  const firstDate = dateRange[0].order_date;
  const lastDate = dateRange[dateRange.length - 1].order_date;
  
  console.log(`   Data mais antiga: ${firstDate}`);
  console.log(`   Data mais recente: ${lastDate}`);
  
  // 7. TOP 10 FABRICANTES
  console.log('\n🏭 TOP 10 FABRICANTES DE MOTORES:');
  const { data: manufacturerData } = await supabase
    .from('service_orders')
    .select('engine_manufacturer');
  
  const manufacturerCount = {};
  manufacturerData.forEach(row => {
    if (row.engine_manufacturer && row.engine_manufacturer.trim()) {
      const mfg = row.engine_manufacturer.trim().toUpperCase();
      manufacturerCount[mfg] = (manufacturerCount[mfg] || 0) + 1;
    }
  });
  
  Object.entries(manufacturerCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([mfg, count], index) => {
      const percentage = ((count / totalRecords) * 100).toFixed(1);
      console.log(`   ${index + 1}. ${mfg}: ${count} registros (${percentage}%)`);
    });
  
  // 8. TOP 10 MECÂNICOS
  console.log('\n👨‍🔧 TOP 10 MECÂNICOS RESPONSÁVEIS:');
  const { data: mechanicData } = await supabase
    .from('service_orders')
    .select('responsible_mechanic');
  
  const mechanicCount = {};
  mechanicData.forEach(row => {
    if (row.responsible_mechanic && row.responsible_mechanic.trim()) {
      const mechanic = row.responsible_mechanic.trim().toUpperCase();
      mechanicCount[mechanic] = (mechanicCount[mechanic] || 0) + 1;
    }
  });
  
  Object.entries(mechanicCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([mechanic, count], index) => {
      const percentage = ((count / totalRecords) * 100).toFixed(1);
      console.log(`   ${index + 1}. ${mechanic}: ${count} registros (${percentage}%)`);
    });
  
  // 9. ANÁLISE DE VALORES
  console.log('\n💰 ANÁLISE DE VALORES:');
  const { data: valueData } = await supabase
    .from('service_orders')
    .select('parts_total, labor_total, grand_total');
  
  const partsTotals = valueData.map(r => r.parts_total || 0).filter(v => v > 0);
  const laborTotals = valueData.map(r => r.labor_total || 0).filter(v => v > 0);
  const grandTotals = valueData.map(r => r.grand_total || 0).filter(v => v > 0);
  
  const avgParts = partsTotals.reduce((a, b) => a + b, 0) / partsTotals.length;
  const avgLabor = laborTotals.reduce((a, b) => a + b, 0) / laborTotals.length;
  const avgGrand = grandTotals.reduce((a, b) => a + b, 0) / grandTotals.length;
  
  console.log(`   Valor médio de peças: R$ ${avgParts.toFixed(2)}`);
  console.log(`   Valor médio de serviços: R$ ${avgLabor.toFixed(2)}`);
  console.log(`   Valor médio total: R$ ${avgGrand.toFixed(2)}`);
  
  // 10. RESUMO FINAL
  console.log('\n' + '='.repeat(60));
  console.log('📋 RESUMO EXECUTIVO:');
  console.log('='.repeat(60));
  console.log(`✅ Total processado: ${totalRecords} registros`);
  console.log(`📅 Período: ${firstDate} a ${lastDate}`);
  console.log(`📊 Status mais comum: ${Object.keys(statusCount).reduce((a, b) => statusCount[a] > statusCount[b] ? a : b)} (${Math.max(...Object.values(statusCount))} registros)`);
  console.log(`🧮 Cálculos corretos: ${calcCorrectPerc}%`);
  console.log(`🏭 Principal fabricante: ${Object.keys(manufacturerCount).reduce((a, b) => manufacturerCount[a] > manufacturerCount[b] ? a : b)}`);
  console.log('='.repeat(60));
}

generateDetailedReport();