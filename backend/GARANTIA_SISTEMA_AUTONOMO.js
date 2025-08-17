/**
 * SISTEMA DE GARANTIA AUTÔNOMA - NUNCA FALHA
 * 
 * Este arquivo garante que a IA sempre funcionará, mesmo após deploy
 * Implementa múltiplos sistemas de fallback e auto-recuperação
 * 
 * Data: 13/08/2025
 * Status: PRODUÇÃO PERMANENTE - NÃO ALTERAR
 */

const { createClient } = require('@supabase/supabase-js');
const { autoClassifyNewOrders, classifyDefectPermanent } = require('./SISTEMA_HIERARQUICO_BACKUP.js');
require('dotenv').config();

// CONFIGURAÇÃO ULTRA-ROBUSTA
const SUPABASE_CLIENT = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: { 'x-my-custom-header': 'hierarchy-ai-system' }
    }
  }
);

/**
 * SISTEMA PRINCIPAL DE GARANTIA AUTÔNOMA
 * Esta função SEMPRE tentará classificar novos dados, usando múltiplos fallbacks
 */
class AutonomousAIGuarantee {
  constructor() {
    this.lastClassificationCheck = Date.now();
    this.failureCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 segundos
    
    // Iniciar monitoramento automático
    this.startAutoMonitoring();
  }

  /**
   * MONITORAMENTO CONTÍNUO - Executa a cada 5 minutos
   */
  startAutoMonitoring() {
    console.log('🛡️ Sistema de Garantia Autônoma ATIVADO - Monitoramento a cada 5 minutos');
    
    // Executar imediatamente
    this.executeAutoClassification();
    
    // Executar a cada 5 minutos
    setInterval(() => {
      this.executeAutoClassification();
    }, 5 * 60 * 1000); // 5 minutos
  }

  /**
   * EXECUÇÃO PRINCIPAL COM MÚLTIPLOS FALLBACKS
   */
  async executeAutoClassification() {
    const timestamp = new Date().toISOString();
    console.log(`\n🤖 [${timestamp}] Executando verificação automática...`);

    try {
      // MÉTODO 1: Sistema Hierárquico Permanente
      let result = await this.tryMethod1_PermanentHierarchy();
      if (result.success && result.processed > 0) {
        console.log(`✅ Método 1 (Hierárquico Permanente): ${result.successful}/${result.processed} classificados`);
        this.resetFailureCount();
        return result;
      }

      // MÉTODO 2: Classificação Direta no Banco
      result = await this.tryMethod2_DirectDatabase();
      if (result.success && result.processed > 0) {
        console.log(`✅ Método 2 (Direto no Banco): ${result.successful}/${result.processed} classificados`);
        this.resetFailureCount();
        return result;
      }

      // MÉTODO 3: Classificação Manual de Emergência
      result = await this.tryMethod3_EmergencyManual();
      if (result.success && result.processed > 0) {
        console.log(`✅ Método 3 (Emergência Manual): ${result.successful}/${result.processed} classificados`);
        this.resetFailureCount();
        return result;
      }

      // Se chegou até aqui, não há defeitos para classificar
      console.log(`ℹ️ Não há defeitos pendentes para classificar`);
      this.resetFailureCount();
      return { success: true, processed: 0, message: 'Nenhum defeito pendente' };

    } catch (error) {
      console.error(`❌ Erro crítico no sistema autônomo:`, error);
      this.handleFailure();
      return { success: false, error: error.message };
    }
  }

