const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createSubsubgroups() {
  console.log('🔧 FASE 4: Criando subsubgrupos para refinamento da hierarquia...');

  try {
    // 1. Analisar "Vazamento de Óleo" (538 defeitos) - candidato principal
    console.log('\n📋 Analisando "Vazamento de Óleo" para subsubgrupos...');
    
    const { data: oleoDefects } = await supabase
      .from('defect_classifications')
      .select('original_defect_description')
      .eq('category_id', 25) // ID do "Vazamento de Óleo"
      .limit(100); // Analisar amostra

    console.log(`📊 Analisando ${oleoDefects.length} defeitos de óleo...`);

    const oleoSubsubgroups = analyzeOleoDefects(oleoDefects.map(d => d.original_defect_description));
    
    console.log(`🎯 Identificados ${oleoSubsubgroups.length} subsubgrupos para óleo:`);
    oleoSubsubgroups.forEach((subsubgroup, i) => {
      console.log(`\n${i+1}. ${subsubgroup.name}`);
      console.log(`   📝 ${subsubgroup.description}`);
      console.log(`   🔑 Keywords: ${subsubgroup.keywords.join(', ')}`);
      console.log(`   📊 ${subsubgroup.defectCount} defeitos`);
    });

    // 2. Analisar "Outros Vazamentos" (344 defeitos)
    console.log('\n📋 Analisando "Outros Vazamentos" para subsubgrupos...');
    
    const { data: outrosDefects } = await supabase
      .from('defect_classifications')
      .select('original_defect_description')
      .eq('category_id', 27) // ID do "Outros Vazamentos"
      .limit(80);

    const outrosSubsubgroups = analyzeOutrosDefects(outrosDefects.map(d => d.original_defect_description));
    
    console.log(`🎯 Identificados ${outrosSubsubgroups.length} subsubgrupos para outros:`);
    outrosSubsubgroups.forEach((subsubgroup, i) => {
      console.log(`\n${i+1}. ${subsubgroup.name}`);
      console.log(`   📝 ${subsubgroup.description}`);
      console.log(`   🔑 Keywords: ${subsubgroup.keywords.join(', ')}`);
      console.log(`   📊 ${subsubgroup.defectCount} defeitos`);
    });

    // 3. Criar os subsubgrupos no banco
    console.log('\n🔧 Criando subsubgrupos no banco de dados...');
    
    const allSubsubgroups = [...oleoSubsubgroups, ...outrosSubsubgroups];
    const createdSubsubgroups = [];

    for (const subsubgroup of allSubsubgroups) {
      try {
        // Verificar se já existe
        const { data: existing } = await supabase
          .from('defect_categories')
          .select('id')
          .eq('category_name', subsubgroup.name)
          .single();

        if (existing) {
          console.log(`⚠️ Subsubgrupo já existe: ${subsubgroup.name}`);
          continue;
        }

        // Criar subsubgrupo
        const { data: newSubsubgroup, error } = await supabase
          .from('defect_categories')
          .insert({
            category_name: subsubgroup.name,
            description: subsubgroup.description,
            keywords: subsubgroup.keywords,
            color_hex: generateSubsubgroupColor(),
            icon: selectSubsubgroupIcon(subsubgroup.name),
            is_active: true,
            ai_confidence: 0.8,
            total_occurrences: 0
          })
          .select()
          .single();

        if (error) {
          console.error(`❌ Erro ao criar subsubgrupo ${subsubgroup.name}:`, error.message);
        } else {
          console.log(`✅ Subsubgrupo criado: ${subsubgroup.name} (ID: ${newSubsubgroup.id})`);
          createdSubsubgroups.push({
            ...newSubsubgroup,
            parentCategory: subsubgroup.parentCategory
          });
        }

      } catch (error) {
        console.error(`❌ Erro na criação do subsubgrupo ${subsubgroup.name}:`, error);
      }
    }

    console.log(`\n🎉 Criação de subsubgrupos completa! ${createdSubsubgroups.length} subsubgrupos criados.`);

    // 4. Reclassificar alguns defeitos nos subsubgrupos (amostra)
    if (createdSubsubgroups.length > 0) {
      console.log('\n🔄 Reclassificando amostra de defeitos nos subsubgrupos...');
      await reclassifyIntoSubsubgroups(createdSubsubgroups);
    }

    return createdSubsubgroups;

  } catch (error) {
    console.error('❌ Erro geral na criação de subsubgrupos:', error);
  }
}

