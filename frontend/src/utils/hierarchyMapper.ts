// SISTEMA DE MAPEAMENTO HIERÁRQUICO INTELIGENTE
// Grupo > Subgrupo > Subsubgrupo

interface HierarchyResult {
  group: string;
  subgroup: string;
  subsubgroup: string;
  confidence: number;
}

// Sistema de classificação hierárquica baseado em padrões
const HIERARCHY_PATTERNS = {
  // VAZAMENTOS
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

  // RUÍDOS
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

  // ELÉTRICO
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

  // MECÂNICO
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

  // OPERACIONAL
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
};

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function mapToHierarchy(categoryName: string, defectDescription?: string): HierarchyResult {
  // Se temos descrição do defeito, usar classificação inteligente
  if (defectDescription && defectDescription.trim() !== '' && defectDescription !== 'null') {
    const intelligentResult = classifyDefectIntelligently(defectDescription);
    if (intelligentResult) {
      return intelligentResult;
    }
  }

  // Fallback: mapear categoria existente
  return mapExistingCategory(categoryName);
}

function classifyDefectIntelligently(description: string): HierarchyResult | null {
  if (!description || description.trim() === '' || description === 'null') {
    return null;
  }

  const defect = description.toLowerCase().trim();
  let bestMatch = null;
  let maxScore = 0;

  // Percorrer todos os padrões
  Object.entries(HIERARCHY_PATTERNS).forEach(([mainGroup, groupData]) => {
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
              finalScore += 25;
              
              if (defect.startsWith(keyword)) {
                finalScore += 10;
              }
              
              if (defect === keyword) {
                finalScore += 50;
              }
            }
          });

          if (finalScore > maxScore && finalScore > 20) { // Score mínimo
            maxScore = finalScore;
            bestMatch = {
              group: capitalizeFirst(mainGroup),
              subgroup: capitalizeFirst(subGroup),
              subsubgroup: capitalizeFirst(subSubGroup),
              confidence: Math.min(0.98, finalScore / 100)
            };
          }
        });
      });
    }
  });

  return bestMatch;
}

function mapExistingCategory(categoryName: string): HierarchyResult {
  if (!categoryName) {
    return {
      group: 'Não Classificado',
      subgroup: 'Indefinido',
      subsubgroup: 'Geral',
      confidence: 0
    };
  }

  // Mapeamento das categorias existentes para nova hierarquia
  const categoryMappings: Record<string, HierarchyResult> = {
    'Vazamentos': {
      group: 'Vazamentos',
      subgroup: 'Óleo',
      subsubgroup: 'Motor',
      confidence: 0.8
    },
    'Vazamento de Óleo': {
      group: 'Vazamentos',
      subgroup: 'Óleo',
      subsubgroup: 'Motor',
      confidence: 0.8
    },
    'Vazamento Carter': {
      group: 'Vazamentos',
      subgroup: 'Óleo', 
      subsubgroup: 'Carter',
      confidence: 0.9
    },
    'Outros Vazamentos': {
      group: 'Vazamentos',
      subgroup: 'Óleo',
      subsubgroup: 'Selo',
      confidence: 0.6
    },
    'Vazamento de Água/Refrigerante': {
      group: 'Vazamentos',
      subgroup: 'Agua',
      subsubgroup: 'Radiador',
      confidence: 0.8
    },
    'Problemas Mecânicos': {
      group: 'Mecânico',
      subgroup: 'Motor',
      subsubgroup: 'Cabecote',
      confidence: 0.6
    },
    'Ruídos Anômalos': {
      group: 'Ruídos',
      subgroup: 'Motor',
      subsubgroup: 'Biela',
      confidence: 0.7
    },
    'Problemas Elétricos': {
      group: 'Elétrico',
      subgroup: 'Partida',
      subsubgroup: 'Motor',
      confidence: 0.7
    },
    'Superaquecimento': {
      group: 'Mecânico',
      subgroup: 'Refrigeracao',
      subsubgroup: 'Superaquecimento',
      confidence: 0.9
    },
    'Operacional': {
      group: 'Operacional',
      subgroup: 'Desempenho',
      subsubgroup: 'Potencia',
      confidence: 0.5
    }
  };

  return categoryMappings[categoryName] || {
    group: 'Operacional',
    subgroup: 'Manutencao',
    subsubgroup: 'Revisao',
    confidence: 0.3
  };
}