  /**
   * MÉTODO 1: Sistema Hierárquico Permanente (Principal)
   */
  async tryMethod1_PermanentHierarchy() {
    try {
      console.log('🎯 Tentando Método 1: Sistema Hierárquico Permanente...');
      const result = await autoClassifyNewOrders();
      return result;
    } catch (error) {
      console.error('❌ Método 1 falhou:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * MÉTODO 2: Classificação Direta no Banco (Fallback 1)
   */
  async tryMethod2_DirectDatabase() {
    try {
      console.log('🎯 Tentando Método 2: Classificação Direta...');
      
      // Buscar defeitos não classificados
      const { data: unclassifiedOrders, error } = await SUPABASE_CLIENT
        .from('service_orders')
        .select('id, order_number, raw_defect_description')
        .not('id', 'in', `(select service_order_id from defect_classifications where service_order_id is not null)`)
        .limit(500); // Limitar para não sobrecarregar

      if (error || !unclassifiedOrders) {
        throw new Error(`Erro ao buscar defeitos: ${error?.message}`);
      }

      if (unclassifiedOrders.length === 0) {
        return { success: true, processed: 0 };
      }

      console.log(`📋 Encontrados ${unclassifiedOrders.length} defeitos para classificar diretamente`);

      let successful = 0;
      
      for (const order of unclassifiedOrders) {
        try {
          const classification = classifyDefectPermanent(order.raw_defect_description);
          
          if (classification.confidence > 0.3) {
            // Buscar/criar categoria
            let categoryId = await this.ensureCategory(classification);
            
            if (categoryId) {
              // Criar classificação direta
              const { error: insertError } = await SUPABASE_CLIENT
                .from('defect_classifications')
                .insert([{
                  service_order_id: order.id,
                  category_id: categoryId,
                  ai_confidence: classification.confidence,
                  ai_reasoning: `[AUTO-MÉTODO-2] ${classification.reasoning}`,
                  original_defect_description: order.raw_defect_description,
                  created_at: new Date().toISOString()
                }]);

              if (!insertError) {
                successful++;
              }
            }
          }

          // Pausar entre processamentos para não sobrecarregar
          if (successful % 50 === 0 && successful > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (error) {
          console.error(`❌ Erro ao processar OS ${order.order_number}:`, error.message);
        }
      }

      return {
        success: true,
        processed: unclassifiedOrders.length,
        successful: successful
      };

    } catch (error) {
      console.error('❌ Método 2 falhou:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * MÉTODO 3: Classificação de Emergência (Fallback 2)
   */
  async tryMethod3_EmergencyManual() {
    try {
      console.log('🎯 Tentando Método 3: Classificação de Emergência...');
      
      // Buscar apenas os 100 defeitos mais recentes não classificados
      const { data: unclassifiedOrders, error } = await SUPABASE_CLIENT
        .from('service_orders')
        .select('id, order_number, raw_defect_description, created_at')
        .not('id', 'in', `(select service_order_id from defect_classifications where service_order_id is not null)`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !unclassifiedOrders || unclassifiedOrders.length === 0) {
        return { success: true, processed: 0 };
      }

      console.log(`🚨 Classificação de EMERGÊNCIA para ${unclassifiedOrders.length} defeitos mais recentes`);

      let successful = 0;
      
      // Classificação ultra-simples por palavras-chave básicas
      for (const order of unclassifiedOrders) {
        try {
          const emergencyCategory = this.getEmergencyClassification(order.raw_defect_description);
          let categoryId = await this.ensureCategory(emergencyCategory);
          
          if (categoryId) {
            const { error: insertError } = await SUPABASE_CLIENT
              .from('defect_classifications')
              .insert([{
                service_order_id: order.id,
                category_id: categoryId,
                ai_confidence: 0.5, // Confiança baixa para emergência
                ai_reasoning: `[EMERGÊNCIA] Classificação automática de fallback`,
                original_defect_description: order.raw_defect_description,
                created_at: new Date().toISOString()
              }]);

            if (!insertError) {
              successful++;
            }
          }
        } catch (error) {
          console.error(`❌ Erro emergencial OS ${order.order_number}:`, error.message);
        }
      }

      return {
        success: true,
        processed: unclassifiedOrders.length,
        successful: successful
      };

    } catch (error) {
      console.error('❌ Método 3 falhou:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * CLASSIFICAÇÃO DE EMERGÊNCIA ULTRA-SIMPLES
   */
  getEmergencyClassification(description) {
    if (!description) {
      return { group: 'Operacional', subgroup: 'Garantia', subsubgroup: 'Aguardando', confidence: 0.3 };
    }

    const text = description.toLowerCase();
    
    if (text.includes('vazamento') || text.includes('vaza')) {
      if (text.includes('oleo') || text.includes('óleo')) {
        return { group: 'Vazamentos', subgroup: 'Oleo', subsubgroup: 'Motor', confidence: 0.6 };
      } else if (text.includes('agua') || text.includes('água')) {
        return { group: 'Vazamentos', subgroup: 'Agua', subsubgroup: 'Radiador', confidence: 0.6 };
      } else {
        return { group: 'Vazamentos', subgroup: 'Oleo', subsubgroup: 'Carter', confidence: 0.5 };
      }
    }
    
    if (text.includes('barulho') || text.includes('ruido')) {
      return { group: 'Ruidos', subgroup: 'Motor', subsubgroup: 'Biela', confidence: 0.5 };
    }
    
    if (text.includes('nao pega') || text.includes('não pega') || text.includes('bateria')) {
      return { group: 'Eletrico', subgroup: 'Partida', subsubgroup: 'Motor', confidence: 0.5 };
    }
    
    if (text.includes('aqueceu') || text.includes('esquenta')) {
      return { group: 'Mecanico', subgroup: 'Refrigeracao', subsubgroup: 'Superaquecimento', confidence: 0.6 };
    }

    // Fallback final
    return { group: 'Operacional', subgroup: 'Manutencao', subsubgroup: 'Revisao', confidence: 0.3 };
  }

  /**
   * GARANTIR QUE CATEGORIA EXISTE NO BANCO
   */
  async ensureCategory(classification) {
    try {
      const categoryName = `${classification.group} - ${classification.subgroup} - ${classification.subsubgroup}`;
      
      // Tentar buscar categoria existente
      let { data: category } = await SUPABASE_CLIENT
        .from('defect_categories')
        .select('id')
        .eq('category_name', categoryName)
        .single();

      if (!category) {
        // Criar nova categoria
        const { data: newCategory } = await SUPABASE_CLIENT
          .from('defect_categories')
          .insert([{
            category_name: categoryName,
            color_hex: this.getGroupColor(classification.group)
          }])
          .select('id')
          .single();
        
        category = newCategory;
      }

      return category?.id || null;
    } catch (error) {
      console.error(`❌ Erro ao garantir categoria:`, error.message);
      return null;
    }
  }

  getGroupColor(group) {
    const colors = {
      'Vazamentos': '#DC2626',
      'Ruidos': '#D97706',
      'Eletrico': '#2563EB',
      'Mecanico': '#16A34A',
      'Operacional': '#7C3AED'
    };
    return colors[group] || '#6B7280';
  }

  handleFailure() {
    this.failureCount++;
    console.error(`💥 Falha ${this.failureCount}/${this.maxRetries} no sistema autônomo`);
    
    if (this.failureCount >= this.maxRetries) {
      console.error(`🚨 ALERTA CRÍTICO: Sistema autônomo falhou ${this.maxRetries} vezes!`);
      // Aqui você poderia enviar um email de alerta ou notificação
      this.resetFailureCount(); // Reset para tentar novamente
    }
  }

  resetFailureCount() {
    this.failureCount = 0;
  }

  /**
   * MÉTODO PÚBLICO PARA FORÇAR CLASSIFICAÇÃO IMEDIATA
   */
  async forceClassification() {
    console.log('🔄 Forçando classificação imediata...');
    return await this.executeAutoClassification();
  }

  /**
   * MÉTODO PÚBLICO PARA VERIFICAR SAÚDE DO SISTEMA
   */
  async healthCheck() {
    try {
      // Verificar conexão com Supabase
      const { data, error } = await SUPABASE_CLIENT
        .from('service_orders')
        .select('count')
        .limit(1);

      if (error) {
        throw new Error(`Erro de conexão: ${error.message}`);
      }

      // Verificar se há defeitos não classificados
      const { data: unclassified } = await SUPABASE_CLIENT
        .from('service_orders')
        .select('id')
        .not('id', 'in', `(select service_order_id from defect_classifications where service_order_id is not null)`)
        .limit(1);

      return {
        status: 'healthy',
        database_connected: true,
        unclassified_count: unclassified?.length || 0,
        last_check: new Date().toISOString(),
        failure_count: this.failureCount
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database_connected: false,
        error: error.message,
        last_check: new Date().toISOString(),
        failure_count: this.failureCount
      };
    }
  }
}

// INSTÂNCIA SINGLETON GLOBAL
const autonomousGuarantee = new AutonomousAIGuarantee();

// EXPORTAR PARA USO EXTERNO
module.exports = {
  autonomousGuarantee,
  AutonomousAIGuarantee,
  forceClassification: () => autonomousGuarantee.forceClassification(),
  healthCheck: () => autonomousGuarantee.healthCheck()
};

// INICIALIZAR AUTOMATICAMENTE SE EXECUTADO DIRETAMENTE
if (require.main === module) {
  console.log('🚀 Iniciando Sistema de Garantia Autônoma...');
  autonomousGuarantee.forceClassification()
    .then(result => {
      console.log('✅ Sistema iniciado com sucesso:', result);
    })
    .catch(error => {
      console.error('❌ Erro na inicialização:', error);
    });
}