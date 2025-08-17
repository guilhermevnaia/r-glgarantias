import { Request, Response } from 'express';
import { AIContingencyService } from '../services/AIContingencyService';

export class AIContingencyController {
  private aiContingency: AIContingencyService;

  constructor() {
    this.aiContingency = AIContingencyService.getInstance();
  }

  // Verificação manual do status da IA
  async checkStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.aiContingency.manualCheck();
      
      res.json({
        success: true,
        status: {
          totalDefects: status.totalDefects,
          totalClassifications: status.totalClassifications,
          missingCount: status.missingCount,
          percentageClassified: ((status.totalClassifications / status.totalDefects) * 100).toFixed(1),
          isFullyClassified: status.missingCount === 0
        },
        message: status.missingCount === 0 
          ? 'Todos os defeitos estão classificados' 
          : `${status.missingCount} defeitos precisam de classificação`
      });
    } catch (error) {
      console.error('Erro ao verificar status da IA:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao verificar status da classificação'
      });
    }
  }

  // Forçar classificação manual
  async forceClassification(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔄 Classificação manual forçada pelo usuário');
      
      // Executar verificação e classificação
      await this.aiContingency.checkAndClassifyMissing();
      
      // Verificar status após classificação
      const status = await this.aiContingency.manualCheck();
      
      res.json({
        success: true,
        message: 'Classificação manual executada com sucesso',
        status: {
          totalDefects: status.totalDefects,
          totalClassifications: status.totalClassifications,
          missingCount: status.missingCount,
          percentageClassified: ((status.totalClassifications / status.totalDefects) * 100).toFixed(1),
          isFullyClassified: status.missingCount === 0
        }
      });
    } catch (error) {
      console.error('Erro na classificação manual:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao executar classificação manual'
      });
    }
  }
}