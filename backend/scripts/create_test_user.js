const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createTestUser() {
  console.log('=== CRIANDO USUÁRIO DE TESTE PARA PRIMEIRO ACESSO ===');
  
  try {
    // Verificar se usuário já existe
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'joao@teste.com')
      .single();
    
    if (existing) {
      console.log('❌ Usuário já existe:', existing.email);
      console.log('🔑 Senha atual:', existing.password_hash ? 'TEM SENHA' : 'SEM SENHA');
      return;
    }
    
    // Criar usuário com senha temporária (será substituída no primeiro login)  
    const bcrypt = require('bcryptjs');
    const tempPassword = await bcrypt.hash('TEMP_PASSWORD_' + Date.now(), 10);
    
    const userData = {
      name: 'João Teste',
      email: 'joao@teste.com',
      password_hash: tempPassword, // Senha temporária
      role: 'user',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      login_count: 0 // Usar login_count = 0 como indicador de primeiro acesso
    };
    
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar usuário:', error);
      return;
    }
    
    console.log('✅ Usuário criado com sucesso!');
    console.log('📧 Email:', data.email);
    console.log('👤 Nome:', data.name);
    console.log('🎯 Login Count (0 = primeiro acesso):', data.login_count);
    console.log('');
    console.log('🧪 PARA TESTAR:');
    console.log('1. Acesse http://localhost:3000');
    console.log('2. Digite o email:', data.email);
    console.log('3. O sistema deve detectar que é primeiro acesso');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTestUser();