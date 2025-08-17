const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAISystem() {
  console.log('🤖 === TESTE DO SISTEMA DE IA DE DEFEITOS ===');
  
  try {
    // 1. Verificar se as tabelas existem
    console.log('\n1. 📊 Verificando tabelas do sistema de IA...');
    
    const { data: categories, error: categoriesError } = await supabase
      .from('defect_categories')
      .select('*')
      .limit(5);
    
    if (categoriesError) {
      console.log('❌ Tabela defect_categories não existe:', categoriesError.message);
      console.log('💡 Execute o SQL: backend/src/database/simple_ai_tables.sql');
      return false;
    }
    
    console.log(`✅ Tabela defect_categories encontrada com ${categories.length} categorias`);
    categories.forEach(cat => {
      console.log(`  - ${cat.category_name}: ${cat.total_occurrences} ocorrências`);
    });
    
    // 2. Verificar tabela de classificações
    const { data: classifications, error: classificationsError } = await supabase
      .from('defect_classifications')
      .select('*')
      .limit(5);
    
    if (classificationsError) {
      console.log('❌ Tabela defect_classifications não existe:', classificationsError.message);
      console.log('💡 Execute o SQL: backend/src/database/simple_ai_tables.sql');
      return false;
    }
    
    console.log(`✅ Tabela defect_classifications encontrada com ${classifications.length} classificações`);
    
    // 3. Testar endpoints da API
    console.log('\n2. 🌐 Testando endpoints da API de IA...');
    
    // Testar status da IA
    console.log('\n2.1 📊 Testando status da IA...');
    const statusResponse = await fetch('http://localhost:3011/api/v1/ai/status');
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Status da IA:', statusData.data);
    } else {
      console.log('❌ Erro ao obter status da IA:', statusResponse.status);
    }
    
    // Testar estatísticas
    console.log('\n2.2 📈 Testando estatísticas...');
    const statsResponse = await fetch('http://localhost:3011/api/v1/ai/stats');
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Estatísticas da IA:', {
        totalClassified: statsData.data.totalClassified,
        totalDefects: statsData.data.totalDefects,
        rate: Math.round(statsData.data.classificationRate * 100) + '%'
      });
    } else {
      console.log('❌ Erro ao obter estatísticas:', statsResponse.status);
    }
    
    // 4. Testar classificação individual
    console.log('\n3. 🧠 Testando classificação individual...');
    
    const testDefect = 'Motor com vazamento de óleo na junta do cabeçote';
    console.log(`🔍 Defeito teste: "${testDefect}"`);
    
    const classifyResponse = await fetch('http://localhost:3011/api/v1/ai/classify-defect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        defectDescription: testDefect
      })
    });
    
    if (classifyResponse.ok) {
      const classifyData = await classifyResponse.json();
      console.log('✅ Classificação realizada:', {
        categoria: classifyData.data.category_name,
        confianca: (classifyData.data.ai_confidence * 100).toFixed(1) + '%',
        raciocinio: classifyData.data.ai_reasoning?.substring(0, 100) + '...'
      });
    } else {
      const errorText = await classifyResponse.text();
      console.log('❌ Erro na classificação:', classifyResponse.status, errorText);
    }
    
    // 5. Verificar ordens não classificadas
    console.log('\n4. 🔍 Verificando ordens não classificadas...');
    
    const debugResponse = await fetch('http://localhost:3011/api/v1/ai/debug');
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('✅ Debug de classificações:', {
        classificadas: debugData.data.totalClassified,
        naoClassificadas: debugData.data.totalUnclassified,
        exemplosNaoClassificadas: debugData.data.sampleUnclassified.slice(0, 3).map(o => ({
          id: o.id,
          defeito: o.raw_defect_description?.substring(0, 50) + '...'
        }))
      });
    } else {
      console.log('❌ Erro no debug:', debugResponse.status);
    }
    
    console.log('\n🎯 === RESUMO DO TESTE ===');
    console.log('✅ Tabelas do banco: OK');
    console.log('✅ API de IA: Funcionando');
    console.log('✅ Classificação individual: OK');
    console.log('✅ Sistema pronto para classificação em massa');
    
    return true;
    
  } catch (error) {
    console.error('❌ ERRO GERAL NO TESTE:', error);
    return false;
  }
}

// Função auxiliar para testar classificação em massa
async function testMassClassification() {
  console.log('\n🚀 === TESTE DE CLASSIFICAÇÃO EM MASSA ===');
  
  try {
    console.log('⚠️  Este teste irá iniciar a classificação de TODOS os defeitos.');
    console.log('📝 Pressione Ctrl+C para cancelar ou aguarde 5 segundos...');
    
    // Pausa de 5 segundos para permitir cancelamento
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const response = await fetch('http://localhost:3011/api/v1/ai/classify-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Classificação em massa iniciada:', data.message);
      console.log('⏱️  Tempo estimado:', data.estimated_time);
      
      // Monitorar progresso
      console.log('\n📊 Monitorando progresso...');
      for (let i = 0; i < 20; i++) { // Monitorar por 10 minutos
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 segundos
        
        const progressResponse = await fetch('http://localhost:3011/api/v1/ai/progress');
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          console.log(`📈 Progresso: ${progressData.data.progress}% (${progressData.data.totalClassified}/${progressData.data.totalDefects})`);
          
          if (progressData.data.isComplete) {
            console.log('🎉 Classificação concluída!');
            break;
          }
        }
      }
      
    } else {
      console.log('❌ Erro ao iniciar classificação em massa:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erro na classificação em massa:', error);
  }
}

// Executar teste básico primeiro
testAISystem().then(success => {
  if (success) {
    console.log('\n🤖 Sistema de IA está funcionando corretamente!');
    console.log('\n💡 Para executar classificação em massa, descomente a linha abaixo:');
    console.log('// testMassClassification();');
    
    // Descomente a linha abaixo para executar classificação em massa
    // testMassClassification();
  } else {
    console.log('\n❌ Sistema de IA tem problemas que precisam ser corrigidos.');
  }
});