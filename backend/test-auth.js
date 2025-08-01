const http = require('http');

// Teste da rota de login
const testLogin = () => {
  const postData = JSON.stringify({
    email: 'admin@glgarantias.com',
    password: 'Admin123'
  });

  const options = {
    hostname: 'localhost',
    port: 3009,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', data);
    });
  });

  req.on('error', (e) => {
    console.error(`Erro na requisição: ${e.message}`);
  });

  req.write(postData);
  req.end();
};

// Teste da rota de teste
const testAuth = () => {
  const postData = JSON.stringify({
    test: 'data'
  });

  const options = {
    hostname: 'localhost',
    port: 3009,
    path: '/api/v1/test-auth',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', data);
    });
  });

  req.on('error', (e) => {
    console.error(`Erro na requisição: ${e.message}`);
  });

  req.write(postData);
  req.end();
};

console.log('🔍 Testando rota de teste...');
testAuth();

setTimeout(() => {
  console.log('\n🔍 Testando rota de login...');
  testLogin();
}, 1000); 