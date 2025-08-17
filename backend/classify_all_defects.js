const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function classifyAllDefects() {
  console.log('🚀 CLASSIFICAÇÃO MASSIVA DE TODOS OS DEFEITOS...');
  
  try {
    // Buscar defeitos com descrição
    const { data: allDefects } = await supabase
      .from('service_orders')
      .select('id, raw_defect_description')
      .not('raw_defect_description', 'is', null)
;
    
    // Buscar classificações existentes
    const { data: existingClassifications } = await supabase
      .from('defect_classifications')
      .select('service_order_id');
    
    const classifiedIds = new Set(existingClassifications.map(c => c.service_order_id));
    const unclassified = allDefects.filter(d => !classifiedIds.has(d.id));
    
    console.log('📊 ESTATÍSTICAS:');
    console.log('   Total com descrição:', allDefects.length);
    console.log('   Já classificados:', existingClassifications.length);
    console.log('   Restantes para classificar:', unclassified.length);
    
    if (unclassified.length === 0) {
      console.log('✅ Todos os defeitos já foram classificados!');
      return;
    }
    
    // Função de classificação por palavras-chave
    function classifyDefect(description) {
      const desc = description.toLowerCase();
      
      // Vazamentos
      if (desc.includes('vazamento') || desc.includes('vaza') || desc.includes('escorre')) {
        return { categoryId: 27, confidence: 0.8, reasoning: 'Vazamento detectado' };
      }
      
      // Ruídos e barulhos
      if (desc.includes('barulho') || desc.includes('ruido') || desc.includes('ruído') || desc.includes('estalo')) {
        return { categoryId: 33, confidence: 0.7, reasoning: 'Ruído/barulho detectado' };
      }
      
      // Folgas mecânicas
      if (desc.includes('folga') || desc.includes('frouxo') || desc.includes('solto')) {
        return { categoryId: 33, confidence: 0.7, reasoning: 'Folga mecânica detectada' };
      }
      
      // Quebras e fraturas
      if (desc.includes('quebra') || desc.includes('quebrou') || desc.includes('rompeu') || desc.includes('partiu') || desc.includes('trinca')) {
        return { categoryId: 36, confidence: 0.8, reasoning: 'Quebra/fratura detectada' };
      }
      
      // Problemas de temperatura
      if (desc.includes('superaquecimento') || desc.includes('quente') || desc.includes('temperatura') || desc.includes('aqueceu')) {
        return { categoryId: 26, confidence: 0.7, reasoning: 'Problema de temperatura' };
      }
      
      // Problemas com óleo
      if (desc.includes('oleo') || desc.includes('óleo') || desc.includes('lubrificante')) {
        return { categoryId: 27, confidence: 0.6, reasoning: 'Problema relacionado a óleo' };
      }
      
      // Problemas elétricos
      if (desc.includes('eletrico') || desc.includes('elétrico') || desc.includes('fio') || desc.includes('cabo')) {
        return { categoryId: 25, confidence: 0.7, reasoning: 'Problema elétrico detectado' };
      }
      
      // Desgaste
      if (desc.includes('desgaste') || desc.includes('gasto') || desc.includes('consumo') || desc.includes('desgastou')) {
        return { categoryId: 28, confidence: 0.6, reasoning: 'Desgaste detectado' };
      }
      
      // Combustão
      if (desc.includes('combustao') || desc.includes('combustão') || desc.includes('queima') || desc.includes('fumaca')) {
        return { categoryId: 26, confidence: 0.7, reasoning: 'Problema de combustão' };
      }
      
      // Padrão - outros defeitos
      return { categoryId: 28, confidence: 0.5, reasoning: 'Classificação automática - outros defeitos' };
    }
    
    // Processar em batches de 100
    let totalInserted = 0;
    const batchSize = 200;
    
    for (let i = 0; i < unclassified.length; i += batchSize) {
      const batch = unclassified.slice(i, i + batchSize);
      
      const classifications = batch.map(order => {
        const classification = classifyDefect(order.raw_defect_description);
        return {
          service_order_id: order.id,
          category_id: classification.categoryId,
          ai_confidence: classification.confidence,
          ai_reasoning: classification.reasoning,
          original_defect_description: order.raw_defect_description.substring(0, 500),
          created_at: new Date().toISOString()
        };
      });
      
      const { data, error } = await supabase
        .from('defect_classifications')
        .insert(classifications);
      
      if (error) {
        console.error(`❌ Erro no batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        break;
      } else {
        totalInserted += classifications.length;
        console.log(`✅ Batch ${Math.floor(i/batchSize) + 1} inserido: ${classifications.length} | Total: ${totalInserted}`);
      }
      
      // Pequena pausa para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n🎯 RESULTADO FINAL:');
    console.log(`   ✅ Classificações inseridas: ${totalInserted}`);
    console.log(`   📊 Total restante: ${unclassified.length - totalInserted}`);
    console.log('   🎉 Classificação massiva concluída!');
    
  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

classifyAllDefects();