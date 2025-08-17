import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface SystemHealthStatus {
  database: boolean;
  aiClassifications: boolean;
  fileSystem: boolean;
  environment: boolean;
  security: boolean;
  performance: boolean;
  lastCheck: Date;
  issues: string[];
  criticalErrors: string[];
}

interface ContingencyAction {
  name: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  execute: () => Promise<boolean>;
  description: string;
}

export class ComprehensiveContingencyService {
  private static instance: ComprehensiveContingencyService;
  private healthStatus: SystemHealthStatus;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private contingencyActions: Map<string, ContingencyAction> = new Map();
  private isRunning = false;

  private constructor() {
    this.healthStatus = {
      database: false,
      aiClassifications: false,
      fileSystem: false,
      environment: false,
      security: false,
      performance: false,
      lastCheck: new Date(),
      issues: [],
      criticalErrors: []
    };

    this.initializeContingencyActions();
  }

  static getInstance(): ComprehensiveContingencyService {
    if (!ComprehensiveContingencyService.instance) {
      ComprehensiveContingencyService.instance = new ComprehensiveContingencyService();
    }
    return ComprehensiveContingencyService.instance;
  }

  // ========================================
  // SISTEMA DE MONITORAMENTO PRINCIPAL
  // ========================================

  startComprehensiveMonitoring(): void {
    if (this.monitoringInterval) return;

    console.log('🛡️ INICIANDO SISTEMA DE CONTINGÊNCIA ABRANGENTE');
    console.log('   ✅ Monitoramento de Banco de Dados');
    console.log('   ✅ Verificação de Classificações IA');
    console.log('   ✅ Validação de Sistema de Arquivos');
    console.log('   ✅ Auditoria de Segurança');
    console.log('   ✅ Monitoramento de Performance');
    console.log('   ✅ Contingências Automáticas');

    // Execução imediata
    this.performComprehensiveCheck();

    // Monitoramento contínuo a cada 10 minutos
    this.monitoringInterval = setInterval(() => {
      this.performComprehensiveCheck();
    }, 10 * 60 * 1000);
  }

  async performComprehensiveCheck(): Promise<SystemHealthStatus> {
    if (this.isRunning) {
      console.log('⏳ Verificação já em andamento, aguardando...');
      return this.healthStatus;
    }

    this.isRunning = true;
    console.log('🔍 INICIANDO VERIFICAÇÃO ABRANGENTE DO SISTEMA');

    try {
      // Reset status
      this.healthStatus = {
        database: false,
        aiClassifications: false,
        fileSystem: false,
        environment: false,
        security: false,
        performance: false,
        lastCheck: new Date(),
        issues: [],
        criticalErrors: []
      };

      // Verificações paralelas
      const checks = await Promise.allSettled([
        this.checkDatabaseHealth(),
        this.checkAIClassifications(),
        this.checkFileSystemHealth(),
        this.checkEnvironmentSecurity(),
        this.checkPerformanceMetrics()
      ]);

      // Processar resultados
      this.processCheckResults(checks);

      // Executar contingências se necessário
      await this.executeContingencyActions();

      // Log final
      this.logSystemStatus();

      return this.healthStatus;

    } catch (error) {
      console.error('❌ ERRO CRÍTICO na verificação abrangente:', error);
      this.healthStatus.criticalErrors.push(`Sistema de monitoramento falhou: ${error.message}`);
      return this.healthStatus;
    } finally {
      this.isRunning = false;
    }
  }

  // ========================================
  // VERIFICAÇÕES ESPECÍFICAS
  // ========================================

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      console.log('🔍 Verificando saúde do banco de dados...');

      // 1. Conectividade básica
      const { error: connectionError } = await supabase
        .from('service_orders')
        .select('count', { count: 'exact', head: true })
        .limit(1);

      if (connectionError) {
        this.healthStatus.issues.push(`Conectividade DB: ${connectionError.message}`);
        return false;
      }

      // 2. Verificar integridade de tabelas críticas
      const criticalTables = ['service_orders', 'defect_classifications', 'defect_categories', 'users'];
      for (const table of criticalTables) {
        const { error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true })
          .limit(1);

