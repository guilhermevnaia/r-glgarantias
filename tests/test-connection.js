const https = require('http');

console.log('🔍 Testando conexão com a API...');

const options = {
  hostname: 'localhost',
  port: 3006,
  path: '/api/v1/stats',
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  console.log(`📡 Status Code: ${res.statusCode}`);
  console.log(`📡 Headers:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('✅ SUCESSO! Dados recebidos:');
      console.log('📊 Total Orders:', jsonData.totalOrders);
      console.log('📊 Orders Array Length:', jsonData.orders?.length);
      console.log('📊 Status Distribution:', jsonData.statusDistribution);
      console.log('📊 Financial Summary Total:', jsonData.financialSummary?.totalValue);
      
      if (jsonData.totalOrders > 0) {
        console.log('🎉 API ESTÁ FUNCIONANDO PERFEITAMENTE!');
      } else {
        console.log('⚠️ API funciona mas não retorna dados');
      }
    } catch (error) {
      console.error('❌ Erro ao parsear JSON:', error.message);
      console.log('📦 Dados brutos recebidos:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ ERRO DE CONEXÃO:', error.message);
  console.error('❌ Possíveis causas:');
  console.error('   - Backend não está rodando na porta 3006');
  console.error('   - Firewall bloqueando a conexão');
  console.error('   - Problema de rede local');
});

req.end();