const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addHierarchyColumns() {
  console.log('🔧 ADICIONANDO COLUNAS HIERÁRQUICAS...\n');

  try {
    // Verificar estrutura atual
    const { data: currentColumns } = await supabase
      .from('defect_categories')
      .select('*')
      .limit(1);
    
    console.log('📊 Estrutura atual da tabela:');
    if (currentColumns && currentColumns.length > 0) {
      console.log('Colunas existentes:', Object.keys(currentColumns[0]));
    }
    
    // Criar estrutura hierárquica simplificada primeiro
    console.log('\n1️⃣ Limpando dados existentes...');
    
    // Limpar classificações
    await supabase.from('defect_classifications').delete().neq('id', 0);
    console.log('✅ Classificações limpas');
    
    // Limpar categorias
    await supabase.from('defect_categories').delete().neq('id', 0);
    console.log('✅ Categorias limpas');
    
    console.log('\n2️⃣ Criando categorias hierárquicas simplificadas...');
    
    // Estrutura hierárquica simplificada (sem colunas extras por enquanto)
    const categories = [
      // GRUPOS PRINCIPAIS (Nível 1)
      {
        id: 100, 
        category_name: 'Vazamentos',
        description: 'Problemas relacionados a vazamentos de fluidos',
        color_hex: '#DC2626',
        icon: 'droplets',
        keywords: ['vazamento', 'vaza', 'gotej', 'ping', 'escorr', 'oleo', 'agua'],
        is_active: true,
        total_occurrences: 0
      },
      {
        id: 200,
        category_name: 'Problemas Mecânicos', 
        description: 'Problemas mecânicos e estruturais',
        color_hex: '#7C2D12',
        icon: 'wrench',
        keywords: ['quebr', 'danific', 'desgast', 'gast', 'worn'],
        is_active: true,
        total_occurrences: 0
      },
      {
        id: 300,
        category_name: 'Problemas Térmicos',
        description: 'Problemas relacionados a temperatura',
        color_hex: '#EA580C', 
        icon: 'thermometer',
        keywords: ['esquent', 'quent', 'temperatura', 'calor', 'fervend'],
        is_active: true,
        total_occurrences: 0
      },
      {
        id: 400,
        category_name: 'Problemas Elétricos',
        description: 'Problemas do sistema elétrico',
        color_hex: '#2563EB',
        icon: 'zap', 
        keywords: ['eletric', 'vela', 'bobina', 'bateria', 'sensor'],
        is_active: true,
        total_occurrences: 0
      },
      {
        id: 500,
        category_name: 'Ruídos e Vibrações',
        description: 'Problemas de ruído e vibração', 
        color_hex: '#7C3AED',
        icon: 'volume-2',
        keywords: ['barulh', 'ruido', 'som', 'estalo', 'batid', 'vibrac'],
        is_active: true,
        total_occurrences: 0
      },
      {
        id: 600,
        category_name: 'Operacionais',
        description: 'Problemas operacionais e de funcionamento',
        color_hex: '#059669',
        icon: 'settings',
        keywords: ['test', 'verifica', 'manutencao', 'ajust', 'nao pega', 'falha'],
        is_active: true,
        total_occurrences: 0
      }
    ];
    
    // Inserir categorias
    for (const category of categories) {
      const { error } = await supabase
        .from('defect_categories')
        .insert(category);
      
      if (error) {
        console.error(`❌ Erro ao inserir ${category.category_name}:`, error.message);
      } else {
        console.log(`✅ Categoria criada: ${category.category_name}`);
      }
    }
    
    // Verificar resultado
    const { count } = await supabase
      .from('defect_categories')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Total de categorias criadas: ${count}`);
    
    return { success: true, categoriesCreated: count };
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    return { success: false, error: error.message };
  }
}

addHierarchyColumns()
  .then(result => {
    console.log('\n✅ Processo concluído:', result);
  })
  .catch(console.error);