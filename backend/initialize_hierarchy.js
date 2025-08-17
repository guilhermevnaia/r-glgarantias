const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function initializeHierarchy() {
  console.log('🚀 Inicializando hierarquia padrão...');

  // Primeiro criar grupos básicos
  const groups = [
    {
      name: 'Vazamentos',
      description: 'Problemas relacionados a vazamentos de fluidos',
      keywords: ['vazamento','vaza','gotej','oleo','agua','fluid','respingo'],
      level: 1,
      parent_id: null,
      color_hex: '#DC2626',
      icon: 'droplet',
      ai_confidence: 0.9,
      total_occurrences: 0,
      is_active: true
    },
    {
      name: 'Problemas Mecânicos',
      description: 'Falhas em componentes mecânicos',
      keywords: ['quebr','rachad','danific','desgast','pistao','biela','mecanico'],
      level: 1,
      parent_id: null,
      color_hex: '#EA580C',
      icon: 'wrench',
      ai_confidence: 0.9,
      total_occurrences: 0,
      is_active: true
    },
    {
      name: 'Ruídos',
      description: 'Problemas de ruído e barulho',
      keywords: ['barulh','ruido','som','estalo','batid','zunid'],
      level: 1,
      parent_id: null,
      color_hex: '#CA8A04',
      icon: 'volume-2',
      ai_confidence: 0.9,
      total_occurrences: 0,
      is_active: true
    },
    {
      name: 'Problemas Elétricos',
      description: 'Falhas em sistema elétrico',
      keywords: ['eletric','vela','bobina','bateria','sensor'],
      level: 1,
      parent_id: null,
      color_hex: '#2563EB',
      icon: 'zap',
      ai_confidence: 0.9,
      total_occurrences: 0,
      is_active: true
    }
  ];

  try {
    for (const group of groups) {
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('defect_hierarchy')
        .select('id')
        .eq('name', group.name)
        .eq('level', 1)
        .single();

      if (existing) {
        console.log('⚠️ Grupo já existe:', group.name);
        continue;
      }

      const { data, error } = await supabase
        .from('defect_hierarchy')
        .insert(group)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar grupo:', group.name, error.message);
      } else {
        console.log('✅ Grupo criado:', group.name, 'ID:', data.id);
      }
    }

    // Agora criar alguns subgrupos
    console.log('\n🌳 Criando subgrupos...');

    // Buscar ID do grupo Vazamentos
    const { data: vazamentosGroup } = await supabase
      .from('defect_hierarchy')
      .select('id')
      .eq('name', 'Vazamentos')
      .eq('level', 1)
      .single();

    if (vazamentosGroup) {
      const subgroups = [
        {
          name: 'Vazamento de Óleo',
          description: 'Vazamentos específicos de óleo',
          keywords: ['oleo', 'lubrificant', 'motor', 'carter'],
          level: 2,
          parent_id: vazamentosGroup.id,
          color_hex: '#DC2626',
          icon: 'droplet',
          ai_confidence: 0.85,
          total_occurrences: 0,
          is_active: true
        },
        {
          name: 'Vazamento de Água',
          description: 'Vazamentos de água/refrigerante',
          keywords: ['agua', 'refrigerant', 'radiador', 'mangueira'],
          level: 2,
          parent_id: vazamentosGroup.id,
          color_hex: '#DC2626',
          icon: 'droplet',
          ai_confidence: 0.85,
          total_occurrences: 0,
          is_active: true
        }
      ];

      for (const subgroup of subgroups) {
        const { data: existingSub } = await supabase
          .from('defect_hierarchy')
          .select('id')
          .eq('name', subgroup.name)
          .eq('level', 2)
          .single();

        if (existingSub) {
          console.log('⚠️ Subgrupo já existe:', subgroup.name);
          continue;
        }

        const { data, error } = await supabase
          .from('defect_hierarchy')
          .insert(subgroup)
          .select()
          .single();

        if (error) {
          console.error('❌ Erro ao criar subgrupo:', subgroup.name, error.message);
        } else {
          console.log('✅ Subgrupo criado:', subgroup.name, 'ID:', data.id);
        }
      }
    }

    // Verificar resultado final
    const { data: hierarchy } = await supabase
      .from('defect_hierarchy')
      .select('*')
      .order('level')
      .order('name');

    console.log('\n📊 Hierarquia atual:');
    hierarchy?.forEach(item => {
      const indent = '  '.repeat(item.level - 1);
      const icon = item.level === 1 ? '📁' : item.level === 2 ? '📂' : '📄';
      console.log(`${indent}${icon} ${item.name} (Level ${item.level}, ID: ${item.id})`);
    });

    console.log(`\n✅ Hierarquia inicializada com ${hierarchy?.length || 0} nós!`);
    
    // Contar por level
    const levelCounts = { 1: 0, 2: 0, 3: 0 };
    hierarchy?.forEach(h => levelCounts[h.level]++);
    console.log(`📈 Grupos: ${levelCounts[1]}, Subgrupos: ${levelCounts[2]}, Subsubgrupos: ${levelCounts[3]}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

initializeHierarchy();