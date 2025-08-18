/**
 * SISTEMA HIERÁRQUICO COMPLETO - BACKUP PERMANENTE
 * 
 * Este arquivo contém o sistema completo de classificação hierárquica
 * que NUNCA deve ser alterado após o deploy.
 * 
 * Data: 13/08/2025
 * Status: PRODUÇÃO - NÃO ALTERAR
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// CONFIGURAÇÃO PERMANENTE DO SUPABASE
const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  options: {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
};

const supabase = createClient(
  SUPABASE_CONFIG.url, 
  SUPABASE_CONFIG.key, 
  SUPABASE_CONFIG.options
);

// SISTEMA DE CLASSIFICAÇÃO HIERÁRQUICA PERMANENTE
const PERMANENT_HIERARCHY_SYSTEM = {
  // GRUPO 1: VAZAMENTOS
  vazamentos: {
    keywords: ['vazamento', 'vaza', 'vazou', 'passando', 'jogando', 'gotejando', 'escorrendo'],
    priority: 10,
    subgroups: {
      oleo: {
        keywords: ['oleo', 'óleo', 'lubrificante', 'motor', 'lubrif'],
        priority: 15,
        subsubgroups: {
          carter: {
            keywords: ['carter', 'oleo carter', 'vazamento carter', 'carter vaza'],
            priority: 25,
            confidence_base: 0.9
          },
          motor: {
            keywords: ['motor', 'oleo motor', 'vazamento motor', 'motor vazando oleo'],
            priority: 23,
            confidence_base: 0.85
          },
          selo: {
            keywords: ['selo', 'selo cabecote', 'selo atras', 'retentor', 'selo traseiro'],
            priority: 24,
            confidence_base: 0.88
          },
          polia: {
            keywords: ['polia', 'retentor polia', 'vazamento polia', 'polia vaza'],
            priority: 22,
            confidence_base: 0.86
          },
          turbo: {
            keywords: ['turbo', 'turbina', 'oleo turbo', 'turbina vaza'],
            priority: 20,
            confidence_base: 0.82
          },
          distribuicao: {
            keywords: ['distribuicao', 'distribui��o', 'vazamento distribui��o', 'distribui��o vaza'],
            priority: 21,
            confidence_base: 0.84
          }
        }
      },
      agua: {
        keywords: ['agua', 'água', 'radiador', 'refrigerante', 'arrefecimento', 'liquido'],
        priority: 14,
        subsubgroups: {
          radiador: {
            keywords: ['radiador', 'agua radiador', 'vazamento radiador', 'radiador vaza'],
            priority: 25,
            confidence_base: 0.9
          },
          cabecote: {
            keywords: ['cabecote', 'cabeçote', 'agua cabecote', 'passando agua', 'cabecote agua'],
            priority: 24,
            confidence_base: 0.87
          },
          bomba: {
            keywords: ['bomba agua', 'bomba dagua', 'bomba d\'agua', 'bomba radiador'],
            priority: 22,
            confidence_base: 0.85
          },
          mangueira: {
            keywords: ['mangueira', 'flexivel', 'mangueira agua', 'flexivel agua'],
            priority: 20,
            confidence_base: 0.8
          },
          junta: {
            keywords: ['junta cabecote', 'junta', 'queimou junta', 'junta queimada'],
            priority: 23,
            confidence_base: 0.86
          },
          bloco: {
            keywords: ['bloco', 'camisa', 'passando agua bloco', 'agua bloco'],
            priority: 21,
            confidence_base: 0.83
          }
        }
      },
      combustivel: {
        keywords: ['combustivel', 'diesel', 'gasolina', 'alcool', 'etanol'],
        priority: 12,
        subsubgroups: {
          bomba: {
            keywords: ['bomba combustivel', 'bomba diesel', 'bomba gasolina'],
            priority: 22,
            confidence_base: 0.85
          },
          filtro: {
            keywords: ['filtro', 'filtro combustivel', 'vazamento filtro', 'filtro vaza'],
            priority: 20,
            confidence_base: 0.82
          },
          tanque: {
            keywords: ['tanque', 'vazamento tanque', 'tanque combustivel', 'reservatorio'],
            priority: 18,
            confidence_base: 0.8
          },
          bico: {
            keywords: ['bico', 'injetor', 'vazamento bico', 'injetor vaza'],
            priority: 24,
            confidence_base: 0.87
          },
          mangueira: {
            keywords: ['mangueira combustivel', 'flexivel combustivel', 'mangueira diesel'],
            priority: 19,
            confidence_base: 0.81
          },
          carburador: {
            keywords: ['carburador', 'vazamento carburador', 'carburador vaza'],
            priority: 21,
            confidence_base: 0.83
          }
        }
      }
    }
  },

  // GRUPO 2: RUÍDOS
  ruidos: {
    keywords: ['barulho', 'ruido', 'ruído', 'rangendo', 'batendo', 'chiando', 'apitando'],
    priority: 8,
    subgroups: {
      motor: {
        keywords: ['motor', 'cilindro', 'funcionamento', 'interna'],
        priority: 15,
        subsubgroups: {
          biela: {
            keywords: ['biela', 'bronzina', 'mancal', 'encosto', 'biela bate'],
            priority: 25,
            confidence_base: 0.9
          },
          valvula: {
            keywords: ['valvula', 'válvula', 'tucho', 'comando', 'valvula bate'],
            priority: 23,
            confidence_base: 0.86
          },
          pistao: {
            keywords: ['pistao', 'pistão', 'pino pistao', 'pistao bate'],
            priority: 22,
            confidence_base: 0.85
          },
          compensador: {
            keywords: ['compensador', 'massa', 'compensador massa', 'equilibrador'],
            priority: 20,
            confidence_base: 0.82
          },
          correia: {
            keywords: ['correia', 'correia partida', 'tensor', 'correia range'],
            priority: 18,
            confidence_base: 0.8
          },
          distribuicao: {
            keywords: ['distribuicao', 'distribui��o', 'engrenagem', 'comando'],
            priority: 21,
            confidence_base: 0.84
          }
        }
      },
      transmissao: {
        keywords: ['cambio', 'câmbio', 'embreagem', 'diferencial', 'transmissao'],
        priority: 12,
        subsubgroups: {
          cambio: {
            keywords: ['cambio', 'câmbio', 'marcha', 'cambio range'],
            priority: 22,
            confidence_base: 0.85
          },
          embreagem: {
            keywords: ['embreagem', 'disco', 'platô', 'embreagem range'],
            priority: 21,
            confidence_base: 0.83
          },
          diferencial: {
            keywords: ['diferencial', 'cardã', 'cardan', 'diferencial range'],
            priority: 20,
            confidence_base: 0.82
          },
          rolamento: {
            keywords: ['rolamento', 'cubo', 'eixo', 'rolamento gasto'],
            priority: 19,
            confidence_base: 0.81
          },
          engrenagem: {
            keywords: ['engrenagem', 'dentado', 'pinhao', 'engrenagem gasta'],
            priority: 18,
            confidence_base: 0.8
          },
          acoplamento: {
            keywords: ['acoplamento', 'junta', 'cruzeta', 'cardã'],
            priority: 17,
            confidence_base: 0.79
          }
        }
      },
      acessorios: {
        keywords: ['alternador', 'compressor', 'ventoinha', 'bomba', 'acessorio'],
        priority: 10,
        subsubgroups: {
          alternador: {
            keywords: ['alternador', 'gerador', 'alternador range'],
            priority: 20,
            confidence_base: 0.82
          },
          compressor: {
            keywords: ['compressor', 'ar condicionado', 'compressor range'],
            priority: 19,
            confidence_base: 0.81
          },
          ventoinha: {
            keywords: ['ventoinha', 'ventilador', 'helice', 'ventoinha range'],
            priority: 18,
            confidence_base: 0.8
          },
          polia: {
            keywords: ['polia', 'folga polia', 'desalinhada', 'polia range'],
            priority: 17,
            confidence_base: 0.79
          },
          bomba: {
            keywords: ['bomba', 'bomba dagua', 'bomba hidraulica', 'bomba barulho'],
            priority: 21,
            confidence_base: 0.83
          },
          direcao: {
            keywords: ['direcao', 'direção', 'hidraulica', 'bomba direcao'],
            priority: 16,
            confidence_base: 0.78
          }
        }
      }
    }
  },

  // GRUPO 3: ELÉTRICO
  eletrico: {
    keywords: ['eletric', 'elétric', 'luz', 'acende', 'bateria', 'alternador', 'fio'],
    priority: 6,
    subgroups: {
      partida: {
        keywords: ['pega', 'partida', 'arranque', 'bateria', 'liga'],
        priority: 14,
        subsubgroups: {
          motor: {
            keywords: ['nao pega', 'não pega', 'dificuldade', 'partida dificil'],
            priority: 25,
            confidence_base: 0.9
          },
          bateria: {
            keywords: ['bateria', 'fraca', 'descarregada', 'problema bateria', 'bateria ruim'],
            priority: 24,
            confidence_base: 0.88
          },
          arranque: {
            keywords: ['arranque', 'motor arranque', 'esquenta arranque', 'arranque ruim'],
            priority: 23,
            confidence_base: 0.86
          },
          alternador: {
            keywords: ['alternador', 'carrega', 'nao carrega', 'alternador ruim'],
            priority: 22,
            confidence_base: 0.85
          },
          chicote: {
            keywords: ['chicote', 'fio', 'cabo', 'eletrico', 'chicote queimado'],
            priority: 20,
            confidence_base: 0.82
          },
          rele: {
            keywords: ['rele', 'relé', 'fusivel', 'fusível', 'rele queimado'],
            priority: 18,
            confidence_base: 0.8
          }
        }
      },
      ignicao: {
        keywords: ['ignicao', 'ignição', 'vela', 'bobina', 'centelha'],
        priority: 12,
        subsubgroups: {
          vela: {
            keywords: ['vela', 'vela aquecedora', 'aquecimento', 'vela ruim'],
            priority: 22,
            confidence_base: 0.85
          },
          bobina: {
            keywords: ['bobina', 'ignicao', 'centelha', 'bobina queimada'],
            priority: 21,
            confidence_base: 0.84
          },
          cabo: {
            keywords: ['cabo', 'cabo vela', 'fio vela', 'cabo ignicao'],
            priority: 19,
            confidence_base: 0.81
          },
          distribuidor: {
            keywords: ['distribuidor', 'platinado', 'ponto', 'distribuidor ruim'],
            priority: 18,
            confidence_base: 0.8
          },
          modulo: {
            keywords: ['modulo', 'módulo', 'central', 'modulo ignicao'],
            priority: 17,
            confidence_base: 0.79
          },
          sensor: {
            keywords: ['sensor', 'sonda', 'medidor', 'sensor ignicao'],
            priority: 16,
            confidence_base: 0.78
          }
        }
      },
      painel: {
        keywords: ['luz', 'painel', 'indicador', 'acende', 'mostrador'],
        priority: 10,
        subsubgroups: {
          oleo: {
            keywords: ['luz oleo', 'pressao oleo', 'indicador oleo', 'luz pressao'],
            priority: 24,
            confidence_base: 0.87
          },
          temperatura: {
            keywords: ['temperatura', 'indicador temperatura', 'oscila', 'termometro'],
            priority: 22,
            confidence_base: 0.85
          },
          combustivel: {
            keywords: ['combustivel painel', 'indicador combustivel', 'marcador combustivel'],
            priority: 20,
            confidence_base: 0.82
          },
          bateria: {
            keywords: ['luz bateria', 'indicador bateria', 'bateria painel'],
            priority: 21,
            confidence_base: 0.83
          },
          motor: {
            keywords: ['luz motor', 'check engine', 'injecao', 'luz injecao'],
            priority: 23,
            confidence_base: 0.86
          },
          geral: {
            keywords: ['painel', 'mostrador', 'display', 'painel nao funciona'],
            priority: 18,
            confidence_base: 0.8
          }
        }
      }
    }
  },

  // GRUPO 4: MECÂNICO
  mecanico: {
    keywords: ['mecanico', 'mecânico', 'motor', 'peca', 'peça', 'quebrado'],
    priority: 7,
    subgroups: {
      motor: {
        keywords: ['motor', 'cilindro', 'bloco', 'cabecote', 'interno'],
        priority: 15,
        subsubgroups: {
          cabecote: {
            keywords: ['cabecote', 'cabeçote', 'retifica cabecote', 'trincado', 'cabecote quebrado'],
            priority: 24,
            confidence_base: 0.87
          },
          bloco: {
            keywords: ['bloco', 'camisa', 'retifica bloco', 'furado', 'bloco trincado'],
            priority: 23,
            confidence_base: 0.86
          },
          pistao: {
            keywords: ['pistao', 'pistão', 'anel', 'pino pistao', 'pistao quebrado'],
            priority: 22,
            confidence_base: 0.85
          },
          biela: {
            keywords: ['biela', 'empenada', 'quebrada', 'torta', 'biela quebrada'],
            priority: 21,
            confidence_base: 0.84
          },
          virabrequim: {
            keywords: ['virabrequim', 'eixo', 'cremalheira', 'empenado', 'eixo empenado'],
            priority: 25,
            confidence_base: 0.9
          },
          valvula: {
            keywords: ['valvula', 'válvula', 'sede', 'guia valvula', 'valvula quebrada'],
            priority: 20,
            confidence_base: 0.82
          }
        }
      },
      combustao: {
        keywords: ['combustao', 'combustão', 'carburador', 'injecao', 'alimentacao'],
        priority: 12,
        subsubgroups: {
          carburador: {
            keywords: ['carburador', 'regulagem', 'reparo carburador', 'carburador ruim'],
            priority: 22,
            confidence_base: 0.85
          },
          injecao: {
            keywords: ['injecao', 'injeção', 'bico', 'bomba injecao', 'sistema injecao'],
            priority: 24,
            confidence_base: 0.88
          },
          filtro: {
            keywords: ['filtro', 'ar', 'combustivel', 'entupido', 'filtro sujo'],
            priority: 20,
            confidence_base: 0.82
          },
          admissao: {
            keywords: ['admissao', 'admissão', 'coletor', 'entrada ar', 'admissao entupida'],
            priority: 19,
            confidence_base: 0.81
          },
          escape: {
            keywords: ['escape', 'descarga', 'coletor escape', 'escape entupido'],
            priority: 18,
            confidence_base: 0.8
          },
          turbo: {
            keywords: ['turbo', 'turbina', 'intercooler', 'soprador', 'turbo quebrado'],
            priority: 23,
            confidence_base: 0.86
          }
        }
      },
      refrigeracao: {
        keywords: ['aqueceu', 'esquenta', 'temperatura', 'radiador', 'superaquecimento'],
        priority: 14,
        subsubgroups: {
          superaquecimento: {
            keywords: ['aqueceu', 'esquentando', 'superaquecimento', 'quente', 'motor aqueceu'],
            priority: 25,
            confidence_base: 0.9
          },
          termostato: {
            keywords: ['termostato', 'valvula termostática', 'termostato ruim'],
            priority: 20,
            confidence_base: 0.82
          },
          bomba: {
            keywords: ['bomba dagua', 'bomba agua', 'circulacao', 'bomba quebrada'],
            priority: 23,
            confidence_base: 0.86
          },
          radiador: {
            keywords: ['radiador entupido', 'furado', 'obstrucao', 'radiador ruim'],
            priority: 22,
            confidence_base: 0.85
          },
          ventoinha: {
            keywords: ['ventoinha nao funciona', 'ventilador', 'ventoinha quebrada'],
            priority: 21,
            confidence_base: 0.84
          },
          sensor: {
            keywords: ['sensor temperatura', 'interruptor', 'bulbo', 'sensor ruim'],
            priority: 18,
            confidence_base: 0.8
          }
        }
      }
    }
  },

  // GRUPO 5: OPERACIONAL
  operacional: {
    keywords: ['funcionamento', 'operacao', 'marcha', 'potencia', 'desempenho'],
    priority: 5,
    subgroups: {
      desempenho: {
        keywords: ['potencia', 'forca', 'força', 'desempenho', 'rendimento'],
        priority: 12,
        subsubgroups: {
          potencia: {
            keywords: ['falta potencia', 'sem forca', 'fraco', 'baixa potencia', 'motor fraco'],
            priority: 24,
            confidence_base: 0.87
          },
          consumo: {
            keywords: ['consumo', 'gasta muito', 'economia', 'rendimento', 'consumo alto'],
            priority: 22,
            confidence_base: 0.85
          },
          fumaca: {
            keywords: ['fumaca', 'fumaça', 'preta', 'branca', 'azul', 'fumaca preta'],
            priority: 23,
            confidence_base: 0.86
          },
          engasgo: {
            keywords: ['engasga', 'engasgando', 'corta', 'falha', 'motor engasga'],
            priority: 21,
            confidence_base: 0.84
          },
          marcha: {
            keywords: ['marcha lenta', 'falhando', 'instavel', 'irregular', 'lenta irregular'],
            priority: 20,
            confidence_base: 0.82
          },
          aceleracao: {
            keywords: ['aceleracao', 'aceleração', 'resposta', 'demora', 'acelera mal'],
            priority: 19,
            confidence_base: 0.81
          }
        }
      },
      manutencao: {
        keywords: ['manutencao', 'manutenção', 'revisao', 'troca', 'servico'],
        priority: 10,
        subsubgroups: {
          revisao: {
            keywords: ['revisao', 'revisão', 'inspecao', 'verificacao', 'revisao geral'],
            priority: 20,
            confidence_base: 0.82
          },
          troca: {
            keywords: ['trocar', 'substituir', 'mudança', 'substituicao', 'troca de'],
            priority: 22,
            confidence_base: 0.85
          },
          regulagem: {
            keywords: ['regular', 'regulagem', 'ajustar', 'calibrar', 'ajuste'],
            priority: 21,
            confidence_base: 0.84
          },
          limpeza: {
            keywords: ['limpar', 'limpeza', 'sujeira', 'entupimento', 'sujo'],
            priority: 18,
            confidence_base: 0.8
          },
          aperto: {
            keywords: ['apertar', 'folga', 'solto', 'frouxo', 'reaperto'],
            priority: 17,
            confidence_base: 0.79
          },
          vedacao: {
            keywords: ['vedar', 'vedacao', 'vedação', 'selar', 'veda'],
            priority: 19,
            confidence_base: 0.81
          }
        }
      },
      garantia: {
        keywords: ['garantia', 'reclamacao', 'cliente', 'problema', 'atendimento'],
        priority: 8,
        subsubgroups: {
          reclamacao: {
            keywords: ['reclamacao', 'reclamação', 'reclama', 'insatisfeito', 'cliente reclama'],
            priority: 22,
            confidence_base: 0.85
          },
          retrabalho: {
            keywords: ['retrabalho', 'refazer', 'repetir', 'novo reparo', 'fazer novamente'],
            priority: 21,
            confidence_base: 0.84
          },
          improcedente: {
            keywords: ['improcedente', 'sem defeito', 'normal', 'ok', 'nao procede'],
            priority: 20,
            confidence_base: 0.82
          },
          orientacao: {
            keywords: ['orientacao', 'orientação', 'explicado', 'orientado', 'esclarecido'],
            priority: 18,
            confidence_base: 0.8
          },
          teste: {
            keywords: ['teste', 'testado', 'verificado', 'conferido', 'testando'],
            priority: 19,
            confidence_base: 0.81
          },
          aguardando: {
            keywords: ['aguardando', 'pendente', 'esperando', 'parado', 'em espera'],
            priority: 17,
            confidence_base: 0.79
          }
        }
      }
    }
  }
};

/**
 * FUNÇÃO PRINCIPAL DE CLASSIFICAÇÃO - PERMANENTE
 * Esta função NUNCA deve ser alterada após o deploy
 */
