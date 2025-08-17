const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function reclassifyIntoSubgroups() {
  console.log('🔄 FASE 3: Reclassificando defeitos nos novos subgrupos...');

  try {
    // 1. Buscar os subgrupos recém-criados
    const { data: subgroups } = await supabase
      .from('defect_categories')
      .select('*')
      .in('category_name', [
        'Vazamento de Óleo',
        'Vazamento de Água/Refrigerante', 
        'Outros Vazamentos'
      ]);

    console.log(`📋 Subgrupos encontrados: ${subgroups.length}`);
    subgroups.forEach(sg => {
      console.log(`  - ${sg.category_name} (ID: ${sg.id})`);
    });

    // 2. Buscar todos os defeitos classificados como "Vazamentos" (categoria principal)
    const { data: vazamentosDefects } = await supabase
      .from('defect_classifications')
      .select('*')
      .eq('category_id', 19); // ID da categoria "Vazamentos"

    console.log(`📊 Total de defeitos a reclassificar: ${vazamentosDefects.length}`);

    if (!vazamentosDefects || vazamentosDefects.length === 0) {
      console.log('❌ Nenhum defeito encontrado para reclassificar');
      return;
    }

    // 3. Reclassificar cada defeito no subgrupo apropriado
    let reclassified = 0;
    let errors = 0;

    for (const defect of vazamentosDefects) {
      try {
        const newSubgroupId = determineSubgroup(defect.original_defect_description, subgroups);
        
        if (newSubgroupId && newSubgroupId !== defect.category_id) {
          // Atualizar classificação
          const { error } = await supabase
            .from('defect_classifications')
            .update({ 
              category_id: newSubgroupId,
              updated_at: new Date().toISOString()
            })
            .eq('id', defect.id);

          if (error) {
            console.error(`❌ Erro ao reclassificar defect ${defect.id}:`, error.message);
            errors++;
          } else {
            reclassified++;
            
            // Log de progresso a cada 50 defeitos
            if (reclassified % 50 === 0) {
              console.log(`📈 Progresso: ${reclassified} defeitos reclassificados...`);
            }
          }
        }

      } catch (error) {
        console.error(`❌ Erro ao processar defect ${defect.id}:`, error);
        errors++;
      }
    }

    console.log(`\n🎉 Reclassificação completa!`);
    console.log(`✅ Defeitos reclassificados: ${reclassified}`);
    console.log(`❌ Erros: ${errors}`);

    // 4. Verificar resultados da reclassificação
    console.log('\n📊 VERIFICAÇÃO DOS RESULTADOS:');
    
    for (const subgroup of subgroups) {
      const { count } = await supabase
        .from('defect_classifications')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', subgroup.id);

      console.log(`📁 ${subgroup.category_name}: ${count || 0} defeitos`);

      // Atualizar contador na categoria
      await supabase
        .from('defect_categories')
        .update({ total_occurrences: count || 0 })
        .eq('id', subgroup.id);
    }

    // 5. Verificar quantos defeitos restaram na categoria principal
    const { count: remainingInParent } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', 19);

    console.log(`📁 Vazamentos (categoria principal): ${remainingInParent || 0} defeitos restantes`);

    return { reclassified, errors };

  } catch (error) {
    console.error('❌ Erro geral na reclassificação:', error);
  }
}

function determineSubgroup(defectDescription, subgroups) {
  const lowerDescription = defectDescription.toLowerCase();
  
  // Buscar o subgrupo mais apropriado baseado nas keywords
  for (const subgroup of subgroups) {
    const keywords = subgroup.keywords || [];
    
    // Contar quantas keywords correspondem
    let matchCount = 0;
    for (const keyword of keywords) {
      if (lowerDescription.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    
    // Se encontrou correspondências, retornar este subgrupo
    if (matchCount > 0) {
      return subgroup.id;
    }
  }

  // Se não encontrou correspondência específica, usar lógica adicional
  
  // Priorizar "Vazamento de Óleo" se contém óleo
  if (lowerDescription.includes('oleo') || lowerDescription.includes('óleo')) {
    return subgroups.find(sg => sg.category_name === 'Vazamento de Óleo')?.id;
  }
  
  // Priorizar "Vazamento de Água/Refrigerante" se contém água
  if (lowerDescription.includes('agua') || lowerDescription.includes('água') || 
      lowerDescription.includes('radiador')) {
    return subgroups.find(sg => sg.category_name === 'Vazamento de Água/Refrigerante')?.id;
  }
  
  // Caso contrário, usar "Outros Vazamentos"
  return subgroups.find(sg => sg.category_name === 'Outros Vazamentos')?.id;
}

reclassifyIntoSubgroups();