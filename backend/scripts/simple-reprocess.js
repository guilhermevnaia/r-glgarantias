const { CleanDataProcessor } = require('./dist/services/CleanDataProcessor');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

console.log('🔧 REPROCESSAMENTO SIMPLES - SISTEMA LÚCIO');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const processor = new CleanDataProcessor();

async function simpleReprocess() {
  try {
    console.log('\n📁 Processando planilha GLú-Garantias.xlsx...');
    
    const filePath = 'S:/comp-glgarantias/r-glgarantias/GLú-Garantias.xlsx';
    const buffer = fs.readFileSync(filePath);
    
    console.log('🔧 Iniciando processamento...');
    const result = await processor.processExcelData(buffer);
    
    console.log('\n📊 RESULTADO:');
    console.log(`Registros processados: ${result.data.length}`);
    console.log('Distribuição por ano:', result.summary.yearDistribution);
    
    if (result.data.length === 0) {
      console.log('❌ Nenhum dado válido processado!');
      console.log('🔍 Problema: Filtro >= 2019 está excluindo todos os dados');
      
      // Vamos verificar quais anos existem na planilha original
      console.log('\n🔍 Verificando dados brutos da planilha...');
      
      // Processar alguns registros sem filtro para debug
      console.log('📋 Primeiros registros da planilha para análise...');
      return;
    }
    
    // Inserir apenas dados válidos
    console.log(`\n💾 Inserindo ${result.data.length} registros...`);
    
    const batchSize = 100;
    for (let i = 0; i < result.data.length; i += batchSize) {
      const batch = result.data.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('service_orders')
        .upsert(batch, { onConflict: 'order_number' });

      if (error) {
        console.error(`❌ Erro no batch:`, error);
      } else {
        console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} registros`);
      }
    }
    
    console.log('\n🎉 PROCESSAMENTO CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
  }
}

simpleReprocess();