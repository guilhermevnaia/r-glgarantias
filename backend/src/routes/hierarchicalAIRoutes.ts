import { Router } from 'express';
import { HierarchicalAIController } from '../controllers/HierarchicalAIController';

const router = Router();
const hierarchicalAIController = new HierarchicalAIController();

// 🌳 ROTAS PRINCIPAIS DE IA HIERÁRQUICA

/**
 * POST /api/v1/hierarchical-ai/classify-defect
 * Classifica um defeito hierarquicamente
 */
router.post('/classify-defect', (req, res) => hierarchicalAIController.classifyDefectHierarchically(req, res));

/**
 * POST /api/v1/hierarchical-ai/classify-all
 * Inicia classificação hierárquica de todos os defeitos existentes
 */
router.post('/classify-all', (req, res) => hierarchicalAIController.classifyAllHierarchically(req, res));

/**
 * GET /api/v1/hierarchical-ai/stats
 * Obtém estatísticas das classificações hierárquicas
 */
router.get('/stats', (req, res) => hierarchicalAIController.getHierarchicalStats(req, res));

/**
 * GET /api/v1/hierarchical-ai/progress
 * Obtém progresso da classificação hierárquica
 */
router.get('/progress', (req, res) => hierarchicalAIController.getHierarchicalProgress(req, res));

/**
 * GET /api/v1/hierarchical-ai/status
 * Status do sistema de IA hierárquica
 */
router.get('/status', (req, res) => hierarchicalAIController.getHierarchicalAIStatus(req, res));

// 🌲 ROTAS DE HIERARQUIA

/**
 * GET /api/v1/hierarchical-ai/hierarchy
 * Obtém toda a estrutura hierárquica
 */
router.get('/hierarchy', (req, res) => hierarchicalAIController.getHierarchy(req, res));

/**
 * POST /api/v1/hierarchical-ai/hierarchy
 * Cria um novo nó na hierarquia manualmente
 */
router.post('/hierarchy', (req, res) => hierarchicalAIController.createHierarchyNode(req, res));

/**
 * POST /api/v1/hierarchical-ai/refresh
 * Força refresh do cache da hierarquia
 */
router.post('/refresh', (req, res) => hierarchicalAIController.refreshHierarchy(req, res));

// 📋 ROTAS DE CLASSIFICAÇÕES HIERÁRQUICAS

/**
 * GET /api/v1/hierarchical-ai/classifications
 * Lista classificações hierárquicas com paginação e filtros
 */
router.get('/classifications', (req, res) => hierarchicalAIController.getHierarchicalClassifications(req, res));

export default router;