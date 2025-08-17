const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function classifyMissingDefects() {
  console.log('🤖 CLASSIFICANDO DEFEITOS FALTANTES...');
  
  // 1. Primeiro buscar todos os defeitos sem classificação
  const { data: allOrders } = await supabase
    .from('service_orders')
    .select(`
      id,
      order_number,
      raw_defect_description,
      defect_classifications (id)
    `)
    .not('raw_defect_description', 'is', null);

  const unclassified = allOrders.filter(order => 
    !order.defect_classifications || order.defect_classifications.length === 0
  );

  console.log(`🎯 Encontrados ${unclassified.length} defeitos para classificar`);

  if (unclassified.length === 0) {
    console.log('✅ Nenhum defeito pendente de classificação!');
    return;
  }

  // 2. Buscar categorias disponíveis
  const { data: categories } = await supabase
    .from('defect_categories')
    .select('*');

  console.log(`📋 Categorias disponíveis: ${categories.length}`);

  // 3. Classificar cada defeito
  for (const order of unclassified) {
    console.log(`\n🔍 Processando OS ${order.order_number}:`);
    console.log(`   Defeito: ${order.raw_defect_description.substring(0, 60)}...`);

    // Lógica simples de classificação baseada em palavras-chave
    const defect = order.raw_defect_description.toLowerCase();
    let selectedCategory = null;
    let confidence = 0.8;

    if (defect.includes('vazamento') || defect.includes('vaza') || defect.includes('oleo')) {
      selectedCategory = categories.find(c => c.category_name === 'Vazamentos');
      confidence = 0.9;
    } else if (defect.includes('aquecimento') || defect.includes('superaquecimento')) {
      selectedCategory = categories.find(c => c.category_name === 'Superaquecimento');
      confidence = 0.85;
    } else if (defect.includes('ruido') || defect.includes('barulho') || defect.includes('som')) {
      selectedCategory = categories.find(c => c.category_name === 'Ruídos Anômalos');
      confidence = 0.8;
    } else if (defect.includes('falha') || defect.includes('funcionamento') || defect.includes('ignição')) {
      selectedCategory = categories.find(c => c.category_name === 'Falhas de Ignição');
      confidence = 0.75;
    } else if (defect.includes('consumo') || defect.includes('combustivel')) {
      selectedCategory = categories.find(c => c.category_name === 'Consumo Excessivo');
      confidence = 0.8;
    } else {
      // Categoria padrão
      selectedCategory = categories.find(c => c.category_name === 'Outros Problemas');
      confidence = 0.6;
    }

    if (selectedCategory) {
      const { data: newClassification, error } = await supabase
        .from('defect_classifications')
        .insert({
          service_order_id: order.id,
          category_id: selectedCategory.id,
          ai_confidence: confidence,
          ai_reasoning: `Classificação automática baseada em análise de palavras-chave: ${defect.substring(0, 100)}`
        })
        .select();

      if (error) {
        console.error(`   ❌ Erro ao classificar: ${error.message}`);
      } else {
        console.log(`   ✅ Classificado como: ${selectedCategory.category_name} (${(confidence * 100).toFixed(1)}%)`);
      }
    }
  }

  console.log('\n🎉 CLASSIFICAÇÃO CONCLUÍDA!');
}

classifyMissingDefects();