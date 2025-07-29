const { CleanDataProcessor } = require('./dist/services/CleanDataProcessor');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

console.log('🧪 Testando upload direto completo...');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const processor = new CleanDataProcessor();

async function testDirectUpload() {
  try {
    const filePath = 'S:/comp-glgarantias/r-glgarantias/GLú-Garantias.xlsx';
    console.log(`📁 Lendo arquivo: ${filePath}`);
    
    const buffer = fs.readFileSync(filePath);
    console.log(`📊 Buffer criado: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('🔧 Iniciando processamento...');
    const result = await processor.processExcelData(buffer);
    
    console.log('✅ SUCESSO! Dados processados:');
    console.log(`📊 Total de linhas processadas: ${result.data.length}`);
    console.log('📈 Summary:', result.summary);
    
    if (result.data.length > 0) {
      console.log('\n💾 Inserindo dados no Supabase...');
      
      // Processar em lotes de 100 para melhor performance
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
      
      console.log(`\n🎉 UPLOAD COMPLETO!`);
      console.log(`📊 Total inserido: ${insertedCount} registros`);
      
      // Verificar total no banco
      const { count } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true });
      
      console.log(`📈 Total no banco agora: ${count} registros`);
      
      // Verificar distribuição por ano
      const { data: yearData } = await supabase
        .from('service_orders')
        .select('order_date')
        .order('order_date', { ascending: true });
      
      const yearCounts = {};
      yearData.forEach(row => {
        const year = new Date(row.order_date).getFullYear();
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      });
      
      console.log('\n📅 Distribuição por ano:');
      Object.entries(yearCounts).sort().forEach(([year, count]) => {
        console.log(`   ${year}: ${count} registros`);
      });
    }
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('❌ Stack:', error.stack);
  }
}

testDirectUpload();