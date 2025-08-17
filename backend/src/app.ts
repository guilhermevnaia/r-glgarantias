import express from 'express';
import multer from 'multer';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { UploadController } from './controllers/UploadController';
import { UploadControllerV2 } from './controllers/UploadControllerV2';
import { StatsController } from './controllers/StatsController';
import { IntegrityController } from './controllers/IntegrityController';
import { SettingsController } from './controllers/SettingsController';
import { AuthController } from './controllers/AuthController';
import { continuousMonitoring } from './services/ContinuousMonitoringService';
import aiRoutes from './routes/aiRoutes';
import authRoutes from './routes/authRoutes';

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

const app = express();
const port = parseInt(process.env.PORT || '3005', 10);

// 🛡️ APLICAR MIDDLEWARES DE SEGURANÇA (ORDEM IMPORTANTE!)

// 1. Timeout para requisições
app.use(requestTimeout(30000)); // 30 segundos

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
    // Permitir apenas tipos específicos
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
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

// NOVA ROTA DE UPLOAD DEFINITIVA COM PYTHON PANDAS (PROTEGIDA)
app.post('/api/v2/upload', authenticateToken, uploadRateLimit, upload.single('file'), (req, res) => {
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
app.get('/api/v1/stats', authenticateToken, (req, res) => {
  statsController.getStats(req, res);
});

app.get('/api/v1/service-orders', authenticateToken, (req, res) => {
  statsController.getServiceOrders(req, res);
});

app.put('/api/v1/service-orders/:id', authenticateToken, require('./middleware/authMiddleware').requireRole(['admin', 'manager']), (req, res) => {
  statsController.updateServiceOrder(req, res);
});

app.get('/api/v1/upload-logs', authenticateToken, require('./middleware/authMiddleware').requireRole(['admin', 'manager']), (req, res) => {
  statsController.getUploadLogs(req, res);
});

// Rotas de integridade de dados
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

// Rotas de configurações - Usuários
app.get('/api/v1/users', (req, res) => {
  settingsController.getUsers(req, res);
});

app.post('/api/v1/users', (req, res) => {
  settingsController.addUser(req, res);
});

app.put('/api/v1/users/:id', (req, res) => {
  settingsController.updateUser(req, res);
});

app.delete('/api/v1/users/:id', (req, res) => {
  settingsController.removeUser(req, res);
});

// 🔐 ROTAS DE AUTENTICAÇÃO (PÚBLICAS)
app.use('/api/v1/auth', authRoutes);

// 🔑 ROTAS DE PRIMEIRO ACESSO (PÚBLICAS)
app.post('/api/v1/auth/check-first-login', (req, res) => {
  authController.checkFirstLogin(req, res);
});
app.post('/api/v1/auth/set-first-password', AuthController.setFirstPasswordValidation, (req: express.Request, res: express.Response) => {
  authController.setFirstPassword(req, res);
});

// 🧪 TESTE DE AUTH
app.post('/api/v1/test-auth', async (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de teste funcionando',
    body: req.body
  });
});

// 🤖 ROTAS DE INTELIGÊNCIA ARTIFICIAL (PROTEGIDAS)
app.use('/api/v1/ai', aiRoutes); // Autenticação temporariamente removida para testes

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
  console.log(`\n⚡ SISTEMA DEFINITIVO PYTHON DISPONÍVEL!`);
  
  // Iniciar monitoramento contínuo após 30 segundos (dar tempo para o servidor estabilizar)
  setTimeout(() => {
    console.log('🔄 Iniciando sistema de monitoramento contínuo...');
    continuousMonitoring.startMonitoring(30); // Verificar a cada 30 minutos
  }, 30000);
});

export default app;

