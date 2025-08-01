import { Router, Request, Response } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();
const authController = new AuthController();

// 🔐 ROTAS PÚBLICAS (sem autenticação)

/**
 * POST /auth/login
 * Login do usuário
 */
router.post('/login', AuthController.loginValidation, (req: Request, res: Response) => 
  authController.login(req, res)
);

// 🔒 ROTAS PROTEGIDAS (requer autenticação)

/**
 * POST /auth/register
 * Registrar novo usuário (apenas admins)
 */
router.post('/register', 
  authenticateToken,
  requireRole(['admin']),
  AuthController.registerValidation,
  (req: Request, res: Response) => authController.register(req, res)
);

/**
 * GET /auth/profile
 * Obter perfil do usuário autenticado
 */
router.get('/profile', 
  authenticateToken,
  (req: Request, res: Response) => authController.getProfile(req, res)
);

/**
 * POST /auth/logout
 * Logout do usuário
 */
router.post('/logout', 
  authenticateToken,
  (req: Request, res: Response) => authController.logout(req, res)
);

/**
 * PUT /auth/change-password
 * Alterar senha do usuário autenticado
 */
router.put('/change-password',
  authenticateToken,
  AuthController.changePasswordValidation,
  (req: Request, res: Response) => authController.changePassword(req, res)
);

export default router;