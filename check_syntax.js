const fs = require('fs');

function analyzeSyntax(filePath) {
  console.log(`Analisando ${filePath}...`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let parenCount = 0;
  let braceCount = 0;
  let bracketCount = 0;
  let issues = [];
  
  lines.forEach((line, i) => {
    for (let char of line) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      if (char === '[') bracketCount++;
      if (char === ']') bracketCount--;
    }
    
    // Verificar linha específica com problema
    if (i === 924) { // linha 925 (0-indexed)
      console.log(`\nLinha 925 (problemática): "${line.trim()}"`);
      console.log(`Contadores na linha 925: paren=${parenCount}, brace=${braceCount}, bracket=${bracketCount}`);
    }
    
    // Verificar linhas ao redor
    if (i >= 920 && i <= 928) {
      const lineNum = i + 1;
      console.log(`Linha ${lineNum}: paren=${parenCount}, brace=${braceCount} | ${line.trim()}`);
    }
  });
  
  console.log('\nContadores finais:');
  console.log('Parênteses:', parenCount);
  console.log('Chaves:', braceCount);
  console.log('Colchetes:', bracketCount);
  
  if (parenCount !== 0) issues.push(`${parenCount} parênteses não fechados`);
  if (braceCount !== 0) issues.push(`${braceCount} chaves não fechadas`);
  if (bracketCount !== 0) issues.push(`${bracketCount} colchetes não fechados`);
  
  return issues;
}

// Analisar Defects.tsx
const issues = analyzeSyntax('frontend/src/pages/Defects.tsx');

console.log('\n=== RESULTADO ===');
if (issues.length === 0) {
  console.log('✅ Nenhum problema de sintaxe detectado');
} else {
  console.log('❌ Problemas encontrados:');
  issues.forEach(issue => console.log(`  - ${issue}`));
}