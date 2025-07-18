"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const dotenv_1 = __importDefault(require("dotenv"));
const UploadController_1 = require("./controllers/UploadController");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = parseInt(process.env.PORT || '3001', 10);
// Configuração do multer para upload de arquivos
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
    },
});
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// CORS - permitir requisições de qualquer origem
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    }
    else {
        next();
    }
});
// Instanciar controladores
const uploadController = new UploadController_1.UploadController();
// Rotas
app.get('/', (req, res) => {
    res.json({
        message: 'Sistema de Análise de Ordens de Serviço - API',
        version: '1.0.0',
        status: 'running'
    });
});
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// Rota de upload
app.post('/api/v1/upload', upload.single('file'), (req, res) => {
    uploadController.uploadExcel(req, res);
});
// Middleware de tratamento de erros
app.use((error, req, res, next) => {
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
    console.log(`📤 Upload endpoint: http://localhost:${port}/api/v1/upload`);
});
exports.default = app;
