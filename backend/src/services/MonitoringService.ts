import fs from 'fs/promises';
import path from 'path';
import { cache } from '../config/cache';
import supabase from '../config/supabase';

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  database: {
    connected: boolean;
    responseTime: number;
  };
  cache: {
    status: string;
    hits: number;
    misses: number;
  };
  errors: {
    last24h: number;
    criticalErrors: string[];
  };
  performance: {
    avgResponseTime: number;
    slowQueries: number;
  };
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'critical';
  message: string;
  timestamp: string;
  metadata?: any;
  source: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

class MonitoringService {
  private logBuffer: LogEntry[] = [];
  private errorCount24h = 0;
  private cacheHits = 0;
  private cacheMisses = 0;
  private responseTimes: number[] = [];
  private criticalErrors: string[] = [];

  constructor() {
    this.startPeriodicTasks();
  }

  // Registrar log estruturado
  async log(level: LogEntry['level'], message: string, metadata?: any, source = 'system') {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
      source
    };

    // Adicionar ao buffer
    this.logBuffer.push(logEntry);

    // Manter apenas últimos 1000 logs no buffer
    if (this.logBuffer.length > 1000) {
      this.logBuffer = this.logBuffer.slice(-1000);
    }

    // Contar erros
    if (level === 'error' || level === 'critical') {
      this.errorCount24h++;
      
      if (level === 'critical') {
        this.criticalErrors.push(message);
        // Manter apenas últimos 10 erros críticos
        if (this.criticalErrors.length > 10) {
          this.criticalErrors = this.criticalErrors.slice(-10);
        }
      }
    }

    // Log no console para desenvolvimento
    const logFunc = level === 'error' || level === 'critical' ? console.error : 
                   level === 'warn' ? console.warn : console.log;
    
    logFunc(`[${level.toUpperCase()}] ${message}`, metadata ? JSON.stringify(metadata, null, 2) : '');

