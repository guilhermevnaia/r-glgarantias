const http = require('http');

const API_BASE = 'http://localhost:3008';

async function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3008,
            path: path,
            method: method,
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
                    resolve({ status: res.statusCode, data: result });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        
        if (body) {
            req.write(JSON.stringify(body));
        }
        
        req.end();
    });
}

async function testIntegritySystem() {
    console.log('🔍 Testando Sistema de Integridade de Dados\n');

    try {
        // 1. Verificar saúde do sistema
        console.log('1. Verificando saúde do sistema...');
        const health = await makeRequest('GET', '/api/v1/integrity/health');
        console.log(`   Status: ${health.status}`);
        console.log(`   Resultado: ${health.data.status || 'N/A'}`);
        console.log(`   Mensagem: ${health.data.message || 'N/A'}\n`);

        // 2. Executar verificação completa
        console.log('2. Executando verificação completa...');
        const complete = await makeRequest('POST', '/api/v1/integrity/check/complete');
        console.log(`   Status: ${complete.status}`);
        if (complete.data.success) {
            const summary = complete.data.data;
            console.log(`   Total de verificações: ${summary.total_checks}`);
            console.log(`   OK: ${summary.ok_count}`);
            console.log(`   Erros: ${summary.error_count}`);
            console.log(`   Corrigidos: ${summary.fixed_count}`);
            
            console.log('\n   Detalhes das verificações:');
            summary.checks.forEach((check, i) => {
                console.log(`     ${i+1}. ${check.check_type}: ${check.status}`);
                console.log(`        ${check.details}`);
                if (check.error_details) {
                    console.log(`        Erro: ${check.error_details}`);
                }
            });
        }
        console.log('');

        // 3. Verificar contagem total
        console.log('3. Verificando contagem total de registros...');
        const totalCheck = await makeRequest('POST', '/api/v1/integrity/check/total-records');
        console.log(`   Status: ${totalCheck.status}`);
        if (totalCheck.data.success) {
            const result = totalCheck.data.data;
            console.log(`   Esperado: ${result.expected_count}`);
            console.log(`   Atual: ${result.actual_count}`);
            console.log(`   Status: ${result.status}`);
        }
        console.log('');

        // 4. Verificar range de datas
        console.log('4. Verificando range de datas...');
        const dateCheck = await makeRequest('POST', '/api/v1/integrity/check/date-range');
        console.log(`   Status: ${dateCheck.status}`);
        if (dateCheck.data.success) {
            const result = dateCheck.data.data;
            console.log(`   Status: ${result.status}`);
            console.log(`   Detalhes: ${result.details}`);
        }
        console.log('');

        // 5. Verificar cálculos financeiros
        console.log('5. Verificando cálculos financeiros...');
        const financialCheck = await makeRequest('POST', '/api/v1/integrity/check/financial');
        console.log(`   Status: ${financialCheck.status}`);
        if (financialCheck.data.success) {
            const result = financialCheck.data.data;
            console.log(`   Status: ${result.status}`);
            console.log(`   Detalhes: ${result.details}`);
        }
        console.log('');

        // 6. Buscar logs recentes
        console.log('6. Buscando logs recentes...');
        const logs = await makeRequest('GET', '/api/v1/integrity/logs?limit=5');
        console.log(`   Status: ${logs.status}`);
        if (logs.data.success && logs.data.data.logs) {
            console.log(`   Total de logs: ${logs.data.data.total}`);
            console.log('   Últimos 5 logs:');
            logs.data.data.logs.forEach((log, i) => {
                console.log(`     ${i+1}. ${log.check_type} - ${log.status} (${new Date(log.timestamp).toLocaleString('pt-BR')})`);
            });
        }

        console.log('\n✅ Teste do sistema de integridade concluído!');

    } catch (error) {
        console.error('❌ Erro durante teste:', error.message);
    }
}

// Executar teste
testIntegritySystem();