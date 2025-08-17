// S:\comp-glgarantias\r-glgarantias\backend\scripts\truncate_all_data.js

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: 'S:/comp-glgarantias/r-glgarantias/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tablesToTruncate = [
  'defect_classifications',
  'service_orders',
  'upload_logs',
  'defect_hierarchy',
  'mechanics',
  'quality_metrics'
];

async function truncateAllData() {
  console.log('🔥 ATENÇÃO: Este script irá apagar permanentemente os dados das seguintes tabelas:');
  console.log(tablesToTruncate.join(', '));
  console.log('A operação começará em 5 segundos...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    for (const table of tablesToTruncate) {
      console.log(`🗑️ Limpando a tabela: ${table}...`);
      const { error } = await supabase.from(table).delete().neq('id', -1); // Deleta todas as linhas

      if (error) {
        // Ignorar erro se a tabela não existir
        if (error.code === '42P01') {
          console.warn(`⚠️  Aviso: A tabela "${table}" não foi encontrada. Pulando.`);
        } else {
          console.error(`❌ Erro ao limpar a tabela ${table}:`, error.message);
          // Parar o script se houver um erro crítico
          throw new Error(`Falha ao truncar ${table}.`);
        }
      } else {
        console.log(`✅ Tabela ${table} limpa com sucesso.`);
      }
    }

    console.log('\n🎉 Operação concluída! Todas as tabelas especificadas foram limpas.');
    console.log('🚀 Você pode fazer o upload da nova planilha agora.');

  } catch (error) {
    console.error('\n🛑 Erro fatal durante a operação de limpeza:', error.message);
    process.exit(1);
  }
}

// Função auxiliar para executar SQL arbitrário (necessária para TRUNCATE)
// Esta função precisa ser criada no Supabase SQL Editor primeiro.
/*
  CREATE OR REPLACE FUNCTION execute_sql(sql TEXT)
  RETURNS void AS $$
  BEGIN
    EXECUTE sql;
  END;
  $$ LANGUAGE plpgsql;
*/

truncateAllData();
