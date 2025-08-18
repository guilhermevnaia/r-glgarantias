const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createProductionUser() {
  console.log('🚀 CRIANDO USUÁRIO DE PRODUÇÃO...');
  console.log('Supabase URL:', supabaseUrl);
  
  try {
    // Verificar se o usuário já existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'guiilhermenaia@gmail.com')
      .single();
    
    if (existingUser) {
      console.log('✅ Usuário já existe em produção!');
      console.log('- ID:', existingUser.id);
      console.log('- Nome:', existingUser.name);
      console.log('- Email:', existingUser.email);
      console.log('- Role:', existingUser.role);
      console.log('- Ativo:', existingUser.is_active);
      console.log('- Login count:', existingUser.login_count);
      return;
    }
    
    // Criar o usuário se não existe
    console.log('⚠️ Usuário não existe. Criando...');
    
    const userData = {
      name: 'Guilherme Naia',
      email: 'guiilhermenaia@gmail.com', 
      role: 'admin',
      is_active: true,
      password_hash: '$2b$12$dummy.hash.that.will.be.replaced.on.first.login.setup',
      login_count: 0,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select();
    
    if (error) {
      console.error('❌ Erro ao criar usuário:', error);
      return;
    }
    
    console.log('✅ Usuário criado com sucesso em PRODUÇÃO!');
    console.log('- ID:', data[0].id);
    console.log('- Nome:', data[0].name);
    console.log('- Email:', data[0].email);
    console.log('- Role:', data[0].role);
    console.log('- Ativo:', data[0].is_active);
    console.log('- Login count:', data[0].login_count);
    console.log('');
    console.log('🔑 Usuário pronto para definir senha no primeiro login!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createProductionUser();