const fetch = require('node-fetch');

async function testLoginRateLimit() {
  const baseURL = 'http://localhost:3009';
  const loginData = {
    email: 'admin@glgarantias.com',
    password: 'Admin123'
  };

  console.log('🧪 Testando remoção do rate limiting do login...\n');

  // Fazer múltiplas tentativas de login rapidamente
  const attempts = 10;
  const promises = [];

  for (let i = 1; i <= attempts; i++) {
    promises.push(
      fetch(`${baseURL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      }).then(async (response) => {
        const data = await response.json();
        return {
          attempt: i,
          status: response.status,
          success: data.success,
          error: data.error
        };
      }).catch(error => ({
        attempt: i,
        status: 'ERROR',
        success: false,
        error: error.message
      }))
    );
  }

  try {
    const results = await Promise.all(promises);
    
    console.log('📊 Resultados dos testes:');
    console.log('='.repeat(50));
    
    let successCount = 0;
    let errorCount = 0;
    let rateLimitErrors = 0;

    results.forEach(result => {
      console.log(`Tentativa ${result.attempt}: ${result.success ? '✅ Sucesso' : '❌ Erro'} - ${result.error || 'N/A'}`);
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        if (result.error && result.error.includes('15 minutos')) {
          rateLimitErrors++;
        }
      }
    });

    console.log('\n📈 Estatísticas:');
    console.log(`✅ Sucessos: ${successCount}/${attempts}`);
    console.log(`❌ Erros: ${errorCount}/${attempts}`);
    console.log(`🚫 Erros de Rate Limit: ${rateLimitErrors}/${attempts}`);

    if (rateLimitErrors === 0) {
      console.log('\n🎉 SUCESSO! Rate limiting removido do login!');
    } else {
      console.log('\n⚠️ ATENÇÃO: Ainda há erros de rate limiting!');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar teste
testLoginRateLimit(); 