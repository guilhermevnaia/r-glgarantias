import { Request, Response } from 'express';
import { ComprehensiveContingencyService } from '../services/ComprehensiveContingencyService';

export class ContingencyController {
  private contingencyService: ComprehensiveContingencyService;

  constructor() {
    this.contingencyService = ComprehensiveContingencyService.getInstance();
  }

  /**
   * GET /api/v1/contingency/status
   * Obtém status completo do sistema
   */
  async getSystemStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = this.contingencyService.getSystemHealth();
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        systemHealth: status,
        overall: {
          healthy: status.criticalErrors.length === 0,
          score: this.calculateHealthScore(status),
          status: this.getOverallStatus(status)
        }
      });

    } catch (error) {
      console.error('Erro ao obter status do sistema:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao verificar status do sistema'
      });
    }
  }

  /**
   * POST /api/v1/contingency/check
   * Executa verificação manual completa
   */
  async performManualCheck(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔧 Verificação manual de contingência solicitada via API');
      
      const status = await this.contingencyService.manualContingencyCheck();
      
      res.json({
        success: true,
        message: 'Verificação manual completa executada',
        timestamp: new Date().toISOString(),
        systemHealth: status,
        overall: {
          healthy: status.criticalErrors.length === 0,
          score: this.calculateHealthScore(status),
          status: this.getOverallStatus(status)
        },
        summary: {
          totalChecks: 5,
          passedChecks: this.countPassedChecks(status),
          issues: status.issues.length,
          criticalErrors: status.criticalErrors.length
        }
      });

    } catch (error) {
      console.error('Erro na verificação manual:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao executar verificação manual'
      });
    }
  }

  /**
   * GET /api/v1/contingency/health-summary
   * Retorna resumo simplificado da saúde do sistema
   */
  async getHealthSummary(req: Request, res: Response): Promise<void> {
    try {
      const status = this.contingencyService.getSystemHealth();
      const score = this.calculateHealthScore(status);
      
      res.json({
        success: true,
        healthy: status.criticalErrors.length === 0,
        score: score,
        status: this.getOverallStatus(status),
        lastCheck: status.lastCheck,
        summary: {
          database: status.database ? 'OK' : 'FAIL',
          ai: status.aiClassifications ? 'OK' : 'FAIL',
          filesystem: status.fileSystem ? 'OK' : 'FAIL',
          security: status.security ? 'OK' : 'FAIL',
          performance: status.performance ? 'OK' : 'FAIL'
        },
        alerts: {
          issues: status.issues.length,
          critical: status.criticalErrors.length
        }
      });

    } catch (error) {
      console.error('Erro ao obter resumo de saúde:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter resumo de saúde do sistema'
      });
    }
  }

  /**
   * POST /api/v1/contingency/start-monitoring
   * Inicia monitoramento contínuo (apenas admin)
   */
  async startMonitoring(req: Request, res: Response): Promise<void> {
    try {
      this.contingencyService.startComprehensiveMonitoring();
      
      res.json({
        success: true,
        message: 'Sistema de monitoramento contínuo iniciado',
        timestamp: new Date().toISOString(),
        note: 'Verificações automáticas serão executadas a cada 10 minutos'
      });

    } catch (error) {
      console.error('Erro ao iniciar monitoramento:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao iniciar sistema de monitoramento'
      });
    }
  }

  /**
   * POST /api/v1/contingency/stop-monitoring
   * Para monitoramento contínuo (apenas admin)
   */
  async stopMonitoring(req: Request, res: Response): Promise<void> {
    try {
      this.contingencyService.stopMonitoring();
      
      res.json({
        success: true,
        message: 'Sistema de monitoramento contínuo parado',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao parar monitoramento:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao parar sistema de monitoramento'
      });
    }
  }

  // ========================================
  // MÉTODOS AUXILIARES
  // ========================================

  private calculateHealthScore(status: any): number {
    const checks = [
      status.database,
      status.aiClassifications,
      status.fileSystem,
      status.security,
      status.performance
    ];
    
    const passedChecks = checks.filter(Boolean).length;
    let score = (passedChecks / checks.length) * 100;
    
    // Penalizar por problemas
    score -= (status.issues.length * 5);
    score -= (status.criticalErrors.length * 20);
    
    return Math.max(0, Math.min(100, score));
  }

  private countPassedChecks(status: any): number {
    return [
      status.database,
      status.aiClassifications,
      status.fileSystem,
      status.security,
      status.performance
    ].filter(Boolean).length;
  }

  private getOverallStatus(status: any): string {
    if (status.criticalErrors.length > 0) return 'CRITICAL';
    if (status.issues.length > 0) return 'WARNING';
    
    const score = this.calculateHealthScore(status);
    if (score >= 90) return 'EXCELLENT';
    if (score >= 75) return 'GOOD';
    if (score >= 50) return 'FAIR';
    return 'POOR';
  }
}