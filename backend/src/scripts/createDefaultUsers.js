// Script para criar usuários padrão no sistema
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createDefaultUsers() {
  console.log('🔄 Criando usuários padrão...');

  const saltRounds = 12;
  
  const defaultUsers = [
    {
      email: 'admin@glgarantias.com',
      name: 'Administrador',
      password: 'Admin123!',
      role: 'admin',
      permissions: ['*']
    },
    {
      email: 'manager@glgarantias.com',
      name: 'Gerente',
      password: 'Manager123!',
      role: 'manager',
      permissions: ['view_dashboard', 'view_reports', 'manage_service_orders', 'manage_mechanics', 'export_data', 'view_ai_classifications']
    },
    {
      email: 'user@glgarantias.com',
      name: 'Usuário',
      password: 'User123!',
      role: 'user',
      permissions: ['view_dashboard', 'view_reports', 'view_service_orders']
    }
  ];

  for (const userData of defaultUsers) {
    try {
      console.log(`📝 Criando usuário: ${userData.email}`);
      
      // Verificar se usuário já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        console.log(`⚠️ Usuário ${userData.email} já existe`);
        continue;
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Criar usuário
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          name: userData.name,
          password_hash: passwordHash,
          role: userData.role,
          permissions: userData.permissions,
          is_active: true,
          email_verified: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Erro ao criar usuário ${userData.email}:`, error);
      } else {
        console.log(`✅ Usuário ${userData.email} criado com sucesso!`);
      }

    } catch (error) {
      console.error(`❌ Erro ao processar usuário ${userData.email}:`, error);
    }
  }

  console.log('🎉 Processo de criação de usuários concluído!');
  
  // Listar usuários criados
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, name, role, is_active, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Erro ao listar usuários:', error);
  } else {
    console.log('\n📋 Usuários no sistema:');
    console.table(users);
  }
}

// Executar script
createDefaultUsers()
  .then(() => {
    console.log('\n✨ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro ao executar script:', error);
    process.exit(1);
  });