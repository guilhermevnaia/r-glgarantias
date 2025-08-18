const fs = require('fs');
const path = require('path');

// Lista de arquivos que precisam ser corrigidos
const files = [
  'frontend/src/pages/Defects.tsx',
  'frontend/src/pages/ServiceOrders.tsx'
];

// Padrões de erros comuns e suas correções
const fixes = [
  // Missing closing braces for objects/functions
  {
    pattern: /(\s+)(})(\s*)$/gm,
    replacement: '$1$2;$3'
  },
  // Missing closing parentheses for toast calls
  {
    pattern: /toast\(\{([^}]+)\}\s*\n\s*(?![});])/gm,
    replacement: 'toast({$1});\n'
  },
  // Missing closing braces for fetch calls
  {
    pattern: /fetch\([^,]+,\s*\{\s*([^}]+)\s*\n\s*(?![});])/gm,
    replacement: 'fetch($1, {\n$2\n});\n'
  },
  // Fix broken function syntax
  {
    pattern: /(\s+)}(\s+)(?=const|function)/gm,
    replacement: '$1};$2'
  }
];

function fixSyntaxErrors(filePath) {
  try {
    console.log(`Analisando ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Aplicar correções
    fixes.forEach((fix, index) => {
      content = content.replace(fix.pattern, fix.replacement);
    });
    
    // Verificar se houve mudanças
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Corrigido ${filePath}`);
    } else {
      console.log(`ℹ️  Nenhuma correção automática aplicada em ${filePath}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Iniciando correção automática de erros de sintaxe...');
  
  files.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      fixSyntaxErrors(fullPath);
    } else {
      console.log(`⚠️  Arquivo não encontrado: ${fullPath}`);
    }
  });
  
  console.log('\n✅ Processo concluído!');
  console.log('Execute "npm run build" no frontend para verificar se os erros foram corrigidos.');
}

main();