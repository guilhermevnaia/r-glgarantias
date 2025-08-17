const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function analyzeClassificationReliability() {
  console.log('🔍 ANÁLISE DE CONFIABILIDADE DAS CLASSIFICAÇÕES');
  
  try {
    // 1. Buscar todas as classificações
    console.log('📊 1. Buscando todas as classificações...');
    let allClassifications = [];
    const pageSize = 1000;
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: pageClassifications, error } = await supabase
        .from('defect_classifications')
        .select(`
          id,
          original_defect_description,
          category_id,
          ai_confidence,
          ai_reasoning,
          defect_categories(category_name, color_hex)
        `)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error('❌ Erro na página', page, ':', error);
        break;
      }

      if (!pageClassifications || pageClassifications.length === 0) {
        hasMore = false;
      } else {
        allClassifications.push(...pageClassifications);
        console.log(`📄 Página ${page + 1}: ${pageClassifications.length} registros (Total: ${allClassifications.length})`);
        page++;
        
        if (pageClassifications.length < pageSize) {
          hasMore = false;
        }
      }
    }

    console.log(`📋 Total de classificações carregadas: ${allClassifications.length}`);

    // 2. Análise de confiança
    console.log('\n📈 2. ANÁLISE DE CONFIANÇA:');
    
    const confidenceRanges = {
      'muito_alta': [], // >= 0.9
      'alta': [],       // 0.7 - 0.9
      'media': [],      // 0.5 - 0.7
      'baixa': [],      // 0.3 - 0.5
      'muito_baixa': [] // < 0.3
    };

    allClassifications.forEach(classification => {
      const confidence = classification.ai_confidence;
      if (confidence >= 0.9) confidenceRanges.muito_alta.push(classification);
      else if (confidence >= 0.7) confidenceRanges.alta.push(classification);
      else if (confidence >= 0.5) confidenceRanges.media.push(classification);
      else if (confidence >= 0.3) confidenceRanges.baixa.push(classification);
      else confidenceRanges.muito_baixa.push(classification);
    });

    const total = allClassifications.length;
    console.log(`🟢 Confiança MUITO ALTA (≥90%): ${confidenceRanges.muito_alta.length} (${((confidenceRanges.muito_alta.length/total)*100).toFixed(1)}%)`);
    console.log(`🔵 Confiança ALTA (70-90%): ${confidenceRanges.alta.length} (${((confidenceRanges.alta.length/total)*100).toFixed(1)}%)`);
    console.log(`🟡 Confiança MÉDIA (50-70%): ${confidenceRanges.media.length} (${((confidenceRanges.media.length/total)*100).toFixed(1)}%)`);
    console.log(`🟠 Confiança BAIXA (30-50%): ${confidenceRanges.baixa.length} (${((confidenceRanges.baixa.length/total)*100).toFixed(1)}%)`);
    console.log(`🔴 Confiança MUITO BAIXA (<30%): ${confidenceRanges.muito_baixa.length} (${((confidenceRanges.muito_baixa.length/total)*100).toFixed(1)}%)`);

    // Estatísticas de confiança
    const confidences = allClassifications.map(c => c.ai_confidence);
    const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const minConfidence = Math.min(...confidences);
    const maxConfidence = Math.max(...confidences);

    console.log(`📊 Confiança média: ${(avgConfidence * 100).toFixed(1)}%`);
    console.log(`📉 Confiança mínima: ${(minConfidence * 100).toFixed(1)}%`);
    console.log(`📈 Confiança máxima: ${(maxConfidence * 100).toFixed(1)}%`);

    // 3. Análise por categoria
    console.log('\n📂 3. DISTRIBUIÇÃO POR CATEGORIA:');
    
    const categoryStats = {};
    allClassifications.forEach(classification => {
      const categoryName = classification.defect_categories?.category_name || 'Desconhecida';
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = {
          count: 0,
          confidences: [],
          avgConfidence: 0
        };
      }
      categoryStats[categoryName].count++;
      categoryStats[categoryName].confidences.push(classification.ai_confidence);
    });

    // Calcular médias por categoria
    Object.keys(categoryStats).forEach(categoryName => {
      const stats = categoryStats[categoryName];
      stats.avgConfidence = stats.confidences.reduce((sum, c) => sum + c, 0) / stats.confidences.length;
    });

    // Ordenar por contagem
    const sortedCategories = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b.count - a.count);

    sortedCategories.forEach(([categoryName, stats]) => {
      console.log(`📋 ${categoryName}: ${stats.count} classificações (${((stats.count/total)*100).toFixed(1)}%) - Confiança média: ${(stats.avgConfidence*100).toFixed(1)}%`);
    });

    // 4. Análise de classificações de baixa confiança
    console.log('\n⚠️ 4. CLASSIFICAÇÕES DE BAIXA CONFIANÇA (REQUEREM REVISÃO):');
    
    const lowConfidenceClassifications = allClassifications.filter(c => c.ai_confidence < 0.5);
    console.log(`🔍 Total de classificações com baixa confiança: ${lowConfidenceClassifications.length}`);

    if (lowConfidenceClassifications.length > 0) {
      console.log('📝 Amostras de baixa confiança:');
      lowConfidenceClassifications.slice(0, 10).forEach((classification, i) => {
        console.log(`  ${i+1}. [${(classification.ai_confidence*100).toFixed(1)}%] "${classification.original_defect_description.substring(0, 60)}..." → ${classification.defect_categories?.category_name}`);
      });
    }

    // 5. Análise de padrões suspeitos
    console.log('\n🚨 5. ANÁLISE DE PADRÕES SUSPEITOS:');
    
    // Classificações muito genéricas
    const genericDescriptions = allClassifications.filter(c => 
      c.original_defect_description.length < 20 || 
      /^(TESTE|TEST|VAZAMENTO|BARULHO|PROBLEMA)$/i.test(c.original_defect_description.trim())
    );
    
    console.log(`⚠️ Descrições muito genéricas: ${genericDescriptions.length}`);

    // Classificações com mesmo texto repetitivo
    const descriptionCounts = {};
    allClassifications.forEach(c => {
      const desc = c.original_defect_description.substring(0, 50);
      descriptionCounts[desc] = (descriptionCounts[desc] || 0) + 1;
    });

    const repeatedDescriptions = Object.entries(descriptionCounts)
      .filter(([desc, count]) => count > 3)
      .sort(([,a], [,b]) => b - a);

    console.log(`🔄 Descrições repetitivas (>3x): ${repeatedDescriptions.length}`);
    if (repeatedDescriptions.length > 0) {
      console.log('📝 Top 5 mais repetitivas:');
      repeatedDescriptions.slice(0, 5).forEach(([desc, count]) => {
        console.log(`  • "${desc}..." (${count}x)`);
      });
    }

    // 6. Recomendações de melhoria
    console.log('\n💡 6. RECOMENDAÇÕES DE MELHORIA:');
    
    const highConfidenceRate = ((confidenceRanges.muito_alta.length + confidenceRanges.alta.length) / total) * 100;
    const lowConfidenceRate = ((confidenceRanges.baixa.length + confidenceRanges.muito_baixa.length) / total) * 100;

    console.log(`📊 Taxa de alta confiança: ${highConfidenceRate.toFixed(1)}%`);
    console.log(`📊 Taxa de baixa confiança: ${lowConfidenceRate.toFixed(1)}%`);

    if (highConfidenceRate >= 80) {
      console.log('🟢 EXCELENTE: Sistema está funcionando muito bem!');
    } else if (highConfidenceRate >= 60) {
      console.log('🟡 BOM: Sistema funcionando bem, mas pode melhorar.');
    } else {
      console.log('🟠 ATENÇÃO: Sistema precisa de melhorias significativas.');
    }

    console.log('\n📋 AÇÕES RECOMENDADAS:');
    
    if (lowConfidenceRate > 20) {
      console.log('1. ⚠️ CRÍTICO: Revisar manualmente classificações com confiança < 50%');
    }
    
    if (genericDescriptions.length > 50) {
      console.log('2. 📝 Melhorar algoritmo para lidar com descrições genéricas');
    }
    
    if (repeatedDescriptions.length > 10) {
      console.log('3. 🔄 Criar regras específicas para padrões repetitivos');
    }

    console.log('4. ✅ Implementar sistema de revisão humana para classificações de baixa confiança');
    console.log('5. 📈 Coletar feedback de usuários para ajustar algoritmo');
    console.log('6. 🎯 Expandir base de palavras-chave por categoria');

    // 7. Score geral do sistema
    console.log('\n🎯 7. SCORE GERAL DO SISTEMA:');
    
    let systemScore = 0;
    
    // Critério 1: Taxa de cobertura (peso 30%)
    const coverageScore = Math.min(100, (allClassifications.length / 2353) * 100);
    systemScore += (coverageScore / 100) * 30;
    
    // Critério 2: Confiança média (peso 40%)
    const confidenceScore = avgConfidence * 100;
    systemScore += (confidenceScore / 100) * 40;
    
    // Critério 3: Taxa de alta confiança (peso 30%)
    systemScore += (highConfidenceRate / 100) * 30;
    
    console.log(`📊 Cobertura: ${coverageScore.toFixed(1)}/100`);
    console.log(`📊 Confiança média: ${confidenceScore.toFixed(1)}/100`);
    console.log(`📊 Alta confiança: ${highConfidenceRate.toFixed(1)}/100`);
    console.log(`🏆 SCORE GERAL: ${systemScore.toFixed(1)}/100`);

    if (systemScore >= 90) {
      console.log('🏆 SISTEMA EXCEPCIONAL - Pronto para produção!');
    } else if (systemScore >= 80) {
      console.log('🥇 SISTEMA MUITO BOM - Algumas melhorias pontuais');
    } else if (systemScore >= 70) {
      console.log('🥈 SISTEMA BOM - Melhorias recomendadas');
    } else {
      console.log('🥉 SISTEMA FUNCIONAL - Melhorias necessárias');
    }

  } catch (error) {
    console.error('❌ Erro na análise de confiabilidade:', error);
  }
}

analyzeClassificationReliability();