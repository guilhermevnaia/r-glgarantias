// Teste rápido da IA
const { GroqAIService } = require('../dist/services/GroqAIService');

async function testAI() {
  try {
    console.log('🤖 Testando IA...');
    
    const aiService = GroqAIService.getInstance();
    
    // Testar classificação
    const result = await aiService.classifyDefect('VAZAMENTO DE ÓLEO NO MOTOR');
    
    console.log('✅ Resultado:', result);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testAI();