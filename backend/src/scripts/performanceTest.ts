import { performance } from 'perf_hooks';
import fetch from 'node-fetch';

interface TestResult {
  endpoint: string;
  method: string;
  avgTime: number;
  minTime: number;
  maxTime: number;
  successRate: number;
  totalRequests: number;
  failedRequests: number;
}

class PerformanceTest {
  private baseURL = 'http://localhost:3009';
  private authToken = '';
  
  async login() {
    console.log('🔐 Fazendo login para obter token...');
    
    const response = await fetch(`${this.baseURL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@glgarantias.com',
        password: 'Admin123!@#'
      })
    });
    
    if (response.ok) {
      const data = await response.json() as any;
      this.authToken = data.data.token;
      console.log('✅ Login realizado com sucesso');
    } else {
      throw new Error('Falha no login para testes');
    }
  }

  async testEndpoint(
    endpoint: string, 
    method: 'GET' | 'POST' = 'GET', 
    requests: number = 10,
    data?: any
  ): Promise<TestResult> {
    console.log(`📊 Testando ${method} ${endpoint} com ${requests} requisições...`);
    
    const times: number[] = [];
    let failed = 0;
    
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    for (let i = 0; i < requests; i++) {
      const start = performance.now();
      
      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method,
          headers,
          ...(data && { body: JSON.stringify(data) })
        });
        
        if (!response.ok) {
          failed++;
        }
        
        const end = performance.now();
        times.push(end - start);
      } catch (error) {
        failed++;
        const end = performance.now();
        times.push(end - start);
      }
      
      // Pequena pausa entre requisições
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const successRate = ((requests - failed) / requests) * 100;
    
    return {
      endpoint,
      method,
      avgTime: Math.round(avgTime),
      minTime: Math.round(minTime),
      maxTime: Math.round(maxTime),
      successRate,
      totalRequests: requests,
      failedRequests: failed
    };
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Iniciando testes de performance...\n');
    
    const results: TestResult[] = [];
    
    try {
      // Login primeiro
      await this.login();
      
      // Testes de endpoints críticos
      const tests = [
        { endpoint: '/api/v1/stats', method: 'GET' as const, requests: 20 },
        { endpoint: '/api/v1/stats?month=7&year=2025', method: 'GET' as const, requests: 15 },
        { endpoint: '/api/v1/service-orders?page=1&limit=50', method: 'GET' as const, requests: 10 },
        { endpoint: '/api/v1/ai/stats', method: 'GET' as const, requests: 10 },
        { endpoint: '/api/v1/ai/classifications?limit=100', method: 'GET' as const, requests: 10 },
        { endpoint: '/api/v1/mechanics', method: 'GET' as const, requests: 10 },
        { endpoint: '/api/v1/auth/profile', method: 'GET' as const, requests: 15 }
      ];
      
      for (const test of tests) {
        const result = await this.testEndpoint(test.endpoint, test.method, test.requests);
        results.push(result);
        
        // Breve pausa entre diferentes endpoints
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error('❌ Erro durante os testes:', error);
    }
    
    return results;
  }

  printResults(results: TestResult[]) {
    console.log('\n📈 RESULTADOS DOS TESTES DE PERFORMANCE');
    console.log('=' .repeat(80));
    
    results.forEach(result => {
      const status = result.successRate >= 95 ? '✅' : result.successRate >= 80 ? '⚠️' : '❌';
      
      console.log(`\n${status} ${result.method} ${result.endpoint}`);
      console.log(`   Tempo médio: ${result.avgTime}ms`);
      console.log(`   Tempo min/max: ${result.minTime}ms / ${result.maxTime}ms`);
      console.log(`   Taxa de sucesso: ${result.successRate.toFixed(1)}% (${result.totalRequests - result.failedRequests}/${result.totalRequests})`);
      
      if (result.avgTime > 2000) {
        console.log(`   ⚠️ LENTO: Tempo médio acima de 2s`);
      } else if (result.avgTime > 1000) {
        console.log(`   ⚠️ MODERADO: Tempo médio acima de 1s`);
      }
    });
    
    // Estatísticas gerais
    const avgResponseTime = results.reduce((sum, r) => sum + r.avgTime, 0) / results.length;
    const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failedRequests, 0);
    const overallSuccessRate = ((totalRequests - totalFailed) / totalRequests) * 100;
    
    console.log('\n🎯 RESUMO GERAL');
    console.log('-'.repeat(40));
    console.log(`Tempo de resposta médio: ${Math.round(avgResponseTime)}ms`);
    console.log(`Taxa de sucesso geral: ${overallSuccessRate.toFixed(1)}%`);
    console.log(`Total de requisições: ${totalRequests}`);
    console.log(`Requisições falharam: ${totalFailed}`);
    
    // Recomendações
    console.log('\n💡 RECOMENDAÇÕES');
    console.log('-'.repeat(40));
    
    if (avgResponseTime > 1500) {
      console.log('❌ Sistema LENTO - Considerar otimizações');
    } else if (avgResponseTime > 800) {
      console.log('⚠️ Sistema MODERADO - Monitorar performance');
    } else {
      console.log('✅ Sistema RÁPIDO - Performance adequada');
    }
    
    if (overallSuccessRate < 95) {
      console.log('❌ Taxa de erro ALTA - Investigar falhas');
    } else {
      console.log('✅ Taxa de erro BAIXA - Sistema estável');
    }
    
    const slowEndpoints = results.filter(r => r.avgTime > 1000);
    if (slowEndpoints.length > 0) {
      console.log('\n🐌 Endpoints mais lentos:');
      slowEndpoints.forEach(r => {
        console.log(`   - ${r.endpoint}: ${r.avgTime}ms`);
      });
    }
  }
}

// Executar testes se chamado diretamente
async function runTests() {
  const tester = new PerformanceTest();
  const results = await tester.runAllTests();
  tester.printResults(results);
}

if (require.main === module) {
  runTests().catch(console.error);
}

export { PerformanceTest };