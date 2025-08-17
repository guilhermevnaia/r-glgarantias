import { Request, Response } from 'express';
import { PythonExcelService, PythonProcessingResult } from '../services/PythonExcelService';
import EditProtectionService from '../services/EditProtectionService';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { SimpleAIService } from '../services/SimpleAIService';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

class UploadControllerV2 {
  private pythonService: PythonExcelService;
  private editProtectionService: EditProtectionService;
  private aiService: SimpleAIService;

  constructor() {
    this.pythonService = new PythonExcelService();
    this.editProtectionService = new EditProtectionService();
    this.aiService = SimpleAIService.getInstance();
  }

  /**
   * UPLOAD DEFINITIVO COM PYTHON PANDAS
   * 
   * Este método substitui completamente o uploadExcel anterior
   * e garante processamento 100% correto dos dados Excel.
   */
  async uploadExcelDefinitive(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const uploadId = uuidv4();
    
    console.log('🚀 === SISTEMA DEFINITIVO DE UPLOAD EXCEL ===');
    console.log(`📋 Upload ID: ${uploadId}`);

    try {
      // 1. VALIDAR ARQUIVO
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'Nenhum arquivo enviado'
        });
        return;
      }

      console.log(`📁 Arquivo: ${req.file.originalname}`);
      console.log(`📊 Tamanho: ${(req.file.buffer.length / 1024 / 1024).toFixed(2)} MB`);

      // 2. VALIDAR AMBIENTE PYTHON
      const pythonValidation = await this.pythonService.validatePythonEnvironment();
      if (!pythonValidation.valid) {
        console.error('❌ Ambiente Python não configurado:', pythonValidation.error);
        res.status(500).json({
          success: false,
          error: `Ambiente Python não configurado: ${pythonValidation.error}`,
          suggestion: 'Instale Python 3.x e as dependências: pip install pandas openpyxl numpy'
        });
        return;
      }

      console.log('✅ Ambiente Python validado');

      // 3. PROCESSAR COM PYTHON PANDAS (DEFINITIVO)
      console.log('🐍 Iniciando processamento definitivo com Python pandas...');
      const processingResult = await this.pythonService.processExcelBuffer(
        req.file.buffer, 
        req.file.originalname
      );

      if (!processingResult.success) {
        throw new Error(`Processamento Python falhou: ${processingResult.errors.join(', ')}`);
      }

      console.log('🎯 RESULTADOS DO PROCESSAMENTO PYTHON:');
      console.log(`   📊 Total linhas Excel: ${processingResult.total_rows_excel}`);
      console.log(`   ✅ Linhas válidas: ${processingResult.valid_rows}`);
      console.log(`   ❌ Linhas rejeitadas: ${processingResult.rejected_rows}`);
      console.log(`   ⏱️ Tempo Python: ${processingResult.processing_time_seconds.toFixed(2)}s`);
      console.log(`   🧮 Validação matemática: ${processingResult.summary.mathematically_correct ? '✅' : '❌'}`);

      // 4. 🛡️ SISTEMA DE PROTEÇÃO DE DADOS EDITADOS
      let insertedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      let protectedCount = 0;
      let mergedCount = 0;

      console.log(`🔍 DADOS PROCESSADOS PELO PYTHON: ${processingResult.data.length} registros`);
      console.log(`🔍 PRIMEIRO REGISTRO:`, JSON.stringify(processingResult.data[0], null, 2));

      if (processingResult.data.length > 0) {
        console.log('🛡️ Iniciando sistema de proteção de dados editados...');
        
        try {
          // APLICAR PROTEÇÃO DE DADOS EDITADOS
          const protectionResult = await this.editProtectionService.protectEditedDataDuringUpload(processingResult.data);
          
          console.log('📊 RESULTADO DA PROTEÇÃO:');
          console.log(`   🆕 Ordens novas para inserir: ${protectionResult.newOrders.length}`);
          console.log(`   🛡️ Ordens totalmente protegidas: ${protectionResult.protectedOrders.length}`);
          console.log(`   🔄 Ordens parcialmente mescladas: ${protectionResult.mergedOrders.length}`);

          // INSERIR APENAS ORDENS REALMENTE NOVAS
          if (protectionResult.newOrders.length > 0) {
            const duplicateResults = await this.handleDuplicateDetection(protectionResult.newOrders);
            insertedCount = duplicateResults.inserted;
            skippedCount = duplicateResults.skipped;
            errorCount = duplicateResults.errors;
          }

          // APLICAR ATUALIZAÇÕES MESCLADAS (preservando edições)
          if (protectionResult.mergedOrders.length > 0) {
            const mergeResults = await this.editProtectionService.applyMergedUpdates(protectionResult.mergedOrders);
            mergedCount = mergeResults.updated;
            errorCount += mergeResults.errors;
          }

          // CONTAR ORDENS PROTEGIDAS
          protectedCount = protectionResult.protectedOrders.length;

          // REGISTRAR LOG DE PROTEÇÃO
          await this.editProtectionService.logProtectionActivity(protectionResult.summary, uploadId);

          console.log('📊 RESULTADO FINAL DA INSERÇÃO COM PROTEÇÃO:');
          console.log(`   🆕 Novos registros inseridos: ${insertedCount}`);
          console.log(`   🔄 Registros mesclados (preservando edições): ${mergedCount}`);
          console.log(`   🛡️ Registros totalmente protegidos: ${protectedCount}`);
          console.log(`   ⚠️ Duplicatas ignoradas: ${skippedCount}`);
          console.log(`   ❌ Erros na inserção: ${errorCount}`);

        } catch (error) {
          console.error('💥 ERRO CRÍTICO NO SISTEMA DE PROTEÇÃO:', error);
          // Fallback para o sistema antigo em caso de erro
          console.log('🔄 Usando sistema de inserção sem proteção como fallback...');
          const duplicateResults = await this.handleDuplicateDetection(processingResult.data);
          insertedCount = duplicateResults.inserted;
          skippedCount = duplicateResults.skipped;
          errorCount = duplicateResults.errors;
        }
      } else {
        console.log('⚠️ Nenhum dado processado pelo Python - array vazio');
      }

      // 5. REGISTRAR LOG DETALHADO
      const processingTime = Date.now() - startTime;
      const logSummary = {
        uploadId,
        fileName: req.file.originalname,
        processingMethod: 'PYTHON_PANDAS_DEFINITIVE',
        pythonProcessingTime: processingResult.processing_time_seconds,
        totalProcessingTime: processingTime / 1000,
        
        // Dados do Excel
        totalRowsInExcel: processingResult.total_rows_excel,
        rowsValidated: processingResult.valid_rows,
        rowsRejected: processingResult.rejected_rows,
        
        // Rejeições detalhadas
        rejectedByMissingFields: processingResult.summary.rejected_by_missing_fields,
        rejectedByInvalidStatus: processingResult.summary.rejected_by_invalid_status,
        rejectedByInvalidDate: processingResult.summary.rejected_by_invalid_date,
        rejectedByYearRange: processingResult.summary.rejected_by_year_range,
        
        // Inserção no banco com proteção
        rowsInserted: insertedCount,
        rowsSkippedDuplicates: skippedCount,
        rowsWithInsertionErrors: errorCount,
        rowsProtected: protectedCount,
        rowsMerged: mergedCount,
        
        // Distribuições
        statusDistribution: processingResult.summary.status_distribution,
        yearDistribution: processingResult.summary.year_distribution,
        
        // Validações
        mathematicallyCorrect: processingResult.summary.mathematically_correct,
        processingErrors: processingResult.summary.processing_errors,
        
        // Metadata
        systemVersion: '2.0_PYTHON_PANDAS',
        reliability: 'HIGH',
        dataAccuracy: processingResult.summary.mathematically_correct ? 'VERIFIED' : 'NEEDS_REVIEW'
      };

      await this.logUploadResult(uploadId, 'SUCCESS', logSummary);

      // 🤖 CLASSIFICAÇÃO AUTOMÁTICA DE DEFEITOS COM IA (EM BACKGROUND)
      if (insertedCount > 0) {
        console.log('🤖 Iniciando classificação automática de defeitos em background...');
        this.classifyNewDefectsInBackground().catch(error => {
          console.error('❌ Erro na classificação automática:', error);
        });
      }

      // 6. RESPOSTA FINAL OTIMIZADA
      res.json({
        success: true,
        uploadId: uploadId,
        systemVersion: '2.0_PYTHON_PANDAS',
        processingTime: processingTime,
        
        summary: {
          fileName: req.file.originalname,
          totalRowsInExcel: processingResult.total_rows_excel,
          rowsValidated: processingResult.valid_rows,
          rowsRejected: processingResult.rejected_rows,
          rowsInserted: insertedCount,
          rowsSkippedDuplicates: skippedCount,
          rowsWithErrors: errorCount,
          rowsProtected: protectedCount,
          rowsMerged: mergedCount,
          mathematicallyCorrect: processingResult.summary.mathematically_correct,
          dataAccuracy: processingResult.summary.mathematically_correct ? 'VERIFIED' : 'NEEDS_REVIEW',
          reliability: 'HIGH'
        },
        
        details: {
          pythonProcessingTime: processingResult.processing_time_seconds,
          rejectionBreakdown: {
            missingFields: processingResult.summary.rejected_by_missing_fields,
            invalidStatus: processingResult.summary.rejected_by_invalid_status,
            invalidDate: processingResult.summary.rejected_by_invalid_date,
            yearOutOfRange: processingResult.summary.rejected_by_year_range
          },
          distributions: {
            status: processingResult.summary.status_distribution,
            year: processingResult.summary.year_distribution
          },
          processingErrors: processingResult.summary.processing_errors,
          warnings: processingResult.warnings
        }
      });

    } catch (error) {
      console.error('💥 ERRO CRÍTICO NO UPLOAD:', error);

      const processingTime = Date.now() - startTime;
      await this.logUploadResult(uploadId, 'FAILED', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        fileName: req.file?.originalname || 'unknown',
        processingTime: processingTime / 1000,
        systemVersion: '2.0_PYTHON_PANDAS'
      });

      res.status(500).json({
        success: false,
        uploadId: uploadId,
        error: (error as Error).message,
        systemVersion: '2.0_PYTHON_PANDAS',
        processingTime: processingTime,
        timestamp: new Date().toISOString(),
        suggestion: 'Verifique se o arquivo Excel está no formato correto e se o ambiente Python está configurado.'
      });
    }
  }

  /**
   * DETECÇÃO INTELIGENTE DE DUPLICATAS
   */
  private async handleDuplicateDetection(data: any[]): Promise<{inserted: number, skipped: number, errors: number}> {
    console.log(`🔍 Processando ${data.length} registros com detecção avançada de duplicatas...`);
    
    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    try {
      // 1. EXTRAIR TODAS AS ORDER_NUMBERS
      const orderNumbers = data.map(row => row.order_number);
      console.log(`🔍 Verificando duplicatas para ${orderNumbers.length} ordens de serviço...`);

      // 2. CONSULTAR BANCO EM BATCHES OTIMIZADOS
      const existingOrderNumbers = new Set<string>();
      const batchSize = 1000;

      for (let i = 0; i < orderNumbers.length; i += batchSize) {
        const batch = orderNumbers.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(orderNumbers.length / batchSize);
        
        console.log(`   🔍 Verificando batch ${batchNumber}/${totalBatches}: ${batch.length} registros`);

        const { data: existingOrders, error: checkError } = await supabase
          .from('service_orders')
          .select('order_number')
          .in('order_number', batch);

        if (checkError) {
          console.error(`❌ Erro no batch ${batchNumber}:`, checkError);
          throw new Error(`Erro na verificação de duplicatas: ${checkError.message}`);
        }

        if (existingOrders) {
          existingOrders.forEach(order => existingOrderNumbers.add(order.order_number));
        }
      }

      console.log(`🔍 Total de registros já existentes no banco: ${existingOrderNumbers.size}`);

      // 3. SEPARAR NOVOS DOS EXISTENTES
      const newRecords = data.filter(row => !existingOrderNumbers.has(row.order_number));
      const existingRecords = data.filter(row => existingOrderNumbers.has(row.order_number));

      console.log(`📊 ANÁLISE DE DUPLICATAS:`);
      console.log(`   📋 Total na planilha: ${data.length}`);
      console.log(`   ⚠️ Já existem no banco: ${existingRecords.length}`);
      console.log(`   🆕 Novos para inserir: ${newRecords.length}`);

      skipped = existingRecords.length;

      // 4. INSERIR APENAS REGISTROS NOVOS
      if (newRecords.length > 0) {
        console.log(`🆕 Inserindo ${newRecords.length} novos registros em batches otimizados...`);
        
        const insertBatchSize = 100;
        for (let i = 0; i < newRecords.length; i += insertBatchSize) {
          const batch = newRecords.slice(i, i + insertBatchSize);
          const batchNumber = Math.floor(i / insertBatchSize) + 1;
          const totalBatches = Math.ceil(newRecords.length / insertBatchSize);

          try {
            const { data: insertedData, error } = await supabase
              .from('service_orders')
              .insert(batch)
              .select('order_number');

            if (error) {
              console.error(`❌ Erro no batch de inserção ${batchNumber}:`, error);
              errors += batch.length;
            } else {
              const actualInserted = (insertedData as any)?.length || batch.length;
              inserted += actualInserted;
              console.log(`   ✅ Batch ${batchNumber}/${totalBatches}: ${actualInserted} registros inseridos`);
            }
          } catch (err) {
            console.error(`❌ Erro crítico no batch ${batchNumber}:`, err);
            errors += batch.length;
          }
        }
      } else {
        console.log(`ℹ️ Nenhum registro novo - todos já existem no banco`);
      }

      return { inserted, skipped, errors };

    } catch (error) {
      console.error('💥 Erro na detecção de duplicatas:', error);
      throw new Error(`Falha na detecção de duplicatas: ${(error as Error).message}`);
    }
  }

  /**
   * REGISTRAR LOG DO UPLOAD
   */
  private async logUploadResult(uploadId: string, status: string, summary: any): Promise<void> {
    try {
      await supabase
        .from('upload_logs')
        .insert({
          upload_id: uploadId,
          filename: summary.fileName || 'unknown',
          status: status,
          processing_time: (summary.totalProcessingTime || summary.processingTime) * 1000,
          summary: summary,
          details: {
            systemVersion: '2.0_PYTHON_PANDAS',
            reliability: 'HIGH',
            method: 'DEFINITIVE_PYTHON_PROCESSING'
          }
        });
    } catch (error) {
      console.error('⚠️ Falha ao registrar log (não crítico):', error);
    }
  }

  /**
   * HEALTH CHECK DO SISTEMA PYTHON
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const pythonValidation = await this.pythonService.validatePythonEnvironment();
      
      res.json({
        success: true,
        systemVersion: '2.0_PYTHON_PANDAS',
        pythonEnvironment: pythonValidation,
        timestamp: new Date().toISOString(),
        ready: pythonValidation.valid
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * INSTALAR DEPENDÊNCIAS PYTHON
   */
  async installDependencies(req: Request, res: Response): Promise<void> {
    try {
      console.log('📦 Iniciando instalação de dependências Python...');
      
      const installResult = await this.pythonService.installPythonDependencies();
      
      if (installResult.success) {
        res.json({
          success: true,
          message: 'Dependências Python instaladas com sucesso',
          systemVersion: '2.0_PYTHON_PANDAS',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          error: installResult.error,
          message: 'Falha na instalação das dependências Python',
          systemVersion: '2.0_PYTHON_PANDAS',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * RELATÓRIO DE DADOS EDITADOS PELO USUÁRIO
   */
  async getEditedDataReport(req: Request, res: Response): Promise<void> {
    try {
      console.log('📊 Gerando relatório de dados editados...');
      
      const report = await this.editProtectionService.getEditedOrdersReport();
      
      res.json({
        success: true,
        data: report,
        systemVersion: '2.0_EDIT_PROTECTION',
        timestamp: new Date().toISOString(),
        message: 'Relatório de dados editados gerado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao gerar relatório de dados editados:', error);
      
      res.status(500).json({
        success: false,
        error: (error as Error).message,
        systemVersion: '2.0_EDIT_PROTECTION',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 🤖 CLASSIFICAÇÃO AUTOMÁTICA DE DEFEITOS EM BACKGROUND
   * Executa após upload bem-sucedido para classificar novos defeitos
   */
  private async classifyNewDefectsInBackground(): Promise<void> {
    try {
      console.log('🤖 Buscando defeitos não classificados...');
      
      // Primeiro, buscar IDs já classificados
      const { data: classifiedIds } = await supabase
        .from('defect_classifications')
        .select('service_order_id');

      const classifiedSet = new Set((classifiedIds || []).map(c => c.service_order_id));
      
      // Buscar OS que ainda não foram classificadas
      const { data: allOrders, error } = await supabase
        .from('service_orders')
        .select('id, raw_defect_description')
        .not('raw_defect_description', 'is', null)
        .not('raw_defect_description', 'eq', '')
        .order('created_at', { ascending: false })
        .limit(200); // Buscar mais para filtrar depois

      if (error) {
        console.error('❌ Erro ao buscar ordens:', error);
        return;
      }

      // Filtrar apenas os não classificados
      const unclassifiedOrders = (allOrders || [])
        .filter(order => !classifiedSet.has(order.id))
        .slice(0, 50); // Limitar a 50 para processamento

      if (!unclassifiedOrders || unclassifiedOrders.length === 0) {
        console.log('✅ Nenhum defeito novo para classificar');
        return;
      }

      console.log(`📊 Encontrados ${unclassifiedOrders.length} defeitos para classificar`);

      // Processar em lotes pequenos
      let classified = 0;
      for (const order of unclassifiedOrders) {
        try {
          const classification = await this.aiService.classifyDefect(order.raw_defect_description);
          if (classification) {
            await this.aiService.saveClassification(order.id, classification);
            classified++;
          }
        } catch (error) {
          console.error(`❌ Erro ao classificar OS ${order.id}:`, error);
        }

        // Pequena pausa entre classificações para respeitar rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`🎉 Classificação automática concluída: ${classified}/${unclassifiedOrders.length} defeitos processados`);

    } catch (error) {
      console.error('❌ Erro na classificação automática em background:', error);
    }
  }

  /**
   * RESETAR PROTEÇÃO DE UMA ORDEM ESPECÍFICA
   * (Permite que a próxima planilha sobrescreva os dados)
   */
  async resetOrderProtection(req: Request, res: Response) {
    try {
      const { orderNumber } = req.params;
      
      if (!orderNumber) {
        return res.status(400).json({
          success: false,
          error: 'Número da ordem é obrigatório'
        });
      }

      console.log(`🔓 Resetando proteção da ordem: ${orderNumber}`);

      const { data: updatedOrder, error } = await supabase
        .from('service_orders')
        .update({
          manually_edited: false,
          protected_fields: {},
          last_edited_by: null,
          last_edit_date: null,
          edit_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('order_number', orderNumber)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Erro ao resetar proteção:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao resetar proteção da ordem'
        });
      }

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          error: 'Ordem de serviço não encontrada'
        });
      }

      console.log(`✅ Proteção resetada para ordem: ${orderNumber}`);

      res.json({
        success: true,
        message: 'Proteção resetada com sucesso. A próxima planilha poderá sobrescrever os dados desta ordem.',
        data: updatedOrder,
        systemVersion: '2.0_EDIT_PROTECTION',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao resetar proteção:', error);
      
      res.status(500).json({
        success: false,
        error: (error as Error).message,
        systemVersion: '2.0_EDIT_PROTECTION',
        timestamp: new Date().toISOString()
      });
    }
  }
}

export { UploadControllerV2 };