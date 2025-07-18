"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RobustUploadService = void 0;
const XLSX = __importStar(require("xlsx"));
const RobustDataProcessor_1 = require("./RobustDataProcessor");
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class RobustUploadService {
    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseServiceRoleKey) {
            throw new Error('Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.');
        }
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceRoleKey);
    }
    processUpload(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const uploadId = this.generateUUID();
            const startTime = Date.now();
            try {
                // 1. VALIDAÇÕES INICIAIS
                this.validateFile(file);
                // 2. CRIAR LOG DE TENTATIVA (no banco de dados)
                yield this.createUploadLog(uploadId, file.originalname, file.size, 'STARTED');
                // 3. PROCESSAR COM TIMEOUT E RETRY
                const processor = new RobustDataProcessor_1.RobustDataProcessor();
                const processingResult = yield this.processWithRetry(() => processor.processExcelData(file.buffer), uploadId);
                // 4. SALVAR RESULTADO NO BANCO DE DADOS
                const dbResult = yield this.saveResultsToDatabase(processingResult.data, uploadId);
                // 5. ATUALIZAR LOG DE SUCESSO
                const processingTime = Date.now() - startTime;
                yield this.updateUploadLog(uploadId, 'SUCCESS', processingResult.log, processingResult.analysis, dbResult, processingTime);
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
            }
            catch (error) {
                const processingTime = Date.now() - startTime;
                yield this.updateUploadLog(uploadId, 'FAILED', { totalRows: 0, processedRows: 0, validRows: 0, errors: [], warnings: [] }, { totalRows: 0, rowsWithData: 0, rowsAfterDateFilter: 0, rowsAfterStatusFilter: 0, finalValidRows: 0, rowsWithInvalidDates: [], rowsWithInvalidStatus: [], rowsWithMissingData: [] }, { inserted: 0, updated: 0 }, processingTime, error.message);
                throw error;
            }
        });
    }
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    validateFile(file) {
        if (!file) {
            throw new Error('Nenhum arquivo enviado');
        }
        if (file.size > 50 * 1024 * 1024) { // 50MB
            throw new Error('Arquivo muito grande (máximo 50MB)');
        }
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new Error('Tipo de arquivo inválido. Apenas Excel (.xlsx, .xls)');
        }
        try {
            const workbook = XLSX.read(file.buffer);
            if (!workbook.SheetNames.includes('Tabela')) {
                throw new Error('Planilha deve conter uma aba chamada "Tabela"');
            }
        }
        catch (error) {
            throw new Error(`Arquivo Excel corrompido ou inválido: ${error.message}`);
        }
    }
    processWithRetry(fn, uploadId) {
        return __awaiter(this, void 0, void 0, function* () {
            const maxRetries = 3;
            let lastError;
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`🔄 Tentativa ${attempt}/${maxRetries} - Upload ${uploadId}`);
                    const result = yield Promise.race([
                        fn(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Processamento excedeu o tempo limite')), 300000)) // 5 minutos timeout
                    ]);
                    return result;
                }
                catch (error) {
                    lastError = error;
                    console.log(`❌ Tentativa ${attempt} falhou:`, error.message);
                    if (attempt < maxRetries) {
                        yield this.delay(2000 * attempt);
                    }
                }
            }
            throw new Error(`Upload failed after ${maxRetries} attempts: ${lastError.message}`);
        });
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    createUploadLog(uploadId, filename, fileSize, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error } = yield this.supabase
                .from('file_processing_logs')
                .insert({
                upload_id: uploadId,
                filename: filename,
                file_size: fileSize,
                status: status,
                processed_at: new Date().toISOString(),
            });
            if (error)
                throw error;
        });
    }
    updateUploadLog(uploadId, status, log, analysis, dbResult, processingTime, errorMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            const updateData = {
                status: status,
                processing_time_ms: processingTime,
                total_rows_in_excel: analysis.totalRows,
                rows_with_data: analysis.rowsWithData,
                rows_after_date_filter: analysis.rowsAfterDateFilter,
                rows_after_status_filter: analysis.rowsAfterStatusFilter,
                final_valid_rows: analysis.finalValidRows,
                rows_inserted: dbResult.inserted,
                rows_updated: dbResult.updated,
                rows_rejected: log.errors.length,
                error_details: errorMessage ? { message: errorMessage } : null,
                date_validation_errors: analysis.rowsWithInvalidDates.length > 0 ? analysis.rowsWithInvalidDates : null,
                status_validation_errors: analysis.rowsWithInvalidStatus.length > 0 ? analysis.rowsWithInvalidStatus : null,
                // calculation_errors: log.errors.filter(e => e.errors.some(err => err.includes('calculation'))).length > 0 ? log.errors.filter(e => e.errors.some(err => err.includes('calculation'))) : null,
                // warnings: log.warnings.length > 0 ? log.warnings : null,
            };
            const { error } = yield this.supabase
                .from('file_processing_logs')
                .update(updateData)
                .eq('upload_id', uploadId);
            if (error)
                throw error;
            // Inserir erros detalhados na tabela processing_errors
            if (log.errors.length > 0) {
                const errorRecords = log.errors.map((err) => ({
                    upload_id: uploadId,
                    row_number: err.row,
                    excel_row_data: err.data,
                    error_type: err.errors[0].includes('date') ? 'DATE_INVALID' : (err.errors[0].includes('status') ? 'STATUS_INVALID' : (err.errors[0].includes('calculation') ? 'CALCULATION_ERROR' : 'OTHER_ERROR')),
                    error_message: err.errors.join('; '),
                    column_name: err.errors[0].includes('date') ? 'Data_OSv' : (err.errors[0].includes('status') ? 'Status_OSv' : null),
                    original_value: err.errors[0].includes('date') ? err.data['Data_OSv'] : (err.errors[0].includes('status') ? err.data['Status_OSv'] : null),
                }));
                const { error: insertErrors } = yield this.supabase
                    .from('processing_errors')
                    .insert(errorRecords);
                if (insertErrors)
                    console.error('Erro ao inserir erros de processamento:', insertErrors);
            }
        });
    }
    saveResultsToDatabase(data, uploadId) {
        return __awaiter(this, void 0, void 0, function* () {
            let insertedCount = 0;
            let updatedCount = 0;
            for (const record of data) {
                // Verificar se a OS já existe
                const { data: existingOrder, error: selectError } = yield this.supabase
                    .from('service_orders')
                    .select('id')
                    .eq('order_number', record.order_number)
                    .single();
                if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = No rows found
                    console.error(`Erro ao verificar ordem existente ${record.order_number}:`, selectError);
                    // Registrar erro na tabela processing_errors se necessário
                    continue;
                }
                if (existingOrder) {
                    // Atualizar ordem existente
                    const { error: updateError } = yield this.supabase
                        .from('service_orders')
                        .update(record)
                        .eq('id', existingOrder.id);
                    if (updateError) {
                        console.error(`Erro ao atualizar ordem ${record.order_number}:`, updateError);
                        // Registrar erro na tabela processing_errors
                    }
                    else {
                        updatedCount++;
                    }
                }
                else {
                    // Inserir nova ordem
                    const { error: insertError } = yield this.supabase
                        .from('service_orders')
                        .insert(record);
                    if (insertError) {
                        console.error(`Erro ao inserir ordem ${record.order_number}:`, insertError);
                        // Registrar erro na tabela processing_errors
                    }
                    else {
                        insertedCount++;
                    }
                }
            }
            return { inserted: insertedCount, updated: updatedCount };
        });
    }
}
exports.RobustUploadService = RobustUploadService;
