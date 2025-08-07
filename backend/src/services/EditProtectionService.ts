import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface EditedOrderData {
  id: number;
  order_number: string;
  manually_edited: boolean;
  protected_fields: Record<string, boolean>;
  last_edit_date: string;
  edit_count: number;
}

interface NewOrderData {
  order_number: string;
  order_date: string;
  order_status: string;
  engine_manufacturer: string;
  engine_description: string;
  vehicle_model: string;
  raw_defect_description: string;
  responsible_mechanic: string;
  parts_total: number;
  labor_total: number;
  grand_total: number;
}

export class EditProtectionService {
  
  /**
   * BUSCAR TODAS AS ORDENS EDITADAS MANUALMENTE
   * Retorna mapa com order_number como chave para verificação rápida
   */
  async getEditedOrders(): Promise<Map<string, EditedOrderData>> {
    console.log('🔍 Buscando ordens editadas manualmente...');
    
    try {
      const { data: editedOrders, error } = await supabase
        .from('service_orders')
        .select('id, order_number, manually_edited, protected_fields, last_edit_date, edit_count')
        .eq('manually_edited', true);

      if (error) {
        console.error('❌ Erro ao buscar ordens editadas:', error);
        throw new Error(`Erro ao buscar ordens editadas: ${error.message}`);
      }

      const editedMap = new Map<string, EditedOrderData>();
      
      if (editedOrders) {
        editedOrders.forEach(order => {
          editedMap.set(order.order_number, order as EditedOrderData);
        });
        
        console.log(`✅ Encontradas ${editedOrders.length} ordens editadas manualmente`);
      }

      return editedMap;
      
    } catch (error) {
      console.error('❌ Erro crítico ao buscar ordens editadas:', error);
      throw error;
    }
  }

  /**
   * PROTEGER DADOS EDITADOS DURANTE UPLOAD
   * Filtra dados novos preservando edições manuais
   */
  async protectEditedDataDuringUpload(newOrdersData: NewOrderData[]): Promise<{
    newOrders: NewOrderData[];
    protectedOrders: NewOrderData[];
    mergedOrders: any[];
    summary: {
      totalNewOrders: number;
      fullyProtectedOrders: number;
      partiallyMergedOrders: number;
      newOrdersToInsert: number;
    }
  }> {
    console.log('🛡️ Iniciando proteção de dados editados durante upload...');
    console.log(`📊 Total de ordens no upload: ${newOrdersData.length}`);

    try {
      // 1. Buscar todas as ordens editadas
      const editedOrdersMap = await this.getEditedOrders();
      
      const newOrders: NewOrderData[] = [];
      const protectedOrders: NewOrderData[] = [];
      const mergedOrders: any[] = [];

      // 2. Processar cada ordem do upload
      for (const newOrder of newOrdersData) {
        const editedOrder = editedOrdersMap.get(newOrder.order_number);
        
        if (!editedOrder) {
          // ✅ Ordem não foi editada - pode ser inserida normalmente
          newOrders.push(newOrder);
        } else {
          // 🛡️ Ordem foi editada - aplicar proteção
          const protectedFields = editedOrder.protected_fields || {};
          
          if (Object.keys(protectedFields).length === 0) {
            // Editado mas sem campos protegidos específicos - proteger completamente
            protectedOrders.push(newOrder);
            console.log(`🛡️ Ordem ${newOrder.order_number}: TOTALMENTE PROTEGIDA (sem campos específicos)`);
          } else {
            // Fazer merge preservando campos editados
            const mergedOrder = await this.mergeOrderData(editedOrder.id, newOrder, protectedFields);
            mergedOrders.push(mergedOrder);
            console.log(`🔄 Ordem ${newOrder.order_number}: PARCIALMENTE MESCLADA (${Object.keys(protectedFields).length} campos protegidos)`);
          }
        }
      }

      const summary = {
        totalNewOrders: newOrdersData.length,
        fullyProtectedOrders: protectedOrders.length,
        partiallyMergedOrders: mergedOrders.length,
        newOrdersToInsert: newOrders.length
      };

      console.log('📊 RESUMO DA PROTEÇÃO:');
      console.log(`   📋 Total no upload: ${summary.totalNewOrders}`);
      console.log(`   🆕 Novas ordens: ${summary.newOrdersToInsert}`);
      console.log(`   🛡️ Totalmente protegidas: ${summary.fullyProtectedOrders}`);
      console.log(`   🔄 Parcialmente mescladas: ${summary.partiallyMergedOrders}`);

      return {
        newOrders,
        protectedOrders,
        mergedOrders,
        summary
      };

    } catch (error) {
      console.error('❌ Erro na proteção de dados editados:', error);
      throw error;
    }
  }

