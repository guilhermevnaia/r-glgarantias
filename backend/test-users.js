const axios = require('axios');

const API_BASE_URL = 'http://localhost:3007';

async function testUsersAPI() {
  try {
    console.log('🧪 Testando API de usuários...\n');

    // 1. Testar GET /api/v1/users
    console.log('1️⃣ Testando GET /api/v1/users...');
    try {
      const usersResponse = await axios.get(`${API_BASE_URL}/api/v1/users`);
      console.log('✅ GET /api/v1/users:', usersResponse.status, usersResponse.data);
    } catch (error) {
      console.log('❌ GET /api/v1/users falhou:', error.response?.status, error.response?.data);
    }

    // 2. Testar POST /api/v1/users
    console.log('\n2️⃣ Testando POST /api/v1/users...');
    try {
      const newUser = {
        name: 'Usuário Teste',
        email: 'teste@glgarantias.com',
        role: 'user'
      };
      
      const addUserResponse = await axios.post(`${API_BASE_URL}/api/v1/users`, newUser);
      console.log('✅ POST /api/v1/users:', addUserResponse.status, addUserResponse.data);
      
      // Se conseguiu criar, testar atualização
      if (addUserResponse.data.data?.id) {
        const userId = addUserResponse.data.data.id;
        
        console.log('\n3️⃣ Testando PUT /api/v1/users/:id...');
        try {
          const updateData = { name: 'Usuário Teste Atualizado' };
          const updateResponse = await axios.put(`${API_BASE_URL}/api/v1/users/${userId}`, updateData);
          console.log('✅ PUT /api/v1/users/:id:', updateResponse.status, updateResponse.data);
        } catch (error) {
          console.log('❌ PUT /api/v1/users/:id falhou:', error.response?.status, error.response?.data);
        }
        
        console.log('\n4️⃣ Testando DELETE /api/v1/users/:id...');
        try {
          const deleteResponse = await axios.delete(`${API_BASE_URL}/api/v1/users/${userId}`);
          console.log('✅ DELETE /api/v1/users/:id:', deleteResponse.status, deleteResponse.data);
        } catch (error) {
          console.log('❌ DELETE /api/v1/users/:id falhou:', error.response?.status, error.response?.data);
        }
      }
      
    } catch (error) {
      console.log('❌ POST /api/v1/users falhou:', error.response?.status, error.response?.data);
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

// Executar teste
testUsersAPI(); 