import { Request, Response } from 'express';
import { CleanDataProcessor } from '../services/CleanDataProcessor';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
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

      // 3. INSERIR DADOS NO SUPABASE (BATCH OTIMIZADO)
      let insertedCount = 0;
      let updatedCount = 0;

      if (result.data.length > 0) {
        console.log(`💾 Inserindo ${result.data.length} registros em batches...`);
        
        // Processar em lotes de 100 para melhor performance
        const batchSize = 100;
        for (let i = 0; i < result.data.length; i += batchSize) {
          const batch = result.data.slice(i, i + batchSize);
          
          try {
            const { error } = await supabase
              .from('service_orders')
              .upsert(batch, {
                onConflict: 'order_number'
              });

            if (error) {
              console.error(`Erro no batch ${Math.floor(i/batchSize) + 1}:`, error);
            } else {
              insertedCount += batch.length;
              console.log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} registros`);
            }
          } catch (err) {
            console.error(`Erro no batch ${Math.floor(i/batchSize) + 1}:`, err);
          }
        }
      }

      // 4. REGISTRAR LOG
      const processingTime = Date.now() - startTime;
      const summary = {
        fileName: req.file.originalname,
        totalRowsInExcel: result.summary.totalRows,
        rowsProcessed: result.data.length,
        rowsValid: result.data.length,
        rowsInserted: insertedCount,
        rowsUpdated: updatedCount,
        rowsRejected: result.summary.totalRows - result.data.length
      };

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
            removedByDate: result.summary.removedByDate
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
          removedByDate: result.summary.removedByDate,
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