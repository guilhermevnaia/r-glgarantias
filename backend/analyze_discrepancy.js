const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function analyzeDiscrepancy() {
  console.log('=== ANÁLISE DA DISCREPÂNCIA ===');
  
  // 1. Contar total atual no banco
  const { count: totalCurrent } = await supabase
    .from('service_orders')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Total atual no banco: ${totalCurrent}`);
  
  // 2. Buscar registros anteriores vs recentes
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  
  const { count: recentCount } = await supabase
    .from('service_orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyMinutesAgo);
  
  const oldCount = totalCurrent - recentCount;
  
  console.log(`Registros antigos (antes dos últimos 30 min): ${oldCount}`);
  console.log(`Registros novos (últimos 30 min): ${recentCount}`);
  
  // 3. Verificar se houve limpeza do banco
  const { data: oldestRecord } = await supabase
    .from('service_orders')
    .select('created_at')
    .order('created_at', { ascending: true })
    .limit(1);
  
  const { data: newestRecord } = await supabase
    .from('service_orders')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1);
  
  console.log('\\n=== HISTÓRICO DE CRIAÇÃO ===');
  if (oldestRecord && oldestRecord[0]) {
    console.log(`Registro mais antigo: ${oldestRecord[0].created_at}`);
  }
  if (newestRecord && newestRecord[0]) {
    console.log(`Registro mais recente: ${newestRecord[0].created_at}`);
  }
  
  // 4. Verificar se há padrão nos registros antigos
  if (oldCount > 0) {
    const { data: oldRecords } = await supabase
      .from('service_orders')
      .select('order_number, created_at')
      .lt('created_at', thirtyMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('\\n=== AMOSTRA DE REGISTROS ANTIGOS ===');
    if (oldRecords) {
      oldRecords.forEach((record, i) => {
        console.log(`${i+1}: OS ${record.order_number} - Criado: ${record.created_at}`);
      });
    }
  } else {
    console.log('\\n⚠️ POSSÍVEL CAUSA: O banco foi limpo recentemente!');
    console.log('Todos os registros no banco foram criados nos últimos 30 minutos.');
    console.log('Isso explicaria por que os dados da planilha foram inseridos como "novos".');
  }
}

analyzeDiscrepancy();