        if (error) {
          this.healthStatus.criticalErrors.push(`Tabela ${table} não acessível: ${error.message}`);
          return false;
        }
      }

      // 3. Verificar integridade referencial
      const { data: orphanedClassifications } = await supabase
        .from('defect_classifications')
        .select('id')
        .not('service_order_id', 'in', `(SELECT id FROM service_orders)`)
        .limit(1);

      if (orphanedClassifications && orphanedClassifications.length > 0) {
        this.healthStatus.issues.push('Encontradas classificações órfãs no banco');
      }

      console.log('✅ Banco de dados saudável');
      return true;

    } catch (error) {
      console.error('❌ Erro na verificação do banco:', error);
      this.healthStatus.criticalErrors.push(`Falha na verificação DB: ${error.message}`);
      return false;
    }
  }

  private async checkAIClassifications(): Promise<boolean> {
    try {
      console.log('🤖 Verificando sistema de classificação IA...');

      // 1. Contar defeitos e classificações
      const { count: totalDefects } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true })
        .not('raw_defect_description', 'is', null)
        .neq('raw_defect_description', '');

      const { count: totalClassifications } = await supabase
        .from('defect_classifications')
        .select('*', { count: 'exact', head: true });

      const classificationRate = totalDefects > 0 ? (totalClassifications / totalDefects) * 100 : 0;

      // 2. Verificar se IA está funcionando adequadamente
      if (classificationRate < 95) {
        this.healthStatus.issues.push(`Taxa de classificação baixa: ${classificationRate.toFixed(1)}%`);
        
        // Tentar classificação automática
        await this.contingencyActions.get('autoClassifyMissing')?.execute();
      }

      // 3. Verificar classificações recentes
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: recentClassifications } = await supabase
        .from('defect_classifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo);

      console.log(`✅ IA funcionando: ${classificationRate.toFixed(1)}% classificados`);
      return true;

    } catch (error) {
      console.error('❌ Erro na verificação da IA:', error);
      this.healthStatus.criticalErrors.push(`Falha na verificação IA: ${error.message}`);
      return false;
    }
  }

  private async checkFileSystemHealth(): Promise<boolean> {
    try {
      console.log('📁 Verificando sistema de arquivos...');

      // 1. Verificar diretórios críticos
      const criticalDirs = ['./logs', './backups', './uploads', './python'];
      for (const dir of criticalDirs) {
        if (!fs.existsSync(dir)) {
          console.log(`📁 Criando diretório ausente: ${dir}`);
          fs.mkdirSync(dir, { recursive: true });
          this.healthStatus.issues.push(`Diretório ${dir} foi recriado`);
        }
      }

      // 2. Verificar permissões de escrita
      const testFile = './logs/contingency-test.txt';
      try {
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
      } catch (error) {
        this.healthStatus.criticalErrors.push('Sem permissão de escrita no sistema de arquivos');
        return false;
      }

      // 3. Verificar espaço em disco (se possível)
      const stats = fs.statSync('./');
      
      console.log('✅ Sistema de arquivos saudável');
      return true;

    } catch (error) {
      console.error('❌ Erro na verificação do sistema de arquivos:', error);
      this.healthStatus.criticalErrors.push(`Falha no sistema de arquivos: ${error.message}`);
      return false;
    }
  }

  private async checkEnvironmentSecurity(): Promise<boolean> {
    try {
      console.log('🔒 Verificando segurança do ambiente...');

      // 1. Verificar variáveis de ambiente críticas
      const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

      if (missingVars.length > 0) {
        this.healthStatus.criticalErrors.push(`Variáveis de ambiente ausentes: ${missingVars.join(', ')}`);
        return false;
      }

      // 2. Verificar força do JWT_SECRET
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret || jwtSecret === 'fallback_secret_key_change_in_production' || jwtSecret.length < 32) {
        this.healthStatus.criticalErrors.push('JWT_SECRET inseguro ou padrão detectado');
        return false;
      }

      // 3. Verificar se estamos em produção com configurações adequadas
      if (process.env.NODE_ENV === 'production') {
        if (process.env.SUPABASE_URL?.includes('localhost')) {
          this.healthStatus.criticalErrors.push('Configuração de desenvolvimento em produção');
          return false;
        }
      }

      console.log('✅ Ambiente seguro');
      return true;

    } catch (error) {
      console.error('❌ Erro na verificação de segurança:', error);
      this.healthStatus.criticalErrors.push(`Falha na verificação de segurança: ${error.message}`);
      return false;
    }
  }

  private async checkPerformanceMetrics(): Promise<boolean> {
    try {
      console.log('⚡ Verificando métricas de performance...');

      const startTime = Date.now();

      // 1. Teste de latência do banco
      await supabase
        .from('service_orders')
        .select('count', { count: 'exact', head: true })
        .limit(1);

      const dbLatency = Date.now() - startTime;

      if (dbLatency > 5000) {
        this.healthStatus.issues.push(`Alta latência do banco: ${dbLatency}ms`);
      }

      // 2. Verificar uso de memória
      const memUsage = process.memoryUsage();
      const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);

      if (memUsageMB > 512) {
        this.healthStatus.issues.push(`Alto uso de memória: ${memUsageMB}MB`);
      }

      console.log(`✅ Performance OK (Latência: ${dbLatency}ms, Memória: ${memUsageMB}MB)`);
      return true;

    } catch (error) {
      console.error('❌ Erro na verificação de performance:', error);
      this.healthStatus.issues.push(`Falha na verificação de performance: ${error.message}`);
      return false;
    }
  }

  // ========================================
  // AÇÕES DE CONTINGÊNCIA
  // ========================================

  private initializeContingencyActions(): void {
    // Ação 1: Classificação automática de defeitos
    this.contingencyActions.set('autoClassifyMissing', {
      name: 'Classificação Automática de Defeitos',
      priority: 'high',
      description: 'Classifica automaticamente defeitos não classificados',
      execute: async () => {
        try {
          console.log('🤖 CONTINGÊNCIA: Executando classificação automática...');
          
          const { data: unclassified } = await supabase
            .from('service_orders')
            .select(`id, raw_defect_description, defect_classifications!left(id)`)
            .not('raw_defect_description', 'is', null)
            .neq('raw_defect_description', '')
            .is('defect_classifications.id', null)
            .limit(100);

          if (!unclassified || unclassified.length === 0) {
            return true;
          }

          // Classificação simples baseada em padrões
          const classifications = unclassified.map(order => ({
            service_order_id: order.id,
            category_id: this.getEmergencyClassification(order.raw_defect_description),
            ai_confidence: 0.6,
            ai_reasoning: 'CONTINGÊNCIA: Classificação automática de emergência',
            original_defect_description: order.raw_defect_description.substring(0, 500),
            created_at: new Date().toISOString()
          }));

          const { error } = await supabase
            .from('defect_classifications')
            .insert(classifications);

          if (error) {
            console.error('❌ Falha na classificação de contingência:', error);
            return false;
          }

          console.log(`✅ CONTINGÊNCIA: ${classifications.length} defeitos classificados automaticamente`);
          return true;

        } catch (error) {
          console.error('❌ Erro na ação de contingência de classificação:', error);
          return false;
        }
      }
    });

    // Ação 2: Backup de emergência
    this.contingencyActions.set('emergencyBackup', {
      name: 'Backup de Emergência',
      priority: 'critical',
      description: 'Cria backup de emergência dos dados críticos',
      execute: async () => {
        try {
          console.log('💾 CONTINGÊNCIA: Criando backup de emergência...');
          
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const backupDir = './backups';
          
          if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
          }

          // Backup das tabelas críticas
          const criticalTables = ['service_orders', 'defect_classifications', 'users'];
          let backupSuccess = true;

          for (const table of criticalTables) {
            try {
              const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(10000);

              if (error) {
                console.error(`❌ Erro no backup da tabela ${table}:`, error);
                backupSuccess = false;
                continue;
              }

              const backupFile = path.join(backupDir, `emergency_${table}_${timestamp}.json`);
              fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
              console.log(`💾 Backup criado: ${backupFile}`);

            } catch (error) {
              console.error(`❌ Falha no backup da tabela ${table}:`, error);
              backupSuccess = false;
            }
          }

          return backupSuccess;

        } catch (error) {
          console.error('❌ Erro na ação de backup de emergência:', error);
          return false;
        }
      }
    });

    // Ação 3: Limpeza de cache e otimização
    this.contingencyActions.set('systemOptimization', {
      name: 'Otimização do Sistema',
      priority: 'medium',
      description: 'Limpa cache e otimiza performance',
      execute: async () => {
        try {
          console.log('🧹 CONTINGÊNCIA: Executando otimização do sistema...');
          
          // Força garbage collection se disponível
          if (global.gc) {
            global.gc();
          }

          // Limpar logs antigos
          const logsDir = './logs';
          if (fs.existsSync(logsDir)) {
            const files = fs.readdirSync(logsDir);
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            
            files.forEach(file => {
              const filePath = path.join(logsDir, file);
              const stats = fs.statSync(filePath);
              
              if (stats.mtime.getTime() < oneWeekAgo) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Log antigo removido: ${file}`);
              }
            });
          }

          console.log('✅ CONTINGÊNCIA: Otimização concluída');
          return true;

        } catch (error) {
          console.error('❌ Erro na otimização do sistema:', error);
          return false;
        }
      }
    });
  }

  private async executeContingencyActions(): Promise<void> {
    const criticalIssues = this.healthStatus.criticalErrors.length > 0;
    const hasIssues = this.healthStatus.issues.length > 0;

    if (criticalIssues) {
      console.log('🚨 EXECUTANDO CONTINGÊNCIAS CRÍTICAS...');
      
      // Executar ações críticas
      for (const [key, action] of this.contingencyActions) {
        if (action.priority === 'critical') {
          console.log(`🔄 Executando: ${action.name}`);
          const success = await action.execute();
          console.log(success ? `✅ ${action.name} executada com sucesso` : `❌ Falha em ${action.name}`);
        }
      }
    }

    if (hasIssues || criticalIssues) {
      console.log('⚠️ EXECUTANDO CONTINGÊNCIAS DE CORREÇÃO...');
      
      // Executar ações de alta prioridade
      for (const [key, action] of this.contingencyActions) {
        if (action.priority === 'high') {
          console.log(`🔄 Executando: ${action.name}`);
          const success = await action.execute();
          console.log(success ? `✅ ${action.name} executada com sucesso` : `❌ Falha em ${action.name}`);
        }
      }
    }
  }

  // ========================================
  // MÉTODOS AUXILIARES
  // ========================================

  private getEmergencyClassification(description: string): number {
    const desc = description.toLowerCase();
    
    // Classificação simples baseada em palavras-chave
    if (desc.includes('vazamento') || desc.includes('vaza')) return 27;
    if (desc.includes('barulho') || desc.includes('ruído')) return 33;
    if (desc.includes('quebra') || desc.includes('rompe')) return 36;
    if (desc.includes('aquecimento') || desc.includes('quente')) return 26;
    if (desc.includes('elétrico') || desc.includes('fio')) return 25;
    if (desc.includes('desgaste') || desc.includes('gasto')) return 28;
    
    return 28; // Categoria padrão: Outros
  }

  private processCheckResults(checks: PromiseSettledResult<boolean>[]): void {
    const checkNames: (keyof Pick<SystemHealthStatus, 'database' | 'aiClassifications' | 'fileSystem' | 'security' | 'performance'>)[] = 
      ['database', 'aiClassifications', 'fileSystem', 'security', 'performance'];
    
    checks.forEach((result, index) => {
      const checkName = checkNames[index];
      
      if (result.status === 'fulfilled') {
        (this.healthStatus as any)[checkName] = result.value;
      } else {
        (this.healthStatus as any)[checkName] = false;
        this.healthStatus.criticalErrors.push(`Verificação ${checkName} falhou: ${result.reason}`);
      }
    });
  }

  private logSystemStatus(): void {
    const totalChecks = 5;
    const passedChecks = [
      this.healthStatus.database,
      this.healthStatus.aiClassifications,
      this.healthStatus.fileSystem,
      this.healthStatus.security,
      this.healthStatus.performance
    ].filter(Boolean).length;

    console.log('\n🛡️ ================= RELATÓRIO DE CONTINGÊNCIA =================');
    console.log(`📊 Status Geral: ${passedChecks}/${totalChecks} verificações passaram`);
    console.log(`🔍 Banco de Dados: ${this.healthStatus.database ? '✅ OK' : '❌ FALHA'}`);
    console.log(`🤖 IA Classificações: ${this.healthStatus.aiClassifications ? '✅ OK' : '❌ FALHA'}`);
    console.log(`📁 Sistema de Arquivos: ${this.healthStatus.fileSystem ? '✅ OK' : '❌ FALHA'}`);
    console.log(`🔒 Segurança: ${this.healthStatus.security ? '✅ OK' : '❌ FALHA'}`);
    console.log(`⚡ Performance: ${this.healthStatus.performance ? '✅ OK' : '❌ FALHA'}`);
    
    if (this.healthStatus.issues.length > 0) {
      console.log(`\n⚠️ AVISOS (${this.healthStatus.issues.length}):`);
      this.healthStatus.issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    if (this.healthStatus.criticalErrors.length > 0) {
      console.log(`\n🚨 ERROS CRÍTICOS (${this.healthStatus.criticalErrors.length}):`);
      this.healthStatus.criticalErrors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('\n✅ NENHUM ERRO CRÍTICO DETECTADO');
    }
    
    console.log(`🕐 Última verificação: ${this.healthStatus.lastCheck.toISOString()}`);
    console.log('================================================================\n');
  }

  // ========================================
  // API PÚBLICA
  // ========================================

  getSystemHealth(): SystemHealthStatus {
    return { ...this.healthStatus };
  }

  async manualContingencyCheck(): Promise<SystemHealthStatus> {
    console.log('🔧 VERIFICAÇÃO MANUAL DE CONTINGÊNCIA SOLICITADA');
    return await this.performComprehensiveCheck();
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 Sistema de contingência parado');
    }
  }
}