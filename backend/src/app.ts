import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import { UploadController } from './controllers/UploadController';
import { UploadControllerV2 } from './controllers/UploadControllerV2';
import { StatsController } from './controllers/StatsController';
import { IntegrityController } from './controllers/IntegrityController';
import { SettingsController } from './controllers/SettingsController';
import { continuousMonitoring } from './services/ContinuousMonitoringService';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '4000', 10);

// Configuração do multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - permitir requisições de qualquer origem
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Instanciar controladores
const uploadController = new UploadController();
const uploadControllerV2 = new UploadControllerV2();
const statsController = new StatsController();
const integrityController = new IntegrityController();
const settingsController = new SettingsController();

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

// NOVA ROTA DE UPLOAD DEFINITIVA COM PYTHON PANDAS
app.post('/api/v2/upload', upload.single('file'), (req, res) => {
  uploadControllerV2.uploadExcelDefinitive(req, res);
});

// Health check do sistema Python
app.get('/api/v2/health', (req, res) => {
  uploadControllerV2.healthCheck(req, res);
});

// Instalar dependências Python
app.post('/api/v2/install-dependencies', (req, res) => {
  uploadControllerV2.installDependencies(req, res);
});

// Rota de teste simples
app.get('/api/v1/test', (req, res) => {
  res.json({ message: 'API funcionando', timestamp: new Date().toISOString() });
});

// Rotas de estatísticas e dados
app.get('/api/v1/stats', (req, res) => {
  statsController.getStats(req, res);
});

app.get('/api/v1/service-orders', (req, res) => {
  statsController.getServiceOrders(req, res);
});

app.put('/api/v1/service-orders/:id', (req, res) => {
  statsController.updateServiceOrder(req, res);
});

app.get('/api/v1/upload-logs', (req, res) => {
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