    // Persistir em arquivo em produção
    if (process.env.NODE_ENV === 'production') {
      await this.writeLogToFile(logEntry);
    }
  }

  // Escrever log em arquivo
  private async writeLogToFile(logEntry: LogEntry) {
    try {
      const logsDir = path.join(process.cwd(), 'logs');
      
      // Criar diretório se não existir
      try {
        await fs.access(logsDir);
      } catch {
        await fs.mkdir(logsDir, { recursive: true });
      }

      const fileName = `${new Date().toISOString().split('T')[0]}.log`;
      const filePath = path.join(logsDir, fileName);
      
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(filePath, logLine);
    } catch (error) {
      console.error('❌ Erro ao escrever log em arquivo:', error);
    }
  }

  // Verificar saúde do sistema
  async getSystemHealth(): Promise<SystemHealth> {
    const startTime = Date.now();

    // Verificar conectividade do banco
    let dbConnected = false;
    let dbResponseTime = 0;
    try {
      const dbStart = Date.now();
      await supabase.from('service_orders').select('id').limit(1);
      dbResponseTime = Date.now() - dbStart;
      dbConnected = true;
    } catch (error) {
      dbConnected = false;
      await this.log('error', 'Database connection failed', { error: error.message });
    }

    // Informações de memória
    const memUsage = process.memoryUsage();
    const memory = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      free: Math.round((memUsage.heapTotal - memUsage.heapUsed) / 1024 / 1024), // MB
      total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    };

    // Performance
    const avgResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
      : 0;

    const slowQueries = this.responseTimes.filter(time => time > 1000).length;

    // Status geral
    let status: SystemHealth['status'] = 'healthy';
    if (!dbConnected || memory.percentage > 90 || this.criticalErrors.length > 0) {
      status = 'critical';
    } else if (memory.percentage > 80 || avgResponseTime > 500 || this.errorCount24h > 50) {
      status = 'warning';
    }

    const health: SystemHealth = {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      memory,
      database: {
        connected: dbConnected,
        responseTime: dbResponseTime
      },
      cache: {
        status: cache.getStatus().redisEnabled ? 'redis' : 'local',
        hits: this.cacheHits,
        misses: this.cacheMisses
      },
      errors: {
        last24h: this.errorCount24h,
        criticalErrors: this.criticalErrors
      },
      performance: {
        avgResponseTime: Math.round(avgResponseTime),
        slowQueries
      }
    };

    return health;
  }

  // Registrar tempo de resposta
  recordResponseTime(time: number) {
    this.responseTimes.push(time);
    
    // Manter apenas últimas 100 medições
    if (this.responseTimes.length > 100) {
      this.responseTimes = this.responseTimes.slice(-100);
    }
  }

  // Registrar hit/miss do cache
  recordCacheHit() {
    this.cacheHits++;
  }

  recordCacheMiss() {
    this.cacheMisses++;
  }

  // Obter logs recentes
  getRecentLogs(limit = 100): LogEntry[] {
    return this.logBuffer.slice(-limit);
  }

  // Obter logs por nível
  getLogsByLevel(level: LogEntry['level'], limit = 50): LogEntry[] {
    return this.logBuffer
      .filter(log => log.level === level)
      .slice(-limit);
  }

  // Verificação de integridade dos dados
  async checkDataIntegrity(): Promise<any> {
    try {
      await this.log('info', 'Iniciando verificação de integridade dos dados');

      // Verificar consistência básica
      const { data: orders, error } = await supabase
        .from('service_orders')
        .select('id, order_number, order_date, grand_total')
        .limit(1000);

      if (error) {
        await this.log('error', 'Erro na verificação de integridade', { error: error.message });
        return { success: false, error: error.message };
      }

      // Verificações específicas
      const issues = [];
      
      // 1. Verificar dados obrigatórios
      const missingData = orders?.filter(order => 
        !order.order_number || !order.order_date
      );
      
      if (missingData && missingData.length > 0) {
        issues.push(`${missingData.length} registros com dados obrigatórios faltando`);
      }

      // 2. Verificar valores negativos inválidos
      const negativeValues = orders?.filter(order => 
        order.grand_total < 0
      );
      
      if (negativeValues && negativeValues.length > 0) {
        issues.push(`${negativeValues.length} registros com valores negativos`);
      }

      // 3. Verificar duplicatas
      const orderNumbers = orders?.map(o => o.order_number) || [];
      const duplicates = orderNumbers.filter((num, index) => 
        orderNumbers.indexOf(num) !== index
      );
      
      if (duplicates.length > 0) {
        issues.push(`${duplicates.length} possíveis duplicatas encontradas`);
      }

      const result = {
        success: true,
        timestamp: new Date().toISOString(),
        recordsChecked: orders?.length || 0,
        issues,
        status: issues.length === 0 ? 'healthy' : 'warning'
      };

      await this.log('info', 'Verificação de integridade concluída', result);
      return result;

    } catch (error) {
      await this.log('error', 'Erro na verificação de integridade', { error });
      return { success: false, error: error.message };
    }
  }

  // Tarefas periódicas
  private startPeriodicTasks() {
    // Reset de contadores a cada 24h
    setInterval(() => {
      this.errorCount24h = 0;
      this.cacheHits = 0;
      this.cacheMisses = 0;
      this.criticalErrors = [];
      this.log('info', 'Contadores de 24h resetados');
    }, 24 * 60 * 60 * 1000);

    // Verificação de saúde a cada 5 minutos
    setInterval(async () => {
      const health = await this.getSystemHealth();
      if (health.status === 'critical') {
        await this.log('critical', 'Sistema em estado crítico', health);
      } else if (health.status === 'warning') {
        await this.log('warn', 'Sistema em estado de atenção', health);
      }
    }, 5 * 60 * 1000);

    // Limpeza de logs antigos a cada hora
    setInterval(async () => {
      try {
        const logsDir = path.join(process.cwd(), 'logs');
        const files = await fs.readdir(logsDir);
        const oldFiles = files.filter(file => {
          const fileDate = new Date(file.replace('.log', ''));
          const daysDiff = (Date.now() - fileDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff > 7; // Manter logs por 7 dias
        });

        for (const file of oldFiles) {
          await fs.unlink(path.join(logsDir, file));
        }

        if (oldFiles.length > 0) {
          await this.log('info', `${oldFiles.length} arquivos de log antigos removidos`);
        }
      } catch (error) {
        // Erro silencioso para não poluir logs
      }
    }, 60 * 60 * 1000);
  }

  // Alertas automáticos
  async checkAndSendAlerts() {
    const health = await this.getSystemHealth();
    
    if (health.status === 'critical') {
      // Em um ambiente real, aqui você enviaria notificações
      // via email, Slack, Discord, etc.
      await this.log('critical', 'ALERTA CRÍTICO: Sistema requer atenção imediata', health);
    }
  }
}

// Instância singleton
export const monitoring = new MonitoringService();

export default monitoring;