  /**
   * FAZER MERGE DE DADOS PRESERVANDO CAMPOS EDITADOS
   */
  private async mergeOrderData(
    orderId: number, 
    newData: NewOrderData, 
    protectedFields: Record<string, boolean>
  ): Promise<any> {
    try {
      // Buscar dados atuais da ordem
      const { data: currentOrder, error } = await supabase
        .from('service_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error || !currentOrder) {
        throw new Error(`Erro ao buscar ordem atual: ${error?.message}`);
      }

      // Criar objeto com dados mesclados
      const mergedData: any = { 
        id: orderId,
        order_number: currentOrder.order_number // order_number sempre preservado
      };

      // Para cada campo, decidir se usa o novo valor ou preserva o editado
      const fieldsToCheck = [
        'order_date', 'order_status', 'engine_manufacturer', 'engine_description',
        'vehicle_model', 'raw_defect_description', 'responsible_mechanic',
        'parts_total', 'labor_total', 'grand_total'
      ];

      fieldsToCheck.forEach(fieldName => {
        if (protectedFields[fieldName]) {
          // Campo foi editado - preservar valor atual
          mergedData[fieldName] = currentOrder[fieldName];
          console.log(`  🔒 ${fieldName}: PRESERVADO (editado pelo usuário)`);
        } else {
          // Campo não foi editado - usar novo valor
          mergedData[fieldName] = newData[fieldName as keyof NewOrderData];
          console.log(`  📝 ${fieldName}: ATUALIZADO (novo valor da planilha)`);
        }
      });

      // Preservar metadados de edição
      mergedData.manually_edited = currentOrder.manually_edited;
      mergedData.protected_fields = currentOrder.protected_fields;
      mergedData.last_edited_by = currentOrder.last_edited_by;
      mergedData.last_edit_date = currentOrder.last_edit_date;
      mergedData.edit_count = currentOrder.edit_count;
      mergedData.updated_at = new Date().toISOString();

      return mergedData;

    } catch (error) {
      console.error(`❌ Erro ao fazer merge da ordem ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * APLICAR ATUALIZAÇÕES MESCLADAS
   */
  async applyMergedUpdates(mergedOrders: any[]): Promise<{
    updated: number;
    errors: number;
  }> {
    if (mergedOrders.length === 0) {
      return { updated: 0, errors: 0 };
    }

    console.log(`🔄 Aplicando ${mergedOrders.length} atualizações mescladas...`);

    let updated = 0;
    let errors = 0;

    for (const order of mergedOrders) {
      try {
        const { error } = await supabase
          .from('service_orders')
          .update(order)
          .eq('id', order.id);

        if (error) {
          console.error(`❌ Erro ao atualizar ordem ${order.order_number}:`, error);
          errors++;
        } else {
          updated++;
        }

      } catch (error) {
        console.error(`❌ Erro crítico ao atualizar ordem ${order.order_number}:`, error);
        errors++;
      }
    }

    console.log(`✅ Atualizações aplicadas: ${updated} sucessos, ${errors} erros`);
    return { updated, errors };
  }

  /**
   * REGISTRAR LOG DE PROTEÇÃO PARA AUDITORIA
   */
  async logProtectionActivity(summary: any, uploadId: string): Promise<void> {
    try {
      await supabase
        .from('upload_logs')
        .insert({
          upload_id: uploadId,
          filename: 'protection_log',
          status: 'PROTECTION_APPLIED',
          processing_time: 0,
          summary: {
            ...summary,
            protection_type: 'EDIT_PROTECTION',
            system_version: '2.0_EDIT_PROTECTION',
            timestamp: new Date().toISOString()
          },
          details: {
            message: 'Sistema de proteção de dados editados aplicado com sucesso',
            method: 'EDIT_PROTECTION_SERVICE'
          }
        });

      console.log('📝 Log de proteção registrado com sucesso');

    } catch (error) {
      console.warn('⚠️ Falha ao registrar log de proteção (não crítico):', error);
    }
  }

  /**
   * RELATÓRIO DE ORDENS EDITADAS
   */
  async getEditedOrdersReport(): Promise<{
    totalEdited: number;
    recentEdits: any[];
    mostEditedOrders: any[];
    fieldEditStats: Record<string, number>;
  }> {
    try {
      const { data: editedOrders, error } = await supabase
        .from('service_orders')
        .select('*')
        .eq('manually_edited', true)
        .order('last_edit_date', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar relatório: ${error.message}`);
      }

      const recentEdits = editedOrders?.slice(0, 10) || [];
      const mostEditedOrders = editedOrders?.sort((a, b) => (b.edit_count || 0) - (a.edit_count || 0)).slice(0, 10) || [];
      
      // Estatísticas de campos editados
      const fieldEditStats: Record<string, number> = {};
      
      editedOrders?.forEach(order => {
        const protectedFields = order.protected_fields || {};
        Object.keys(protectedFields).forEach(field => {
          fieldEditStats[field] = (fieldEditStats[field] || 0) + 1;
        });
      });

      return {
        totalEdited: editedOrders?.length || 0,
        recentEdits,
        mostEditedOrders,
        fieldEditStats
      };

    } catch (error) {
      console.error('❌ Erro ao gerar relatório de ordens editadas:', error);
      throw error;
    }
  }
}

export default EditProtectionService;