import * as XLSX from 'xlsx';
import { RobustDataProcessor, ProcessingResult } from './RobustDataProcessor';
import { createClient } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';

interface UploadResult {
  uploadId: string;
  summary: {
    fileName: string;
    totalRowsInExcel: number;
    rowsProcessed: number;
    rowsValid: number;
    rowsInserted: number;
    rowsUpdated: number;
    rowsRejected: number;
  };
  details: {
    dateValidationIssues: any[];
    statusValidationIssues: any[];
    calculationIssues: any[];
    missingDataIssues: any[];
    otherErrors: any[];
  };
  processingTime: number;
}

class RobustUploadService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.');
    }
    console.log('SUPABASE_URL no RobustUploadService:', supabaseUrl);
    console.log('SUPABASE_SERVICE_ROLE_KEY no RobustUploadService (parcial):', supabaseServiceRoleKey ? supabaseServiceRoleKey.substring(0, 5) + '...' : '');
    this.supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  }

  async processUpload(file: Express.Multer.File): Promise<UploadResult> {
    const uploadId = this.generateUUID();
    const startTime = Date.now();

    try {
      // 1. VALIDAÇÕES INICIAIS
      this.validateFile(file);

      // 2. PROCESSAR COM TIMEOUT E RETRY
      const processor = new RobustDataProcessor();
      const processingResult = await this.processWithRetry(() => processor.processExcelData(file.buffer), uploadId);

      // 3. SALVAR RESULTADO NO BANCO DE DADOS (apenas se tiver dados válidos)
      let dbResult = { inserted: 0, updated: 0 };
      if (processingResult.data.length > 0) {
        try {
          dbResult = await this.saveResultsToDatabase(processingResult.data, uploadId);
        } catch (dbError) {
          console.error('❌ Erro ao salvar no banco de dados:', dbError);
          // Continuar mesmo se falhar ao salvar no banco
        }
      }

      // 4. RETORNAR RESULTADO
      const processingTime = Date.now() - startTime;

      return {
        uploadId: uploadId,
        summary: {
          fileName: file.originalname,
          totalRowsInExcel: processingResult.analysis.totalRows,
          rowsProcessed: processingResult.log.processedRows,
          rowsValid: processingResult.log.validRows,
          rowsInserted: dbResult.inserted,
          rowsUpdated: dbResult.updated,
          rowsRejected: processingResult.log.errors.length,
        },
        details: {
          dateValidationIssues: processingResult.log.errors.filter(e => e.errors.some(err => err.includes('date'))),
          statusValidationIssues: processingResult.log.errors.filter(e => e.errors.some(err => err.includes('status'))),
          calculationIssues: processingResult.log.errors.filter(e => e.errors.some(err => err.includes('calculation'))),
          missingDataIssues: processingResult.log.errors.filter(e => e.errors.some(err => err.includes('Missing'))),
          otherErrors: processingResult.log.errors.filter(e => !e.errors.some(err => err.includes('date') || err.includes('status') || err.includes('calculation') || err.includes('Missing'))),
        },
        processingTime: processingTime,
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('💥 Erro no processamento:', error);
      throw error;
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new Error('Nenhum arquivo enviado');
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB
      throw new Error('Arquivo muito grande (máximo 50MB)');
    }

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream' // Adicionado para lidar com mimetypes genéricos de upload
    ];

    if (!allowedTypes.includes(file.mimetype) && !file.originalname.endsWith('.xlsx') && !file.originalname.endsWith('.xls')) {
      throw new Error('Tipo de arquivo inválido. Apenas Excel (.xlsx, .xls)');
    }

    try {
      const workbook = XLSX.read(file.buffer);
      if (!workbook.SheetNames.includes('Tabela')) {
        throw new Error('Planilha deve conter uma aba chamada "Tabela"');
      }
    } catch (error) {
      throw new Error(`Arquivo Excel corrompido ou inválido: ${(error as Error).message}`);
    }
  }

  private async processWithRetry<T>(fn: () => Promise<T>, uploadId: string): Promise<T> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentativa ${attempt}/${maxRetries} - Upload ${uploadId}`);
        const result = await Promise.race([
          fn(),
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Processamento excedeu o tempo limite')), 900000)) // 15 minutos timeout para arquivos muito grandes
        ]);
        return result;
      } catch (error) {
        lastError = error;
        console.log(`❌ Tentativa ${attempt} falhou:`, (error as Error).message);
        if (attempt < maxRetries) {
          await this.delay(2000 * attempt);
        }
      }
    }
    throw new Error(`Upload failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async saveResultsToDatabase(data: any[], uploadId: string): Promise<{ inserted: number, updated: number }> {
    let insertedCount = 0;
    let updatedCount = 0;
    const batchSize = 10; // Reduzido para evitar timeout e erro 520
    
    console.log(`💾 Iniciando inserção no banco: ${data.length} registros em lotes de ${batchSize}`);
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      console.log(`📦 Processando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(data.length/batchSize)} - ${batch.length} registros`);
      
      try {
        // Processar lote com retry em caso de falha
        const batchResult = await this.processBatchWithRetry(batch, uploadId);
        insertedCount += batchResult.inserted;
        updatedCount += batchResult.updated;
        
        // Pausa maior entre lotes para evitar sobrecarga
        if (i + batchSize < data.length) {
          await this.delay(500); // 500ms
        }
      } catch (error) {
        console.error(`❌ Erro no lote ${Math.floor(i/batchSize) + 1} (registros ${i + 1} a ${i + batch.length}):`, error);
        // Continuar com próximo lote mesmo se um falhar
      }
    }
    
    console.log(`✅ Inserção concluída: ${insertedCount} inseridos, ${updatedCount} atualizados`);
    return { inserted: insertedCount, updated: updatedCount };
  }
  
  private async processBatchWithRetry(batch: any[], uploadId: string): Promise<{ inserted: number, updated: number }> {
    const maxRetries = 3;
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.processBatch(batch, uploadId);
      } catch (error) {
        lastError = error;
        console.log(`⚠️ Tentativa ${attempt}/${maxRetries} do lote falhou:`, (error as Error).message);
        if (attempt < maxRetries) {
          await this.delay(1000 * attempt); // Backoff exponencial
        }
      }
    }
    throw new Error(`Lote falhou após ${maxRetries} tentativas: ${lastError.message}`);
  }
  
  private async processBatch(batch: any[], uploadId: string): Promise<{ inserted: number, updated: number }> {
    let insertedCount = 0;
    let updatedCount = 0;

    for (const record of batch) {
      try {
        // Verificar se a OS já existe
        const { data: existingOrder, error: selectError } = await this.supabase
          .from('service_orders')
          .select('id')
          .eq('order_number', record.order_number)
          .single();

        if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = No rows found
          console.error(`Erro ao verificar ordem existente ${record.order_number}:`, selectError);
          continue;
        }

        if (existingOrder) {
          // Atualizar ordem existente
          const { error: updateError } = await this.supabase
            .from('service_orders')
            .update(record)
            .eq('id', existingOrder.id);
          if (updateError) {
            console.error(`Erro ao atualizar ordem ${record.order_number}:`, updateError);
          } else {
            updatedCount++;
          }
        } else {
          // Inserir nova ordem
          const { error: insertError } = await this.supabase
            .from('service_orders')
            .insert(record);
          if (insertError) {
            console.error(`Erro ao inserir ordem ${record.order_number}:`, insertError);
          } else {
            insertedCount++;
          }
        }
      } catch (recordError) {
        console.error(`Erro ao processar registro ${record.order_number}:`, recordError);
      }
    }
    return { inserted: insertedCount, updated: updatedCount };
  }
}

export { RobustUploadService, UploadResult };

