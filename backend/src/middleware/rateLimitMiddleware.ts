import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limiting para login (anti-brute force)
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 tentativas por IP
  message: {
    success: false,
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    code: 'RATE_LIMIT_LOGIN',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Personalizar chave para incluir email quando disponível
  keyGenerator: (req: Request) => {
    const email = req.body?.email;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return email ? `${ip}:${email}` : ip;
  }
});

/**
 * Rate limiting para APIs gerais
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requests por IP
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente em alguns minutos.',
    code: 'RATE_LIMIT_API',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiting para upload de arquivos
 */
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // Máximo 10 uploads por hora por IP
  message: {
    success: false,
    error: 'Limite de uploads atingido. Máximo 10 arquivos por hora.',
    code: 'RATE_LIMIT_UPLOAD',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiting para IA (mais restritivo)
 */
export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // Máximo 20 classificações por minuto
  message: {
    success: false,
    error: 'Limite de uso da IA atingido. Máximo 20 classificações por minuto.',
    code: 'RATE_LIMIT_AI',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiting para operações críticas (admin)
 */
export const criticalRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 3, // Máximo 3 operações críticas por 5 minutos
  message: {
    success: false,
    error: 'Limite de operações críticas atingido. Aguarde 5 minutos.',
    code: 'RATE_LIMIT_CRITICAL',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiting personalizado para diferentes tipos de usuário
 */
export const createUserBasedRateLimit = (limits: {
  admin: number;
  manager: number;
  user: number;
}) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: (req: any) => {
      const userRole = req.user?.role || 'user';
      return limits[userRole as keyof typeof limits] || limits.user;
    },
    message: (req: any) => {
      const userRole = req.user?.role || 'user';
      const limit = limits[userRole as keyof typeof limits] || limits.user;
      return {
        success: false,
        error: `Limite de requisições atingido para ${userRole}. Máximo ${limit} por 15 minutos.`,
        code: 'RATE_LIMIT_USER_BASED',
        retryAfter: 15 * 60,
        userRole,
        limit
      };
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => {
      const userId = req.user?.id;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      return userId ? `user:${userId}` : `ip:${ip}`;
    }
  });
};

/**
 * Rate limiting dinâmico baseado no endpoint
 */
export const dynamicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: (req: Request) => {
    const path = req.path;
    
    // Endpoints mais restritivos
    if (path.includes('/ai/classify-all')) return 1; // Apenas 1 classificação em massa por 15min
    if (path.includes('/upload')) return 5; // 5 uploads por 15min
    if (path.includes('/auth/login')) return 10; // 10 tentativas de login por 15min
    if (path.includes('/ai/')) return 30; // 30 requests de IA por 15min
    
    // Endpoints padrão
    return 100;
  },
  message: (req: Request) => {
    const path = req.path;
    let message = 'Limite de requisições atingido.';
    
    if (path.includes('/ai/classify-all')) {
      message = 'Apenas uma classificação em massa permitida por 15 minutos.';
    } else if (path.includes('/upload')) {
      message = 'Limite de uploads atingido. Máximo 5 por 15 minutos.';
    } else if (path.includes('/auth/login')) {
      message = 'Muitas tentativas de login. Aguarde 15 minutos.';
    } else if (path.includes('/ai/')) {
      message = 'Limite de uso da IA atingido. Máximo 30 por 15 minutos.';
    }
    
    return {
      success: false,
      error: message,
      code: 'RATE_LIMIT_DYNAMIC',
      endpoint: path,
      retryAfter: 15 * 60
    };
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Skip rate limit para IPs confiáveis (desenvolvimento/testing)
 */
export const skipTrustedIPs = (trustedIPs: string[] = ['127.0.0.1', '::1']) => {
  return (req: Request, res: Response, next: any) => {
    const clientIP = req.ip || req.connection.remoteAddress || '';
    
    if (trustedIPs.includes(clientIP)) {
      return next(); // Skip rate limiting
    }
    
    return next(); // Continue to rate limiting
  };
};