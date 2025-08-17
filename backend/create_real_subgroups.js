const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function criarSubgruposReais() {
  console.log('🔍 Analisando defeitos reais para criar estrutura hierárquica...');
  
  try {
    // 1. Buscar todas as classificações com descrições de defeitos
    const { data: classificacoes } = await supabase
      .from('defect_classifications')
      .select(`
        id,
        original_defect_description,
        category_id,
        category_name,
        ai_confidence,
        service_orders!inner(
          id,
          order_number,
          engine_manufacturer,
          vehicle_model,
          raw_defect_description
        )
      `)
      .limit(1000);
    
    console.log('📊 Total de classificações analisadas:', classificacoes?.length || 0);
    
    // 2. Agrupar por categoria e analisar padrões
    const analiseCategoria = {};
    
    classificacoes?.forEach(classificacao => {
      const categoria = classificacao.category_name;
      const descricao = classificacao.original_defect_description || classificacao.service_orders?.raw_defect_description || '';
      
      if (!analiseCategoria[categoria]) {
        analiseCategoria[categoria] = {
          total: 0,
          descricoes: [],
          subgruposPotenciais: new Map()
        };
      }
      
      analiseCategoria[categoria].total++;
      analiseCategoria[categoria].descricoes.push(descricao.toLowerCase());
      
      // Identificar subgrupos baseado em palavras-chave específicas
      identificarSubgrupos(descricao, categoria, analiseCategoria[categoria].subgruposPotenciais);
    });
    
    // 3. Gerar estrutura hierárquica baseada em dados reais
    console.log('\\n🏗️ ESTRUTURA HIERÁRQUICA IDENTIFICADA:');
    console.log('=' + '='.repeat(60));
    
    for (const [categoria, dados] of Object.entries(analiseCategoria)) {
      console.log(`\\n📂 CATEGORIA: ${categoria} (${dados.total} casos)`);
      console.log('-'.repeat(50));
      
      // Mostrar subgrupos encontrados
      const subgrupos = Array.from(dados.subgruposPotenciais.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 8); // Top 8 subgrupos
      
      subgrupos.forEach(([subgrupo, info]) => {
        const percentual = ((info.count / dados.total) * 100).toFixed(1);
        console.log(`  📁 ${subgrupo}: ${info.count} casos (${percentual}%)`);
        
        // Mostrar exemplos
        if (info.exemplos.length > 0) {
          console.log(`     Exemplos: ${info.exemplos.slice(0, 2).map(ex => `"${ex.substring(0, 60)}..."`).join(', ')}`);
        }
      });
    }
    
    // 4. Criar estrutura no banco de dados
    await criarEstruturaNoBanco(analiseCategoria);
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

function identificarSubgrupos(descricao, categoria, subgruposPotenciais) {
  const desc = descricao.toLowerCase();
  
  // Padrões específicos por categoria
  const padroes = {
    'Vazamentos': {
      'Vazamento de Óleo - Carter': ['carter', 'oleo carter', 'dreno'],
      'Vazamento de Óleo - Filtro': ['filtro oleo', 'filtro de oleo', 'gaxeta filtro'],
      'Vazamento de Óleo - Vedações': ['vedacao', 'junta', 'retentor', 'anel'],
      'Vazamento de Óleo - Cabeçote': ['cabecote', 'cabeçote', 'junta cabecote'],
      'Vazamento de Água - Radiador': ['radiador', 'agua radiador', 'refrigerante'],
      'Vazamento de Água - Mangueiras': ['mangueira', 'mangote', 'flexivel'],
      'Vazamento de Água - Bomba': ['bomba agua', 'bomba d\'agua', 'bomba dagua'],
      'Vazamento de Combustível': ['combustivel', 'diesel', 'gasolina', 'bico injetor']
    },
    'Problemas Mecânicos': {
      'Desgaste de Peças': ['desgast', 'gast', 'worn', 'deteriora'],
      'Quebras e Fraturas': ['quebr', 'rachad', 'fratur', 'parti'],
      'Folgas Excessivas': ['folga', 'loose', 'play', 'frouxo'],
      'Travamentos': ['travad', 'emperra', 'stuck', 'preso'],
      'Corrosão': ['corros', 'ferrugem', 'oxidac', 'rust']
    },
    'Ruídos Anômalos': {
      'Ruído Metálico': ['metalic', 'ferragem', 'batida metal'],
      'Ruído de Rolamento': ['rolamento', 'bearing', 'mancal'],
      'Ruído de Motor': ['motor barulh', 'ruido motor', 'batida motor'],
      'Ruído de Bomba': ['bomba barulh', 'ruido bomba', 'cavitacao'],
      'Ruído de Válvulas': ['valvula', 'valve', 'batida valvula']
    },
    'Superaquecimento': {
      'Superaquecimento - Radiador': ['radiador entupid', 'radiador sujo', 'radiador obstruid'],
      'Superaquecimento - Termostato': ['termostat', 'valvula termic'],
      'Superaquecimento - Bomba': ['bomba agua', 'circulacao'],
      'Superaquecimento - Ventilador': ['ventilador', 'ventoinha', 'eletro ventilador']
    },
    'Problemas Elétricos': {
      'Sensores': ['sensor', 'sonda', 'transdut'],
      'Fiação': ['fio', 'cabo', 'chicote', 'fiacao'],
      'Velas e Ignição': ['vela', 'ignicao', 'bobina'],
      'Alternador/Bateria': ['alternador', 'bateria', 'carga']
    },
    'Operacional': {
      'Manutenção Preventiva': ['manutencao', 'revisao', 'inspecao'],
      'Testes e Verificações': ['test', 'verifica', 'check'],
      'Ajustes': ['ajust', 'regulag', 'calibra']
    }
  };
  
  const categoriaPatroes = padroes[categoria] || {};
  
  for (const [subgrupo, palavrasChave] of Object.entries(categoriaPatroes)) {
    const encontrou = palavrasChave.some(palavra => desc.includes(palavra));
    
    if (encontrou) {
      if (!subgruposPotenciais.has(subgrupo)) {
        subgruposPotenciais.set(subgrupo, { count: 0, exemplos: [] });
      }
      
      const info = subgruposPotenciais.get(subgrupo);
      info.count++;
      if (info.exemplos.length < 5) {
        info.exemplos.push(descricao);
      }
    }
  }
}

async function criarEstruturaNoBanco(analiseCategoria) {
  console.log('\\n💾 Criando estrutura hierárquica no banco...');
  
  try {
    // Para cada categoria, criar subgrupos reais baseados na análise
    for (const [categoriaNome, dados] of Object.entries(analiseCategoria)) {
      if (dados.total < 10) continue; // Apenas categorias com volume significativo
      
      console.log(`\\n📋 Processando: ${categoriaNome}`);
      
      // Buscar ID da categoria pai
      const { data: categoriaPai } = await supabase
        .from('defect_categories')
        .select('id')
        .eq('category_name', categoriaNome)
        .single();
      
      if (!categoriaPai) continue;
      
      // Criar subgrupos baseados na análise
      const subgrupos = Array.from(dados.subgruposPotenciais.entries())
        .filter(([, info]) => info.count >= 3) // Mínimo 3 ocorrências
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 6); // Top 6 subgrupos
      
      for (const [subgrupoNome, info] of subgrupos) {
        // Verificar se já existe
        const { data: existente } = await supabase
          .from('defect_categories')
          .select('id')
          .eq('category_name', subgrupoNome);
        
        if (existente && existente.length > 0) {
          console.log(`  ⚠️ Subgrupo já existe: ${subgrupoNome}`);
          continue;
        }
        
        // Criar subgrupo
        const novoSubgrupo = {
          category_name: subgrupoNome,
          description: `[GRUPO: ${categoriaNome}] [SUBGRUPO] ${subgrupoNome} - Baseado em ${info.count} casos reais`,
          color_hex: categoriaPai ? '#6366f1' : '#8b5cf6', // Cores diferenciadas para subgrupos
          icon: getIconForSubgroup(subgrupoNome),
          keywords: extrairPalavrasChave(info.exemplos),
          total_occurrences: info.count,
          is_active: true,
          sample_defects: info.exemplos.slice(0, 3)
        };
        
        const { data: subgrupoCriado, error } = await supabase
          .from('defect_categories')
          .insert([novoSubgrupo])
          .select()
          .single();
        
        if (error) {
          console.error(`❌ Erro ao criar subgrupo ${subgrupoNome}:`, error);
        } else {
          console.log(`  ✅ Subgrupo criado: ${subgrupoNome} (${info.count} casos)`);
        }
      }
    }
    
    console.log('\\n🎉 Estrutura hierárquica criada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar estrutura no banco:', error);
  }
}

function getIconForSubgroup(subgrupoNome) {
  if (subgrupoNome.includes('Óleo')) return 'droplets';
  if (subgrupoNome.includes('Água')) return 'droplets';
  if (subgrupoNome.includes('Ruído')) return 'volume-2';
  if (subgrupoNome.includes('Superaquecimento')) return 'thermometer';
  if (subgrupoNome.includes('Elétrico') || subgrupoNome.includes('Sensor')) return 'zap';
  if (subgrupoNome.includes('Mecânico') || subgrupoNome.includes('Desgaste')) return 'wrench';
  return 'settings';
}

function extrairPalavrasChave(exemplos) {
  // Extrair palavras-chave mais comuns dos exemplos
  const palavras = new Map();
  
  exemplos.forEach(exemplo => {
    const tokens = exemplo.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(palavra => palavra.length > 3 && !['para', 'como', 'mais', 'muito', 'pode', 'estar', 'sendo'].includes(palavra));
    
    tokens.forEach(palavra => {
      palavras.set(palavra, (palavras.get(palavra) || 0) + 1);
    });
  });
  
  return Array.from(palavras.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([palavra]) => palavra);
}

criarSubgruposReais();