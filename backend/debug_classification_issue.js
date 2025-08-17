const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugClassificationIssue() {
  console.log('🔍 === INVESTIGAÇÃO COMPLETA DOS PROBLEMAS DE CLASSIFICAÇÃO ===\n');
  
  try {
    // 1. Dados básicos
    console.log('1️⃣ DADOS BÁSICOS:');
    
    const { count: totalDefects } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    const { count: totalClassified } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });
    
    const { count: activeCategories } = await supabase
      .from('defect_categories')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    console.log(`   📊 Total defeitos: ${totalDefects}`);
    console.log(`   🤖 Total classificados: ${totalClassified}`);
    console.log(`   📈 Taxa de classificação: ${(totalClassified / totalDefects * 100).toFixed(1)}%`);
    console.log(`   📂 Categorias ativas: ${activeCategories}\n`);
    
    // 2. Verificar defeitos não classificados
    console.log('2️⃣ IDENTIFICANDO DEFEITOS NÃO CLASSIFICADOS:');
    
    const { data: classifiedIds } = await supabase
      .from('defect_classifications')
      .select('service_order_id');
    
    const classifiedSet = new Set((classifiedIds || []).map(c => c.service_order_id));
    
    const { data: allDefects } = await supabase
      .from('service_orders')
      .select('id, order_number, raw_defect_description')
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    const unclassified = allDefects.filter(d => classifiedSet.has(d.id) === false);
    
    console.log(`   ❌ Defeitos não classificados: ${unclassified.length}`);
    
    if (unclassified.length > 0) {
      console.log(`   📋 Primeiros 10 não classificados:`);
      unclassified.slice(0, 10).forEach((d, i) => {
        const defect = d.raw_defect_description || 'Sem descrição';
        const truncated = defect.length > 50 ? defect.substring(0, 50) + '...' : defect;
        console.log(`      ${i+1}. OS ${d.order_number}: ${truncated}`);
      });
    }
    
    console.log('');
    
    // 3. Verificar endpoint de estatísticas
    console.log('3️⃣ TESTANDO ENDPOINT DE ESTATÍSTICAS:');
    
    // Simular o que o frontend recebe
    const { data: categories } = await supabase
      .from('defect_categories')
      .select('category_name, total_occurrences, color_hex, icon')
      .eq('is_active', true)
      .order('total_occurrences', { ascending: false });
    
    console.log(`   📊 Categorias retornadas: ${categories?.length || 0}`);
    console.log(`   🏷️ Top 5 categorias:`);
    (categories || []).slice(0, 5).forEach(cat => {
      console.log(`      • ${cat.category_name}: ${cat.total_occurrences} ocorrências`);
    });
    
    console.log('');
    
    // 4. Verificar problemas no cache frontend
    console.log('4️⃣ DIAGNÓSTICO DE PROBLEMAS:');
    
    const totalFromCategories = (categories || []).reduce((sum, cat) => sum + cat.total_occurrences, 0);
    console.log(`   🧮 Soma das ocorrências por categoria: ${totalFromCategories}`);
    console.log(`   🤖 Total de classificações na tabela: ${totalClassified}`);
    
    if (totalFromCategories !== totalClassified) {
      console.log('   ⚠️  PROBLEMA: Dessincronia entre contadores de categoria e classificações!');
    }
    
    // 5. Verificar se há classificações órfãs
    console.log('');
    console.log('5️⃣ VERIFICANDO INTEGRIDADE DOS DADOS:');
    
    const { data: orphanClassifications } = await supabase
      .from('defect_classifications')
      .select(`
        id,
        service_order_id,
        category_id,
        defect_categories!inner(category_name)
      `)
      .limit(5);
    
    console.log(`   🔗 Classificações com categorias válidas: ${orphanClassifications?.length || 0}/5 testadas`);
    
    // 6. Status das classificações recentes
    const { data: recentClassifications } = await supabase
      .from('defect_classifications')
      .select('id, service_order_id, category_id, ai_confidence, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log(`   ⏰ Classificações mais recentes:`);
    (recentClassifications || []).forEach(c => {
      const date = new Date(c.created_at).toLocaleDateString('pt-BR');
      console.log(`      ID ${c.id}: OS ${c.service_order_id}, Categoria ${c.category_id}, Confiança ${(c.ai_confidence * 100).toFixed(1)}% (${date})`);
    });
    
    console.log('\n🎯 === CONCLUSÃO ===');
    console.log(`Status real: ${unclassified.length} defeitos ainda precisam ser classificados`);
    console.log(`Discrepância encontrada: Documentação mostra 99.1%, realidade é ${(totalClassified / totalDefects * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Erro na investigação:', error);
  }
}

debugClassificationIssue();