"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadController = void 0;
const RobustUploadService_1 = require("../services/RobustUploadService");
class UploadController {
    constructor() {
        this.uploadService = new RobustUploadService_1.RobustUploadService();
    }
    uploadExcel(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const startTime = Date.now();
            try {
                console.log('📤 Iniciando upload:', (_a = req.file) === null || _a === void 0 ? void 0 : _a.originalname);
                // 1. VALIDAR ARQUIVO
                if (!req.file) {
                    res.status(400).json({
                        success: false,
                        error: 'Nenhum arquivo enviado'
                    });
                    return;
                }
                // 2. PROCESSAR COM SERVIÇO ROBUSTO
                const result = yield this.uploadService.processUpload(req.file);
                // 3. RESPOSTA DETALHADA
                const processingTime = Date.now() - startTime;
                res.json({
                    success: true,
                    uploadId: result.uploadId,
                    processingTime: processingTime,
                    summary: result.summary,
                    details: result.details
                });
            }
            catch (error) {
                console.error('💥 Erro no upload:', error);
                res.status(500).json({
                    success: false,
                    error: error.message,
                    processingTime: Date.now() - startTime,
                    timestamp: new Date().toISOString()
                });
            }
        });
    }
}
exports.UploadController = UploadController;
