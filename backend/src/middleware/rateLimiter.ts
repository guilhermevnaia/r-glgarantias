import { Request, Response, NextFunction } from 'express';
import { cache } from '../config/cache';

interface RateLimitOptions {
  windowMs: number; // Janela de tempo em ms
  maxRequests: number; // Máximo de requests por janela
  message?: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

class RateLimiter {
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.options = {
      message: 'Too many requests, please try again later.',
      skipSuccessfulRequests: false,
      keyGenerator: (req) => req.ip || 'unknown',
      ...options
    };
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = this.options.keyGenerator!(req);
        const now = Date.now();
        const windowStart = now - this.options.windowMs;
        
        // Chave do cache para rate limiting
        const cacheKey = `rate-limit:${key}`;
        
        // Buscar histórico de requests
        let requests: number[] = await cache.get(cacheKey) || [];
        
        // Filtrar apenas requests dentro da janela de tempo
        requests = requests.filter(timestamp => timestamp > windowStart);
        
        // Verificar se excedeu o limite
        if (requests.length >= this.options.maxRequests) {
          const resetTime = Math.ceil((requests[0] + this.options.windowMs) / 1000);
          
          return res.status(429).json({
            success: false,
            error: this.options.message,
            retryAfter: resetTime,
            limit: this.options.maxRequests,
            remaining: 0,
            resetTime
          });
        }
        
        // Adicionar request atual
        requests.push(now);
        
        // Salvar no cache
        await cache.set(cacheKey, requests, Math.ceil(this.options.windowMs / 1000));
        
        // Adicionar headers informativos
        res.set({
          'X-RateLimit-Limit': this.options.maxRequests.toString(),
          'X-RateLimit-Remaining': (this.options.maxRequests - requests.length).toString(),
          'X-RateLimit-Reset': Math.ceil((now + this.options.windowMs) / 1000).toString()
        });
        
        next();
      } catch (error) {
        console.error('❌ Erro no rate limiter:', error);
        // Em caso de erro, permitir a requisição para não bloquear o sistema
        next();
      }
    };
  }
}

// Rate limiters pré-configurados para produção
export const rateLimiters = {
  // Rate limiter geral - 100 requests por minuto por IP
  general: new RateLimiter({
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 100,
    message: 'Muitas requisições. Tente novamente em 1 minuto.'
  }),
  
  // Rate limiter para APIs críticas - 20 requests por minuto
  strict: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 20,
    message: 'Limite de API atingido. Tente novamente em 1 minuto.'
  }),
  
  // Rate limiter para upload - 5 uploads por hora
  upload: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 5,
    message: 'Limite de uploads atingido. Tente novamente em 1 hora.'
  }),
  
  // Rate limiter para login - 10 tentativas por 15 minutos
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 10,
    keyGenerator: (req) => `${req.ip}-${req.body?.email || 'unknown'}`,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  }),
  
  // Rate limiter para IA - 30 requests por minuto (IA é custosa)
  ai: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 30,
    message: 'Limite de classificações IA atingido. Tente novamente em 1 minuto.'
  })
};

export { RateLimiter };
export default rateLimiters;