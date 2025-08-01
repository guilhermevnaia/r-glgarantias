const http = require('http');

// Teste de várias rotas para ver quais estão funcionando
const routes = [
  '/health',
  '/api/v1/test-auth',
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/upload',
  '/api/v1/stats',
  '/api/v1/mechanics'
];

const testRoute = (route) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3009,
      path: route,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      resolve({
        route,
        status: res.statusCode,
        working: res.statusCode !== 404
      });
    });

    req.on('error', () => {
      resolve({
        route,
        status: 'ERROR',
        working: false
      });
    });

    req.end();
  });
};

const testAllRoutes = async () => {
  console.log('🔍 Testando todas as rotas...\n');
  
  for (const route of routes) {
    const result = await testRoute(route);
    const status = result.working ? '✅' : '❌';
    console.log(`${status} ${route} - Status: ${result.status}`);
  }
};

testAllRoutes(); 