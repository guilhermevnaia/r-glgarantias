import { performance } from 'perf_hooks';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Teste simples de performance sem dependências externas
class SimplePerformanceTest {
  async testDatabaseQuery() {
    console.log('🔍 Testando consulta ao banco de dados...');
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    
    const times: number[] = [];
    const iterations = 10;
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      try {
        // Consulta simples para testar conexão
        const { count } = await supabase
          .from('service_orders')
          .select('*', { count: 'exact', head: true });
          
        const end = performance.now();
        times.push(end - start);
        
        if (i === 0) {
          console.log(`📊 Total de registros no banco: ${count}`);
        }
      } catch (error) {
        console.error(`❌ Erro na iteração ${i + 1}:`, error);
      }
    }
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    console.log(`⏱️ Consulta ao banco:`);
    console.log(`   Tempo médio: ${Math.round(avg)}ms`);
    console.log(`   Tempo min/max: ${Math.round(min)}ms / ${Math.round(max)}ms`);
    
    return { avg, min, max };
  }
  
  async testComplexQuery() {
    console.log('\n🔍 Testando consulta complexa (estatísticas)...');
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    
    const times: number[] = [];
    const iterations = 5; // Menos iterações para consultas complexas
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      try {
        // Consulta complexa similar ao que fazemos no dashboard
        const { data } = await supabase
          .from('service_orders')
          .select(`
            id,
            order_date,
            engine_manufacturer,
            parts_total,
            labor_total,
            order_status,
            responsible_mechanic,
            raw_defect_description
          `)
          .gte('order_date', '2025-01-01')
          .lte('order_date', '2025-12-31')
          .limit(1000);
          
        const end = performance.now();
        times.push(end - start);
        
        if (i === 0) {
          console.log(`📊 Registros retornados: ${data?.length || 0}`);
        }
      } catch (error) {
        console.error(`❌ Erro na iteração ${i + 1}:`, error);
      }
    }
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    console.log(`⏱️ Consulta complexa:`);
    console.log(`   Tempo médio: ${Math.round(avg)}ms`);
    console.log(`   Tempo min/max: ${Math.round(min)}ms / ${Math.round(max)}ms`);
    
    return { avg, min, max };
  }
  
  async testFileSystem() {
    console.log('\n📁 Testando performance do sistema de arquivos...');
    
    const fs = require('fs').promises;
    const path = require('path');
    
    const times: number[] = [];
    const iterations = 10;
    const testFile = path.join(__dirname, 'temp_performance_test.txt');
    const testData = 'A'.repeat(1024 * 10); // 10KB de dados
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      try {
        // Escrever arquivo
        await fs.writeFile(testFile, testData);
        
        // Ler arquivo
        await fs.readFile(testFile, 'utf8');
        
        // Deletar arquivo
        await fs.unlink(testFile);
        
        const end = performance.now();
        times.push(end - start);
      } catch (error) {
        console.error(`❌ Erro na iteração ${i + 1}:`, error);
      }
    }
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    console.log(`⏱️ Operações de arquivo (10KB):`);
    console.log(`   Tempo médio: ${Math.round(avg)}ms`);
    console.log(`   Tempo min/max: ${Math.round(min)}ms / ${Math.round(max)}ms`);
    
    return { avg, min, max };
  }
  
  async testMemoryUsage() {
    console.log('\n🧠 Verificando uso de memória...');
    
    const formatBytes = (bytes: number) => {
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      if (bytes === 0) return '0 Byte';
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };
    
    const usage = process.memoryUsage();
    
    console.log(`💾 Uso de memória:`);
    console.log(`   RSS: ${formatBytes(usage.rss)} (Memória total)`);
    console.log(`   Heap Total: ${formatBytes(usage.heapTotal)}`);
    console.log(`   Heap Usado: ${formatBytes(usage.heapUsed)}`);
    console.log(`   Externo: ${formatBytes(usage.external)}`);
    
    // Testar alocação de memória
    const bigArray = new Array(100000).fill('test data');
    const usageAfter = process.memoryUsage();
    
    console.log(`\n📈 Após alocação de array (100k elementos):`);
    console.log(`   Heap Usado: ${formatBytes(usageAfter.heapUsed)} (+${formatBytes(usageAfter.heapUsed - usage.heapUsed)})`);
    
    return usage;
  }
  
  printSystemInfo() {
    console.log('🖥️ INFORMAÇÕES DO SISTEMA');
    console.log('=' .repeat(50));
    console.log(`Node.js: ${process.version}`);
    console.log(`Plataforma: ${process.platform} ${process.arch}`);
    console.log(`CPU: ${require('os').cpus()[0].model}`);
    console.log(`CPUs: ${require('os').cpus().length} cores`);
    console.log(`Memória total: ${Math.round(require('os').totalmem() / 1024 / 1024 / 1024 * 100) / 100} GB`);
    console.log(`Memória livre: ${Math.round(require('os').freemem() / 1024 / 1024 / 1024 * 100) / 100} GB`);
    console.log(`Uptime: ${Math.round(require('os').uptime() / 60)} minutos`);
  }
  
  async runAllTests() {
    console.log('🚀 TESTE DE PERFORMANCE DO SISTEMA');
    console.log('=' .repeat(50));
    
    this.printSystemInfo();
    
    const results = {
      database: await this.testDatabaseQuery(),
      complexQuery: await this.testComplexQuery(),
      fileSystem: await this.testFileSystem(),
      memory: await this.testMemoryUsage()
    };
    
    console.log('\n🎯 RESUMO FINAL');
    console.log('=' .repeat(50));
    
    // Análise dos resultados
    if (results.database.avg < 500) {
      console.log('✅ Banco de dados: EXCELENTE (< 500ms)');
    } else if (results.database.avg < 1000) {
      console.log('⚠️ Banco de dados: BOM (< 1s)');
    } else {
      console.log('❌ Banco de dados: LENTO (> 1s)');
    }
    
    if (results.complexQuery.avg < 1000) {
      console.log('✅ Consultas complexas: EXCELENTE (< 1s)');
    } else if (results.complexQuery.avg < 2000) {
      console.log('⚠️ Consultas complexas: BOM (< 2s)');
    } else {
      console.log('❌ Consultas complexas: LENTO (> 2s)');
    }
    
    if (results.fileSystem.avg < 100) {
      console.log('✅ Sistema de arquivos: EXCELENTE (< 100ms)');
    } else if (results.fileSystem.avg < 500) {
      console.log('⚠️ Sistema de arquivos: BOM (< 500ms)');
    } else {
      console.log('❌ Sistema de arquivos: LENTO (> 500ms)');
    }
    
    const heapUsedMB = results.memory.heapUsed / 1024 / 1024;
    if (heapUsedMB < 100) {
      console.log('✅ Uso de memória: EXCELENTE (< 100MB)');
    } else if (heapUsedMB < 200) {
      console.log('⚠️ Uso de memória: BOM (< 200MB)');
    } else {
      console.log('❌ Uso de memória: ALTO (> 200MB)');
    }
    
    console.log('\n🏁 Testes concluídos!');
    return results;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const tester = new SimplePerformanceTest();
  tester.runAllTests().catch(console.error);
}

export { SimplePerformanceTest };