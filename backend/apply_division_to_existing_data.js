const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function applyDivisionToExistingData() {
  console.log('🔧 APLICANDO DIVISÃO POR 2 AOS DADOS EXISTENTES');
  
  // Buscar todos os registros onde parts_total = original_parts_value (ou seja, não foi aplicada divisão)
  const { data: recordsToFix } = await supabase
    .from('service_orders')
    .select('id, order_number, parts_total, original_parts_value, labor_total, grand_total')
    .neq('parts_total', 0); // Apenas registros com peças
  
  if (!recordsToFix) {
    console.log('❌ Erro ao buscar dados');
    return;
  }
  
  // Filtrar registros que precisam de correção
  const needsCorrection = recordsToFix.filter(record => {
    // Se parts_total = original_parts_value, significa que não foi aplicada divisão
    return record.original_parts_value && 
           (record.parts_total === record.original_parts_value);
  });
  
  console.log(`📊 Encontrados ${needsCorrection.length} registros que precisam de divisão por 2`);
  
  if (needsCorrection.length === 0) {
    console.log('✅ Todos os registros já têm a divisão aplicada!');
    return;
  }
  
  console.log('🔄 Aplicando divisão por 2...');
  
  let correctedCount = 0;
  const batchSize = 50;
  
  for (let i = 0; i < needsCorrection.length; i += batchSize) {
    const batch = needsCorrection.slice(i, i + batchSize);
    
    console.log(`📦 Processando batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(needsCorrection.length/batchSize)}`);
    
    for (const record of batch) {
      const newPartsTotal = record.parts_total / 2;
      
      const { error } = await supabase
        .from('service_orders')
        .update({
          parts_total: newPartsTotal
          // Mantém original_parts_value como está (valor original)
        })
        .eq('id', record.id);
      
      if (error) {
        console.error(`❌ Erro ao corrigir OS ${record.order_number}:`, error.message);
      } else {
        correctedCount++;
        if (correctedCount <= 5) {
          console.log(`✅ OS ${record.order_number}: ${record.parts_total} → ${newPartsTotal}`);
        }
      }
    }
  }
  
  console.log(`\n🎯 CORREÇÃO CONCLUÍDA:`);
  console.log(`   Registros corrigidos: ${correctedCount}`);
  console.log(`   Erros: ${needsCorrection.length - correctedCount}`);
  
  // Verificar alguns registros após correção
  console.log('\n🔍 VERIFICAÇÃO PÓS-CORREÇÃO:');
  const { data: verificationSample } = await supabase
    .from('service_orders')
    .select('order_number, parts_total, original_parts_value, labor_total, grand_total')
    .neq('parts_total', 0)
    .limit(3);
  
  if (verificationSample) {
    verificationSample.forEach(record => {
      const divisionApplied = record.original_parts_value && 
                            (Math.abs(record.parts_total * 2 - record.original_parts_value) < 0.01);
      console.log(`OS ${record.order_number}:`);
      console.log(`   parts_total: ${record.parts_total}`);
      console.log(`   original_parts_value: ${record.original_parts_value}`);
      console.log(`   Divisão aplicada: ${divisionApplied ? '✅' : '❌'}`);
    });
  }
}

applyDivisionToExistingData();