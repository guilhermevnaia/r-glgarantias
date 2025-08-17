const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function forceClassify42093() {
  console.log('🎯 FORÇANDO CLASSIFICAÇÃO DO REGISTRO 42093...');
  
  // 1. Verificar o registro
  const { data: order } = await supabase
    .from('service_orders')
    .select('id, order_number, raw_defect_description')
    .eq('id', 42093)
    .single();

  if (!order) {
    console.log('❌ Registro 42093 não encontrado!');
    return;
  }

  console.log(`📋 OS ${order.order_number}: ${order.raw_defect_description}`);

  // 2. Buscar categoria de Vazamentos
  const { data: category } = await supabase
    .from('defect_categories')
    .select('*')
    .eq('category_name', 'Vazamentos')
    .single();

  if (!category) {
    console.log('❌ Categoria Vazamentos não encontrada!');
    return;
  }

  console.log(`🏷️ Categoria encontrada: ${category.category_name} (${category.color_hex})`);

  // 3. Verificar se já existe classificação
  const { data: existing } = await supabase
    .from('defect_classifications')
    .select('*')
    .eq('service_order_id', 42093);

  if (existing && existing.length > 0) {
    console.log('⚠️ Já existe classificação! Removendo primeira...');
    await supabase
      .from('defect_classifications')
      .delete()
      .eq('service_order_id', 42093);
  }

  // 4. Criar nova classificação
  const { data: newClassification, error } = await supabase
    .from('defect_classifications')
    .insert({
      service_order_id: 42093,
      category_id: category.id,
      ai_confidence: 0.95,
      ai_reasoning: 'Classificação manual forçada - defeito claramente relacionado a vazamento',
      original_defect_description: order.raw_defect_description
    })
    .select(`
      *,
      defect_categories (
        category_name,
        color_hex
      )
    `);

  if (error) {
    console.error('❌ Erro ao criar classificação:', error);
    return;
  }

  console.log('✅ CLASSIFICAÇÃO CRIADA COM SUCESSO!');
  console.log('📊 Detalhes:', JSON.stringify(newClassification, null, 2));

  // 5. Verificar se agora aparece na API
  console.log('\n🧪 TESTANDO API APÓS CLASSIFICAÇÃO...');
  const { data: apiTest } = await supabase
    .from('service_orders')
    .select(`
      id,
      order_number,
      raw_defect_description,
      defect_classifications (
        id,
        category_id,
        ai_confidence,
        defect_categories (
          category_name,
          color_hex
        )
      )
    `)
    .eq('id', 42093);

  if (apiTest && apiTest.length > 0) {
    const testResult = apiTest[0];
    console.log('🎯 Resultado da API:');
    console.log(`   OS: ${testResult.order_number}`);
    console.log(`   Classifications: ${testResult.defect_classifications?.length || 0}`);
      
    if (testResult.defect_classifications && testResult.defect_classifications.length > 0) {
      const cl = testResult.defect_classifications[0];
      console.log(`   ✅ Categoria: ${cl.defect_categories?.category_name}`);
      console.log(`   🎯 Confiança: ${(cl.ai_confidence * 100).toFixed(1)}%`);
    }
  }
}

forceClassify42093();