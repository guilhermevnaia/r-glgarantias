import { Request, Response, NextFunction } from 'express';
import { rateLimiters } from './rateLimiter';
import { 
  corsOptions, 
  helmetConfig, 
  customSecurityHeaders, 
  securityLogger,
  botProtection,
  preventPathTraversal,
  requestTimeout
} from './securityMiddleware';
import cors from 'cors';
import compression from 'compression';

// Middleware de compressão para produção
export const compressionMiddleware = compression({
  // Comprimir apenas se o arquivo for maior que 1KB
  threshold: 1024,
  // Nível de compressão (1-9, 6 é o padrão)
  level: 6,
  // Tipos de arquivo para comprimir
  filter: (req: Request, res: Response) => {
    // Não comprimir se o cliente não suporta
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Comprimir apenas responses grandes
    const contentType = res.getHeader('content-type');
    if (contentType) {
      const type = contentType.toString();
      return (
        type.includes('application/json') ||
        type.includes('text/') ||
        type.includes('application/javascript') ||
        type.includes('application/xml')
      );
    }
    
    return compression.filter(req, res);
  }
});

// Middleware de headers de cache para assets estáticos
export const cacheHeaders = (req: Request, res: Response, next: NextFunction) => {
  const url = req.url;
  
  // Cache longo para assets estáticos
  if (url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    // Cache por 1 ano para assets com hash
    if (url.includes('.') && url.match(/\.[a-f0-9]{8,}\./)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      // Cache por 1 dia para assets sem hash
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
    res.setHeader('Vary', 'Accept-Encoding');
  } else if (url.match(/\/api\//)) {
    // Sem cache para APIs, exceto endpoints específicos
    if (url.includes('/stats') || url.includes('/service-orders')) {
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutos
    } else {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
  
  next();
};

// Middleware de monitoramento de performance
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = process.hrtime.bigint();
  
  // Interceptar o final da resposta
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Converter para ms
    
    // Log apenas para requests lentos (>1000ms) ou com erro
    if (duration > 1000 || res.statusCode >= 400) {
      console.log(`⚡ Performance Alert:`, {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration.toFixed(2)}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent')?.substring(0, 100)
      });
    }
    
    // Adicionar header de tempo de resposta
    res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
  });
  
  next();
};

// Middleware de sanitização de entrada
export const inputSanitizer = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeString = (str: string): string => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/[<>]/g, '') // Remove < e >
      .trim();
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    } else if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      } else {
        const sanitized: any = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            sanitized[key] = sanitizeObject(obj[key]);
          }
        }
        return sanitized;
      }
    }
    return obj;
  };

  // Sanitizar dados de entrada
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Middleware de validação de Content-Type
export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
  // Aplicar apenas para métodos que enviam dados
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    
    // Permitir apenas tipos seguros
    const allowedTypes = [
      'application/json',
      'multipart/form-data',
      'application/x-www-form-urlencoded'
    ];
    
    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      return res.status(415).json({
        success: false,
        error: 'Content-Type não suportado',
        supportedTypes: allowedTypes
      });
    }
  }
  
  next();
};

// Middleware para detectar requisições suspeitas
export const suspiciousActivityDetector = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    // SQL Injection patterns
    /(\b(union|select|insert|delete|update|drop|create|alter|exec|execute)\b)/gi,
    // XSS patterns
    /(<script|javascript:|vbscript:|onload=|onerror=)/gi,
    // Path traversal
    /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/gi,
    // Command injection
    /(\||\&|\;|\$\(|\`)/g
  ];

  const checkForPatterns = (data: any): boolean => {
    const dataStr = JSON.stringify(data);
    return suspiciousPatterns.some(pattern => pattern.test(dataStr));
  };

  const hasSuspiciousActivity = 
    checkForPatterns(req.body) ||
    checkForPatterns(req.query) ||
    checkForPatterns(req.params) ||
    checkForPatterns(req.url);

  if (hasSuspiciousActivity) {
    console.warn('🚨 Suspicious activity detected:', {
      ip: req.ip,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    // Registrar em log de segurança (implementar se necessário)
    
    return res.status(400).json({
      success: false,
      error: 'Padrão de requisição não permitido',
      code: 'SUSPICIOUS_ACTIVITY'
    });
  }

  next();
};

// Aplicar todos os middlewares de produção
export const applyProductionMiddlewares = (app: any) => {
  console.log('🔒 Aplicando middlewares de produção...');

  // 1. Compressão (primeiro para comprimir tudo)
  app.use(compressionMiddleware);

  // 2. Headers de segurança
  app.use(helmetConfig);
  app.use(customSecurityHeaders);

  // 3. CORS
  app.use(cors(corsOptions));

  // 4. Rate limiting global
  app.use(rateLimiters.general.middleware());

  // 5. Timeout de requisições
  app.use(requestTimeout(30000)); // 30 segundos

  // 6. Headers de cache
  app.use(cacheHeaders);

  // 7. Monitoramento de performance
  app.use(performanceMonitor);

  // 8. Segurança
  app.use(botProtection);
  app.use(preventPathTraversal);
  app.use(suspiciousActivityDetector);
  app.use(inputSanitizer);
  app.use(validateContentType);

  // 9. Logging de segurança
  if (process.env.NODE_ENV === 'production') {
    app.use(securityLogger);
  }

  console.log('✅ Middlewares de produção aplicados com sucesso');
};

// Rate limiters específicos para rotas
export const routeRateLimiters = {
  auth: rateLimiters.auth.middleware(),
  upload: rateLimiters.upload.middleware(),
  ai: rateLimiters.ai.middleware(),
  strict: rateLimiters.strict.middleware()
};

export default {
  applyProductionMiddlewares,
  routeRateLimiters,
  compressionMiddleware,
  cacheHeaders,
  performanceMonitor,
  inputSanitizer,
  validateContentType,
  suspiciousActivityDetector
};