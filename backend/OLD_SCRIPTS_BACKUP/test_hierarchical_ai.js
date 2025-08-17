const { HierarchicalAIServiceV2 } = require('./dist/services/HierarchicalAIServiceV2');

async function testHierarchicalAI() {
  console.log('🧪 TESTANDO SISTEMA DE IA HIERÁRQUICO\n');
  
  try {
    const aiService = HierarchicalAIServiceV2.getInstance();
    
    // Casos de teste variados
    const testCases = [
      'VAZAMENTO NO RETENTOR DIANTEIRO',
      'QUEBROU O PISTÃO DO MOTOR',
      'SUPERAQUECIMENTO NO MOTOR, MUITO QUENTE',
      'VELA DE IGNIÇÃO QUEIMADA',
      'BARULHO ESTRANHO NO MOTOR',
      'TESTE DE VERIFICAÇÃO DO SISTEMA',
      'VAZAMENTO NA TAMPA DE VÁLVULAS',
      'DESGASTE NA BRONZINA',
      'RADIADOR COM PROBLEMA DE RESFRIAMENTO',
      'BATERIA DESCARREGADA'
    ];
    
    console.log(`📋 Testando ${testCases.length} casos...\n`);
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`🔍 TESTE ${i + 1}: "${testCase}"`);
      
      const result = await aiService.classifyDefectHierarchical(testCase);
      
      if (result) {
        console.log(`✅ RESULTADO:`);
        console.log(`   📂 Grupo: ${result.primary_group.name} (${(result.primary_group.confidence * 100).toFixed(1)}%)`);
        console.log(`   📁 Subgrupo: ${result.secondary_subgroup.name || 'N/A'} (${(result.secondary_subgroup.confidence * 100).toFixed(1)}%)`);
        console.log(`   📄 Específico: ${result.tertiary_specific.name || 'N/A'} (${(result.tertiary_specific.confidence * 100).toFixed(1)}%)`);
        console.log(`   🎯 Caminho: ${result.full_hierarchy_path}`);
        console.log(`   📊 Confiança: ${(result.overall_confidence * 100).toFixed(1)}%`);
        console.log(`   🤖 Método: ${result.classification_method}`);
        console.log();
      } else {
        console.log('❌ ERRO: Não foi possível classificar\n');
      }
    }
    
    console.log('✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testHierarchicalAI();