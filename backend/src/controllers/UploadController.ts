import { Request, Response } from 'express';
import { RobustUploadService } from '../services/RobustUploadService';

class UploadController {
  private uploadService: RobustUploadService;

  constructor() {
    this.uploadService = new RobustUploadService();
  }

  async uploadExcel(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

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

      // 2. PROCESSAR COM SERVIÇO ROBUSTO
      const result = await this.uploadService.processUpload(req.file);

      // 3. RESPOSTA DETALHADA
      const processingTime = Date.now() - startTime;

      res.json({
        success: true,
        uploadId: result.uploadId,
        processingTime: processingTime,
        summary: result.summary,
        details: result.details
      });

    } catch (error) {
      console.error('💥 Erro no upload:', error);

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

