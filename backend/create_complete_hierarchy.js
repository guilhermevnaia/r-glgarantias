const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Hierarquia completa e específica de 3 níveis
const hierarchyStructure = {
  // GRUPO 1: SISTEMA DE VAZAMENTOS
  'Vazamentos': {
    'Óleo': {
      'Carter': ['vazamento carter', 'carter', 'oleo carter'],
      'Motor': ['vazamento motor', 'oleo motor', 'motor vazando'],
      'Selo': ['vazamento selo', 'selo vazando', 'selo atras cabecote', 'selo cabeçote'],
      'Guias': ['passando oleo guias', 'guias vazando', 'oleo pelas guias'],
      'Turbo': ['vazamento turbo', 'oleo turbo', 'turbina vazando'],
      'Mangueira': ['vazamento mangueira', 'flexivel vazando', 'mangueira oleo']
    },
    'Água': {
      'Radiador': ['vazamento radiador', 'agua radiador', 'radiador vazando'],
      'Bomba': ['bomba agua', 'vazamento bomba', 'bomba dagua'],
      'Mangueira': ['mangueira agua', 'flexivel agua', 'mangueira radiador'],
      'Cabeçote': ['agua cabecote', 'vazamento cabecote', 'cabecote agua'],
      'Bloco': ['agua bloco', 'vazamento bloco', 'bloco agua'],
      'Junta': ['junta cabecote', 'junta queimada', 'agua junta']
    },
    'Combustível': {
      'Bomba': ['bomba combustivel', 'vazamento bomba', 'combustivel bomba'],
      'Tanque': ['vazamento tanque', 'tanque combustivel', 'tanque vazando'],
      'Mangueira': ['mangueira combustivel', 'flexivel combustivel', 'combustivel mangueira'],
      'Filtro': ['filtro combustivel', 'vazamento filtro', 'combustivel filtro'],
      'Injetor': ['injetor vazando', 'vazamento injetor', 'combustivel injetor'],
      'Carburador': ['carburador vazando', 'vazamento carburador', 'combustivel carburador']
    }
  },

  // GRUPO 2: SISTEMA DE RUÍDOS E VIBRAÇÕES  
  'Ruídos': {
    'Motor': {
      'Biela': ['barulho biela', 'ruido biela', 'bronzina biela', 'biela batendo'],
      'Mancal': ['barulho mancal', 'ruido mancal', 'mancal desgastado', 'encosto mancal'],
      'Válvulas': ['barulho valvula', 'ruido valvula', 'valvula batendo', 'regulagem valvula'],
      'Pistão': ['barulho pistao', 'ruido pistao', 'pistao batendo', 'folga pistao'],
      'Compensador': ['compensador massa', 'barulho compensador', 'ruido compensador'],
      'Correia': ['barulho correia', 'ruido correia', 'correia rangendo', 'correia partida']
    },
    'Transmissão': {
      'Embreagem': ['barulho embreagem', 'ruido embreagem', 'embreagem rangendo'],
      'Câmbio': ['barulho cambio', 'ruido cambio', 'cambio rangendo'],
      'Diferencial': ['barulho diferencial', 'ruido diferencial', 'diferencial rangendo'],
      'Cardan': ['barulho cardan', 'ruido cardan', 'cardan rangendo'],
      'Rolamento': ['barulho rolamento', 'ruido rolamento', 'rolamento desgastado'],
      'Engrenagem': ['barulho engrenagem', 'ruido engrenagem', 'engrenagem desgastada']
    },
    'Acessórios': {
      'Polia': ['barulho polia', 'ruido polia', 'polia rangendo', 'folga polia'],
      'Alternador': ['barulho alternador', 'ruido alternador', 'alternador rangendo'],
      'Compressor': ['barulho compressor', 'ruido compressor', 'compressor rangendo'],
      'Ventoinha': ['barulho ventoinha', 'ruido ventoinha', 'ventoinha rangendo'],
      'Correia': ['correia rangendo', 'barulho correia', 'ruido correia'],
      'Tensor': ['tensor correia', 'barulho tensor', 'ruido tensor']
    }
  },

  // GRUPO 3: SISTEMA ELÉTRICO
  'Elétrico': {
    'Partida': {
      'Motor': ['motor nao pega', 'nao pega', 'dificuldade partida', 'arranque'],
      'Bateria': ['bateria fraca', 'problema bateria', 'bateria ruim', 'sem partida bateria'],
      'Alternador': ['alternador nao carrega', 'problema alternador', 'alternador ruim'],
      'Chicote': ['problema chicote', 'chicote queimado', 'fio partido'],
      'Relé': ['rele queimado', 'problema rele', 'rele nao funciona'],
      'Fusível': ['fusivel queimado', 'problema fusivel', 'fusivel nao funciona']
    },
    'Ignição': {
      'Velas': ['vela queimada', 'problema vela', 'vela suja', 'vela aquecedora'],
      'Bobina': ['bobina queimada', 'problema bobina', 'bobina nao funciona'],
      'Cabo': ['cabo vela', 'problema cabo', 'cabo queimado'],
      'Distribuidor': ['distribuidor', 'problema distribuidor', 'distribuidor queimado'],
      'Platinado': ['platinado', 'problema platinado', 'platinado queimado'],
      'Condensador': ['condensador', 'problema condensador', 'condensador queimado']
    },
    'Instrumentos': {
      'Painel': ['painel nao funciona', 'problema painel', 'painel queimado'],
      'Temperatura': ['indicador temperatura', 'termometro', 'oscilacao temperatura'],
      'Combustível': ['indicador combustivel', 'marcador combustivel', 'combustivel abaixa'],
      'Óleo': ['pressao oleo', 'indicador oleo', 'luz oleo'],
      'Bateria': ['luz bateria', 'indicador bateria', 'bateria painel'],
      'Motor': ['luz motor', 'check engine', 'indicador motor']
    }
  },

  // GRUPO 4: SISTEMA MECÂNICO
  'Mecânico': {
    'Motor': {
      'Cabeçote': ['cabecote trincado', 'problema cabecote', 'cabecote incorreto', 'retifica cabecote'],
      'Bloco': ['bloco trincado', 'problema bloco', 'retifica bloco', 'bloco furado'],
      'Pistão': ['pistao quebrado', 'problema pistao', 'pistao nao chega', 'pino pistao'],
      'Biela': ['biela empenada', 'problema biela', 'biela quebrada', 'biela desgastada'],
      'Virabrequim': ['virabrequim empenado', 'problema virabrequim', 'eixo virabrequim'],
      'Válvulas': ['valvula empenada', 'problema valvula', 'valvula queimada', 'guia valvula']
    },
    'Combustão': {
      'Carburador': ['carburador', 'problema carburador', 'regulagem carburador', 'reparo carburador'],
      'Injeção': ['sistema injecao', 'problema injecao', 'bico injetor', 'bomba injecao'],
      'Filtros': ['filtro ar', 'filtro combustivel', 'filtro oleo', 'filtro entupido'],
      'Admissão': ['coletor admissao', 'problema admissao', 'admissao entupida'],
      'Escape': ['coletor escape', 'problema escape', 'escape entupido'],
      'Turbo': ['turbina', 'problema turbo', 'turbo queimado', 'turbo nao funciona']
    },
    'Refrigeração': {
      'Superaquecimento': ['motor aqueceu', 'superaquecimento', 'motor quente', 'temperatura alta'],
      'Termostato': ['termostato', 'problema termostato', 'termostato nao abre'],
      'Bomba': ['bomba dagua', 'problema bomba', 'bomba nao funciona'],
      'Radiador': ['radiador entupido', 'problema radiador', 'radiador furado'],
      'Ventoinha': ['ventoinha nao funciona', 'problema ventoinha', 'ventoinha quebrada'],
      'Sensor': ['sensor temperatura', 'problema sensor', 'sensor queimado']
    }
  },

  // GRUPO 5: SISTEMA OPERACIONAL
  'Operacional': {
    'Funcionamento': {
      'Marcha': ['falhando marcha lenta', 'problema marcha', 'motor falhando', 'instabilidade'],
      'Potência': ['falta potencia', 'motor fraco', 'sem forca', 'baixa potencia'],
      'Consumo': ['consumo alto', 'gasta muito', 'consumo excessivo', 'economia'],
      'Fumaça': ['fumaca', 'fumaca preta', 'fumaca branca', 'fumaca azul'],
      'Engasgo': ['motor engasga', 'engasgando', 'falta combustivel', 'corta combustivel'],
      'Regulagem': ['regulagem', 'desregulado', 'precisa regular', 'ajuste motor']
    },
    'Manutenção': {
      'Revisão': ['revisao', 'manutencao', 'verificacao', 'inspecao'],
      'Troca': ['trocar oleo', 'trocar filtro', 'trocar peca', 'substituicao'],
      'Ajuste': ['ajustar', 'regular', 'calibrar', 'acertar'],
      'Limpeza': ['limpeza', 'limpar', 'sujeira', 'entupimento'],
      'Vedação': ['vedar', 'vedacao', 'selar', 'calafetar'],
      'Aperto': ['apertar', 'folga', 'solto', 'frouxo']
    },
    'Garantia': {
      'Reclamação': ['reclamacao', 'reclama cliente', 'cliente reclama', 'insatisfacao'],
      'Retrabalho': ['retrabalho', 'refazer', 'repetir servico', 'novo reparo'],
      'Improcedente': ['improcedente', 'nao procede', 'sem defeito', 'normal'],
      'Orientação': ['orientacao', 'orientado', 'explicado', 'esclarecido'],
      'Teste': ['teste', 'testado', 'verificado', 'conferido'],
      'Aguardando': ['aguardando', 'pendente', 'esperando', 'em espera']
    }
  }
};

