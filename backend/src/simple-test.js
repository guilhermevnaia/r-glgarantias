// Teste direto com Groq
const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function testGroqDirect() {
  try {
    console.log('🤖 Testando Groq diretamente...');
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em classificação de defeitos mecânicos automotivos.'
        },
        {
          role: 'user',
          content: 'Classifique este defeito: "VAZAMENTO DE ÓLEO NO MOTOR". Responda apenas com a categoria: Vazamentos, Superaquecimento, Ruídos, Elétrico, Ignição ou Desgaste.'
        }
      ],
      model: 'llama3-8b-8192',
      temperature: 0.1,
      max_tokens: 50
    });

    console.log('✅ Resposta da IA:', completion.choices[0]?.message?.content);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testGroqDirect();