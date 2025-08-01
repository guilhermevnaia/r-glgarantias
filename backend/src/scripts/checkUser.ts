import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';

dotenv.config();

async function checkUser() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

  console.log('🔍 Verificando usuário admin...');
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'admin@glgarantias.com');
  
  if (error) {
    console.log('❌ Erro:', error);
    return;
  }
  
  if (data && data.length > 0) {
    const user = data[0];
    console.log('✅ Usuário encontrado:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Ativo: ${user.is_active}`);
    console.log(`   Criado em: ${user.created_at}`);
    
    // Testar senha
    const testPasswords = ['Admin123', 'Admin123!@#', 'admin123'];
    
    for (const password of testPasswords) {
      const match = await bcrypt.compare(password, user.password_hash);
      console.log(`   Senha "${password}": ${match ? '✅ CORRETA' : '❌ INCORRETA'}`);
    }
  } else {
    console.log('❌ Usuário não encontrado');
  }
}

checkUser().catch(console.error);