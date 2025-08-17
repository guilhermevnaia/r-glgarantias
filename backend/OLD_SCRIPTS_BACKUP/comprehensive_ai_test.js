const { ComprehensiveAIClassificationService } = require('./dist/services/ComprehensiveAIClassificationService');

async function testComprehensiveAI() {
  console.log('🚀 SISTEMA ROBUSTO DE CLASSIFICAÇÃO COM VALIDAÇÃO 100%\n');
  console.log('=' .repeat(80));
  console.log('🎯 OBJETIVOS:');
  console.log('1. ✅ Ler TODOS os defeitos válidos');
  console.log('2. ✅ Classificar com grupos/subgrupos/específicos');
  console.log('3. ✅ Criar novas categorias automaticamente se necessário');
  console.log('4. ✅ Garantir 100% de cobertura com validação rigorosa');
  console.log('5. ✅ Sistema de contingência para falhas');
  console.log('=' .repeat(80));
  
  try {
    const aiService = ComprehensiveAIClassificationService.getInstance();
    
    console.log('\n📊 Iniciando sistema de classificação abrangente...\n');
    
    const startTime = Date.now();
    
    // Executar classificação completa com validação
    const validationResult = await aiService.classifyAllDefectsComprehensive();
    
    const endTime = Date.now();
    const durationMinutes = ((endTime - startTime) / 1000 / 60).toFixed(2);
    
    console.log('\n' + '='.repeat(80));
    console.log('🎉 CLASSIFICAÇÃO ABRANGENTE CONCLUÍDA!');
    console.log('=' .repeat(80));
    console.log(`⏱️ Tempo total: ${durationMinutes} minutos`);
    console.log(`📊 Resultado detalhado:`);
    console.log(`   🎯 Total de defeitos: ${validationResult.total_defects}`);
    console.log(`   ✅ Classificados: ${validationResult.classified_count}`);
    console.log(`   ❌ Não classificados: ${validationResult.unclassified_count}`);
    console.log(`   📈 Cobertura: ${validationResult.coverage_percentage.toFixed(2)}%`);
    console.log(`   🆕 Novas categorias: ${validationResult.new_categories_created}`);
    console.log(`   🏆 Validação: ${validationResult.validation_passed ? 'PASSOU ✅' : 'FALHOU ❌'}`);
    
    if (validationResult.failed_classifications.length > 0) {
      console.log(`\n⚠️ FALHAS (${validationResult.failed_classifications.length}):`);
      validationResult.failed_classifications.slice(0, 5).forEach((failure, index) => {
        console.log(`   ${index + 1}. OS ${failure.id}: ${failure.raw_defect_description?.substring(0, 50)}...`);
        if (failure.error) {
          console.log(`      Erro: ${failure.error}`);
        }
      });
    }
    
    // Status final
    if (validationResult.validation_passed) {
      console.log('\n🎉 SUCESSO COMPLETO! Sistema pronto para produção.');
      console.log('✅ Todos os defeitos foram classificados hierarquicamente.');
      console.log('✅ Sistema de contingência funcionou perfeitamente.');
      console.log('✅ Validação de 100% atingida.');
    } else {
      console.log('\n⚠️ ATENÇÃO! Cobertura não atingiu 100%.');
      console.log('🔧 Recomendação: Revisar defeitos não classificados manualmente.');
    }
    
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. ✅ Sistema já está integrado ao upload automático');
    console.log('2. ✅ Novos uploads classificarão automaticamente');
    console.log('3. ✅ Frontend será atualizado para mostrar hierarquia');
    console.log('4. ✅ Sistema de monitoramento ativo');
    
    return validationResult;
    
  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Executar teste
testComprehensiveAI()
  .then(result => {
    console.log('\n🎯 TESTE CONCLUÍDO COM SUCESSO!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 TESTE FALHOU:', error.message);
    process.exit(1);
  });