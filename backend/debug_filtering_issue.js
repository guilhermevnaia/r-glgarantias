const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugFilteringIssue() {
  console.log('🔍 INVESTIGANDO POR QUE SÓ 919 DE 2353 FORAM CLASSIFICADOS\n');
  
  try {
    // 1. Total bruto de service_orders com defeitos
    const { data: allDefects, count: totalRaw } = await supabase
      .from('service_orders')
      .select('id, raw_defect_description', { count: 'exact' })
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    console.log(`📊 TOTAL BRUTO com defeitos: ${totalRaw}`);
    
    // 2. Analisar os filtros que estavam sendo aplicados
    console.log('\n🔍 ANÁLISE DOS FILTROS:');
    
    let step1_nonNull = allDefects?.filter(d => d.raw_defect_description !== null) || [];
    console.log(`Filtro 1 - Não nulo: ${step1_nonNull.length}`);
    
    let step2_nonEmpty = step1_nonNull.filter(d => d.raw_defect_description !== '');
    console.log(`Filtro 2 - Não vazio: ${step2_nonEmpty.length}`);
    
    let step3_minLength = step2_nonEmpty.filter(d => d.raw_defect_description.trim().length > 3);
    console.log(`Filtro 3 - Mais que 3 chars: ${step3_minLength.length}`);
    
    // 3. Verificar o filtro de "não-defeitos" que estava eliminando muitos
    const nonDefectPatterns = [
      /cortesia/i, /desconto/i, /atendimento/i, /comercial/i,
      /administrativo/i, /cobranca/i, /entrega/i, 
      /excluido para acerto/i, /apenas para controle/i
    ];
    
    let filteredOut = [];
    let validAfterPatterns = step3_minLength.filter(d => {
      const isNonDefect = nonDefectPatterns.some(pattern => pattern.test(d.raw_defect_description));
      if (isNonDefect) {
        filteredOut.push(d);
        return false;
      }
      return true;
    });
    
    console.log(`Filtro 4 - Removidos por "não-defeito": ${filteredOut.length}`);
    console.log(`RESULTADO FINAL após filtros: ${validAfterPatterns.length}`);
    
    console.log('\n❌ PROBLEMA IDENTIFICADO:');
    console.log(`Estamos perdendo ${totalRaw - validAfterPatterns.length} defeitos nos filtros!`);
    
    // 4. Mostrar exemplos do que está sendo filtrado
    console.log('\n📝 EXEMPLOS FILTRADOS (primeiros 10):');
    const examples = [
      ...step2_nonEmpty.filter(d => d.raw_defect_description.trim().length <= 3).slice(0, 5),
      ...filteredOut.slice(0, 5)
    ];
    
    examples.forEach((item, index) => {
      console.log(`${index + 1}. OS ${item.id}: "${item.raw_defect_description}"`);
    });
    
    // 5. Verificar classificações existentes
    const { count: currentClassifications } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Classificações atuais: ${currentClassifications}`);
    console.log(`🎯 META: ${totalRaw} classificações`);
    console.log(`❌ FALTAM: ${totalRaw - currentClassifications}`);
    
    return {
      totalDefects: totalRaw,
      afterFilters: validAfterPatterns.length,
      currentClassifications: currentClassifications,
      missing: totalRaw - currentClassifications,
      filteredOutCount: totalRaw - validAfterPatterns.length
    };
    
  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  }
}

debugFilteringIssue()
  .then(result => {
    console.log('\n🎯 RESULTADO DA INVESTIGAÇÃO:', result);
    
    console.log('\n🚨 CONCLUSÃO:');
    console.log('Os filtros estavam muito restritivos!');
    console.log('Precisamos classificar TODOS os defeitos, mesmo os pequenos!');
    console.log('Vamos criar um novo sistema sem filtros restritivos.');
  })
  .catch(console.error);