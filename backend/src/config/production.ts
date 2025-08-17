import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente baseadas no NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

export interface ProductionConfig {
  // Database
  supabaseUrl: string;
  supabaseKey: string;
  
  // Security
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigins: string[];
  
  // Performance
  cacheExpiry: number;
  maxRequestSize: string;
  rateLimitWindow: number;
  rateLimitMax: number;
  
  // Monitoring
  enableDetailedLogs: boolean;
  enablePerformanceMetrics: boolean;
  enableContingencySystem: boolean;
  
  // File handling
  maxFileSize: number;
  allowedFileTypes: string[];
  
  // AI System
  aiClassificationTimeout: number;
  maxClassificationRetries: number;
}

class ConfigService {
  private static instance: ConfigService;
  private config: ProductionConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private loadConfig(): ProductionConfig {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
      // Database
      supabaseUrl: this.getRequiredEnv('SUPABASE_URL'),
      supabaseKey: this.getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
      
      // Security
      jwtSecret: this.getRequiredEnv('JWT_SECRET'),
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || (isProduction ? '24h' : '7d'),
      corsOrigins: this.parseCorsOrigins(),
      
      // Performance
      cacheExpiry: parseInt(process.env.CACHE_EXPIRY || '300000'), // 5 minutos
      maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutos
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || (isProduction ? '100' : '1000')),
      
      // Monitoring
      enableDetailedLogs: process.env.ENABLE_DETAILED_LOGS === 'true' || !isProduction,
      enablePerformanceMetrics: process.env.ENABLE_PERFORMANCE_METRICS === 'true' || isProduction,
      enableContingencySystem: process.env.ENABLE_CONTINGENCY_SYSTEM !== 'false',
      
