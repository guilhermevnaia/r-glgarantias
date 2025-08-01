import helmet from 'helmet';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';

/**
 * Configuração do CORS
 */
export const corsOptions = {
  origin: function (origin: any, callback: any) {
    // Lista de origens permitidas
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      process.env.FRONTEND_URL,
      process.env.PRODUCTION_URL
    ].filter(Boolean); // Remove valores undefined/null

    // Permitir requisições sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Verificar se a origin está na lista permitida
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Rejeitar origins não permitidas
    callback(new Error('Não permitido pelo CORS'), false);
  },
  credentials: true, // Permitir cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Rate-Limit-Limit',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset'
  ]
};

/**
 * Configuração do Helmet para headers de segurança
 */
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.groq.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"]
    }
  },
  
  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true
  },
  
  // Prevenir MIME type sniffing
  noSniff: true,
  
  // Prevenir clickjacking
  frameguard: {
    action: 'deny'
  },
  
  // Prevenir abertura em outros sites
  xssFilter: true,
  
  // Ocultar header X-Powered-By
  hidePoweredBy: true,
  
  // Política de referrer
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  
  // Prevenção de DNS prefetching
  dnsPrefetchControl: {
    allow: false
  },
  
  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false, // Pode causar problemas com alguns recursos
  
  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: {
    policy: 'same-origin'
  },
  
  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: {
    policy: 'cross-origin'
  }
});

/**
 * Middleware para adicionar headers customizados de segurança
 */
export const customSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevenir cache de dados sensíveis
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  // Headers personalizados
  res.setHeader('X-API-Version', '2.0.0');
  res.setHeader('X-Response-Time', Date.now().toString());
  
  // Prevenir information disclosure
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  // Política de permissões
  res.setHeader('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
  );
  
  next();
};

/**
 * Middleware para detectar e bloquear bots maliciosos
 */
export const botProtection = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.get('User-Agent') || '';
  
  // Lista de user agents suspeitos
  const suspiciousAgents = [
    'sqlmap',
    'nikto',
    'nmap',
    'masscan',
    'nessus',
    'burp',
    'dirb',
    'gobuster',
    'wget',
    'curl', // Pode ser removido se precisar permitir curl legítimo
    'python-requests',
    'bot',
    'crawler',
    'spider'
  ];
  
  const isSuspicious = suspiciousAgents.some(agent => 
    userAgent.toLowerCase().includes(agent.toLowerCase())
  );
  
  if (isSuspicious) {
    console.warn(`🚨 Bot suspeito detectado: ${userAgent} - IP: ${req.ip}`);
    
    return res.status(403).json({
      success: false,
      error: 'Acesso negado',
      code: 'BOT_DETECTED'
    });
  }
  
  next();
};

/**
 * Middleware para validar API Key (endpoints públicos específicos)
 */
export const validateAPIKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-API-Key');
  const validAPIKeys = [
    process.env.API_KEY_PUBLIC,
    process.env.API_KEY_ADMIN
  ].filter(Boolean);
  
  // Se não há chaves configuradas, skip validation
  if (validAPIKeys.length === 0) {
    return next();
  }
  
  if (!apiKey || !validAPIKeys.includes(apiKey)) {
    return res.status(401).json({
      success: false,
      error: 'API Key inválida',
      code: 'INVALID_API_KEY'
    });
  }
  
  next();
};

/**
 * Middleware para logging de segurança
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log da requisição
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    contentLength: req.get('Content-Length'),
    auth: req.get('Authorization') ? 'Bearer ***' : 'None'
  };
  
  console.log('🔒 Security Log:', JSON.stringify(logData, null, 2));
  
  // Interceptar resposta para log de saída
  const originalSend = res.send;
  res.send = function(data: any) {
    const responseTime = Date.now() - startTime;
    
    console.log('📤 Response Log:', {
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentType: res.get('Content-Type')
    });
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware para detectar tentativas de path traversal
 */
export const preventPathTraversal = (req: Request, res: Response, next: NextFunction) => {
  const pathTraversalPatterns = [
    /\.\./g,
    /\.\\\./g,
    /%2e%2e/gi,
    /%252e%252e/gi,
    /\.\.%2f/gi,
    /\.\.%5c/gi
  ];
  
  const checkPath = (path: string): boolean => {
    return pathTraversalPatterns.some(pattern => pattern.test(path));
  };
  
  const hasPathTraversal = 
    checkPath(req.url) ||
    checkPath(JSON.stringify(req.body)) ||
    checkPath(JSON.stringify(req.query));
  
  if (hasPathTraversal) {
    console.warn('🚨 Path traversal attempt detected:', {
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(400).json({
      success: false,
      error: 'Padrão de acesso não permitido',
      code: 'PATH_TRAVERSAL_DETECTED'
    });
  }
  
  next();
};

/**
 * Middleware para timeout de requisições
 */
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Timeout da requisição',
          code: 'REQUEST_TIMEOUT'
        });
      }
    }, timeoutMs);
    
    res.on('finish', () => {
      clearTimeout(timeout);
    });
    
    res.on('close', () => {
      clearTimeout(timeout);
    });
    
    next();
  };
};