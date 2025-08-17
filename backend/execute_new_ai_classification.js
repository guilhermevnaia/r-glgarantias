const { SimpleAIService } = require('./dist/services/SimpleAIService');

async function executeNewAIClassification() {
  console.log('🚀 === EXECUTANDO NOVO SISTEMA DE IA ===\n');
  
  try {
    console.log('🤖 Inicializando SimpleAIService...');
    const aiService = SimpleAIService.getInstance();
    
    console.log('📊 Verificando estado antes da classificação...');
    const statsBefore = await aiService.getStats();
    
    console.log(`📋 Estado inicial:`);
    console.log(`   • Total de defeitos: ${statsBefore.totalDefects}`);
    console.log(`   • Já classificados: ${statsBefore.totalClassified}`);
    console.log(`   • Taxa atual: ${(statsBefore.classificationRate * 100).toFixed(1)}%`);
    console.log(`   • Pendentes: ${statsBefore.totalDefects - statsBefore.totalClassified}`);
    
    if (statsBefore.totalClassified >= statsBefore.totalDefects) {
      console.log('✅ Todos os defeitos já estão classificados!');
      return;
    }
    
    console.log('\n🚀 Iniciando classificação de TODOS os defeitos...');
    console.log('⏱️  Este processo pode levar alguns minutos...\n');
    
    // Executar classificação
    await aiService.classifyAllDefects();
    
    console.log('\n📊 Verificando resultado final...');
    const statsAfter = await aiService.getStats();
    
    console.log('\n🎉 === CLASSIFICAÇÃO COMPLETA ===');
    console.log(`📊 Resultado final:`);
    console.log(`   • Total de defeitos: ${statsAfter.totalDefects}`);
    console.log(`   • Classificados: ${statsAfter.totalClassified}`);
    console.log(`   • Taxa final: ${(statsAfter.classificationRate * 100).toFixed(1)}%`);
    console.log(`   • Pendentes: ${statsAfter.totalDefects - statsAfter.totalClassified}`);
    
    console.log('\n📂 Distribuição por categorias:');
    if (statsAfter.categories && statsAfter.categories.length > 0) {
      statsAfter.categories.forEach((category, index) => {
        console.log(`   ${index + 1}. ${category.category_name}: ${category.total_occurrences} ocorrências`);
      });
    }
    
    const improvement = statsAfter.totalClassified - statsBefore.totalClassified;
    console.log(`\n📈 Novos defeitos classificados: ${improvement}`);
    
    if (statsAfter.classificationRate >= 0.95) {
      console.log('\n🎯 SUCESSO TOTAL! Taxa de classificação ≥ 95%');
    } else if (statsAfter.classificationRate >= 0.80) {
      console.log('\n✅ BOM RESULTADO! Taxa de classificação ≥ 80%');
    } else {
      console.log('\n⚠️  RESULTADO PARCIAL. Pode ser necessário revisar algoritmo');
    }
    
    console.log('\n🔄 O frontend agora deve mostrar dados corretos e atualizados!');
    console.log('💡 Recarregue a página web para ver as mudanças.');
    
  } catch (error) {
    console.error('❌ Erro crítico na execução:', error);
    console.error('Stack:', error.stack);
  }
}

// Executar
executeNewAIClassification();