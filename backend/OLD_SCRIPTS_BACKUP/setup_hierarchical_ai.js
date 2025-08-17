const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function setupHierarchicalAI() {
  console.log('🏗️ CONFIGURANDO SISTEMA DE IA HIERÁRQUICO\n');

  try {
    // 1. Limpar classificações excessivas - manter apenas para defeitos válidos
    console.log('1️⃣ Limpando classificações excessivas...');
    
    // Buscar defeitos válidos (>3 chars)
    const { data: validDefects } = await supabase
      .from('service_orders')
      .select('id, raw_defect_description')
      .not('raw_defect_description', 'is', null)
      .not('raw_defect_description', 'eq', '');
    
    const validDefectIds = validDefects
      ?.filter(d => d.raw_defect_description && d.raw_defect_description.trim().length > 3)
      ?.map(d => d.id) || [];
    
    console.log(`📊 Defeitos válidos encontrados: ${validDefectIds.length}`);
    
    // Remover classificações para defeitos inválidos
    const { error: cleanError } = await supabase
      .from('defect_classifications')
      .delete()
      .not('service_order_id', 'in', `(${validDefectIds.join(',')})`);
    
    if (cleanError) {
      console.error('❌ Erro na limpeza:', cleanError.message);
    } else {
      console.log('✅ Classificações excessivas removidas');
    }
    
    // 2. Criar estrutura hierárquica de categorias
    console.log('\n2️⃣ Criando estrutura hierárquica...');
    
    // Limpar categorias existentes
    await supabase.from('defect_categories').delete().neq('id', 0);
    
    const hierarchicalCategories = [
      // NÍVEL 1: GRUPOS PRINCIPAIS
      {
        id: 100, name: 'Vazamentos', level: 1, parent: null, 
        color: '#DC2626', icon: 'droplets',
        keywords: ['vazamento', 'vaza', 'gotej', 'ping', 'escorr', 'oleo', 'agua']
      },
      {
        id: 200, name: 'Problemas Mecânicos', level: 1, parent: null,
        color: '#7C2D12', icon: 'wrench',
        keywords: ['quebr', 'danific', 'desgast', 'gast', 'worn']
      },
      {
        id: 300, name: 'Problemas Térmicos', level: 1, parent: null,
        color: '#EA580C', icon: 'thermometer',
        keywords: ['esquent', 'quent', 'temperatura', 'calor', 'fervend']
      },
      {
        id: 400, name: 'Problemas Elétricos', level: 1, parent: null,
        color: '#2563EB', icon: 'zap',
        keywords: ['eletric', 'vela', 'bobina', 'bateria', 'sensor']
      },
      {
        id: 500, name: 'Ruídos e Vibrações', level: 1, parent: null,
        color: '#7C3AED', icon: 'volume-2',
        keywords: ['barulh', 'ruido', 'som', 'estalo', 'batid', 'vibrac']
      },
      {
        id: 600, name: 'Operacionais', level: 1, parent: null,
        color: '#059669', icon: 'settings',
        keywords: ['test', 'verifica', 'manutencao', 'ajust']
      },
      
      // NÍVEL 2: SUBGRUPOS
      // Vazamentos
      {
        id: 101, name: 'Vazamentos Externos', level: 2, parent: 100,
        color: '#EF4444', keywords: ['retentor', 'junta', 'vedacao', 'carter', 'tampa']
      },
      {
        id: 102, name: 'Vazamentos Internos', level: 2, parent: 100,
        color: '#F87171', keywords: ['interno', 'combustao', 'cilindro', 'pistao']
      },
      
      // Problemas Mecânicos  
      {
        id: 201, name: 'Desgaste de Componentes', level: 2, parent: 200,
        color: '#A16207', keywords: ['desgast', 'gast', 'usado', 'worn', 'pistao', 'anel']
      },
      {
        id: 202, name: 'Componentes Quebrados', level: 2, parent: 200,
        color: '#B45309', keywords: ['quebr', 'rachad', 'partit', 'danific', 'quebra']
      },
      {
        id: 203, name: 'Perda de Peças', level: 2, parent: 200,
        color: '#C2410C', keywords: ['perdeu', 'falta', 'ausente', 'sem', 'perdido']
      },
      
      // Problemas Térmicos
      {
        id: 301, name: 'Superaquecimento', level: 2, parent: 300,
        color: '#F97316', keywords: ['superaque', 'muito quente', 'fervend', 'vapor']
      },
      {
        id: 302, name: 'Problemas de Resfriamento', level: 2, parent: 300,
        color: '#FB923C', keywords: ['resfri', 'radiador', 'ventoinha', 'termostato']
      },
      
      // Problemas Elétricos
      {
        id: 401, name: 'Sistema de Ignição', level: 2, parent: 400,
        color: '#3B82F6', keywords: ['ignicao', 'vela', 'bobina', 'centelha', 'faisca']
      },
      {
        id: 402, name: 'Sistema Elétrico', level: 2, parent: 400,
        color: '#60A5FA', keywords: ['bateria', 'alternador', 'chicote', 'fio', 'sensor']
      },
      
      // Ruídos e Vibrações
      {
        id: 501, name: 'Ruídos Anômalos', level: 2, parent: 500,
        color: '#8B5CF6', keywords: ['barulh', 'ruido', 'som anormal', 'chiado', 'apito']
      },
      {
        id: 502, name: 'Vibrações', level: 2, parent: 500,
        color: '#A78BFA', keywords: ['vibrac', 'trepid', 'balanc', 'oscila']
      },
      
      // Operacionais
      {
        id: 601, name: 'Testes e Verificações', level: 2, parent: 600,
        color: '#10B981', keywords: ['test', 'verifica', 'checagem', 'analise']
      },
      {
        id: 602, name: 'Falhas Operacionais', level: 2, parent: 600,
        color: '#34D399', keywords: ['nao pega', 'nao liga', 'falha', 'erro']
      },
      
      // NÍVEL 3: SUBSUBGRUPOS
      // Vazamentos Externos
      {
        id: 1011, name: 'Retentor Dianteiro', level: 3, parent: 101,
        color: '#FCA5A5', keywords: ['retentor dianteiro', 'retentor da frente']
      },
      {
        id: 1012, name: 'Retentor Traseiro', level: 3, parent: 101,
        color: '#FECACA', keywords: ['retentor traseiro', 'retentor de tras']
      },
      {
        id: 1013, name: 'Tampa de Válvulas', level: 3, parent: 101,
        color: '#FED7D7', keywords: ['tampa de valvula', 'tampa superior']
      }
    ];
    
    // Inserir categorias hierárquicas
    for (const category of hierarchicalCategories) {
      const { error } = await supabase
        .from('defect_categories')
        .insert({
          id: category.id,
          category_name: category.name,
          hierarchy_level: category.level,
          parent_category_id: category.parent,
          color_hex: category.color,
          icon: category.icon,
          keywords: category.keywords || [],
          is_active: true,
          total_occurrences: 0,
          full_path: category.level === 1 ? category.name : 
                    category.level === 2 ? `Grupo > ${category.name}` :
                    `Grupo > Subgrupo > ${category.name}`
        });
      
      if (error && !error.message.includes('duplicate key')) {
        console.error(`❌ Erro ao inserir ${category.name}:`, error.message);
      } else {
        console.log(`✅ Categoria criada: ${category.name} (Nível ${category.level})`);
      }
    }
    
    console.log('\n3️⃣ Estrutura hierárquica criada com sucesso!');
    
    // Verificar resultado
    const { count } = await supabase
      .from('defect_categories')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    console.log(`📊 Total de categorias hierárquicas: ${count}`);
    
    return { success: true, categoriesCreated: count };
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    return { success: false, error: error.message };
  }
}

setupHierarchicalAI()
  .then(result => {
    console.log('\n✅ Setup concluído:', result);
  })
  .catch(console.error);