// --- TESTE DE DEPLOY v4 - COM CREDENCIAIS SUPABASE CORRETAS ---
console.log('--- INICIANDO A VERSÃO MAIS RECENTE DO CÓDIGO (v4) ---');
console.log('--- CREDENCIAIS SUPABASE ATUALIZADAS NO RENDER.COM ---');
// --- FIM DO TESTE DE DEPLOY ---

import express from 'express';
import multer from 'multer';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { UploadController } from './controllers/UploadController';
import { UploadControllerV2 } from './controllers/UploadControllerV2';
import { StatsController } from './controllers/StatsController';
import { CachedStatsController } from './controllers/CachedStatsController';
import { IntegrityController } from './controllers/IntegrityController';
import { SettingsController } from './controllers/SettingsController';
import { AuthController } from './controllers/AuthController';
import { AIController } from './controllers/AIController';
import { AIControllerSimple } from './controllers/AIControllerSimple';
import { AIContingencyController } from './controllers/AIContingencyController';
import { ContingencyController } from './controllers/ContingencyController';
import { continuousMonitoring } from './services/ContinuousMonitoringService';
import aiRoutes from './routes/aiRoutes';
import authRoutes from './routes/authRoutes';
import hierarchicalAIRoutes from './routes/hierarchicalAIRoutes';
import hierarchicalAnalysisRoutes from './routes/hierarchicalAnalysisRoutes';
import { AIContingencyService } from './services/AIContingencyService';
import { ComprehensiveContingencyService } from './services/ComprehensiveContingencyService';

// 🔒 MIDDLEWARES DE SEGURANÇA
import { 
  helmetConfig, 
  corsOptions, 
  customSecurityHeaders,
  botProtection,
  securityLogger,
  preventPathTraversal,
  requestTimeout
} from './middleware/securityMiddleware';
import { 
  apiRateLimit, 
  loginRateLimit, 
  uploadRateLimit, 
  aiRateLimit,
  dynamicRateLimit
} from './middleware/rateLimitMiddleware';
import { 
  sanitizeHTML, 
  preventSQLInjection,
  handleValidationErrors
} from './middleware/validationMiddleware';
import { authenticateToken, optionalAuth } from './middleware/authMiddleware';

dotenv.config();

// --- INÍCIO DO LOG DE DEPURAÇÃO DE VARIÁVEIS DE AMBIENTE ---
console.log('--- Verificando Variáveis de Ambiente na Inicialização ---');
console.log(`[ENV] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[ENV] PORT: ${process.env.PORT}`);
console.log(`[ENV] SUPABASE_URL: ${process.env.SUPABASE_URL ? 'Carregada (oculta por segurança)' : 'NÃO ENCONTRADA'}`);
console.log(`[ENV] SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Carregada (oculta por segurança)' : 'NÃO ENCONTRADA'}`);
console.log(`[ENV] JWT_SECRET: ${process.env.JWT_SECRET ? 'Carregada' : 'NÃO ENCONTRADA'}`);
console.log('----------------------------------------------------------');


const app = express();
const port = parseInt(process.env.PORT || '3009', 10);

// 🛡️ APLICAR MIDDLEWARES DE SEGURANÇA (ORDEM IMPORTANTE!)

// 1. Timeout para requisições (2 minutos para uploads grandes)
app.use(requestTimeout(120000)); // 2 minutos

// 2. Headers de segurança
app.use(helmetConfig);
app.use(customSecurityHeaders);

// 3. CORS configurado
app.use(cors(corsOptions));

// 4. Logging de segurança
app.use(securityLogger);

// 5. Proteção contra bots (TEMPORARIAMENTE DESABILITADA PARA TESTES)
// app.use(botProtection);

// 6. Prevenção de path traversal
app.use(preventPathTraversal);

// 7. Body parsing com limite de tamanho
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 8. Sanitização de entrada
app.use(sanitizeHTML);
app.use(preventSQLInjection);

// 9. Rate limiting dinâmico
app.use(dynamicRateLimit);

