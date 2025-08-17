const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugCheckFirstLogin() {
  const email = 'joao@teste.com';
  
  console.log('=== DEBUG CHECK FIRST LOGIN ===');
  console.log('Email:', email);
  console.log('Email lowercase:', email.toLowerCase());
  
  try {
    // Buscar usuário exatamente como no AuthController
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, login_count, is_active')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();
    
    console.log('Query error:', error);
    console.log('User found:', user);
    
    if (error || !user) {
      console.log('❌ Usuário não encontrado ou erro');
      return;
    }
    
    const requiresPasswordSetup = (user.login_count || 0) === 0;
    console.log('✅ Usuário encontrado!');
    console.log('Login count:', user.login_count);
    console.log('Requires password setup:', requiresPasswordSetup);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugCheckFirstLogin();