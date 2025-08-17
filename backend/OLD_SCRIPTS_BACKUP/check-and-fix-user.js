const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkAndFixUser() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  
  console.log('🔍 Verificando usuário admin...');
  
  try {
    // Verificar se o usuário existe
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@glgarantias.com');
    
    if (error) {
      console.error('❌ Erro ao buscar usuário:', error);
      return;
    }
    
    if (users && users.length > 0) {
      console.log('✅ Usuário encontrado:', users[0].email);
      
      // Testar senha atual
      const testPassword = 'Admin123';
      const isValid = await bcrypt.compare(testPassword, users[0].password_hash);
      
      if (isValid) {
        console.log('✅ Senha atual está correta!');
      } else {
        console.log('❌ Senha incorreta, recriando usuário...');
        await recreateUser();
      }
    } else {
      console.log('❌ Usuário não encontrado, criando...');
      await recreateUser();
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

async function recreateUser() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  
  try {
    // Deletar usuário existente
    await supabase
      .from('users')
      .delete()
      .eq('email', 'admin@glgarantias.com');
    
    // Criar novo usuário
    const password = 'Admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: 'admin@glgarantias.com',
          password_hash: hashedPassword,
          role: 'admin',
          name: 'Administrador',
          is_active: true
        }
      ])
      .select();
    
    if (error) {
      console.error('❌ Erro ao criar usuário:', error);
    } else {
      console.log('✅ Usuário admin recriado com sucesso!');
      console.log('📧 Email: admin@glgarantias.com');
      console.log('🔑 Senha: Admin123');
    }
    
  } catch (error) {
    console.error('❌ Erro ao recriar usuário:', error);
  }
}

checkAndFixUser(); 