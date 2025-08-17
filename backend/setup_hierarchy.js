const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function setupHierarchicalSystem() {
  try {
    console.log('🏗️ Configurando sistema hierárquico...');

    // Verificar se as tabelas já existem
    const { data: existingHierarchy } = await supabase
      .from('defect_hierarchy')
      .select('id')
      .limit(1);

    const { data: existingClassifications } = await supabase
      .from('hierarchical_classifications')
      .select('id')
      .limit(1);

    console.log('Tabelas existem:', { 
      hierarchy: !!existingHierarchy, 
      classifications: !!existingClassifications 
    });

    // 3. Migrar dados existentes para hierarquia
    console.log('📦 Migrando categorias existentes...');

    // Buscar categorias atuais
    const { data: existingCategories } = await supabase
      .from('defect_categories')
      .select('*')
      .eq('is_active', true);

    if (existingCategories && existingCategories.length > 0) {
      // Inserir como grupos (nível 1)
      for (const cat of existingCategories) {
        const { error } = await supabase
          .from('defect_hierarchy')
          .insert({
            name: cat.category_name,
            description: cat.description,
            level: 1,
            parent_id: null,
            color_hex: cat.color_hex,
            icon: cat.icon,
            keywords: cat.keywords || [],
            ai_confidence: cat.ai_confidence || 0.0,
            total_occurrences: cat.total_occurrences || 0
          });

        if (error && error.message && !error.message.includes('duplicate')) {
          console.warn(`⚠️ Warning migrating ${cat.category_name}:`, error.message);
        }
      }
    }

    // 4. Criar subgrupos iniciais para principais categorias
    console.log('🌳 Criando estrutura hierárquica inicial...');

    // Buscar ID do grupo "Vazamentos"
    const { data: vazamentosGroup } = await supabase
      .from('defect_hierarchy')
      .select('id')
      .eq('name', 'Vazamentos')
      .eq('level', 1)
      .single();

    if (vazamentosGroup) {
      const vazamentosSubgroups = [
        { name: 'Óleo', description: 'Vazamentos de óleo', keywords: ['oleo', 'vazamento oleo', 'mancha oleo'] },
        { name: 'Água', description: 'Vazamentos de água/arrefecimento', keywords: ['agua', 'radiador', 'mangueira'] },
        { name: 'Combustível', description: 'Vazamentos de combustível', keywords: ['combustivel', 'gasolina', 'diesel'] }
      ];

      for (const sub of vazamentosSubgroups) {
        const { error } = await supabase
          .from('defect_hierarchy')
          .insert({
            name: sub.name,
            description: sub.description,
            level: 2,
            parent_id: vazamentosGroup.id,
            color_hex: '#DC2626',
            icon: 'droplet',
            keywords: sub.keywords
          });

        if (error && error.message && !error.message.includes('duplicate')) {
          console.warn(`⚠️ Warning creating subgroup ${sub.name}:`, error.message);
        }
      }
    }

    // 5. Criar subsubgrupos para "Óleo"
    const { data: oleoSubgroup } = await supabase
      .from('defect_hierarchy')
      .select('id')
      .eq('name', 'Óleo')
      .eq('level', 2)
      .single();

    if (oleoSubgroup) {
      const oleoSubsubgroups = [
        { name: 'Motor', description: 'Vazamento de óleo do motor', keywords: ['carter', 'cabecote', 'retentor'] },
        { name: 'Transmissão', description: 'Vazamento de óleo da transmissão', keywords: ['transmissao', 'cambio'] },
        { name: 'Direção', description: 'Vazamento de óleo da direção', keywords: ['direcao', 'bomba direcao'] }
      ];

      for (const subsub of oleoSubsubgroups) {
        const { error } = await supabase
          .from('defect_hierarchy')
          .insert({
            name: subsub.name,
            description: subsub.description,
            level: 3,
            parent_id: oleoSubgroup.id,
            color_hex: '#DC2626',
            icon: 'engine',
            keywords: subsub.keywords
          });

        if (error && error.message && !error.message.includes('duplicate')) {
          console.warn(`⚠️ Warning creating subsubgroup ${subsub.name}:`, error.message);
        }
      }
    }

    // 6. Verificar estrutura criada
    const { count: groupsCount } = await supabase
      .from('defect_hierarchy')
      .select('*', { count: 'exact', head: true })
      .eq('level', 1);

    const { count: subgroupsCount } = await supabase
      .from('defect_hierarchy')
      .select('*', { count: 'exact', head: true })
      .eq('level', 2);

    const { count: subsubgroupsCount } = await supabase
      .from('defect_hierarchy')
      .select('*', { count: 'exact', head: true })
      .eq('level', 3);

    console.log('✅ Sistema hierárquico configurado!');
    console.log(`📊 Grupos (nível 1): ${groupsCount || 0}`);
    console.log(`📊 Subgrupos (nível 2): ${subgroupsCount || 0}`);  
    console.log(`📊 Subsubgrupos (nível 3): ${subsubgroupsCount || 0}`);

    // Mostrar estrutura
    const { data: hierarchy } = await supabase
      .from('defect_hierarchy')
      .select('id, name, level, parent_id')
      .order('level')
      .order('name');

    console.log('\n🌳 Estrutura hierárquica:');
    hierarchy?.forEach(item => {
      const indent = '  '.repeat(item.level - 1);
      console.log(`${indent}${item.level === 1 ? '📁' : item.level === 2 ? '📂' : '📄'} ${item.name} (ID: ${item.id})`);
    });

  } catch (error) {
    console.error('❌ Erro na configuração:', error);
  }
}

setupHierarchicalSystem();