function analyzeOleoDefects(defects) {
  const subsubgroups = [];

  // Análise por localização do vazamento de óleo
  const carterDefects = defects.filter(d => 
    d.toLowerCase().includes('carter') ||
    d.toLowerCase().includes('oleo motor') ||
    d.toLowerCase().includes('drenar')
  );

  const cabecoteDefects = defects.filter(d => 
    d.toLowerCase().includes('cabecote') ||
    d.toLowerCase().includes('cabeçote') ||
    d.toLowerCase().includes('valvula') ||
    d.toLowerCase().includes('válvula')
  );

  const retentorDefects = defects.filter(d => 
    d.toLowerCase().includes('retentor') ||
    d.toLowerCase().includes('vedacao') ||
    d.toLowerCase().includes('vedação') ||
    d.toLowerCase().includes('junta')
  );

  const bombaDefects = defects.filter(d => 
    d.toLowerCase().includes('bomba') ||
    d.toLowerCase().includes('pressao') ||
    d.toLowerCase().includes('pressão')
  );

  if (carterDefects.length >= 8) {
    subsubgroups.push({
      name: 'Vazamento Carter',
      description: 'Vazamentos específicos do carter do motor',
      keywords: ['carter', 'oleo motor', 'dreno', 'bujao'],
      defectCount: carterDefects.length,
      parentCategory: 25 // Vazamento de Óleo
    });
  }

  if (cabecoteDefects.length >= 6) {
    subsubgroups.push({
      name: 'Vazamento Cabeçote',
      description: 'Vazamentos no cabeçote e válvulas',
      keywords: ['cabecote', 'cabeçote', 'valvula', 'valvulas'],
      defectCount: cabecoteDefects.length,
      parentCategory: 25
    });
  }

  if (retentorDefects.length >= 8) {
    subsubgroups.push({
      name: 'Vazamento por Vedação',
      description: 'Vazamentos em retentores e juntas',
      keywords: ['retentor', 'vedacao', 'vedação', 'junta'],
      defectCount: retentorDefects.length,
      parentCategory: 25
    });
  }

  return subsubgroups;
}

function analyzeOutrosDefects(defects) {
  const subsubgroups = [];

  // Análise de outros tipos de vazamento
  const direcaoDefects = defects.filter(d => 
    d.toLowerCase().includes('direcao') ||
    d.toLowerCase().includes('direção') ||
    d.toLowerCase().includes('hidraulic')
  );

  const freioDefects = defects.filter(d => 
    d.toLowerCase().includes('freio') ||
    d.toLowerCase().includes('freno') ||
    d.toLowerCase().includes('brake')
  );

  const ar_condicionadoDefects = defects.filter(d => 
    d.toLowerCase().includes('ar condicionado') ||
    d.toLowerCase().includes('arcondicionado') ||
    d.toLowerCase().includes('condensador')
  );

  if (direcaoDefects.length >= 5) {
    subsubgroups.push({
      name: 'Vazamento Direção',
      description: 'Vazamentos do sistema de direção hidráulica',
      keywords: ['direcao', 'direção', 'hidraulic', 'bomba direcao'],
      defectCount: direcaoDefects.length,
      parentCategory: 27 // Outros Vazamentos
    });
  }

  if (freioDefects.length >= 4) {
    subsubgroups.push({
      name: 'Vazamento Freios',
      description: 'Vazamentos do sistema de freios',
      keywords: ['freio', 'freno', 'brake', 'fluido freio'],
      defectCount: freioDefects.length,
      parentCategory: 27
    });
  }

  return subsubgroups;
}

async function reclassifyIntoSubsubgroups(subsubgroups) {
  let reclassified = 0;

  for (const subsubgroup of subsubgroups) {
    try {
      // Buscar defeitos do grupo pai que se encaixam neste subsubgrupo
      const { data: parentDefects } = await supabase
        .from('defect_classifications')
        .select('*')
        .eq('category_id', subsubgroup.parentCategory)
        .limit(20); // Reclassificar apenas uma amostra

      for (const defect of parentDefects) {
        const shouldReclassify = subsubgroup.keywords.some(keyword =>
          defect.original_defect_description.toLowerCase().includes(keyword.toLowerCase())
        );

        if (shouldReclassify) {
          const { error } = await supabase
            .from('defect_classifications')
            .update({ category_id: subsubgroup.id })
            .eq('id', defect.id);

          if (!error) {
            reclassified++;
          }
        }
      }

    } catch (error) {
      console.error(`❌ Erro ao reclassificar subsubgrupo ${subsubgroup.name}:`, error);
    }
  }

  console.log(`✅ ${reclassified} defeitos reclassificados em subsubgrupos`);
  return reclassified;
}

function generateSubsubgroupColor() {
  const colors = [
    '#DC2626', '#EF4444', '#F87171',  // Tons de vermelho
    '#EA580C', '#F97316', '#FB923C',  // Tons de laranja
    '#D97706', '#F59E0B', '#FBBF24'   // Tons de âmbar
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function selectSubsubgroupIcon(name) {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('carter')) return 'oil-drum';
  if (lowerName.includes('cabecote') || lowerName.includes('cabeçote')) return 'engine';
  if (lowerName.includes('vedacao') || lowerName.includes('vedação')) return 'seal';
  if (lowerName.includes('direcao') || lowerName.includes('direção')) return 'steering-wheel';
  if (lowerName.includes('freio')) return 'disc-brake';
  
  return 'droplet';
}

createSubsubgroups();