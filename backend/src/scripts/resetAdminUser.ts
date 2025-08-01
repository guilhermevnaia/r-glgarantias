import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function resetAdminUser() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

  console.log('🔄 Resetando usuário admin...');
  
  const adminEmail = 'admin@glgarantias.com';
  const adminPassword = 'Admin123';
  
  // Deletar usuário existente
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('email', adminEmail);
    
  if (deleteError) {
    console.log('⚠️ Erro ao deletar usuário existente:', deleteError);
  } else {
    console.log('🗑️ Usuário existente removido');
  }
  
  // Criar novo hash da senha
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
  
  // Criar novo usuário admin
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      email: adminEmail,
      name: 'Administrador',
      password_hash: passwordHash,
      role: 'admin',
      permissions: ['*'],
      is_active: true,
      created_at: new Date().toISOString()
    })
    .select('id, email, name, role')
    .single();

  if (insertError) {
    console.error('❌ Erro ao criar admin:', insertError);
    return;
  }

  console.log('✅ Usuário admin criado com sucesso!');
  console.log(`📧 Email: ${adminEmail}`);
  console.log(`🔑 Senha: ${adminPassword}`);
  console.log('⚠️ Use essas credenciais para fazer login');
  
  // Verificar se a senha funciona
  console.log('\n🧪 Testando senha...');
  const match = await bcrypt.compare(adminPassword, passwordHash);
  console.log(`Verificação: ${match ? '✅ OK' : '❌ FALHOU'}`);
}

resetAdminUser().catch(console.error);