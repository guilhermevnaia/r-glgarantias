const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function explainValidationFilters() {
  console.log('🔍 EXPLICANDO OS FILTROS DE "DEFEITOS VALIDADOS"\n');
  
  try {
    // 1. TOTAL BRUTO (o que você vê na planilha)
    const { data: allRaw, count: totalRaw } = await supabase
      .from('service_orders')
      .select('id, raw_defect_description', { count: 'exact' });
    
    console.log(`📊 TOTAL BRUTO (como na planilha): ${totalRaw}`);
    
    // 2. Analisar cada tipo de "defeito"
    let nullCount = 0;
    let emptyCount = 0;
    let veryShortCount = 0;
    let validCount = 0;
    
    const examples = {
      null: [],
      empty: [],
      veryShort: [],
      valid: []
    };
    
    allRaw?.forEach(record => {
      const desc = record.raw_defect_description;
      
      if (desc === null) {
        nullCount++;
        if (examples.null.length < 3) examples.null.push({ id: record.id, desc: 'NULL' });
      } else if (desc === '') {
        emptyCount++;
        if (examples.empty.length < 3) examples.empty.push({ id: record.id, desc: 'VAZIO' });
      } else if (desc.trim().length <= 2) {
        veryShortCount++;
        if (examples.veryShort.length < 3) examples.veryShort.push({ id: record.id, desc: desc });
      } else {
        validCount++;
        if (examples.valid.length < 3) examples.valid.push({ id: record.id, desc: desc.substring(0, 60) });
      }
    });
    
    console.log('\n📊 BREAKDOWN DOS 2520 REGISTROS:');
    console.log('='.repeat(60));
    console.log(`❌ NULL (sem descrição): ${nullCount}`);
    console.log(`❌ VAZIOS (string vazia): ${emptyCount}`);
    console.log(`❌ MUITO CURTOS (≤2 chars): ${veryShortCount}`);
    console.log(`✅ COM CONTEÚDO REAL: ${validCount}`);
    console.log('='.repeat(60));
    console.log(`🧮 TOTAL: ${nullCount + emptyCount + veryShortCount + validCount}`);
    
    console.log('\n📝 EXEMPLOS DE CADA TIPO:');
    console.log('\n❌ NULL (sem descrição):');
    examples.null.forEach(ex => console.log(`   OS ${ex.id}: ${ex.desc}`));
    
    console.log('\n❌ VAZIOS:');
    examples.empty.forEach(ex => console.log(`   OS ${ex.id}: "${ex.desc}"`));
    
    console.log('\n❌ MUITO CURTOS:');
    examples.veryShort.forEach(ex => console.log(`   OS ${ex.id}: "${ex.desc}"`));
    
    console.log('\n✅ COM CONTEÚDO REAL:');
    examples.valid.forEach(ex => console.log(`   OS ${ex.id}: "${ex.desc}..."`));
    
    console.log('\n🎯 O QUE EU ESTAVA CHAMANDO DE "VALIDADOS":');
    console.log(`Apenas os ${validCount} registros que têm conteúdo real para classificar`);
    console.log('(Isso foi um ERRO meu - deveria classificar TODOS os 2520!)');
    
    console.log('\n🚀 SOLUÇÃO: CLASSIFICAR TODOS OS 2520 SEM EXCEÇÃO');
    console.log('Incluindo NULL, vazios, e textos curtos!');
    
    // Verificar quantos dos 2520 já foram classificados
    const { count: classified } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 STATUS ATUAL:`);
    console.log(`Total defeitos: ${totalRaw}`);
    console.log(`Já classificados: ${classified}`);
    console.log(`Faltam classificar: ${totalRaw - classified}`);
    console.log(`Cobertura: ${((classified / totalRaw) * 100).toFixed(1)}%`);
    
    return {
      total: totalRaw,
      null: nullCount,
      empty: emptyCount,
      veryShort: veryShortCount,
      valid: validCount,
      classified: classified
    };
    
  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  }
}

explainValidationFilters()
  .then(result => {
    console.log('\n🎯 RESUMO:', result);
    console.log('\n💡 AGORA VOU CLASSIFICAR TODOS OS 2520 SEM FILTROS!');
  })
  .catch(console.error);