const https = require('https');
const http = require('http');

async function testServiceOrdersAPI() {
    try {
        console.log('🔄 Testando API ServiceOrders...');
        
        const url = 'http://localhost:3007/api/v1/service-orders?limit=10000&page=1';
        
        const response = await new Promise((resolve, reject) => {
            const req = http.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            req.on('error', reject);
        });
        
        console.log('✅ Resposta recebida:');
        console.log(`📊 Total de registros: ${response.total}`);
        console.log(`📦 Registros retornados: ${response.data.length}`);
        console.log(`📄 Página: ${response.page}`);
        console.log(`📄 Total páginas: ${response.totalPages}`);
        console.log(`🔧 Limit usado: ${response.limit}`);
        
        if (response.data.length > 0) {
            console.log('📋 Primeiro registro:', response.data[0].order_number);
            console.log('📋 Último registro:', response.data[response.data.length - 1].order_number);
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

testServiceOrdersAPI();