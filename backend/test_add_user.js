const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAddUser() {
  console.log('🧪 === TESTE DE ADICIONAR USUÁRIO ===');
  
  try {
    // 1. Verificar se tabela users existe
    console.log('\n1. Verificando se tabela users existe...');
    const { data: tables, error: tableError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === 'PGRST116') {
      console.log('❌ PROBLEMA ENCONTRADO: Tabela users não existe!');
      console.log('📋 Vamos criar a tabela...');
      
      // Tentar criar a tabela usando SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255),
          role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
          permissions JSONB DEFAULT '[]',
          is_active BOOLEAN DEFAULT true,
          email_verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP WITH TIME ZONE,
          login_count INTEGER DEFAULT 0
        );
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { 
        sql: createTableSQL 
      });
      
      if (createError) {
        console.log('❌ Erro ao criar tabela:', createError);
        console.log('⚠️  Use o script SQL para criar a tabela manualmente');
        return;
      }
      
      console.log('✅ Tabela users criada com sucesso!');
    } else if (tableError) {
      console.log('❌ Erro ao verificar tabela:', tableError);
      return;
    } else {
      console.log('✅ Tabela users existe!');
    }

    // 2. Testar inserção de usuário
    console.log('\n2. Testando inserção de usuário...');
    
    const testUser = {
      name: 'Usuário Teste',
      email: 'teste@glgarantias.com',
      password_hash: '$2b$12$temporary.hash.for.first.login',
      role: 'user',
      permissions: ['view_dashboard', 'view_reports', 'view_service_orders'],
      is_active: true,
      email_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Primeiro, remover usuário de teste se existir
    await supabase
      .from('users')
      .delete()
      .eq('email', testUser.email);

    console.log('📝 Dados do usuário de teste:', testUser);

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([testUser])
      .select()
      .single();

    if (insertError) {
      console.log('❌ ERRO AO INSERIR USUÁRIO:', insertError);
      console.log('Código do erro:', insertError.code);
      console.log('Detalhes:', insertError.details);
      console.log('Dica:', insertError.hint);
      return;
    }

    console.log('✅ Usuário inserido com sucesso!');
    console.log('👤 Dados do usuário criado:', newUser);

    // 3. Testar busca de usuários
    console.log('\n3. Testando busca de usuários...');
    
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (fetchError) {
      console.log('❌ ERRO AO BUSCAR USUÁRIOS:', fetchError);
      return;
    }

    console.log('✅ Busca de usuários funcionando!');
    console.log(`📊 Total de usuários no banco: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role} - ${user.is_active ? 'Ativo' : 'Inativo'}`);
    });

    // 4. Limpar dados de teste
    console.log('\n4. Limpando dados de teste...');
    
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', testUser.email);

    if (deleteError) {
      console.log('⚠️  Erro ao limpar dados de teste:', deleteError);
    } else {
      console.log('✅ Dados de teste removidos');
    }

    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    
  } catch (error) {
    console.log('❌ ERRO GERAL NO TESTE:', error);
  }
}

// Executar teste
testAddUser();