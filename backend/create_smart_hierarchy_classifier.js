const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// SISTEMA INTELIGENTE DE CLASSIFICAÇÃO HIERÁRQUICA
const SMART_HIERARCHY = {
  // CLASSIFICAÇÃO POR CONTEXTO E PADRÕES
  patterns: {
    // VAZAMENTOS - Grupo principal
    vazamentos: {
      keywords: ['vazamento', 'vaza', 'vazou', 'passando', 'jogando'],
      subClassifiers: {
        oleo: {
          keywords: ['oleo', 'óleo', 'lubrificante', 'motor'],
          subSubClassifiers: {
            carter: ['carter', 'oleo carter', 'vazamento carter'],
            motor: ['motor', 'oleo motor', 'vazamento motor'],
            selo: ['selo', 'selo cabecote', 'selo atras', 'retentor'],
            polia: ['polia', 'retentor polia', 'vazamento polia'],
            turbo: ['turbo', 'turbina', 'oleo turbo'],
            distribuicao: ['distribuicao', 'distribui��o', 'vazamento distribui��o']
          }
        },
        agua: {
          keywords: ['agua', 'água', 'radiador', 'refrigerante', 'arrefecimento'],
          subSubClassifiers: {
            radiador: ['radiador', 'agua radiador', 'vazamento radiador'],
            cabecote: ['cabecote', 'cabeçote', 'agua cabecote', 'passando agua'],
            bomba: ['bomba agua', 'bomba dagua', 'bomba d\'agua'],
            mangueira: ['mangueira', 'flexivel', 'mangueira agua'],
            junta: ['junta cabecote', 'junta', 'queimou junta'],
            bloco: ['bloco', 'camisa', 'passando agua bloco']
          }
        },
        combustivel: {
          keywords: ['combustivel', 'diesel', 'gasolina', 'alcool'],
          subSubClassifiers: {
            bomba: ['bomba combustivel', 'bomba diesel'],
            filtro: ['filtro', 'filtro combustivel', 'vazamento filtro'],
            tanque: ['tanque', 'vazamento tanque'],
            bico: ['bico', 'injetor', 'vazamento bico'],
            mangueira: ['mangueira combustivel', 'flexivel combustivel'],
            carburador: ['carburador', 'vazamento carburador']
          }
        }
      }
    },

    // RUÍDOS E BARULHOS
    ruidos: {
      keywords: ['barulho', 'ruido', 'ruído', 'rangendo', 'batendo'],
      subClassifiers: {
        motor: {
          keywords: ['motor', 'cilindro', 'funcionamento'],
          subSubClassifiers: {
            biela: ['biela', 'bronzina', 'mancal', 'encosto'],
            valvula: ['valvula', 'válvula', 'tucho', 'comando'],
            pistao: ['pistao', 'pistão', 'pino pistao'],
            compensador: ['compensador', 'massa', 'compensador massa'],
            correia: ['correia', 'correia partida', 'tensor'],
            distribuicao: ['distribuicao', 'distribui��o', 'engrenagem']
          }
        },
        transmissao: {
          keywords: ['cambio', 'câmbio', 'embreagem', 'diferencial'],
          subSubClassifiers: {
            cambio: ['cambio', 'câmbio', 'marcha'],
            embreagem: ['embreagem', 'disco', 'platô'],
            diferencial: ['diferencial', 'cardã', 'cardan'],
            rolamento: ['rolamento', 'cubo', 'eixo'],
            engrenagem: ['engrenagem', 'dentado', 'pinhao'],
            acoplamento: ['acoplamento', 'junta', 'cruzeta']
          }
        },
        acessorios: {
          keywords: ['alternador', 'compressor', 'ventoinha', 'bomba'],
          subSubClassifiers: {
            alternador: ['alternador', 'gerador'],
            compressor: ['compressor', 'ar condicionado'],
            ventoinha: ['ventoinha', 'ventilador', 'helice'],
            polia: ['polia', 'folga polia', 'desalinhada'],
            bomba: ['bomba', 'bomba dagua', 'bomba hidraulica'],
            direcao: ['direcao', 'direção', 'hidraulica']
          }
        }
      }
    },

    // PROBLEMAS ELÉTRICOS
    eletrico: {
      keywords: ['eletric', 'elétric', 'luz', 'acende', 'bateria', 'alternador'],
      subClassifiers: {
        partida: {
          keywords: ['pega', 'partida', 'arranque', 'bateria'],
          subSubClassifiers: {
            motor: ['nao pega', 'não pega', 'dificuldade', 'partida'],
            bateria: ['bateria', 'fraca', 'descarregada', 'problema bateria'],
            arranque: ['arranque', 'motor arranque', 'esquenta arranque'],
            alternador: ['alternador', 'carrega', 'nao carrega'],
            chicote: ['chicote', 'fio', 'cabo', 'eletrico'],
            rele: ['rele', 'relé', 'fusivel', 'fusível']
          }
        },
        ignicao: {
          keywords: ['ignicao', 'ignição', 'vela', 'bobina'],
          subSubClassifiers: {
            vela: ['vela', 'vela aquecedora', 'aquecimento'],
            bobina: ['bobina', 'ignicao', 'centelha'],
            cabo: ['cabo', 'cabo vela', 'fio vela'],
            distribuidor: ['distribuidor', 'platinado', 'ponto'],
            modulo: ['modulo', 'módulo', 'central'],
            sensor: ['sensor', 'sonda', 'medidor']
          }
        },
        painel: {
          keywords: ['luz', 'painel', 'indicador', 'acende'],
          subSubClassifiers: {
            oleo: ['luz oleo', 'pressao oleo', 'indicador oleo'],
            temperatura: ['temperatura', 'indicador temperatura', 'oscila'],
            combustivel: ['combustivel painel', 'indicador combustivel'],
            bateria: ['luz bateria', 'indicador bateria'],
            motor: ['luz motor', 'check engine', 'injecao'],
            geral: ['painel', 'mostrador', 'display']
          }
        }
      }
    },

    // PROBLEMAS MECÂNICOS
    mecanico: {
      keywords: ['mecanico', 'mecânico', 'motor', 'peca', 'peça'],
      subClassifiers: {
        motor: {
          keywords: ['motor', 'cilindro', 'bloco', 'cabecote'],
          subSubClassifiers: {
            cabecote: ['cabecote', 'cabeçote', 'retifica cabecote', 'trincado'],
            bloco: ['bloco', 'camisa', 'retifica bloco', 'furado'],
            pistao: ['pistao', 'pistão', 'anel', 'pino pistao'],
            biela: ['biela', 'empenada', 'quebrada', 'torta'],
            virabrequim: ['virabrequim', 'eixo', 'cremalheira', 'empenado'],
            valvula: ['valvula', 'válvula', 'sede', 'guia valvula']
          }
        },
        combustao: {
          keywords: ['combustao', 'combustão', 'carburador', 'injecao'],
          subSubClassifiers: {
            carburador: ['carburador', 'regulagem', 'reparo carburador'],
            injecao: ['injecao', 'injeção', 'bico', 'bomba injecao'],
            filtro: ['filtro', 'ar', 'combustivel', 'entupido'],
            admissao: ['admissao', 'admissão', 'coletor', 'entrada ar'],
            escape: ['escape', 'descarga', 'coletor escape'],
            turbo: ['turbo', 'turbina', 'intercooler', 'soprador']
          }
        },
        refrigeracao: {
          keywords: ['aqueceu', 'esquenta', 'temperatura', 'radiador'],
          subSubClassifiers: {
            superaquecimento: ['aqueceu', 'esquentando', 'superaquecimento', 'quente'],
            termostato: ['termostato', 'valvula termostática'],
            bomba: ['bomba dagua', 'bomba agua', 'circulacao'],
            radiador: ['radiador', 'entupido', 'furado', 'obstrucao'],
            ventoinha: ['ventoinha', 'ventilador', 'nao funciona'],
            sensor: ['sensor temperatura', 'interruptor', 'bulbo']
          }
        }
      }
    },

    // PROBLEMAS OPERACIONAIS
    operacional: {
      keywords: ['funcionamento', 'operacao', 'marcha', 'potencia'],
      subClassifiers: {
        desempenho: {
          keywords: ['potencia', 'forca', 'força', 'desempenho'],
          subSubClassifiers: {
            potencia: ['falta potencia', 'sem forca', 'fraco', 'baixa potencia'],
            consumo: ['consumo', 'gasta muito', 'economia', 'rendimento'],
            fumaca: ['fumaca', 'fumaça', 'preta', 'branca', 'azul'],
            engasgo: ['engasga', 'engasgando', 'corta', 'falha'],
            marcha: ['marcha lenta', 'falhando', 'instavel', 'irregular'],
            aceleracao: ['aceleracao', 'aceleração', 'resposta', 'demora']
          }
        },
        manutencao: {
          keywords: ['manutencao', 'manutenção', 'revisao', 'troca'],
          subSubClassifiers: {
            revisao: ['revisao', 'revisão', 'inspecao', 'verificacao'],
            troca: ['trocar', 'substituir', 'mudança', 'substituicao'],
            regulagem: ['regular', 'regulagem', 'ajustar', 'calibrar'],
            limpeza: ['limpar', 'limpeza', 'sujeira', 'entupimento'],
            aperto: ['apertar', 'folga', 'solto', 'frouxo'],
            vedacao: ['vedar', 'vedacao', 'vedação', 'selar']
          }
        },
        garantia: {
          keywords: ['garantia', 'reclamacao', 'cliente', 'problema'],
          subSubClassifiers: {
            reclamacao: ['reclamacao', 'reclamação', 'reclama', 'insatisfeito'],
            retrabalho: ['retrabalho', 'refazer', 'repetir', 'novo reparo'],
            improcedente: ['improcedente', 'sem defeito', 'normal', 'ok'],
            orientacao: ['orientacao', 'orientação', 'explicado', 'orientado'],
            teste: ['teste', 'testado', 'verificado', 'conferido'],
            aguardando: ['aguardando', 'pendente', 'esperando', 'parado']
          }
        }
      }
    }
  }
};

