import { Router } from 'express';
import { AIController } from '../controllers/AIController';

const router = Router();
const aiController = new AIController();

// 🤖 ROTAS PRINCIPAIS DE IA

/**
 * POST /api/v1/ai/classify-defect
 * Classifica um defeito específico
 */
router.post('/classify-defect', (req, res) => aiController.classifyDefect(req, res));

/**
 * POST /api/v1/ai/classify-all
 * Inicia classificação de todos os defeitos existentes
 */
router.post('/classify-all', (req, res) => aiController.classifyAllDefects(req, res));

/**
 * GET /api/v1/ai/stats
 * Obtém estatísticas das classificações
 */
router.get('/stats', (req, res) => aiController.getClassificationStats(req, res));

/**
 * GET /api/v1/ai/progress
 * Obtém progresso da classificação em massa
 */
router.get('/progress', (req, res) => aiController.getClassificationProgress(req, res));

/**
 * POST /api/v1/ai/test-direct
 * Teste: inserção direta no banco
 */
router.post('/test-direct', (req, res) => aiController.testDirectInsert(req, res));

/**
 * POST /api/v1/ai/test-save
 * Teste: salvar classificação específica
 */
router.post('/test-save', (req, res) => aiController.testSaveClassification(req, res));

/**
 * GET /api/v1/ai/debug
 * Debug: verifica OS não classificadas
 */
router.get('/debug', (req, res) => aiController.getUnclassifiedCount(req, res));

/**
 * GET /api/v1/ai/status
 * Status do sistema de IA
 */
router.get('/status', (req, res) => aiController.getAIStatus(req, res));

// 📂 ROTAS DE CATEGORIAS

/**
 * GET /api/v1/ai/categories
 * Lista todas as categorias de defeitos
 */
router.get('/categories', (req, res) => aiController.getDefectCategories(req, res));

/**
 * POST /api/v1/ai/categories
 * Cria uma nova categoria manualmente
 */
router.post('/categories', (req, res) => aiController.createCategory(req, res));

/**
 * PUT /api/v1/ai/categories/:id
 * Atualiza uma categoria existente
 */
router.put('/categories/:id', (req, res) => aiController.updateCategory(req, res));

// 📋 ROTAS DE CLASSIFICAÇÕES

/**
 * GET /api/v1/ai/classifications
 * Lista classificações com paginação e filtros
 */
router.get('/classifications', (req, res) => aiController.getDefectClassifications(req, res));

/**
 * PUT /api/v1/ai/classifications/:id/review
 * Marca uma classificação como revisada
 */
router.put('/classifications/:id/review', (req, res) => aiController.reviewClassification(req, res));

export default router;