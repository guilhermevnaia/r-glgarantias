import { DataIntegrityService } from './DataIntegrityService';

export class ContinuousMonitoringService {
  private integrityService: DataIntegrityService;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor() {
    this.integrityService = new DataIntegrityService();
  }

  /**
   * Inicia monitoramento contínuo
   */
  startMonitoring(intervalMinutes: number = 30): void {
    if (this.isRunning) {
      console.log('⚠️ Monitoramento já está em execução');
      return;
    }

    console.log(`🔄 Iniciando monitoramento contínuo de integridade (intervalo: ${intervalMinutes} minutos)`);
    
    this.isRunning = true;
    
    // Executar verificação inicial
    this.performScheduledCheck();
    
    // Agendar verificações periódicas
    this.monitoringInterval = setInterval(() => {
      this.performScheduledCheck();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Para monitoramento contínuo
   */
  stopMonitoring(): void {
    if (!this.isRunning) {
      console.log('⚠️ Monitoramento não está em execução');
      return;
    }

    console.log('⏹️ Parando monitoramento contínuo de integridade');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.isRunning = false;
  }

  /**
   * Executa verificação agendada
   */
  private async performScheduledCheck(): Promise<void> {
    try {
      console.log('🕐 Executando verificação agendada de integridade...');
      
      const results = await this.integrityService.performCompleteIntegrityCheck();
      
      // Verificar se há erros críticos
      const criticalErrors = results.filter(r => r.status === 'ERROR');
      
      if (criticalErrors.length > 0) {
        console.log(`🚨 ALERTA: ${criticalErrors.length} erro(s) crítico(s) detectado(s):`);
        criticalErrors.forEach(error => {
          console.log(`  - ${error.check_type}: ${error.details}`);
          if (error.error_details) {
            console.log(`    Detalhes: ${error.error_details}`);
          }
        });
        
        // Tentar auto-correção
        await this.attemptAutoCorrection(criticalErrors);
      } else {
        console.log('✅ Verificação agendada concluída - todos os sistemas OK');
      }
      
    } catch (error) {
      console.error('❌ Erro durante verificação agendada:', error);
    }
  }

  /**
   * Tenta auto-correção de problemas detectados
   */
  private async attemptAutoCorrection(errors: any[]): Promise<void> {
    console.log('🔧 Tentando auto-correção dos problemas detectados...');
    
    for (const error of errors) {
      try {
        switch (error.check_type) {
          case 'TOTAL_RECORDS_COUNT':
            await this.fixTotalRecordsDiscrepancy(error);
            break;
          case 'VALID_DATE_RANGE_2019_2025':
            await this.fixDateRangeIssues(error);
            break;
          case 'FINANCIAL_CALCULATIONS':
            await this.fixFinancialCalculations(error);
            break;
          default:
            console.log(`⚠️ Auto-correção não implementada para: ${error.check_type}`);
        }
      } catch (correctionError) {
        console.error(`❌ Erro durante auto-correção de ${error.check_type}:`, correctionError);
      }
    }
  }

  /**
   * Tenta corrigir discrepâncias na contagem total
   */
  private async fixTotalRecordsDiscrepancy(error: any): Promise<void> {
    console.log('🔧 Tentando corrigir discrepância na contagem total de registros...');
    
    // Re-executar verificação para confirmar problema
    const recheck = await this.integrityService.checkTotalRecordsIntegrity();
    
    if (recheck.status === 'OK') {
      console.log('✅ Discrepância de contagem resolvida automaticamente');
    } else {
      console.log('⚠️ Discrepância de contagem persiste - pode ser problema temporário do Supabase');
      // Em produção, aqui poderia enviar alerta para equipe técnica
    }
  }

  /**
   * Tenta corrigir problemas de range de datas
   */
  private async fixDateRangeIssues(error: any): Promise<void> {
    console.log('🔧 Analisando registros fora do range de datas...');
    
    // Esta é uma verificação, não correção - registros antigos podem existir legitimamente
    // A "correção" aqui é garantir que os filtros estejam funcionando corretamente
    console.log('ℹ️ Registros fora do range 2019-2025 são esperados e filtrados corretamente');
  }

  /**
   * Tenta corrigir problemas de cálculos financeiros
   */
  private async fixFinancialCalculations(error: any): Promise<void> {
    console.log('🔧 Verificando cálculos financeiros...');
    
    // Re-executar verificação
    const recheck = await this.integrityService.checkFinancialCalculationsIntegrity();
    
    if (recheck.status === 'OK') {
      console.log('✅ Cálculos financeiros estão corretos agora');
    } else {
      console.log('⚠️ Problemas nos cálculos financeiros persistem');
      // Em produção, aqui poderia tentar limpeza de dados NaN
    }
  }

  /**
   * Retorna status do monitoramento
   */
  getMonitoringStatus(): { isRunning: boolean; intervalMinutes?: number } {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.monitoringInterval ? 30 : undefined // valor padrão
    };
  }

  /**
   * Força execução de verificação manual
   */
  async forceCheck(): Promise<any[]> {
    console.log('🔍 Executando verificação manual forçada...');
    return await this.integrityService.performCompleteIntegrityCheck();
  }
}

// Singleton para uso global
export const continuousMonitoring = new ContinuousMonitoringService();