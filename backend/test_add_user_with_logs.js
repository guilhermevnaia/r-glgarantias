const axios = require('axios');

const API_BASE_URL = 'http://localhost:3007';

async function testAddUserAPI() {
  console.log('🧪 === TESTE DE ADICIONAR USUÁRIO VIA API ===');
  
  try {
    // 1. Testar health check primeiro
    console.log('\n1. Testando health check...');
    
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`, { timeout: 3000 });
      console.log('✅ Backend está online:', healthResponse.data);
    } catch (error) {
      console.log('❌ Backend offline ou não respondendo:', error.message);
      console.log('🔧 Iniciando backend manualmente...');
      
      // Tentar conectar múltiplas portas
      const ports = [3005, 3007, 3009, 3008];
      let workingPort = null;
      
      for (const port of ports) {
        try {
          const testUrl = `http://localhost:${port}/health`;
          console.log(`🔍 Testando porta ${port}...`);
          const response = await axios.get(testUrl, { timeout: 1000 });
          console.log(`✅ Backend encontrado na porta ${port}:`, response.data);
          workingPort = port;
          break;
        } catch (err) {
          console.log(`❌ Porta ${port} não respondeu`);
        }
      }
      
      if (!workingPort) {
        console.log('❌ Nenhum backend encontrado. Execute: npm start no diretório backend');
        return;
      }
      
      // Atualizar URL base
      API_BASE_URL.replace('3007', workingPort.toString());
    }

    // 2. Testar adicionar usuário
    console.log('\n2. Testando adicionar usuário via API...');
    
    const userData = {
      name: 'Usuário API Teste',
      email: 'testeapi@glgarantias.com',
      role: 'user'
    };

    console.log('📝 Dados enviados:', userData);
    console.log('🌐 URL:', `${API_BASE_URL}/api/v1/users`);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/users`, userData, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ SUCESSO! Usuário adicionado via API');
      console.log('📊 Status:', response.status);
      console.log('📦 Resposta:', response.data);

    } catch (error) {
      console.log('❌ ERRO ao adicionar usuário via API');
      console.log('📊 Status:', error.response?.status);
      console.log('📦 Resposta:', error.response?.data);
      console.log('🔍 Mensagem completa do erro:', error.message);
      
      if (error.response?.status === 401) {
        console.log('🔐 PROBLEMA: Endpoint requer autenticação!');
        console.log('💡 SOLUÇÃO: Adicione middleware de auth ou remova proteção temporariamente');
      }
      
      if (error.response?.status === 500) {
        console.log('🗄️ PROBLEMA: Erro interno do servidor (possivelmente banco de dados)');
        console.log('💡 SOLUÇÃO: Verificar conexão com Supabase e logs do servidor');
      }
    }

    // 3. Testar buscar usuários
    console.log('\n3. Testando buscar usuários...');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/users`, {
        timeout: 5000
      });

      console.log('✅ SUCESSO! Usuários buscados via API');
      console.log('📊 Status:', response.status);
      console.log(`👥 Total de usuários: ${response.data.data?.length || 0}`);

    } catch (error) {
      console.log('❌ ERRO ao buscar usuários via API');
      console.log('📊 Status:', error.response?.status);
      console.log('📦 Resposta:', error.response?.data);
      
      if (error.response?.status === 401) {
        console.log('🔐 PROBLEMA: Endpoint requer autenticação!');
      }
    }

  } catch (error) {
    console.log('❌ ERRO GERAL NO TESTE:', error.message);
  }
}

// Executar teste
testAddUserAPI();