const { CleanDataProcessor } = require('./dist/services/CleanDataProcessor');
const fs = require('fs');

console.log('🧪 Testando processamento direto da planilha...');

const processor = new CleanDataProcessor();

async function testDirect() {
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
      console.log('\n📋 Primeiro registro processado:');
      console.log(JSON.stringify(result.data[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('❌ Stack:', error.stack);
  }
}

testDirect();