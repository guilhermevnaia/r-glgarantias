const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findOverlap() {
  console.log('=== PROCURANDO OVERLAP ENTRE DADOS ANTIGOS E NOVOS ===');
  
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  
  // Buscar OSs antigas (antes de 30 min)
  const { data: oldRecords } = await supabase
    .from('service_orders')
    .select('order_number')
    .lt('created_at', thirtyMinutesAgo);
  
  // Buscar OSs novas (últimos 30 min)
  const { data: newRecords } = await supabase
    .from('service_orders')
    .select('order_number')
    .gte('created_at', thirtyMinutesAgo);
  
  if (!oldRecords || !newRecords) {
    console.log('Erro ao buscar dados');
    return;
  }
  
  const oldOrderNumbers = new Set(oldRecords.map(r => r.order_number));
  const newOrderNumbers = new Set(newRecords.map(r => r.order_number));
  
  console.log(`Ordens antigas únicas: ${oldOrderNumbers.size}`);
  console.log(`Ordens novas únicas: ${newOrderNumbers.size}`);
  
  // Encontrar intersecção
  const overlap = [];
  for (const orderNum of newOrderNumbers) {
    if (oldOrderNumbers.has(orderNum)) {
      overlap.push(orderNum);
    }
  }
  
  console.log(`\\n=== RESULTADO ===`);
  console.log(`OSs que existiam antes E foram inseridas novamente: ${overlap.length}`);
  
  if (overlap.length > 0) {
    console.log('\\n⚠️ PROBLEMA ENCONTRADO!');
    console.log('As seguintes OSs já existiam mas foram inseridas novamente:');
    overlap.slice(0, 10).forEach((orderNum, i) => {
      console.log(`${i+1}: OS ${orderNum}`);
    });
    
    console.log('\\n🔍 POSSÍVEIS CAUSAS:');
    console.log('1. Sistema de detecção de duplicatas falhou');
    console.log('2. Diferentes formatos de número de OS (ex: "095743" vs "95743")');
    console.log('3. Query de verificação não funcionou corretamente');
  } else {
    console.log('\\n✅ NENHUM OVERLAP ENCONTRADO');
    console.log('Isso significa que:');
    console.log('1. A planilha continha OSs realmente novas, OU');
    console.log('2. O banco foi parcialmente limpo antes do upload, OU');
    console.log('3. A planilha tinha dados diferentes dos que estavam no banco');
  }
  
  // Verificar amostra de números de OS para formatação
  console.log('\\n=== VERIFICAÇÃO DE FORMATO ===');
  const sampleOld = Array.from(oldOrderNumbers).slice(0, 5);
  const sampleNew = Array.from(newOrderNumbers).slice(0, 5);
  
  console.log('Formato OSs antigas:', sampleOld);
  console.log('Formato OSs novas:', sampleNew);
}

findOverlap();