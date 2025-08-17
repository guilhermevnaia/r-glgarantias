// S:\comp-glgarantias\r-glgarantias\backend\scripts\fix_existing_parts_total.js
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente do backend
dotenv.config({ path: 'S:/comp-glgarantias/r-glgarantias/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPartsTotal() {
  console.log('🚀 Iniciando script para corrigir a regra de negócio `parts_total`...');

  try {
    // 1. Buscar todas as ordens de serviço onde a divisão pode não ter sido aplicada.
    // A coluna `original_parts_value` guarda o valor da planilha.
    // Se `parts_total` for igual a `original_parts_value`, a divisão não ocorreu.
    const { data: allOrders, error: fetchError } = await supabase
      .from('service_orders')
      .select('id, order_number, parts_total, original_parts_value')
      .filter('original_parts_value', 'gt', 0); // Apenas onde há valor de peça

    if (fetchError) {
      console.error('❌ Erro ao buscar ordens de serviço:', fetchError.message);
      return;
    }

    if (!allOrders || allOrders.length === 0) {
      console.log('✅ Nenhum registro com valor de peça encontrado. Nenhuma correção necessária.');
      return;
    }

    // Filtrar em memória os registros que precisam de correção
    const ordersToFix = allOrders.filter(order => {
      const partsTotal = parseFloat(order.parts_total);
      const originalPartsValue = parseFloat(order.original_parts_value);
      // A condição de correção é se parts_total é igual ao valor original
      return Math.abs(partsTotal - originalPartsValue) < 0.01;
    });

    if (fetchError) {
      console.error('❌ Erro ao buscar ordens de serviço:', fetchError.message);
      return;
    }

    if (!ordersToFix || ordersToFix.length === 0) {
      console.log('✅ Todos os registros já estão consistentes. Nenhuma correção necessária.');
      return;
    }

    console.log(`🔍 Encontrados ${ordersToFix.length} registros para corrigir.`);

    let successCount = 0;
    let errorCount = 0;

    // 2. Iterar e atualizar cada registro individualmente
    for (const order of ordersToFix) {
      const originalValue = parseFloat(order.original_parts_value);
      const correctedPartsTotal = originalValue / 2;

      const { error: updateError } = await supabase
        .from('service_orders')
        .update({ parts_total: correctedPartsTotal })
        .eq('id', order.id);

      if (updateError) {
        console.error(`   ❌ Erro ao corrigir OS #${order.order_number}: ${updateError.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ OS #${order.order_number} corrigida: ${order.parts_total} -> ${correctedPartsTotal}`);
        successCount++;
      }
    }

    console.log(`
🎉 Operação concluída!`);
    console.log(`   - ${successCount} registros corrigidos com sucesso.`);
    console.log(`   - ${errorCount} registros falharam.`);
    if (errorCount === 0) {
      console.log('Todos os dados existentes agora seguem a regra de negócio (parts_total / 2).');
    }

  } catch (error) {
    console.error('🛑 Erro fatal durante a execução do script:', error.message);
    process.exit(1);
  }
}

fixPartsTotal();
