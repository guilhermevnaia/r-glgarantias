const { createClient } = require('@supabase/supabase-js');
const { EnhancedLocalAIService } = require('./dist/services/EnhancedLocalAIService');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixClassificationSystem() {
  console.log('🔧 === CORREÇÃO DO SISTEMA DE CLASSIFICAÇÃO ===\n');
  
  try {
    // 1. Identificar defeitos não classificados
    console.log('1️⃣ IDENTIFICANDO DEFEITOS PENDENTES...');
    
    const { data: classifiedIds } = await supabase
      .from('defect_classifications')
      .select('service_order_id');
    
    const classifiedSet = new Set((classifiedIds || []).map(c => c.service_order_id));
    
    const { data: allDefects } = await supabase
      .from('service_orders')
      .select('id, order_number, raw_defect_description')
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    const unclassified = allDefects.filter(d => !classifiedSet.has(d.id));
    
    console.log(`   📊 Total defeitos: ${allDefects.length}`);
    console.log(`   ✅ Já classificados: ${classifiedIds.length}`);
    console.log(`   ❌ Pendentes: ${unclassified.length}`);
    
    if (unclassified.length === 0) {
      console.log('✅ Todos os defeitos já estão classificados!');
      return await syncCounters();
    }
    
    // 2. Classificar defeitos pendentes
    console.log(`\n2️⃣ CLASSIFICANDO ${unclassified.length} DEFEITOS PENDENTES...`);
    
    const localAI = EnhancedLocalAIService.getInstance();
    let processed = 0;
    let successful = 0;
    
    for (const defect of unclassified) {
      try {
        console.log(`🔄 [${processed + 1}/${unclassified.length}] OS ${defect.order_number}...`);
        
        const classification = await localAI.classifyDefect(defect.raw_defect_description);
        
        if (classification) {
          const saved = await localAI.saveClassification(defect.id, classification);
          if (saved) {
            successful++;
            console.log(`✅ OS ${defect.order_number} → ${classification.category_name} (${(classification.ai_confidence * 100).toFixed(1)}%)`);
          } else {
            console.log(`❌ Erro ao salvar OS ${defect.order_number}`);
          }
        } else {
          console.log(`⚠️  OS ${defect.order_number} não pôde ser classificada`);
        }
        
        processed++;
        
        // Pausa para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Erro na OS ${defect.order_number}:`, error.message);
        processed++;
      }
    }
    
    console.log(`\n3️⃣ RESULTADO DA CLASSIFICAÇÃO:`);
    console.log(`   📈 Processados: ${processed}`);
    console.log(`   ✅ Sucessos: ${successful}`);
    console.log(`   ❌ Falhas: ${processed - successful}`);
    
    // 3. Sincronizar contadores
    console.log(`\n4️⃣ SINCRONIZANDO CONTADORES...`);
    await syncCounters();
    
    // 4. Verificar resultado final
    console.log(`\n5️⃣ VERIFICAÇÃO FINAL...`);
    await verifyFinalStatus();
    
  } catch (error) {
    console.error('❌ Erro crítico:', error);
  }
}

async function syncCounters() {
  console.log('🔄 Sincronizando contadores de categorias...');
  
  try {
    // Buscar contagem real por categoria
    const { data: realCounts } = await supabase
      .from('defect_classifications')
      .select('category_id')
      .then(result => {
        const counts = {};
        (result.data || []).forEach(item => {
          counts[item.category_id] = (counts[item.category_id] || 0) + 1;
        });
        return { data: Object.entries(counts) };
      });
    
    // Atualizar cada categoria
    for (const [categoryId, count] of realCounts.data) {
      await supabase
        .from('defect_categories')
        .update({ total_occurrences: count })
        .eq('id', parseInt(categoryId));
      
      console.log(`   ✅ Categoria ${categoryId}: ${count} ocorrências`);
    }
    
    console.log('✅ Contadores sincronizados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao sincronizar contadores:', error);
  }
}

async function verifyFinalStatus() {
  try {
    const { count: totalDefects } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    const { count: totalClassified } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });
    
    const rate = (totalClassified / totalDefects * 100).toFixed(1);
    
    console.log(`📊 STATUS FINAL:`);
    console.log(`   • Total defeitos: ${totalDefects}`);
    console.log(`   • Classificados: ${totalClassified}`);
    console.log(`   • Taxa de classificação: ${rate}%`);
    console.log(`   • Pendentes: ${totalDefects - totalClassified}`);
    
    if (totalDefects === totalClassified) {
      console.log('🎉 SISTEMA 100% CLASSIFICADO!');
    } else {
      console.log('⚠️  Ainda há defeitos pendentes.');
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação final:', error);
  }
}

// Executar correção
fixClassificationSystem();