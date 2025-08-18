require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkConnection() {
  console.log('--- Iniciando verificação de conexão com Supabase ---');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERRO CRÍTICO: As variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não foram encontradas.');
    console.log('   Por favor, verifique seu arquivo .env ou as configurações de ambiente no seu provedor de hospedagem (Render).');
    return;
  }

  console.log('✅ Variáveis de ambiente carregadas.');
  console.log(`   URL: ${supabaseUrl.substring(0, 20)}...`); // Mostra apenas o início da URL por segurança

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('🔌 Cliente Supabase criado. Tentando buscar dados...');

    const { data, error } = await supabase
      .from('users')
      .select('email, name, role, created_at')
      .limit(3);

    if (error) {
      console.error('❌ FALHA NA CONEXÃO COM O BANCO DE DADOS:');
      console.error('   Ocorreu um erro ao tentar buscar os usuários.');
      console.error('   Mensagem de erro do Supabase:', error.message);
      if (error.hint) {
        console.error('   Dica:', error.hint);
      }
      console.log('\n   CAUSA PROVÁVEL: A URL do Supabase ou a SERVICE_ROLE_KEY estão incorretas no ambiente onde o backend está rodando (Render).');
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ SUCESSO! Conexão com o banco de dados estabelecida.');
      console.log('   Usuários encontrados na tabela:');
      console.table(data);
    } else {
      console.log('⚠️ AVISO: A conexão funcionou, mas nenhum usuário foi encontrado na tabela "users".');
    }

  } catch (e) {
    console.error('💥 ERRO INESPERADO: Ocorreu uma exceção durante a tentativa de conexão.');
    console.error(e);
  } finally {
    console.log('\n--- Verificação de conexão finalizada ---');
  }
}

checkConnection();