const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanDatabase() {
  console.log('🧹 Limpando banco de dados...');
  
  try {
    // 1. Deletar todas as ordens de serviço
    const { error: deleteOrdersError } = await supabase
      .from('service_orders')
      .delete()
      .gte('id', 0);
    
    if (deleteOrdersError) {
      console.error('❌ Erro ao deletar service_orders:', deleteOrdersError);
    } else {
      console.log('✅ service_orders limpo');
    }
    
    // 2. Deletar erros de processamento primeiro (foreign key)
    const { error: deleteErrorsError } = await supabase
      .from('processing_errors')
      .delete()
      .gte('id', 0);
    
    if (deleteErrorsError) {
      console.error('❌ Erro ao deletar processing_errors:', deleteErrorsError);
    } else {
      console.log('✅ processing_errors limpo');
    }
    
    // 3. Deletar logs de processamento
    const { error: deleteLogsError } = await supabase
      .from('file_processing_logs')
      .delete()
      .gte('id', 0);
    
    if (deleteLogsError) {
      console.error('❌ Erro ao deletar file_processing_logs:', deleteLogsError);
    } else {
      console.log('✅ file_processing_logs limpo');
    }
    
    console.log('🎯 Banco de dados limpo e pronto para novo teste');
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

cleanDatabase();