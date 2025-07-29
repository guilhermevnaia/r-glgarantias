const XLSX = require('xlsx');
const fs = require('fs');

console.log('🔍 Testando leitura direta do arquivo Excel...');

// Testar os dois arquivos
const files = [
  'S:/comp-glgarantias/r-glgarantias/GLú-Garantias.xlsx',
  'S:/comp-glgarantias/r-glgarantias/GLu-Garantias-TesteReal.xlsx'
];

files.forEach((filePath, index) => {
  console.log(`\n📁 Testando arquivo ${index + 1}: ${filePath}`);
  
  try {
    // Verificar se arquivo existe
    if (!fs.existsSync(filePath)) {
      console.log('❌ Arquivo não encontrado');
      return;
    }
    
    const stats = fs.statSync(filePath);
    console.log(`📊 Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Ler arquivo como buffer
    const buffer = fs.readFileSync(filePath);
    console.log(`📦 Buffer criado: ${buffer.length} bytes`);
    
    // Tentar ler com XLSX
    console.log('🔧 Lendo com XLSX...');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    if (!workbook) {
      console.log('❌ Workbook é null/undefined');
      return;
    }
    
    console.log('✅ Workbook lido com sucesso');
    console.log('📋 Propriedades do workbook:', Object.keys(workbook));
    
    if (!workbook.Sheets) {
      console.log('❌ workbook.Sheets é undefined');
      return;
    }
    
    console.log('✅ workbook.Sheets existe');
    console.log('📋 Abas encontradas:', workbook.SheetNames);
    
    if (workbook.SheetNames.includes('Tabela')) {
      console.log('✅ Aba "Tabela" encontrada');
      
      const worksheet = workbook.Sheets['Tabela'];
      if (worksheet) {
        console.log('✅ Worksheet "Tabela" carregado');
        
        // Tentar converter primeira linha para ver headers
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        console.log(`📊 Range da planilha: ${worksheet['!ref']}`);
        console.log(`📊 Linhas: ${range.e.r + 1}, Colunas: ${range.e.c + 1}`);
        
        const firstRow = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          range: 0,
          defval: null
        })[0];
        
        console.log('📋 Headers encontrados:', firstRow.slice(0, 5), '...');
        console.log('✅ TESTE PASSOU - Arquivo pode ser lido corretamente');
      } else {
        console.log('❌ Worksheet "Tabela" é undefined');
      }
    } else {
      console.log('❌ Aba "Tabela" não encontrada');
    }
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('❌ Stack:', error.stack);
  }
});