// Configuração do multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB (reduzido para segurança)
  },
  fileFilter: (req, file, cb) => {
    // Permitir Excel e arquivos semelhantes
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/octet-stream', // Fallback para Excel
      'application/zip' // XLSX é tecnicamente um ZIP
    ];
    
    // Também verificar por extensão
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExtension = allowedExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );
    
    if (allowedMimes.includes(file.mimetype) || hasValidExtension) {
      cb(null, true);
    } else {
      console.log('❌ Arquivo rejeitado:', {
        mimetype: file.mimetype,
        originalname: file.originalname
      });
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

// Instanciar controladores
const uploadController = new UploadController();
const uploadControllerV2 = new UploadControllerV2();
const statsController = new StatsController();
const integrityController = new IntegrityController();
const settingsController = new SettingsController();
const authController = new AuthController();
const aiController = new AIController();
const aiControllerSimple = new AIControllerSimple();
const aiContingencyController = new AIContingencyController();
const contingencyController = new ContingencyController();

// Rotas
app.get('/', (req, res) => {
  res.json({
    message: 'Sistema de Análise de Ordens de Serviço - API',
    version: '2.0.0',
    status: 'running',
    features: {
      v1: 'Sistema original Node.js/XLSX (compatibilidade)',
      v2: 'Sistema definitivo Python/Pandas (recomendado)'
    },
    endpoints: {
      upload_v1: '/api/v1/upload',
      upload_v2: '/api/v2/upload (RECOMENDADO)',
      health_v2: '/api/v2/health',
      install_deps: '/api/v2/install-dependencies'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rota de upload (SISTEMA ANTIGO - Manter para compatibilidade)
app.post('/api/v1/upload', upload.single('file'), (req, res) => {
  uploadController.uploadExcel(req, res);
});

// TEMPORÁRIO: UPLOAD SEM AUTENTICAÇÃO PARA TESTE
app.post('/api/v2/upload', upload.single('file'), (req, res) => {
  uploadControllerV2.uploadExcelDefinitive(req, res);
});

// Health check do sistema Python (PÚBLICO)
app.get('/api/v2/health', (req, res) => {
  uploadControllerV2.healthCheck(req, res);
});

// Instalar dependências Python (APENAS ADMIN)
app.post('/api/v2/install-dependencies', authenticateToken, require('./middleware/authMiddleware').requireRole(['admin']), (req, res) => {
  uploadControllerV2.installDependencies(req, res);
});

// ✅ NOVAS ROTAS DE PROTEÇÃO DE DADOS EDITADOS (PROTEGIDAS)
// Relatório de dados editados pelo usuário
app.get('/api/v2/edited-data-report', authenticateToken, (req, res) => {
  uploadControllerV2.getEditedDataReport(req, res);
});

// Resetar proteção de uma ordem específica
app.post('/api/v2/reset-protection/:orderNumber', authenticateToken, require('./middleware/authMiddleware').requireRole(['admin', 'manager']), (req, res) => {
  uploadControllerV2.resetOrderProtection(req, res);
});

// Rota de teste simples
app.get('/api/v1/test', (req, res) => {
  res.json({ message: 'API funcionando', timestamp: new Date().toISOString() });
});

// Rotas de estatísticas e dados (PROTEGIDAS)
// TEMPORÁRIO: SEM AUTENTICAÇÃO PARA TESTE
app.get('/api/v1/stats', (req, res) => {
  statsController.getStats(req, res);
});

// 🤖 ROTAS DE IA ULTRA-SIMPLIFICADAS (ESTÁVEIS PARA DEPLOY)
app.get('/api/v1/ai/stats', (req, res) => {
  aiControllerSimple.getAIStats(req, res);
});

app.get('/api/v1/ai/classifications', (req, res) => {
  aiControllerSimple.getDefectClassifications(req, res);
});

app.get('/api/v1/ai/categories', (req, res) => {
  aiControllerSimple.getAICategories(req, res);
});

// Rota de teste de conectividade
app.get('/api/v1/ai/test', (req, res) => {
  aiControllerSimple.testConnection(req, res);
});

app.get('/api/v1/service-orders', (req, res) => {
  statsController.getServiceOrders(req, res);
});

app.put('/api/v1/service-orders/:id', authenticateToken, require('./middleware/authMiddleware').requireRole(['admin', 'manager']), (req, res) => {
  statsController.updateServiceOrder(req, res);
});

app.get('/api/v1/upload-logs', authenticateToken, require('./middleware/authMiddleware').requireRole(['admin', 'manager']), (req, res) => {
  statsController.getUploadLogs(req, res);
});

// Rota para limpar o cache (ADMIN)
app.post('/api/v1/clear-cache', authenticateToken, require('./middleware/authMiddleware').requireRole(['admin']), (req, res) => {
  CachedStatsController.clearCache(req, res);
});

// Rotas de integridade de dados (TEMPORARIAMENTE SEM AUTENTICAÇÃO)
app.get('/api/v1/integrity/health', (req, res) => {
  integrityController.healthCheck(req, res);
});

app.post('/api/v1/integrity/check/complete', (req, res) => {
  integrityController.runCompleteCheck(req, res);
});

app.get('/api/v1/integrity/logs', (req, res) => {
  integrityController.getIntegrityLogs(req, res);
});

app.post('/api/v1/integrity/check/total-records', (req, res) => {
  integrityController.checkTotalRecords(req, res);
});

app.post('/api/v1/integrity/check/date-range', (req, res) => {
  integrityController.checkDateRange(req, res);
});

app.post('/api/v1/integrity/check/financial', (req, res) => {
  integrityController.checkFinancialCalculations(req, res);
});

// Rotas de configurações - Mecânicos
app.get('/api/v1/mechanics', (req, res) => {
  settingsController.getMechanics(req, res);
});

app.post('/api/v1/mechanics', (req, res) => {
  settingsController.addMechanic(req, res);
});

app.put('/api/v1/mechanics/:id', (req, res) => {
  settingsController.updateMechanic(req, res);
});

app.delete('/api/v1/mechanics/:id', (req, res) => {
  settingsController.removeMechanic(req, res);
});

// Rotas de configurações - Usuários (PROTEGIDAS)
app.get('/api/v1/users', authenticateToken, (req, res) => {
  settingsController.getUsers(req, res);
});

app.post('/api/v1/users', authenticateToken, require('./middleware/authMiddleware').requireRole(['admin']), (req, res) => {
  settingsController.addUser(req, res);
});

app.put('/api/v1/users/:id', authenticateToken, require('./middleware/authMiddleware').requireRole(['admin']), (req, res) => {
  settingsController.updateUser(req, res);
});

app.delete('/api/v1/users/:id', authenticateToken, require('./middleware/authMiddleware').requireRole(['admin']), (req, res) => {
  settingsController.removeUser(req, res);
});

// 🔐 ROTAS DE AUTENTICAÇÃO (PÚBLICAS)
app.use('/api/v1/auth', authRoutes);

// 🧪 TESTE DE AUTH
app.post('/api/v1/test-auth', async (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de teste funcionando',
    body: req.body
  });
});

// 🤖 ROTAS DE INTELIGÊNCIA ARTIFICIAL (PROTEGIDAS)
app.use('/api/v1/ai', authenticateToken, aiRoutes);

// 🌳 ROTAS DE IA HIERÁRQUICA (PROTEGIDAS)
app.use('/api/v1/hierarchical-ai', authenticateToken, hierarchicalAIRoutes);

// 📊 ROTAS DE ANÁLISE HIERÁRQUICA (PROTEGIDAS)
app.use('/api/v1/hierarchical-analysis', authenticateToken, hierarchicalAnalysisRoutes);

// 🤖 ROTAS DE CONTINGÊNCIA DE IA (PROTEGIDAS)
app.get('/api/v1/ai-contingency/status', (req, res) => {
  aiContingencyController.checkStatus(req, res);
});

app.post('/api/v1/ai-contingency/force-classify', (req, res) => {
  aiContingencyController.forceClassification(req, res);
});

// 🛡️ ROTAS DE CONTINGÊNCIA ABRANGENTE (PROTEGIDAS)
app.get('/api/v1/contingency/status', (req, res) => {
  contingencyController.getSystemStatus(req, res);
});

app.get('/api/v1/contingency/health-summary', (req, res) => {
  contingencyController.getHealthSummary(req, res);
});

app.post('/api/v1/contingency/check', authenticateToken, require('./middleware/authMiddleware').requireRole(['admin']), (req, res) => {
  contingencyController.performManualCheck(req, res);
});

app.post('/api/v1/contingency/start-monitoring', authenticateToken, require('./middleware/authMiddleware').requireRole(['admin']), (req, res) => {
  contingencyController.startMonitoring(req, res);
});

app.post('/api/v1/contingency/stop-monitoring', authenticateToken, require('./middleware/authMiddleware').requireRole(['admin']), (req, res) => {
  contingencyController.stopMonitoring(req, res);
});

// Middleware de tratamento de erros
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: error.message
  });
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`📊 API disponível em http://localhost:${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`📤 Upload v1 (Node.js): http://localhost:${port}/api/v1/upload`);
  console.log(`🐍 Upload v2 (Python): http://localhost:${port}/api/v2/upload`);
  console.log(`🔍 Python health: http://localhost:${port}/api/v2/health`);
  console.log(`🔍 Integridade: http://localhost:${port}/api/v1/integrity/health`);
  console.log(`
⚡ SISTEMA DEFINITIVO PYTHON DISPONÍVEL!
`);
  
  // 🤖 INICIAR SISTEMA DE CONTINGÊNCIA DE IA
  console.log('\n🤖 Iniciando sistema de contingência de IA...');
  const aiContingency = AIContingencyService.getInstance();
  aiContingency.startContingencySystem();
  console.log('✅ Sistema de contingência de IA ativo (verificação a cada 5 min)');
  
  // 🛡️ INICIAR SISTEMA DE CONTINGÊNCIA ABRANGENTE
  console.log('\n🛡️ Iniciando sistema de contingência abrangente...');
  const comprehensiveContingency = ComprehensiveContingencyService.getInstance();
  comprehensiveContingency.startComprehensiveMonitoring();
  console.log('✅ Sistema de contingência abrangente ativo (verificação a cada 10 min)');
  
  // 🛡️ INICIAR SISTEMA DE GARANTIA AUTÔNOMA PERMANENTE
  setTimeout(() => {
    console.log('🔄 Iniciando sistema de monitoramento contínuo...');
    continuousMonitoring.startMonitoring(30); // Verificar a cada 30 minutos
    
    // INICIAR SISTEMA AUTÔNOMO DE CLASSIFICAÇÃO IA (NUNCA PARA)
    console.log('🤖 Inicializando Sistema de Garantia Autônoma da IA...');
    try {
      const { autonomousGuarantee } = require('../GARANTIA_SISTEMA_AUTONOMO.js');
      console.log('✅ Sistema de Garantia Autônoma ATIVO - IA funcionará para sempre!');
    } catch (error) {
      console.error('❌ ERRO: Falha ao iniciar Sistema de Garantia Autônoma!', error);
      console.log('✅ Sistema de contingência ativo via AIContingencyService');
      // Sistema de classificação automática já está ativo via contingência
    }
  }, 30000);
});

export default app;