const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo erros de sintaxe automaticamente...');

const files = [
  'frontend/src/pages/Defects.tsx',
  'frontend/src/pages/ServiceOrders.tsx',
  'frontend/src/pages/Upload.tsx',
  'frontend/src/pages/Settings.tsx',
  'frontend/src/pages/Reports.tsx'
];

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Corrigir padrões comuns de erros de sintaxe
    content = content
      // Corrigir toast sem fechamento
      .replace(/,\s*\n\s*return;/g, '\n        });\n        return;')
      .replace(/,\s*\n\s*\}\s*catch/g, '\n        });\n      } catch')
      .replace(/,\s*\n\s*\}\s*finally/g, '\n        });\n      } finally')
      // Corrigir objetos sem fechamento
      .replace(/,\s*lastDefectDate: order\.created_at[^\}]*\n\s*\}/g, ',\n          lastDefectDate: order.created_at\n        });\n      }')
      // Corrigir parênteses soltos
      .replace(/,\s*\n\s*setEngineStats/g, '\n      });\n      setEngineStats');
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Corrigido: ${filePath}`);
  } else {
    console.log(`⚠️ Arquivo não encontrado: ${filePath}`);
  }
});

console.log('🎉 Correções aplicadas!');