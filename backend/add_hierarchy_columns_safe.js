const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function adicionarColunasHierarquia() {
  console.log('🔧 Adicionando colunas hierárquicas de forma segura...');
  
  try {
    // Verificar se as colunas já existem
    const { data: colunas } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'defect_categories');
    
    const colunasExistentes = colunas?.map(c => c.column_name) || [];
    console.log('📋 Colunas existentes:', colunasExistentes);
    
    // Simular a adição das colunas usando atualizações diretas
    console.log('🎯 Simulando estrutura hierárquica usando categorias existentes...');
    
    // Buscar categorias existentes
    const { data: categorias } = await supabase
      .from('defect_categories')
      .select('*');
    
    console.log('📊 Total de categorias:', categorias?.length);
    
    // Criar estrutura hierárquica virtual usando description field
    const estruturaHierarquica = {
      'Vazamentos': [
        'Vazamento de Óleo',
        'Vazamento de Água/Refrigerante', 
        'Outros Vazamentos',
        'Vazamento Carter',
        'Vazamentos'
      ],
      'Problemas Mecânicos': [
        'Problemas Mecânicos'
      ],
      'Ruídos e Sons': [
        'Ruídos Anômalos'
      ],
      'Temperatura': [
        'Superaquecimento'
      ],
      'Sistema Elétrico': [
        'Problemas Elétricos'
      ],
      'Operacional': [
        'Operacional'
      ]
    };
    
    // Atualizar cada categoria com informação hierárquica na description
    for (const [grupo, subcategorias] of Object.entries(estruturaHierarquica)) {
      for (const subcategoria of subcategorias) {
        const categoria = categorias?.find(c => c.category_name === subcategoria);
        if (categoria) {
          // Atualizar description para incluir hierarquia
          const novaDescricao = `[GRUPO: ${grupo}] ${categoria.description || ''}`;
          
          const { error } = await supabase
            .from('defect_categories')
            .update({
              description: novaDescricao
            })
            .eq('id', categoria.id);
          
          if (error) {
            console.error(`❌ Erro ao atualizar ${subcategoria}:`, error);
          } else {
            console.log(`✅ Atualizado: ${subcategoria} -> ${grupo}`);
          }
        }
      }
    }
    
    console.log('✅ Estrutura hierárquica implementada usando descriptions!');
    
    // Verificar resultado
    const { data: categoriasAtualizadas } = await supabase
      .from('defect_categories')
      .select('category_name, description')
      .order('category_name');
    
    console.log('📊 Estrutura final:');
    categoriasAtualizadas?.forEach(cat => {
      const grupo = cat.description?.match(/\[GRUPO: (.+?)\]/)?.[1] || 'Sem grupo';
      console.log(`  ${grupo} > ${cat.category_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

adicionarColunasHierarquia();