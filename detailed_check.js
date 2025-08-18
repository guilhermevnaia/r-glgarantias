const fs = require('fs');

function findUnbalanced() {
  const content = fs.readFileSync('frontend/src/pages/Defects.tsx', 'utf8');
  const lines = content.split('\n');
  
  let parenStack = [];
  let braceStack = [];
  
  lines.forEach((line, lineIndex) => {
    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      const position = `Line ${lineIndex + 1}:${charIndex + 1}`;
      
      if (char === '(') {
        parenStack.push({ position, line: line.trim() });
      } else if (char === ')') {
        if (parenStack.length === 0) {
          console.log(`❌ ERRO: Parêntese de fechamento sem abertura em ${position}`);
          console.log(`   Linha: ${line.trim()}`);
        } else {
          parenStack.pop();
        }
      } else if (char === '{') {
        braceStack.push({ position, line: line.trim() });
      } else if (char === '}') {
        if (braceStack.length === 0) {
          console.log(`❌ ERRO: Chave de fechamento sem abertura em ${position}`);
          console.log(`   Linha: ${line.trim()}`);
        } else {
          braceStack.pop();
        }
      }
    }
  });
  
  console.log('\n=== PARÊNTESES NÃO FECHADOS ===');
  parenStack.forEach(item => {
    console.log(`❌ ${item.position}: ${item.line}`);
  });
  
  console.log('\n=== CHAVES NÃO FECHADAS ===');
  braceStack.forEach(item => {
    console.log(`❌ ${item.position}: ${item.line}`);
  });
  
  console.log(`\nTotal não fechados: ${parenStack.length} parênteses, ${braceStack.length} chaves`);
}

findUnbalanced();