      // File handling
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB
      allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || '.xlsx,.xls,.csv').split(','),
      
      // AI System
      aiClassificationTimeout: parseInt(process.env.AI_CLASSIFICATION_TIMEOUT || '30000'), // 30 segundos
      maxClassificationRetries: parseInt(process.env.MAX_CLASSIFICATION_RETRIES || '3'),
    };
  }

  private getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`❌ ERRO DE CONFIGURAÇÃO: Variável de ambiente obrigatória '${name}' não definida`);
    }
    return value;
  }

  private parseCorsOrigins(): string[] {
    const origins = process.env.CORS_ORIGINS;
    if (!origins) {
      // Padrões seguros baseados no ambiente
      return process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] // Substitua pelo domínio real
        : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'];
    }
    return origins.split(',').map(origin => origin.trim());
  }

  private validateConfig(): void {
    console.log('🔍 Validando configuração de produção...');

    // Validações críticas de segurança
    this.validateSecurity();
    
    // Validações de performance
    this.validatePerformance();
    
    // Validações de conectividade
    this.validateConnectivity();

    console.log('✅ Configuração de produção validada com sucesso');
  }

  private validateSecurity(): void {
    const { jwtSecret, supabaseUrl, corsOrigins } = this.config;

    // JWT Secret
    if (jwtSecret.length < 32) {
      throw new Error('❌ ERRO DE SEGURANÇA: JWT_SECRET deve ter pelo menos 32 caracteres');
    }

    if (jwtSecret === 'fallback_secret_key_change_in_production') {
      throw new Error('❌ ERRO DE SEGURANÇA: JWT_SECRET está usando o valor padrão inseguro');
    }

    // Supabase URL
    if (process.env.NODE_ENV === 'production' && supabaseUrl.includes('localhost')) {
      throw new Error('❌ ERRO DE CONFIGURAÇÃO: URL do Supabase aponta para localhost em produção');
    }

    // CORS Origins
    if (process.env.NODE_ENV === 'production') {
      const hasLocalhost = corsOrigins.some(origin => origin.includes('localhost'));
      if (hasLocalhost) {
        console.warn('⚠️ AVISO: CORS configurado com localhost em produção');
      }
    }

    console.log('🔒 Validações de segurança: ✅ PASSOU');
  }

  private validatePerformance(): void {
    const { maxFileSize, rateLimitMax, cacheExpiry } = this.config;

    // Limites de arquivo
    if (maxFileSize > 100 * 1024 * 1024) { // 100MB
      console.warn('⚠️ AVISO: Tamanho máximo de arquivo muito alto, pode causar problemas de memória');
    }

    // Rate limiting
    if (rateLimitMax > 10000) {
      console.warn('⚠️ AVISO: Rate limit muito alto, pode não proteger contra ataques');
    }

    // Cache
    if (cacheExpiry < 60000) { // 1 minuto
      console.warn('⚠️ AVISO: Cache muito baixo, pode impactar performance');
    }

    console.log('⚡ Validações de performance: ✅ PASSOU');
  }

  private validateConnectivity(): void {
    const { supabaseUrl, supabaseKey } = this.config;

    // URLs válidas
    try {
      new URL(supabaseUrl);
    } catch {
      throw new Error('❌ ERRO DE CONFIGURAÇÃO: SUPABASE_URL não é uma URL válida');
    }

    // Keys não vazias
    if (!supabaseKey || supabaseKey.length < 32) {
      throw new Error('❌ ERRO DE CONFIGURAÇÃO: SUPABASE_SERVICE_ROLE_KEY inválida');
    }

    console.log('🔗 Validações de conectividade: ✅ PASSOU');
  }

  // Métodos públicos para acessar configuração
  get database() {
    return {
      url: this.config.supabaseUrl,
      key: this.config.supabaseKey
    };
  }

  get security() {
    return {
      jwtSecret: this.config.jwtSecret,
      jwtExpiresIn: this.config.jwtExpiresIn,
      corsOrigins: this.config.corsOrigins
    };
  }

  get performance() {
    return {
      cacheExpiry: this.config.cacheExpiry,
      maxRequestSize: this.config.maxRequestSize,
      rateLimitWindow: this.config.rateLimitWindow,
      rateLimitMax: this.config.rateLimitMax
    };
  }

  get monitoring() {
    return {
      enableDetailedLogs: this.config.enableDetailedLogs,
      enablePerformanceMetrics: this.config.enablePerformanceMetrics,
      enableContingencySystem: this.config.enableContingencySystem
    };
  }

  get fileHandling() {
    return {
      maxFileSize: this.config.maxFileSize,
      allowedFileTypes: this.config.allowedFileTypes
    };
  }

  get aiSystem() {
    return {
      classificationTimeout: this.config.aiClassificationTimeout,
      maxRetries: this.config.maxClassificationRetries
    };
  }

  // Método para log de configuração (sem dados sensíveis)
  logConfigSummary(): void {
    const isProduction = process.env.NODE_ENV === 'production';
    
    console.log('📋 =============== RESUMO DA CONFIGURAÇÃO ===============');
    console.log(`🌍 Ambiente: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
    console.log(`🔗 Supabase: ${this.config.supabaseUrl.includes('localhost') ? 'Local' : 'Remoto'}`);
    console.log(`🔒 CORS Origins: ${this.config.corsOrigins.length} configurados`);
    console.log(`⚡ Cache: ${this.config.cacheExpiry / 1000}s`);
    console.log(`📊 Rate Limit: ${this.config.rateLimitMax} req/${this.config.rateLimitWindow / 60000}min`);
    console.log(`📁 Max File: ${(this.config.maxFileSize / 1024 / 1024).toFixed(1)}MB`);
    console.log(`🤖 AI Timeout: ${this.config.aiClassificationTimeout / 1000}s`);
    console.log(`📈 Logs Detalhados: ${this.config.enableDetailedLogs ? 'SIM' : 'NÃO'}`);
    console.log(`🛡️ Contingência: ${this.config.enableContingencySystem ? 'ATIVO' : 'INATIVO'}`);
    console.log('=====================================================');
  }

  // Método para obter toda a configuração (para uso interno)
  getFullConfig(): ProductionConfig {
    return { ...this.config };
  }
}

// Singleton instance
export const productionConfig = ConfigService.getInstance();

// Export individual configs
export const databaseConfig = productionConfig.database;
export const securityConfig = productionConfig.security;
export const performanceConfig = productionConfig.performance;
export const monitoringConfig = productionConfig.monitoring;
export const fileHandlingConfig = productionConfig.fileHandling;
export const aiSystemConfig = productionConfig.aiSystem;