const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function forceDivisionAllRecords() {
  console.log('🔧 FORÇANDO DIVISÃO POR 2 EM TODOS OS REGISTROS COM PEÇAS');
  
  // Primeiro, vamos ver o status atual
  console.log('\n📊 ANALISANDO STATUS ATUAL...');
  
  const { data: allWithParts } = await supabase
    .from('service_orders')
    .select('id, order_number, parts_total, original_parts_value')
    .gt('parts_total', 0);
  
  console.log(`Total de registros com peças: ${allWithParts.length}`);
  
  // Categorizar registros
  let needsDivision = 0;
  let alreadyDivided = 0;
  let noOriginalValue = 0;
  
  const toCorrect = [];
  
  allWithParts.forEach(record => {
    if (!record.original_parts_value || record.original_parts_value === 0) {
      // Se não tem original_parts_value, assumir que parts_total precisa ser dividido
      noOriginalValue++;
      toCorrect.push({
        id: record.id,
        order_number: record.order_number,
        current_parts_total: record.parts_total,
        new_parts_total: record.parts_total / 2,
        original_parts_value: record.parts_total // Definir como valor original
      });
    } else if (record.parts_total === record.original_parts_value) {
      // Se parts_total = original_parts_value, precisa dividir
      needsDivision++;
      toCorrect.push({
        id: record.id,
        order_number: record.order_number,
        current_parts_total: record.parts_total,
        new_parts_total: record.parts_total / 2,
        original_parts_value: record.original_parts_value
      });
    } else {
      // Já foi dividido
      alreadyDivided++;
    }
  });
  
  console.log(`\n📊 CLASSIFICAÇÃO DOS REGISTROS:`);
  console.log(`   Já com divisão aplicada: ${alreadyDivided}`);
  console.log(`   Precisam de divisão: ${needsDivision}`);
  console.log(`   Sem valor original: ${noOriginalValue}`);
  console.log(`   TOTAL A CORRIGIR: ${toCorrect.length}`);
  
  if (toCorrect.length === 0) {
    console.log('✅ Todos os registros já estão corretos!');
    return;
  }
  
  console.log('\n🔄 APLICANDO DIVISÃO POR 2...');
  
  let correctedCount = 0;
  const batchSize = 100;
  
  for (let i = 0; i < toCorrect.length; i += batchSize) {
    const batch = toCorrect.slice(i, i + batchSize);
    
    console.log(`📦 Processando batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(toCorrect.length/batchSize)} (${batch.length} registros)`);
    
    for (const record of batch) {
      const updateData = {
        parts_total: record.new_parts_total
      };
      
      // Se não tinha original_parts_value, definir agora
      if (!record.original_parts_value || record.original_parts_value === 0) {
        updateData.original_parts_value = record.current_parts_total;
      }
      
      const { error } = await supabase
        .from('service_orders')
        .update(updateData)
        .eq('id', record.id);
      
      if (error) {
        console.error(`❌ Erro ao corrigir OS ${record.order_number}:`, error.message);
      } else {
        correctedCount++;
        if (correctedCount <= 10) {
          console.log(`✅ OS ${record.order_number}: ${record.current_parts_total} → ${record.new_parts_total}`);
        }
      }
    }
    
    console.log(`   Progresso: ${correctedCount}/${toCorrect.length}`);
  }
  
  console.log(`\n🎯 CORREÇÃO MASSIVA CONCLUÍDA:`);
  console.log(`   Total corrigido: ${correctedCount}`);
  console.log(`   Erros: ${toCorrect.length - correctedCount}`);
  
  // Verificação final
  console.log('\n🔍 VERIFICAÇÃO FINAL...');
  const { data: finalCheck } = await supabase
    .from('service_orders')
    .select('order_number, parts_total, original_parts_value')
    .gt('parts_total', 0)
    .limit(10);
  
  let allCorrectNow = true;
  
  if (finalCheck) {
    finalCheck.forEach(record => {
      const divisionApplied = record.original_parts_value && 
                            (Math.abs(record.parts_total * 2 - record.original_parts_value) < 0.01);
      
      if (!divisionApplied) allCorrectNow = false;
      
      console.log(`OS ${record.order_number}: ${record.parts_total} (orig: ${record.original_parts_value}) ${divisionApplied ? '✅' : '❌'}`);
    });
  }
  
  console.log(`\n📊 RESULTADO FINAL: ${allCorrectNow ? '✅ TODOS CORRETOS!' : '❌ AINDA HÁ PROBLEMAS'}`);
  console.log('🎯 Frontend agora deve mostrar TODOS os valores com divisão por 2!');
}

forceDivisionAllRecords();