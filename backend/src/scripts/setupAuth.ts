import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Usar service role key para admin operations
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupAuthSystem() {
  console.log('🔐 Configurando sistema de autenticação...');

  try {
    // 1. Verificar se tabela users existe
    console.log('📋 Verificando tabela users...');
    
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      // Tabela não existe, criar
      console.log('🛠️ Criando tabela users...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
          permissions JSONB DEFAULT '[]'::jsonb,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP WITH TIME ZONE,
          login_count INTEGER DEFAULT 0
        );

        -- Índices para performance
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

        -- RLS (Row Level Security) - desabilitado para simplificar
        ALTER TABLE users DISABLE ROW LEVEL SECURITY;
      `;

      // Executar via RPC já que não podemos executar DDL diretamente
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (createError) {
        console.error('❌ Erro ao criar tabela:', createError);
        return;
      }
      
      console.log('✅ Tabela users criada com sucesso');
    } else {
      console.log('✅ Tabela users já existe');
    }

    // 2. Verificar se já existe um admin
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'admin');

    if (adminError) {
      console.error('❌ Erro ao verificar admins:', adminError);
      return;
    }

    if (adminUsers && adminUsers.length > 0) {
      console.log('✅ Admin já existe:', adminUsers[0].email);
      return;
    }

    // 3. Criar usuário admin inicial
    console.log('👑 Criando usuário admin inicial...');
    
    const adminEmail = 'admin@glgarantias.com';
    const adminPassword = 'Admin123!@#';
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    const { data: newAdmin, error: insertError } = await supabase
      .from('users')
      .insert({
        email: adminEmail,
        name: 'Administrador',
        password_hash: passwordHash,
        role: 'admin',
        permissions: ['*'], // Todas as permissões
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select('id, email, name, role')
      .single();

    if (insertError) {
      console.error('❌ Erro ao criar admin:', insertError);
      return;
    }

    console.log('🎉 Sistema de autenticação configurado com sucesso!');
    console.log('👑 Admin criado:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Senha: ${adminPassword}`);
    console.log('⚠️  ALTERE A SENHA APÓS O PRIMEIRO LOGIN!');

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  setupAuthSystem();
}

export { setupAuthSystem };