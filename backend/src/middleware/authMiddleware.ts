import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    permissions: string[];
  };
}

/**
 * Middleware de autenticação JWT
 */
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso não fornecido',
        code: 'NO_TOKEN'
      });
    }

    // Verificar token JWT
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Buscar usuário no banco de dados
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, is_active, permissions')
      .eq('id', decoded.userId)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido ou usuário não encontrado',
        code: 'INVALID_TOKEN'
      });
    }

    // Adicionar dados do usuário à requisição
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions || []
    };

    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(401).json({
      success: false,
      error: 'Token inválido',
      code: 'TOKEN_ERROR'
    });
  }
};

/**
 * Middleware de autorização por role
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Permissões insuficientes',
        code: 'INSUFFICIENT_PERMISSIONS',
        required_roles: allowedRoles,
        user_role: req.user.role
      });
    }

    next();
  };
};

/**
 * Middleware de autorização por permissão específica
 */
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!req.user.permissions.includes(permission) && !req.user.permissions.includes('*')) {
      return res.status(403).json({
        success: false,
        error: 'Permissão específica negada',
        code: 'PERMISSION_DENIED',
        required_permission: permission,
        user_permissions: req.user.permissions
      });
    }

    next();
  };
};

/**
 * Middleware para rotas públicas (opcional - apenas loga se há usuário)
 */
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, role, permissions')
        .eq('id', decoded.userId)
        .eq('is_active', true)
        .single();

      if (!error && user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          permissions: user.permissions || []
        };
      }
    }

    next();
  } catch (error) {
    // Em rotas opcionais, não bloquear por erro de token
    next();
  }
};