function classifyDefectPermanent(description) {
  if (!description || description.trim() === '' || description === 'null' || description === 'undefined') {
    return {
      group: 'Não Classificado',
      subgroup: 'Indefinido',
      subsubgroup: 'Geral',
      confidence: 0,
      reasoning: 'Descrição inválida ou vazia'
    };
  }

  const defect = description.toLowerCase().trim();
  let bestMatch = null;
  let maxScore = 0;
  let matchDetails = [];

  // Percorrer hierarquia completa
  Object.entries(PERMANENT_HIERARCHY_SYSTEM).forEach(([groupName, groupData]) => {
    let groupScore = 0;
    let groupMatches = [];
    
    // Verificar palavras-chave do grupo
    groupData.keywords.forEach(keyword => {
      if (defect.includes(keyword.toLowerCase())) {
        const keywordScore = groupData.priority + keyword.length;
        groupScore += keywordScore;
        groupMatches.push(`grupo:${keyword}(+${keywordScore})`);
      }
    });

    if (groupScore > 0) {
      // Verificar subgrupos
      Object.entries(groupData.subgroups).forEach(([subgroupName, subgroupData]) => {
        let subgroupScore = groupScore;
        let subgroupMatches = [...groupMatches];
        
        subgroupData.keywords.forEach(keyword => {
          if (defect.includes(keyword.toLowerCase())) {
            const keywordScore = subgroupData.priority + keyword.length;
            subgroupScore += keywordScore;
            subgroupMatches.push(`subgrupo:${keyword}(+${keywordScore})`);
          }
        });

        // Verificar subsubgrupos
        Object.entries(subgroupData.subsubgroups).forEach(([subsubgroupName, subsubgroupData]) => {
          let finalScore = subgroupScore;
          let finalMatches = [...subgroupMatches];
          
          subsubgroupData.keywords.forEach(keyword => {
            if (defect.includes(keyword.toLowerCase())) {
              const keywordScore = subsubgroupData.priority + keyword.length * 2;
              finalScore += keywordScore;
              finalMatches.push(`subsubgrupo:${keyword}(+${keywordScore})`);
              
              // Bonus para matches específicos
              if (defect.startsWith(keyword.toLowerCase())) {
                finalScore += 15;
                finalMatches.push('inicio(+15)');
              }
              
              if (defect === keyword.toLowerCase()) {
                finalScore += 30;
                finalMatches.push('exato(+30)');
              }
            }
          });

          // Aplicar confidence base se há match
          if (finalScore > subgroupScore) {
            const confidence = Math.min(0.98, subsubgroupData.confidence_base + (finalScore / 200));
            
            if (finalScore > maxScore) {
              maxScore = finalScore;
              bestMatch = {
                group: capitalizeFirst(groupName),
                subgroup: capitalizeFirst(subgroupName),
                subsubgroup: capitalizeFirst(subsubgroupName),
                confidence: confidence,
                score: finalScore,
                reasoning: `Matches: ${finalMatches.join(', ')}`
              };
              matchDetails = finalMatches;
            }
          }
        });
      });
    }
  });

  // Fallback se não encontrou match suficiente
  if (!bestMatch || maxScore < 20) {
    return {
      group: 'Operacional',
      subgroup: 'Garantia',
      subsubgroup: 'Aguardando',
      confidence: 0.3,
      reasoning: `Classificação padrão. Texto: "${description.substring(0, 50)}..."`
    };
  }

  return bestMatch;
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * FUNÇÃO PARA CLASSIFICAR AUTOMATICAMENTE NOVOS DADOS
 * Esta função será chamada automaticamente quando novos dados chegarem
 */
async function autoClassifyNewOrders() {
  console.log('🤖 Executando classificação automática...');
  
  try {
    // Buscar ordens sem classificação
    const { data: unclassifiedOrders } = await supabase
      .from('service_orders')
      .select('id, order_number, raw_defect_description')
      .not('id', 'in', `(select service_order_id from defect_classifications where service_order_id is not null)`);

    if (!unclassifiedOrders || unclassifiedOrders.length === 0) {
      console.log('✅ Não há defeitos para classificar');
      return { success: true, processed: 0 };
    }

    console.log(`📋 Encontrados ${unclassifiedOrders.length} defeitos para classificar`);

    let processed = 0;
    let successful = 0;

    for (const order of unclassifiedOrders) {
      try {
        const classification = classifyDefectPermanent(order.raw_defect_description);
        
        if (classification.confidence > 0.3) {
          // Buscar ou criar categoria
          let { data: category } = await supabase
            .from('defect_categories')
            .select('id')
            .eq('category_name', `${classification.group} - ${classification.subgroup} - ${classification.subsubgroup}`)
            .single();

          if (!category) {
            // Criar nova categoria
            const { data: newCategory } = await supabase
              .from('defect_categories')
              .insert([{
                category_name: `${classification.group} - ${classification.subgroup} - ${classification.subsubgroup}`,
                color_hex: getGroupColor(classification.group)
              }])
              .select('id')
              .single();
            
            category = newCategory;
          }

          if (category) {
            // Criar classificação
            const { error: insertError } = await supabase
              .from('defect_classifications')
              .insert([{
                service_order_id: order.id,
                category_id: category.id,
                ai_confidence: classification.confidence,
                ai_reasoning: classification.reasoning,
                original_defect_description: order.raw_defect_description,
                created_at: new Date().toISOString()
              }]);

            if (!insertError) {
              successful++;
            }
          }
        }

        processed++;
        
        if (processed % 100 === 0) {
          console.log(`⏳ Processados: ${processed}/${unclassifiedOrders.length}`);
        }

      } catch (error) {
        console.error(`❌ Erro ao processar OS ${order.order_number}:`, error.message);
      }
    }

    console.log(`✅ Classificação automática concluída: ${successful}/${processed} defeitos classificados`);
    
    return {
      success: true,
      processed: processed,
      successful: successful,
      total_found: unclassifiedOrders.length
    };

  } catch (error) {
    console.error('❌ Erro na classificação automática:', error);
    return { success: false, error: error.message };
  }
}

function getGroupColor(group) {
  const colors = {
    'Vazamentos': '#DC2626',    // Vermelho
    'Ruidos': '#D97706',        // Laranja
    'Eletrico': '#2563EB',      // Azul
    'Mecanico': '#16A34A',      // Verde
    'Operacional': '#7C3AED'    // Roxo
  };
  return colors[group] || '#6B7280';
}

// EXPORTAR FUNÇÕES PERMANENTES
module.exports = {
  classifyDefectPermanent,
  autoClassifyNewOrders,
  PERMANENT_HIERARCHY_SYSTEM,
  SUPABASE_CONFIG
};

// AUTO-EXECUÇÃO SE CHAMADO DIRETAMENTE
if (require.main === module) {
  autoClassifyNewOrders()
    .then(result => {
      console.log('🎯 Resultado da classificação automática:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Erro fatal na classificação:', error);
      process.exit(1);
    });
}