// Função principal de classificação inteligente
function smartClassifyDefect(description) {
  if (!description || description.trim() === '' || description === 'null') {
    return null;
  }

  const defect = description.toLowerCase().trim();
  let bestMatch = null;
  let maxScore = 0;

  // Percorrer todos os padrões
  Object.entries(SMART_HIERARCHY.patterns).forEach(([mainGroup, groupData]) => {
    let groupScore = 0;
    
    // Verificar se defeito contém palavras-chave do grupo principal
    groupData.keywords.forEach(keyword => {
      if (defect.includes(keyword)) {
        groupScore += 10;
      }
    });

    if (groupScore > 0) {
      // Buscar subgrupos
      Object.entries(groupData.subClassifiers).forEach(([subGroup, subData]) => {
        let subScore = groupScore;
        
        // Verificar palavras-chave do subgrupo
        subData.keywords.forEach(keyword => {
          if (defect.includes(keyword)) {
            subScore += 15;
          }
        });

        // Buscar subsubgrupos
        Object.entries(subData.subSubClassifiers).forEach(([subSubGroup, keywords]) => {
          let finalScore = subScore;
          
          keywords.forEach(keyword => {
            if (defect.includes(keyword)) {
              finalScore += 25; // Maior peso para palavras específicas
              
              // Bonus se palavra aparece no início
              if (defect.startsWith(keyword)) {
                finalScore += 10;
              }
              
              // Bonus para match exato
              if (defect === keyword) {
                finalScore += 50;
              }
            }
          });

          if (finalScore > maxScore) {
            maxScore = finalScore;
            bestMatch = {
              group: capitalizeFirst(mainGroup),
              subgroup: capitalizeFirst(subGroup),
              subsubgroup: capitalizeFirst(subSubGroup),
              score: finalScore,
              confidence: Math.min(0.98, finalScore / 100)
            };
          }
        });
      });
    }
  });

  return bestMatch;
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function implementSmartClassification() {
  console.log('=== IMPLEMENTANDO CLASSIFICAÇÃO INTELIGENTE ===');
  
  // 1. Buscar todos os defeitos
  const { data: allOrders } = await supabase
    .from('service_orders')
    .select('id, order_number, raw_defect_description')
    .limit(2542); // Todos os registros
  
  console.log(`Total de ordens: ${allOrders.length}`);
  
  // 2. Processar classificações
  const results = {
    processed: 0,
    classified: 0,
    unclassified: 0,
    classifications: [],
    distribution: {}
  };
  
  for (const order of allOrders) {
    const classification = smartClassifyDefect(order.raw_defect_description);
    
    if (classification && classification.score > 20) { // Score mínimo
      const hierarchy = `${classification.group} > ${classification.subgroup} > ${classification.subsubgroup}`;
      
      results.classifications.push({
        order_id: order.id,
        order_number: order.order_number,
        original_description: order.raw_defect_description,
        group: classification.group,
        subgroup: classification.subgroup,
        subsubgroup: classification.subsubgroup,
        confidence: classification.confidence,
        score: classification.score,
        hierarchy: hierarchy
      });
      
      // Contar distribuição
      results.distribution[hierarchy] = (results.distribution[hierarchy] || 0) + 1;
      results.classified++;
    } else {
      results.unclassified++;
      
      // Log apenas os primeiros 50 não classificados para análise
      if (results.unclassified <= 50 && order.raw_defect_description && order.raw_defect_description !== 'null') {
        console.log(`NÃO CLASSIFICADO: ${order.order_number} - "${order.raw_defect_description}"`);
      }
    }
    
    results.processed++;
    
    if (results.processed % 500 === 0) {
      console.log(`Processados: ${results.processed}/${allOrders.length} (${results.classified} classificados)`);
    }
  }
  
  // 3. Estatísticas finais
  console.log('\n=== RESULTADO FINAL ===');
  console.log(`Total processado: ${results.processed}`);
  console.log(`Classificados: ${results.classified} (${(results.classified/results.processed*100).toFixed(1)}%)`);
  console.log(`Não classificados: ${results.unclassified} (${(results.unclassified/results.processed*100).toFixed(1)}%)`);
  
  // 4. Top 15 classificações
  console.log('\n=== TOP 15 HIERARQUIAS ===');
  Object.entries(results.distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([hierarchy, count]) => {
      console.log(`${hierarchy}: ${count}`);
    });
  
  // 5. Salvar resultado
  const fs = require('fs');
  fs.writeFileSync('smart_hierarchy_results.json', JSON.stringify(results, null, 2));
  console.log('\nResultados salvos em smart_hierarchy_results.json');
  
  return results;
}

// Executar classificação inteligente
implementSmartClassification()
  .then(results => {
    console.log('\n✅ CLASSIFICAÇÃO INTELIGENTE CONCLUÍDA!');
    console.log(`📊 ${results.classified} defeitos classificados em hierarquia de 3 níveis`);
    console.log(`📈 Taxa de sucesso: ${(results.classified/results.processed*100).toFixed(1)}%`);
    console.log('🎯 Próximo passo: Implementar no sistema de componentes UI');
  })
  .catch(console.error);