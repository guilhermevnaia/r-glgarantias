import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

interface BackupConfig {
  supabaseUrl: string;
  supabaseKey: string;
  backupDir: string;
  retentionDays: number;
}

class BackupSystem {
  private config: BackupConfig;
  private supabase;

  constructor() {
    this.config = {
      supabaseUrl: process.env.SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!,
      backupDir: path.join(__dirname, '..', '..', 'backups'),
      retentionDays: 7 // Manter backups por 7 dias
    };

    this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseKey);
  }

  private async ensureBackupDir() {
    try {
      await fs.access(this.config.backupDir);
    } catch {
      await fs.mkdir(this.config.backupDir, { recursive: true });
      console.log(`✅ Diretório de backup criado: ${this.config.backupDir}`);
    }
  }

  private getBackupFileName(table: string): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    return `${table}_backup_${timestamp}.json`;
  }

  private async backupTable(tableName: string): Promise<boolean> {
    try {
      console.log(`📋 Fazendo backup da tabela: ${tableName}...`);

      // Para tabelas grandes, fazer backup em lotes
      const batchSize = 1000;
      let allData: any[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await this.supabase
          .from(tableName)
          .select('*')
          .range(from, from + batchSize - 1);

        if (error) {
          console.error(`❌ Erro ao fazer backup de ${tableName}:`, error);
          return false;
        }

        if (data && data.length > 0) {
          allData = allData.concat(data);
          from += batchSize;
          
          if (data.length < batchSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      // Salvar dados em arquivo JSON
      const fileName = this.getBackupFileName(tableName);
      const filePath = path.join(this.config.backupDir, fileName);
      
      const backupData = {
        table: tableName,
        timestamp: new Date().toISOString(),
        totalRecords: allData.length,
        data: allData
      };

      await fs.writeFile(filePath, JSON.stringify(backupData, null, 2));
      
      console.log(`✅ Backup de ${tableName} concluído: ${allData.length} registros`);
      console.log(`📁 Arquivo: ${fileName}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Erro no backup de ${tableName}:`, error);
      return false;
    }
  }

  private async cleanOldBackups() {
    try {
      console.log('🧹 Limpando backups antigos...');
      
      const files = await fs.readdir(this.config.backupDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      let deletedCount = 0;

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.config.backupDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            deletedCount++;
            console.log(`🗑️ Removido: ${file}`);
          }
        }
      }

      console.log(`✅ Limpeza concluída: ${deletedCount} arquivos removidos`);
    } catch (error) {
      console.error('❌ Erro na limpeza de backups:', error);
    }
  }

  private async createBackupSummary(results: { [table: string]: boolean }) {
    try {
      const summary = {
        timestamp: new Date().toISOString(),
        backupResults: results,
        totalTables: Object.keys(results).length,
        successfulTables: Object.values(results).filter(success => success).length,
        failedTables: Object.values(results).filter(success => !success).length
      };

      const summaryPath = path.join(this.config.backupDir, 'backup_summary.json');
      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
      
      console.log(`📊 Resumo do backup salvo em: backup_summary.json`);
      return summary;
    } catch (error) {
      console.error('❌ Erro ao criar resumo:', error);
      return null;
    }
  }

  async performFullBackup(): Promise<boolean> {
    console.log('🚀 INICIANDO BACKUP COMPLETO DO SISTEMA');
    console.log('=' .repeat(50));
    
    const startTime = Date.now();
    
    try {
      await this.ensureBackupDir();

      // Tabelas críticas para backup
      const criticalTables = [
        'service_orders',
        'users',
        'defect_categories',
        'defect_classifications'
      ];

      const results: { [table: string]: boolean } = {};

      // Fazer backup de cada tabela
      for (const table of criticalTables) {
        results[table] = await this.backupTable(table);
      }

      // Criar resumo
      const summary = await this.createBackupSummary(results);

      // Limpar backups antigos
      await this.cleanOldBackups();

      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);

      console.log('\n🎯 BACKUP CONCLUÍDO');
      console.log('-' .repeat(30));
      console.log(`⏱️ Tempo total: ${duration}s`);
      console.log(`✅ Sucessos: ${summary?.successfulTables || 0}`);
      console.log(`❌ Falhas: ${summary?.failedTables || 0}`);
      console.log(`📁 Local: ${this.config.backupDir}`);

      return (summary?.failedTables || 0) === 0;
      
    } catch (error) {
      console.error('❌ Erro geral no backup:', error);
      return false;
    }
  }

  async restoreFromBackup(backupFile: string, tableName?: string): Promise<boolean> {
    try {
      console.log(`🔄 Iniciando restore do backup: ${backupFile}`);
      
      const filePath = path.join(this.config.backupDir, backupFile);
      const backupContent = await fs.readFile(filePath, 'utf8');
      const backupData = JSON.parse(backupContent);

      if (tableName && backupData.table !== tableName) {
        console.error(`❌ Backup é da tabela '${backupData.table}', mas foi solicitado '${tableName}'`);
        return false;
      }

      const targetTable = tableName || backupData.table;
      
      console.log(`📋 Restaurando ${backupData.totalRecords} registros para '${targetTable}'...`);
      console.log(`⚠️ ATENÇÃO: Esta operação pode sobrescrever dados existentes!`);
      
      // Em produção, você implementaria a lógica de restore aqui
      // Por segurança, não vamos implementar restore automático
      console.log('ℹ️ Restore não implementado por segurança. Dados disponíveis em:', filePath);
      
      return true;
    } catch (error) {
      console.error('❌ Erro no restore:', error);
      return false;
    }
  }

  async listBackups(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.backupDir);
      const backupFiles = files.filter(f => f.endsWith('.json') && f.includes('backup'));

      console.log('📋 BACKUPS DISPONÍVEIS');
      console.log('-' .repeat(40));

      if (backupFiles.length === 0) {
        console.log('Nenhum backup encontrado.');
        return;
      }

      for (const file of backupFiles) {
        const filePath = path.join(this.config.backupDir, file);
        const stats = await fs.stat(filePath);
        const size = Math.round(stats.size / 1024); // KB
        
        console.log(`📄 ${file}`);
        console.log(`   Tamanho: ${size} KB`);
        console.log(`   Criado: ${stats.mtime.toLocaleString('pt-BR')}`);
        console.log('');
      }
    } catch (error) {
      console.error('❌ Erro ao listar backups:', error);
    }
  }

  // Método para configurar backup automático (cron job)
  scheduleBackup() {
    console.log('⏰ Configurando backup automático diário...');
    
    // Em produção, você usaria um cron job ou scheduler
    // Exemplo: backup diário às 2:00 AM
    const cronExpression = '0 2 * * *'; // 2:00 AM todos os dias
    
    console.log(`📅 Backup agendado: ${cronExpression}`);
    console.log('ℹ️ Configure um cron job no servidor para executar este script automaticamente');
    console.log('Exemplo de cron job:');
    console.log(`${cronExpression} cd /path/to/project && npm run backup`);
    
    return cronExpression;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const backupSystem = new BackupSystem();
  
  switch (command) {
    case 'backup':
      await backupSystem.performFullBackup();
      break;
      
    case 'list':
      await backupSystem.listBackups();
      break;
      
    case 'schedule':
      backupSystem.scheduleBackup();
      break;
      
    case 'restore':
      const backupFile = args[1];
      const tableName = args[2];
      if (!backupFile) {
        console.error('❌ Especifique o arquivo de backup para restore');
        break;
      }
      await backupSystem.restoreFromBackup(backupFile, tableName);
      break;
      
    default:
      console.log('🔧 Sistema de Backup GL Garantias');
      console.log('Comandos disponíveis:');
      console.log('  backup   - Executar backup completo');
      console.log('  list     - Listar backups disponíveis');
      console.log('  schedule - Configurar backup automático');
      console.log('  restore <arquivo> [tabela] - Restore de backup');
      console.log('');
      console.log('Exemplo: npm run backup');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { BackupSystem };