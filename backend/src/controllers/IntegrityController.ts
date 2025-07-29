import { Request, Response } from 'express';
import { DataIntegrityService } from '../services/DataIntegrityService';

export class IntegrityController {
  private integrityService: DataIntegrityService;

  constructor() {
    this.integrityService = new DataIntegrityService();
  }

  /**
   * Executa verificação completa de integridade
   */
  async runCompleteCheck(req: Request, res: Response) {
    try {
      console.log('🔍 API: Iniciando verificação completa de integridade...');
      
      const results = await this.integrityService.performCompleteIntegrityCheck();
      
      const summary = {
        timestamp: new Date().toISOString(),
        total_checks: results.length,
        ok_count: results.filter(r => r.status === 'OK').length,
        error_count: results.filter(r => r.status === 'ERROR').length,
        fixed_count: results.filter(r => r.status === 'FIXED').length,
        checks: results
      };

      console.log('✅ API: Verificação completa finalizada:', summary);
      
      res.json({
        success: true,
        message: 'Verificação de integridade executada com sucesso',
        data: summary
      });

    } catch (error) {
      console.error('❌ API: Erro durante verificação de integridade:', error);
      
      res.status(500).json({
        success: false,
        error: 'Erro interno durante verificação de integridade',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Busca logs recentes de integridade
   */
  async getIntegrityLogs(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      
      console.log(`📋 API: Buscando ${limit} logs de integridade mais recentes...`);
      
      const logs = await this.integrityService.getRecentIntegrityLogs(limit);
      
      res.json({
        success: true,
        message: `${logs.length} logs de integridade encontrados`,
        data: {
          total: logs.length,
          logs: logs
        }
      });

    } catch (error) {
      console.error('❌ API: Erro ao buscar logs de integridade:', error);
      
      res.status(500).json({
        success: false,
        error: 'Erro interno ao buscar logs de integridade',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Verifica apenas contagem total de registros
   */
  async checkTotalRecords(req: Request, res: Response) {
    try {
      console.log('📊 API: Verificando contagem total de registros...');
      
      const result = await this.integrityService.checkTotalRecordsIntegrity();
      
      res.json({
        success: true,
        message: 'Verificação de contagem executada',
        data: result
      });

    } catch (error) {
      console.error('❌ API: Erro durante verificação de contagem:', error);
      
      res.status(500).json({
        success: false,
        error: 'Erro interno durante verificação de contagem',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Verifica apenas range de datas válidas
   */
  async checkDateRange(req: Request, res: Response) {
    try {
      console.log('📅 API: Verificando range de datas válidas...');
      
      const result = await this.integrityService.checkValidDateRangeIntegrity();
      
      res.json({
        success: true,
        message: 'Verificação de range de datas executada',
        data: result
      });

    } catch (error) {
      console.error('❌ API: Erro durante verificação de datas:', error);
      
      res.status(500).json({
        success: false,
        error: 'Erro interno durante verificação de datas',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Verifica apenas cálculos financeiros
   */
  async checkFinancialCalculations(req: Request, res: Response) {
    try {
      console.log('💰 API: Verificando cálculos financeiros...');
      
      const result = await this.integrityService.checkFinancialCalculationsIntegrity();
      
      res.json({
        success: true,
        message: 'Verificação de cálculos financeiros executada',
        data: result
      });

    } catch (error) {
      console.error('❌ API: Erro durante verificação financeira:', error);
      
      res.status(500).json({
        success: false,
        error: 'Erro interno durante verificação financeira',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Endpoint de saúde para monitoramento
   */
  async healthCheck(req: Request, res: Response) {
    try {
      const recentLogs = await this.integrityService.getRecentIntegrityLogs(5);
      
      const hasRecentErrors = recentLogs.some(log => 
        log.status === 'ERROR' && 
        new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24h
      );

      res.json({
        success: true,
        status: hasRecentErrors ? 'WARNING' : 'HEALTHY',
        message: hasRecentErrors ? 
          'Existem erros de integridade nas últimas 24h' : 
          'Sistema de integridade funcionando normalmente',
        data: {
          recent_logs_count: recentLogs.length,
          has_recent_errors: hasRecentErrors,
          last_check: recentLogs[0]?.timestamp || null
        }
      });

    } catch (error) {
      console.error('❌ API: Erro durante health check:', error);
      
      res.status(500).json({
        success: false,
        status: 'ERROR',
        error: 'Erro interno durante health check',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}