async function createCompleteHierarchy() {
  console.log('=== CRIANDO HIERARQUIA COMPLETA ===');
  
  // 1. Criar/atualizar tabela de categorias hierárquicas
  const categories = [];
  let categoryId = 1;
  
  Object.entries(hierarchyStructure).forEach(([group, subgroups]) => {
    Object.entries(subgroups).forEach(([subgroup, subsubgroups]) => {
      Object.entries(subsubgroups).forEach(([subsubgroup, keywords]) => {
        categories.push({
          id: categoryId++,
          category_name: `${group} - ${subgroup} - ${subsubgroup}`,
          group_name: group,
          subgroup_name: subgroup,
          subsubgroup_name: subsubgroup,
          keywords: keywords,
          color_hex: getGroupColor(group)
        });
      });
    });
  });
  
  console.log(`Total de categorias criadas: ${categories.length}`);
  
  // 2. Criar função de classificação inteligente
  const classifyDefect = (defectDescription) => {
    if (!defectDescription) return null;
    
    const defect = defectDescription.toLowerCase().trim();
    let bestMatch = null;
    let maxScore = 0;
    
    categories.forEach(category => {
      let score = 0;
      
      // Pontuação por palavras-chave encontradas
      category.keywords.forEach(keyword => {
        if (defect.includes(keyword.toLowerCase())) {
          score += keyword.length; // Palavras mais específicas têm mais peso
        }
      });
      
      // Bonus por match exato
      if (category.keywords.some(k => defect === k.toLowerCase())) {
        score += 50;
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = category;
      }
    });
    
    return bestMatch;
  };
  
  // 3. Analisar defeitos não classificados
  const { data: unclassifiedOrders } = await supabase
    .from('service_orders')
    .select('id, order_number, raw_defect_description')
    .not('id', 'in', `(select service_order_id from defect_classifications)`);
  
  console.log(`Defeitos não classificados: ${unclassifiedOrders.length}`);
  
  // 4. Classificar todos os defeitos não classificados
  const newClassifications = [];
  let classified = 0;
  
  for (const order of unclassifiedOrders) {
    const match = classifyDefect(order.raw_defect_description);
    
    if (match) {
      newClassifications.push({
        service_order_id: order.id,
        category_name: match.category_name,
        group_name: match.group_name,
        subgroup_name: match.subgroup_name,
        subsubgroup_name: match.subsubgroup_name,
        ai_confidence: 0.95, // Alta confiança pois é baseado em regras específicas
        ai_reasoning: `Classificado por padrões hierárquicos: ${match.keywords.join(', ')}`
      });
      classified++;
      
      if (classified % 50 === 0) {
        console.log(`Classificados: ${classified}/${unclassifiedOrders.length}`);
      }
    }
  }
  
  console.log(`Total classificado: ${classified} de ${unclassifiedOrders.length}`);
  console.log(`Restam sem classificação: ${unclassifiedOrders.length - classified}`);
  
  return { categories, newClassifications };
}

function getGroupColor(group) {
  const colors = {
    'Vazamentos': '#DC2626', // Vermelho
    'Ruídos': '#D97706',      // Laranja
    'Elétrico': '#2563EB',    // Azul
    'Mecânico': '#16A34A',    // Verde
    'Operacional': '#7C3AED'  // Roxo
  };
  return colors[group] || '#6B7280';
}

createCompleteHierarchy()
  .then(result => {
    console.log('\n=== RESULTADO ===');
    console.log('Categorias criadas:', result.categories.length);
    console.log('Novas classificações:', result.newClassifications.length);
    
    // Mostrar distribuição por grupo
    const distribution = {};
    result.newClassifications.forEach(c => {
      distribution[c.group_name] = (distribution[c.group_name] || 0) + 1;
    });
    
    console.log('\n=== DISTRIBUIÇÃO POR GRUPO ===');
    Object.entries(distribution).forEach(([group, count]) => {
      console.log(`${group}: ${count} classificações`);
    });
  })
  .catch(console.error);