const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDataIntegrity() {
  console.log('🔧 === CORREÇÃO DE INTEGRIDADE DE DADOS ===\n');
  
  let fixedCount = 0;
  let removedCount = 0;
  
  try {
    // 1. Remover classificações com category_id inválido
    console.log('1. 🧹 REMOVENDO CLASSIFICAÇÕES COM CATEGORY_ID INVÁLIDO...');
    
    const { data: validCategories } = await supabase
      .from('defect_categories')
      .select('id');
    
    const validCategoryIds = validCategories.map(cat => cat.id);
    
    const { data: invalidClassifications, error: invalidError } = await supabase
      .from('defect_classifications')
      .select('id, category_id, service_order_id')
      .not('category_id', 'in', `(${validCategoryIds.join(',')})`);
    
    if (invalidError) {
      console.error('❌ Erro ao buscar classificações inválidas:', invalidError);
    } else if (invalidClassifications && invalidClassifications.length > 0) {
      console.log(`🚨 Encontradas ${invalidClassifications.length} classificações com category_id inválido`);
      
      const { error: deleteError } = await supabase
        .from('defect_classifications')
        .delete()
        .not('category_id', 'in', `(${validCategoryIds.join(',')})`);
      
      if (deleteError) {
        console.error('❌ Erro ao remover classificações inválidas:', deleteError);
      } else {
        removedCount += invalidClassifications.length;
        console.log(`✅ Removidas ${invalidClassifications.length} classificações com category_id inválido`);
      }
    } else {
      console.log('✅ Nenhuma classificação com category_id inválido encontrada');
    }

    // 2. Remover classificações com service_order_id inválido
    console.log('\n2. 🧹 REMOVENDO CLASSIFICAÇÕES COM SERVICE_ORDER_ID INVÁLIDO...');
    
    const { data: validOrders } = await supabase
      .from('service_orders')
      .select('id');
    
    const validOrderIds = validOrders.map(order => order.id);
    
    // Buscar em batches para não sobrecarregar
    const { data: allClassifications } = await supabase
      .from('defect_classifications')
      .select('id, service_order_id');
    
    const invalidOrderClassifications = allClassifications.filter(c => !validOrderIds.includes(c.service_order_id));
    
    if (invalidOrderClassifications.length > 0) {
      console.log(`🚨 Encontradas ${invalidOrderClassifications.length} classificações com service_order_id inválido`);
      
      const invalidIds = invalidOrderClassifications.map(c => c.id);
      const { error: deleteError } = await supabase
        .from('defect_classifications')
        .delete()
        .in('id', invalidIds);
      
      if (deleteError) {
        console.error('❌ Erro ao remover classificações com OS inválida:', deleteError);
      } else {
        removedCount += invalidOrderClassifications.length;
        console.log(`✅ Removidas ${invalidOrderClassifications.length} classificações com service_order_id inválido`);
      }
    } else {
      console.log('✅ Nenhuma classificação com service_order_id inválido encontrada');
    }

    // 3. Remover duplicatas (manter apenas a mais recente por service_order_id)
    console.log('\n3. 🧹 REMOVENDO CLASSIFICAÇÕES DUPLICADAS...');
    
    const { data: duplicates } = await supabase.rpc('find_duplicate_classifications');
    
    if (duplicates && duplicates.length > 0) {
      console.log(`🚨 Encontradas ${duplicates.length} service_orders com classificações duplicadas`);
      
      for (const duplicate of duplicates) {
        // Buscar todas as classificações desta service_order_id
        const { data: orderClassifications } = await supabase
          .from('defect_classifications')
          .select('id, created_at')
          .eq('service_order_id', duplicate.service_order_id)
          .order('created_at', { ascending: false });
        
        if (orderClassifications && orderClassifications.length > 1) {
          // Manter apenas a mais recente (primeira da lista ordenada)
          const toKeep = orderClassifications[0];
          const toRemove = orderClassifications.slice(1);
          
          const idsToRemove = toRemove.map(c => c.id);
          
          const { error: deleteError } = await supabase
            .from('defect_classifications')
            .delete()
            .in('id', idsToRemove);
          
          if (deleteError) {
            console.error(`❌ Erro ao remover duplicatas da OS ${duplicate.service_order_id}:`, deleteError);
          } else {
            removedCount += toRemove.length;
            console.log(`✅ OS ${duplicate.service_order_id}: mantida classificação mais recente (${toKeep.id}), removidas ${toRemove.length} duplicatas`);
          }
        }
      }
    } else {
      console.log('✅ Nenhuma classificação duplicada encontrada');
    }

    // 4. Sincronizar contadores de categorias
    console.log('\n4. 🔄 SINCRONIZANDO CONTADORES DE CATEGORIAS...');
    
    const { data: categories } = await supabase
      .from('defect_categories')
      .select('id, category_name, total_occurrences');
    
    for (const category of categories) {
      const { count: actualCount } = await supabase
        .from('defect_classifications')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id);
      
      const currentCount = category.total_occurrences || 0;
      const realCount = actualCount || 0;
      
      if (currentCount !== realCount) {
        console.log(`🔄 Categoria "${category.category_name}": ${currentCount} → ${realCount}`);
        
        const { error: updateError } = await supabase
          .from('defect_categories')
          .update({ total_occurrences: realCount })
          .eq('id', category.id);
        
        if (updateError) {
          console.error(`❌ Erro ao atualizar contador da categoria ${category.id}:`, updateError);
        } else {
          fixedCount++;
        }
      }
    }

    // 5. Verificação final
    console.log('\n5. ✅ VERIFICAÇÃO FINAL...');
    
    const { count: finalClassifications } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalDefects } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');

    console.log(`📊 Total de classificações válidas: ${finalClassifications}`);
    console.log(`📊 Total de defeitos no sistema: ${finalDefects}`);
    
    if (finalDefects > 0) {
      const rate = ((finalClassifications / finalDefects) * 100).toFixed(1);
      console.log(`📊 Taxa de classificação atual: ${rate}%`);
    }

    // Resumo
    console.log('\n📋 RESUMO DA CORREÇÃO:');
    console.log(`🗑️ Classificações removidas: ${removedCount}`);
    console.log(`🔄 Contadores corrigidos: ${fixedCount}`);
    console.log(`📊 Classificações válidas restantes: ${finalClassifications}`);
    
    if (removedCount > 0 || fixedCount > 0) {
      console.log('\n✅ CORREÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('💡 Recomendação: Execute classificação em massa para processar defeitos pendentes.');
    } else {
      console.log('\n✅ DADOS JÁ ESTAVAM ÍNTEGROS!');
    }

  } catch (error) {
    console.error('❌ Erro crítico durante correção:', error);
  }
}

// Função auxiliar para criar função de busca de duplicatas no Supabase (se não existir)
async function createFindDuplicatesFunction() {
  try {
    const { error } = await supabase.rpc('find_duplicate_classifications');
    // Se a função não existir, vamos buscar duplicatas de forma alternativa
  } catch (error) {
    console.log('ℹ️ Usando método alternativo para encontrar duplicatas...');
    
    // Retornar duplicatas usando query normal
    const { data: allClassifications } = await supabase
      .from('defect_classifications')
      .select('service_order_id, id, created_at');
    
    const orderCounts = {};
    const duplicates = [];
    
    allClassifications.forEach(c => {
      if (orderCounts[c.service_order_id]) {
        orderCounts[c.service_order_id]++;
        if (orderCounts[c.service_order_id] === 2) {
          duplicates.push({ service_order_id: c.service_order_id });
        }
      } else {
        orderCounts[c.service_order_id] = 1;
      }
    });
    
    return duplicates;
  }
}

// Executar correção
fixDataIntegrity();