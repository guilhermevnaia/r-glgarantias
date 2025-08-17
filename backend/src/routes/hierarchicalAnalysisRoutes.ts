import { Router } from 'express';
import { hierarchicalAnalysisController } from '../controllers/HierarchicalAnalysisController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * @route GET /api/v1/hierarchical-analysis
 * @desc Obter análise hierárquica completa (Grupos > Subgrupos > Métricas)
 */
router.get('/', authenticateToken, hierarchicalAnalysisController.getHierarchicalAnalysis);

/**
 * @route GET /api/v1/hierarchical-analysis/subgroup/:subgroupId
 * @desc Obter drill-down detalhado de um subgrupo específico
 */
router.get('/subgroup/:subgroupId', authenticateToken, hierarchicalAnalysisController.getSubgroupDrillDown);

/**
 * @route GET /api/v1/hierarchical-analysis/compare/:mainGroup
 * @desc Comparar todos os subgrupos dentro de um grupo principal
 */
router.get('/compare/:mainGroup', authenticateToken, hierarchicalAnalysisController.compareSubgroups);

export default router;