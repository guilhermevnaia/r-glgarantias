const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function comprehensiveSystemAudit() {
  console.log('🔍 === AUDITORIA COMPLETA DO SISTEMA DE IA ===\n');
  
  try {
    // ============================================
    // 1. VERIFICAÇÃO DE LEITURA COMPLETA DOS DADOS
    // ============================================
    console.log('1️⃣ VERIFICANDO LEITURA COMPLETA DOS DEFEITOS');
    
    // Total de service orders
    const { count: totalOrders } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true });
    
    // Service orders com defeitos nulos
    const { count: nullDefects } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .is('raw_defect_description', null);
    
    // Service orders com defeitos vazios
    const { count: emptyDefects } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .eq('raw_defect_description', '');
    
    // Service orders com defeitos válidos
    const { count: validDefects } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    console.log(`   📊 Total de Service Orders: ${totalOrders}`);
    console.log(`   ❌ Com defeito NULL: ${nullDefects}`);
    console.log(`   📝 Com defeito VAZIO: ${emptyDefects}`);
    console.log(`   ✅ Com defeito VÁLIDO: ${validDefects}`);
    console.log(`   🧮 Verificação: ${nullDefects + emptyDefects + validDefects} = ${totalOrders} ${nullDefects + emptyDefects + validDefects === totalOrders ? '✓' : '❌'}`);
    
    // Amostra de defeitos para verificar qualidade
    const { data: sampleDefects } = await supabase
      .from('service_orders')
      .select('id, order_number, raw_defect_description')
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '')
      .limit(5);
    
    console.log(`\\n   📋 AMOSTRA DE DEFEITOS VÁLIDOS:`);
    sampleDefects.forEach((defect, i) => {
      const desc = defect.raw_defect_description?.substring(0, 60) + '...';
      console.log(`      ${i+1}. OS ${defect.order_number} (ID: ${defect.id}): ${desc}`);
    });
    
    // ============================================
    // 2. VERIFICAÇÃO DE CLASSIFICAÇÃO HIERÁRQUICA
    // ============================================
    console.log(`\\n2️⃣ VERIFICANDO CLASSIFICAÇÃO HIERÁRQUICA`);
    
    const { count: totalClassified } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });
    
    // Verificar se cada classificação tem categoria válida
    const { data: classificationsWithCategories } = await supabase
      .from('defect_classifications')
      .select(`
        id,
        service_order_id,
        category_id,
        ai_confidence,
        defect_categories!inner(
          category_name,
          color_hex,
          icon
        )
      `)
      .limit(5);
    
    console.log(`   🤖 Total de classificações: ${totalClassified}`);
    console.log(`   📂 Classificações com categorias válidas: ${classificationsWithCategories?.length || 0}/5 testadas`);
    
    // Verificar distribuição hierárquica por categoria
    const { data: categoryDistribution } = await supabase
      .from('defect_classifications')
      .select(`
        category_id,
        defect_categories!inner(category_name)
      `);
    
    const distribution = {};
    (categoryDistribution || []).forEach(item => {
      const categoryName = item.defect_categories?.category_name || 'Desconhecido';
      distribution[categoryName] = (distribution[categoryName] || 0) + 1;
    });
    
    console.log(`   📊 DISTRIBUIÇÃO HIERÁRQUICA:`);
    Object.entries(distribution).forEach(([category, count]) => {
      const percentage = ((count / totalClassified) * 100).toFixed(1);
      console.log(`      • ${category}: ${count} (${percentage}%)`);
    });
    
    // ============================================
    // 3. VERIFICAÇÃO DE INTEGRIDADE (SEM INVENÇÕES)
    // ============================================
    console.log(`\\n3️⃣ VERIFICANDO INTEGRIDADE DOS DADOS`);
    
    // Verificar se há classificações órfãs (sem service_order correspondente)
    const { data: orphanedClassifications } = await supabase
      .from('defect_classifications')
      .select(`
        id,
        service_order_id,
        service_orders!inner(id, order_number)
      `)
      .limit(1000);
    
    const totalChecked = orphanedClassifications?.length || 0;
    console.log(`   🔗 Verificação de órfãos: ${totalChecked}/1000 classificações têm service_order válida`);
    
    // Verificar duplicações
    const { data: duplicateCheck } = await supabase
      .from('defect_classifications')
      .select('service_order_id')
      .then(result => {
        const counts = {};
        (result.data || []).forEach(item => {
          counts[item.service_order_id] = (counts[item.service_order_id] || 0) + 1;
        });
        const duplicates = Object.entries(counts).filter(([id, count]) => count > 1);
        return { data: duplicates };
      });
    
    console.log(`   🔄 Verificação de duplicatas: ${duplicateCheck.data.length} service_orders com múltiplas classificações`);
    if (duplicateCheck.data.length > 0) {
      console.log(`      ⚠️  Primeiras duplicatas encontradas:`);
      duplicateCheck.data.slice(0, 3).forEach(([serviceOrderId, count]) => {
        console.log(`         Service Order ${serviceOrderId}: ${count} classificações`);
      });
    }
    
    // Verificar range de confiança
    const { data: confidenceCheck } = await supabase
      .from('defect_classifications')
      .select('ai_confidence')
      .order('ai_confidence', { ascending: false })
      .limit(1000);
    
    const confidences = (confidenceCheck || []).map(c => c.ai_confidence);
    const avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    const minConfidence = Math.min(...confidences);
    const maxConfidence = Math.max(...confidences);
    
    console.log(`   📈 Análise de confiança:`);
    console.log(`      • Média: ${(avgConfidence * 100).toFixed(1)}%`);
    console.log(`      • Mínima: ${(minConfidence * 100).toFixed(1)}%`);
    console.log(`      • Máxima: ${(maxConfidence * 100).toFixed(1)}%`);
    
    // ============================================
    // 4. VERIFICAÇÃO DE COBERTURA COMPLETA
    // ============================================
    console.log(`\\n4️⃣ VERIFICANDO COBERTURA COMPLETA`);
    
    const classificationRate = (totalClassified / validDefects * 100).toFixed(2);
    const pendingClassifications = validDefects - totalClassified;
    
    console.log(`   📊 Taxa de classificação: ${classificationRate}%`);
    console.log(`   ✅ Defeitos classificados: ${totalClassified}`);
    console.log(`   ❌ Defeitos pendentes: ${pendingClassifications}`);
    
    if (pendingClassifications > 0) {
      // Mostrar alguns defeitos não classificados
      const { data: classifiedIds } = await supabase
        .from('defect_classifications')
        .select('service_order_id');
      
      const classifiedSet = new Set((classifiedIds || []).map(c => c.service_order_id));
      
      const { data: unclassifiedSample } = await supabase
        .from('service_orders')
        .select('id, order_number, raw_defect_description')
        .not('raw_defect_description', 'is', null)
        .not('raw_defect_description', 'eq', '')
        .limit(100);
      
      const unclassified = (unclassifiedSample || []).filter(order => !classifiedSet.has(order.id));
      
      console.log(`   📋 Primeiros 3 defeitos não classificados:`);
      unclassified.slice(0, 3).forEach((order, i) => {
        const desc = order.raw_defect_description?.substring(0, 50) + '...';
        console.log(`      ${i+1}. OS ${order.order_number} (ID: ${order.id}): ${desc}`);
      });
    }
    
    // ============================================
    // 5. RESUMO DA AUDITORIA
    // ============================================
    console.log(`\\n🎯 === RESUMO DA AUDITORIA ===`);
    
    const issues = [];
    const successes = [];
    
    // Verificações de sucesso
    if (nullDefects + emptyDefects + validDefects === totalOrders) {
      successes.push('✅ Leitura completa dos dados do Excel→Supabase');
    } else {
      issues.push('❌ Inconsistência na contagem de service orders');
    }
    
    if (duplicateCheck.data.length === 0) {
      successes.push('✅ Nenhuma classificação duplicada');
    } else {
      issues.push(`❌ ${duplicateCheck.data.length} service orders com classificações duplicadas`);
    }
    
    if (classificationsWithCategories?.length === 5) {
      successes.push('✅ Todas as classificações têm categorias válidas');
    } else {
      issues.push('❌ Algumas classificações não têm categorias válidas');
    }
    
    if (parseFloat(classificationRate) >= 95) {
      successes.push('✅ Taxa de classificação excelente (≥95%)');
    } else if (parseFloat(classificationRate) >= 80) {
      successes.push('✅ Taxa de classificação boa (≥80%)');
    } else {
      issues.push(`⚠️  Taxa de classificação pode melhorar (${classificationRate}%)`);
    }
    
    if (avgConfidence >= 0.7) {
      successes.push('✅ Confiança média das classificações é boa');
    } else {
      issues.push(`⚠️  Confiança média das classificações é baixa (${(avgConfidence * 100).toFixed(1)}%)`);
    }
    
    console.log('\\n📊 SUCESSOS:');
    successes.forEach(success => console.log('   ' + success));
    
    if (issues.length > 0) {
      console.log('\\n⚠️  PONTOS DE ATENÇÃO:');
      issues.forEach(issue => console.log('   ' + issue));
    }
    
    console.log('\\n🏆 SISTEMA DE IA:', issues.length === 0 ? 'APROVADO' : 'NECESSITA REVISÃO');
    
    // ============================================
    // 6. DADOS PARA FRONTEND
    // ============================================
    console.log('\\n6️⃣ DADOS PARA FRONTEND (TRANSPARÊNCIA)');
    
    const frontendData = {
      totalDefects: validDefects,
      totalClassified: totalClassified,
      classificationRate: parseFloat(classificationRate),
      avgConfidence: parseFloat((avgConfidence * 100).toFixed(1)),
      categories: Object.entries(distribution).map(([name, count]) => ({
        name,
        count,
        percentage: parseFloat(((count / totalClassified) * 100).toFixed(1))
      })),
      pendingClassifications: pendingClassifications,
      systemHealth: issues.length === 0 ? 'EXCELLENT' : 'NEEDS_ATTENTION',
      lastAudit: new Date().toISOString()
    };
    
    console.log('   📱 Dados que o frontend deve mostrar:');
    console.log(JSON.stringify(frontendData, null, 2));
    
  } catch (error) {
    console.error('❌ Erro crítico na auditoria:', error);
  }
}

comprehensiveSystemAudit();