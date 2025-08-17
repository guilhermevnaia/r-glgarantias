import Redis from 'ioredis';

// Configuração de cache para produção com fallback local
class CacheManager {
  private redis: Redis | null = null;
  private localCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private isRedisEnabled = false;

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      // Usar Redis gratuito do Upstash em produção
      const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
      
      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
          lazyConnect: true
        });

        await this.redis.ping();
        this.isRedisEnabled = true;
        console.log('✅ Redis conectado com sucesso');
      } else {
        console.log('📝 Redis não configurado - usando cache local');
      }
    } catch (error) {
      console.log('⚠️ Redis falhou - usando cache local:', error.message);
      this.isRedisEnabled = false;
    }
  }

  async get(key: string): Promise<any> {
    try {
      // Tentar Redis primeiro
      if (this.isRedisEnabled && this.redis) {
        const value = await this.redis.get(`gl:${key}`);
        if (value) {
          return JSON.parse(value);
        }
      }

      // Fallback para cache local
      const localItem = this.localCache.get(key);
      if (localItem) {
        const now = Date.now();
        if (now - localItem.timestamp < localItem.ttl * 1000) {
          return localItem.data;
        } else {
          this.localCache.delete(key);
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Erro no cache get:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(value);

      // Salvar no Redis se disponível
      if (this.isRedisEnabled && this.redis) {
        await this.redis.setex(`gl:${key}`, ttlSeconds, jsonValue);
      }

      // Sempre salvar no cache local como backup
      this.localCache.set(key, {
        data: value,
        timestamp: Date.now(),
        ttl: ttlSeconds
      });

      return true;
    } catch (error) {
      console.error('❌ Erro no cache set:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      // Remover do Redis se disponível
      if (this.isRedisEnabled && this.redis) {
        await this.redis.del(`gl:${key}`);
      }

      // Remover do cache local
      this.localCache.delete(key);
      return true;
    } catch (error) {
      console.error('❌ Erro no cache del:', error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      // Limpar Redis se disponível
      if (this.isRedisEnabled && this.redis) {
        const keys = await this.redis.keys('gl:*');
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      // Limpar cache local
      this.localCache.clear();
      return true;
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
      return false;
    }
  }

  // Limpeza automática do cache local
  private cleanupLocalCache() {
    const now = Date.now();
    for (const [key, item] of this.localCache.entries()) {
      if (now - item.timestamp > item.ttl * 1000) {
        this.localCache.delete(key);
      }
    }
  }

  // Status do cache para monitoramento
  getStatus() {
    return {
      redisEnabled: this.isRedisEnabled,
      localCacheSize: this.localCache.size,
      timestamp: new Date().toISOString()
    };
  }

  // Iniciar limpeza automática
  startCleanupInterval() {
    setInterval(() => {
      this.cleanupLocalCache();
    }, 60000); // Limpar a cada minuto
  }
}

// Instância singleton
export const cache = new CacheManager();

// Iniciar limpeza automática
cache.startCleanupInterval();

// Utilitários para chaves de cache
export const cacheKeys = {
  stats: (month?: number, year?: number) => 
    `stats:${month || 'all'}:${year || 'all'}`,
  serviceOrders: (params: any) => 
    `service-orders:${JSON.stringify(params)}`,
  mechanics: () => 'mechanics:list',
  aiClassifications: (limit: number) => `ai:classifications:${limit}`,
  engineStats: () => 'engine:stats',
  dashboardSummary: () => 'dashboard:summary'
};

export default cache;