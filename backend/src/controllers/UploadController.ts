import { Request, Response } from 'express';
import { CleanDataProcessor } from '../services/CleanDataProcessor';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

class UploadController {
  private processor: CleanDataProcessor;

  constructor() {
    this.processor = new CleanDataProcessor();
  }

  async uploadExcel(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const uploadId = uuidv4();

    try {
      console.log('📤 Iniciando upload:', req.file?.originalname);

      // 1. VALIDAR ARQUIVO
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'Nenhum arquivo enviado'
        });
        return;
      }

      // 2. PROCESSAR COM PROCESSOR LIMPO
      const result = await this.processor.processExcelData(req.file.buffer);

      // 3. INSERIR DADOS NO SUPABASE COM DETECÇÃO DE DUPLICATAS
      let insertedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      if (result.data.length > 0) {
        console.log(`💾 Processando ${result.data.length} registros com detecção de duplicatas...`);
        
        // PASSO 1: Verificar quais registros já existem no banco (em batches)
        const orderNumbers = result.data.map(row => row.order_number);
        console.log(`🔍 Verificando duplicatas para ${orderNumbers.length} registros...`);
        
        const existingOrderNumbers = new Set<string>();
        const batchSize = 1000; // Limitar queries para evitar timeout
        
        try {
          for (let i = 0; i < orderNumbers.length; i += batchSize) {
            const batch = orderNumbers.slice(i, i + batchSize);
            console.log(`   Verificando batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(orderNumbers.length/batchSize)}: ${batch.length} registros`);
            
            const { data: existingOrders, error: checkError } = await supabase
              .from('service_orders')
              .select('order_number')
              .in('order_number', batch);

            if (checkError) {
              console.error('❌ Erro ao verificar batch de duplicatas:', checkError);
              throw new Error(`Erro ao verificar duplicatas no batch ${Math.floor(i/batchSize) + 1}: ${checkError.message}`);
            }

            // Adicionar ao Set
            if (existingOrders) {
              existingOrders.forEach(order => existingOrderNumbers.add(order.order_number));
            }
          }
          
          console.log(`🔍 Total de registros já existentes no banco: ${existingOrderNumbers.size}`);
        } catch (error) {
          console.error('❌ Erro durante verificação de duplicatas:', error);
          throw new Error('Falha na verificação de duplicatas');
        }

        // PASSO 2: Separar registros novos dos existentes
        const newRecords = result.data.filter(row => !existingOrderNumbers.has(row.order_number));
        const existingRecords = result.data.filter(row => existingOrderNumbers.has(row.order_number));

        console.log(`📊 ANÁLISE DE DUPLICATAS:`);
        console.log(`   Total na planilha: ${result.data.length}`);
        console.log(`   Já existem no banco: ${existingRecords.length}`);
        console.log(`   Novos para inserir: ${newRecords.length}`);
        
        skippedCount = existingRecords.length;

        // PASSO 3: Inserir apenas registros novos
        if (newRecords.length > 0) {
          console.log(`🆕 Inserindo ${newRecords.length} registros novos em batches...`);
          
          const batchSize = 100;
          for (let i = 0; i < newRecords.length; i += batchSize) {
            const batch = newRecords.slice(i, i + batchSize);
            
            try {
              const { data, error } = await supabase
                .from('service_orders')
                .insert(batch)
                .select('order_number');

              if (error) {
                console.error(`❌ Erro no batch ${Math.floor(i/batchSize) + 1}:`, error);
                errorCount += batch.length;
              } else {
                const actualInserted = (data as any)?.length || batch.length;
                insertedCount += actualInserted;
                console.log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: ${actualInserted} novos registros inseridos`);
              }
            } catch (err) {
              console.error(`❌ Erro no batch ${Math.floor(i/batchSize) + 1}:`, err);
              errorCount += batch.length;
            }
          }
        } else {
          console.log(`ℹ️ Nenhum registro novo encontrado - todos já existem no banco`);
        }
        
        // VERIFICAÇÃO FINAL
        console.log(`🔍 RESUMO FINAL DA INSERÇÃO:`);
        console.log(`   Registros processados: ${result.data.length}`);
        console.log(`   Registros já existentes (ignorados): ${skippedCount}`);
        console.log(`   Novos registros inseridos: ${insertedCount}`);
        console.log(`   Erros: ${errorCount}`);
        console.log(`   Total esperado no banco: ${skippedCount + insertedCount}`);
      }

      // 4. REGISTRAR LOG
      const processingTime = Date.now() - startTime;
      const summary = {
        fileName: req.file.originalname,
        totalRowsInExcel: result.summary.totalRows,
        rowsProcessed: result.data.length,
        rowsValid: result.data.length,
        rowsInserted: insertedCount,
        rowsSkipped: skippedCount,
        rowsUpdated: updatedCount,
        errorCount: errorCount,
        rowsRejected: result.summary.totalRows - result.data.length,
        // Detalhes dos filtros aplicados
        removedByMissingFields: result.summary.removedByMissingFields,
        removedByStatus: result.summary.removedByStatus,
        removedByInvalidDate: result.summary.removedByInvalidDate,
        removedByYearRange: result.summary.removedByYearRange,
        mathematicallyCorrect: result.summary.mathematicallyCorrect,
        // Nova informação sobre duplicatas
        duplicateDetectionEnabled: true,
        existingRecordsSkipped: skippedCount
      };

      console.log(`📊 RESUMO FINAL DO UPLOAD:`);
      console.log(`   Arquivo: ${summary.fileName}`);
      console.log(`   Linhas no Excel: ${summary.totalRowsInExcel}`);
      console.log(`   Processadas com sucesso: ${summary.rowsProcessed}`);
      console.log(`   Registros já existentes (ignorados): ${summary.rowsSkipped}`);
      console.log(`   Novos registros inseridos: ${summary.rowsInserted}`);
      console.log(`   Rejeitadas por filtros: ${summary.rowsRejected}`);
      console.log(`   Erros durante inserção: ${summary.errorCount}`);
      console.log(`   Matemática correta: ${summary.mathematicallyCorrect ? '✅' : '❌'}`);
      console.log(`   Detecção de duplicatas: ${summary.duplicateDetectionEnabled ? '✅ Ativa' : '❌ Inativa'}`);
      console.log(`   Tempo de processamento: ${(processingTime / 1000).toFixed(2)}s`);

      await supabase
        .from('upload_logs')
        .insert({
          upload_id: uploadId,
          filename: req.file.originalname,
          status: 'SUCCESS',
          processing_time: processingTime,
          summary: summary,
          details: {
            statusDistribution: result.summary.statusDistribution,
            yearDistribution: result.summary.yearDistribution,
            removedByStatus: result.summary.removedByStatus,
            removedByInvalidDate: result.summary.removedByInvalidDate,
            removedByYearRange: result.summary.removedByYearRange
          }
        });

      // 5. RESPOSTA OTIMIZADA
      res.json({
        success: true,
        uploadId: uploadId,
        processingTime: processingTime,
        summary: summary,
        details: {
          statusDistribution: result.summary.statusDistribution,
          yearDistribution: result.summary.yearDistribution,
          removedByStatus: result.summary.removedByStatus,
          removedByInvalidDate: result.summary.removedByInvalidDate,
          removedByYearRange: result.summary.removedByYearRange,
          dateValidationIssues: [],
          statusValidationIssues: [],
          calculationIssues: [],
          missingDataIssues: [],
          otherErrors: []
        }
      });

    } catch (error) {
      console.error('💥 Erro no upload:', error);

      // Registrar erro no log
      await supabase
        .from('upload_logs')
        .insert({
          upload_id: uploadId,
          filename: req.file?.originalname || 'unknown',
          status: 'FAILED',
          processing_time: Date.now() - startTime,
          summary: { error: (error as Error).message },
          details: { error: (error as Error).stack }
        });

      res.status(500).json({
        success: false,
        error: (error as Error).message,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    }
  }
}

export { UploadController };