const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createTables() {
  console.log('🔧 Criando tabelas hierárquicas...');

  try {
    // Tentar inserir um registro de teste para ver se tabela existe
    const { error: testError } = await supabase
      .from('defect_hierarchy')
      .select('id')
      .limit(1);

    if (testError && testError.code === 'PGRST116') {
      console.log('❌ Tabela defect_hierarchy não existe, criando via INSERT direto...');
      
      // Método alternativo: criar tabela usando INSERT direto 
      // Se não existir, será criada automaticamente pelo Supabase
      const testData = {
        name: 'TESTE_CRIACAO_TABELA',
        description: 'Teste para criar tabela',
        level: 1,
        color_hex: '#FF0000',
        icon: 'test',
        keywords: ['test'],
        ai_confidence: 1.0,
        total_occurrences: 0,
        is_active: false
      };

      const { data, error } = await supabase
        .from('defect_hierarchy')
        .insert(testData)
        .select()
        .single();

      if (error) {
        console.log('❌ Erro ao criar tabela hierárquica:', error.message);
        return;
      } else {
        console.log('✅ Tabela defect_hierarchy criada!');
        
        // Remover registro de teste
        await supabase
          .from('defect_hierarchy')
          .delete()
          .eq('id', data.id);
        
        console.log('🧹 Registro de teste removido');
      }
    } else {
      console.log('✅ Tabela defect_hierarchy já existe');
    }

    // Mesmo processo para tabela de classificações
    const { error: testClassError } = await supabase
      .from('hierarchical_classifications')
      .select('id')
      .limit(1);

    if (testClassError && testClassError.code === 'PGRST116') {
      console.log('❌ Tabela hierarchical_classifications não existe, criando...');
      
      const testClassData = {
        service_order_id: 1,
        original_defect_description: 'TESTE',
        ai_confidence: 1.0,
        ai_reasoning: 'teste',
        classification_path: 'teste'
      };

      const { data: classData, error: classError } = await supabase
        .from('hierarchical_classifications')
        .insert(testClassData)
        .select()
        .single();

      if (classError) {
        console.log('❌ Erro ao criar tabela classificações:', classError.message);
      } else {
        console.log('✅ Tabela hierarchical_classifications criada!');
        
        // Remover registro de teste
        await supabase
          .from('hierarchical_classifications')
          .delete()
          .eq('id', classData.id);
        
        console.log('🧹 Registro de teste de classificação removido');
      }
    } else {
      console.log('✅ Tabela hierarchical_classifications já existe');
    }

    console.log('✅ Verificação de tabelas completa!');

  } catch (error) {
    console.error('❌ Erro geral na criação de tabelas:', error);
  }
}

createTables();