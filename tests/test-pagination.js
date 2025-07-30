const http = require('http');

async function testPagination() {
    console.log('🔍 Testando Paginação da API ServiceOrders\n');

    // Teste página 1
    console.log('📄 Testando página 1 (limit: 50)...');
    await testPage(1, 50);

    // Teste página 2  
    console.log('\n📄 Testando página 2 (limit: 50)...');
    await testPage(2, 50);

    // Teste com limit grande para exportação
    console.log('\n📤 Testando busca para exportação (limit: 10000)...');
    await testPage(1, 10000);
}

async function testPage(page, limit) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3008,
            path: `/api/v1/service-orders?page=${page}&limit=${limit}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    
                    console.log(`   Status: ${res.statusCode}`);
                    console.log(`   Registros retornados: ${result.data?.length || 0}`);
                    console.log(`   Total de registros: ${result.total}`);
                    console.log(`   Página atual: ${result.page}`);
                    console.log(`   Total de páginas: ${result.totalPages}`);
                    console.log(`   Limit usado: ${result.limit}`);
                    
                    if (result.data && result.data.length > 0) {
                        console.log(`   Primeiro registro: ${result.data[0].order_number}`);
                        console.log(`   Último registro: ${result.data[result.data.length - 1].order_number}`);
                    }
                    
                    resolve(result);
                } catch (e) {
                    console.log(`   Erro ao parsear JSON: ${e.message}`);
                    resolve({ error: e.message });
                }
            });
        });

        req.on('error', (error) => {
            console.log(`   Erro na requisição: ${error.message}`);
            resolve({ error: error.message });
        });

        req.end();
    });
}

testPagination();