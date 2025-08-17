const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsersTable() {
  try {
    console.log('🔍 Verificando estrutura da tabela users...\n');

    // 1. Verificar se a tabela existe
    console.log('1️⃣ Verificando se a tabela users existe...');
    try {
      const { data: tableInfo, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.log('❌ Tabela users não existe!');
        console.log('💡 Execute o script de setup: database/users_table.sql');
        return;
      } else if (error) {
        console.log('❌ Erro ao verificar tabela:', error);
        return;
      }

      console.log('✅ Tabela users existe');
    } catch (error) {
      console.log('❌ Erro ao verificar tabela:', error.message);
      return;
    }

    // 2. Verificar estrutura da tabela
    console.log('\n2️⃣ Verificando estrutura da tabela...');
    try {
      const { data: columns, error } = await supabase
        .rpc('get_table_columns', { table_name: 'users' });

      if (error) {
        console.log('⚠️ Não foi possível obter estrutura da tabela via RPC');
        console.log('💡 Verificando via query simples...');
        
        // Query alternativa para verificar estrutura
        const { data: sampleData, error: sampleError } = await supabase
          .from('users')
          .select('*')
          .limit(1);

        if (sampleError) {
          console.log('❌ Erro ao buscar dados de exemplo:', sampleError);
        } else {
          console.log('✅ Estrutura da tabela (baseada em dados de exemplo):');
          console.log(JSON.stringify(sampleData[0], null, 2));
        }
      } else {
        console.log('✅ Estrutura da tabela:');
        console.log(JSON.stringify(columns, null, 2));
      }
    } catch (error) {
      console.log('❌ Erro ao verificar estrutura:', error.message);
    }

    // 3. Verificar dados existentes
    console.log('\n3️⃣ Verificando dados existentes...');
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('id');

      if (error) {
        console.log('❌ Erro ao buscar usuários:', error);
      } else {
        console.log(`✅ Encontrados ${users.length} usuários:`);
        users.forEach(user => {
          console.log(`  - ID: ${user.id}, Nome: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
        });
      }
    } catch (error) {
      console.log('❌ Erro ao buscar usuários:', error.message);
    }

    // 4. Testar inserção
    console.log('\n4️⃣ Testando inserção de usuário...');
    try {
      const testUser = {
        name: 'Usuário Teste',
        email: 'teste-insercao@glgarantias.com',
        password_hash: '$2b$12$temporary.hash.for.first.login',
        role: 'user',
        permissions: ['view_dashboard', 'view_reports', 'view_service_orders'],
        is_active: true,
        email_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newUser, error } = await supabase
        .from('users')
        .insert([testUser])
        .select()
        .single();

      if (error) {
        console.log('❌ Erro ao inserir usuário de teste:', error);
        console.log('📋 Detalhes do erro:', JSON.stringify(error, null, 2));
      } else {
        console.log('✅ Usuário de teste inserido com sucesso:', newUser);
        
        // Remover usuário de teste
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', newUser.id);
        
        if (deleteError) {
          console.log('⚠️ Não foi possível remover usuário de teste:', deleteError);
        } else {
          console.log('✅ Usuário de teste removido');
        }
      }
    } catch (error) {
      console.log('❌ Erro ao testar inserção:', error.message);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar verificação
checkUsersTable(); 