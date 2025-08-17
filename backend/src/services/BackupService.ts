import fs from 'fs/promises';
import path from 'path';
import { monitoring } from './MonitoringService';
import supabase from '../config/supabase';

export interface BackupMetadata {
  id: string;
  timestamp: string;
  type: 'full' | 'incremental' | 'manual';
  size: number;
  recordCount: number;
  tables: string[];
  status: 'creating' | 'completed' | 'failed';
  filePath?: string;
  error?: string;
}

class BackupService {
  private backupDir: string;
  private backups: BackupMetadata[] = [];
  private isBackupRunning = false;

  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.initializeBackupDir();
    this.loadBackupHistory();
    this.scheduleAutoBackups();
  }

  private async initializeBackupDir() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
      await monitoring.log('info', 'Diretório de backup criado', { path: this.backupDir });
    }
  }

  private async loadBackupHistory() {
    try {
      const historyFile = path.join(this.backupDir, 'backup-history.json');
      try {
        const data = await fs.readFile(historyFile, 'utf-8');
        this.backups = JSON.parse(data);
      } catch {
        // Arquivo não existe ainda
        this.backups = [];
      }
    } catch (error) {
      await monitoring.log('error', 'Erro ao carregar histórico de backups', { error });
    }
  }

  private async saveBackupHistory() {
    try {
      const historyFile = path.join(this.backupDir, 'backup-history.json');
      await fs.writeFile(historyFile, JSON.stringify(this.backups, null, 2));
    } catch (error) {
      await monitoring.log('error', 'Erro ao salvar histórico de backups', { error });
    }
  }

  // Criar backup completo
  async createFullBackup(manual = false): Promise<BackupMetadata> {
    if (this.isBackupRunning) {
      throw new Error('Backup já está em execução');
    }

    this.isBackupRunning = true;
    const backupId = `backup-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const backup: BackupMetadata = {
      id: backupId,
      timestamp,
      type: manual ? 'manual' : 'full',
      size: 0,
      recordCount: 0,
      tables: ['service_orders', 'defect_classifications', 'defect_categories'],
      status: 'creating'
    };

    this.backups.push(backup);
    await this.saveBackupHistory();

    try {
      await monitoring.log('info', 'Iniciando backup completo', { backupId, manual });

      const backupData: any = {};
      let totalRecords = 0;

      // Backup de service_orders
      const { data: serviceOrders, error: ordersError } = await supabase
        .from('service_orders')
        .select('*');

      if (ordersError) {
        throw new Error(`Erro ao fazer backup de service_orders: ${ordersError.message}`);
      }

      backupData.service_orders = serviceOrders;
      totalRecords += serviceOrders?.length || 0;

      // Backup de defect_classifications
      const { data: classifications, error: classError } = await supabase
        .from('defect_classifications')
        .select('*');

      if (classError) {
        throw new Error(`Erro ao fazer backup de defect_classifications: ${classError.message}`);
      }

      backupData.defect_classifications = classifications;
      totalRecords += classifications?.length || 0;

      // Backup de defect_categories
      const { data: categories, error: catError } = await supabase
        .from('defect_categories')
        .select('*');

      if (catError) {
        throw new Error(`Erro ao fazer backup de defect_categories: ${catError.message}`);
      }

      backupData.defect_categories = categories;
      totalRecords += categories?.length || 0;

      // Adicionar metadados
      backupData._metadata = {
        backupId,
        timestamp,
        type: backup.type,
        totalRecords,
        version: '1.0.0'
      };

      // Salvar arquivo de backup
      const fileName = `${backupId}.json`;
      const filePath = path.join(this.backupDir, fileName);
      const backupContent = JSON.stringify(backupData, null, 2);
      
      await fs.writeFile(filePath, backupContent);

      // Atualizar metadados do backup
      backup.status = 'completed';
      backup.recordCount = totalRecords;
      backup.size = Buffer.byteLength(backupContent, 'utf8');
      backup.filePath = filePath;

      await this.saveBackupHistory();
      await monitoring.log('info', 'Backup completo concluído', {
        backupId,
        recordCount: totalRecords,
        size: backup.size,
        filePath
      });

      return backup;

    } catch (error) {
      backup.status = 'failed';
      backup.error = error.message;
      await this.saveBackupHistory();
      
      await monitoring.log('error', 'Falha no backup completo', {
        backupId,
        error: error.message
      });

      throw error;
    } finally {
      this.isBackupRunning = false;
    }
  }

  // Restaurar backup
  async restoreBackup(backupId: string): Promise<boolean> {
    try {
      const backup = this.backups.find(b => b.id === backupId);
      if (!backup || backup.status !== 'completed') {
        throw new Error('Backup não encontrado ou não concluído');
      }

      await monitoring.log('info', 'Iniciando restauração de backup', { backupId });

      // Ler arquivo de backup
      const backupContent = await fs.readFile(backup.filePath!, 'utf-8');
      const backupData = JSON.parse(backupContent);

      // Validar estrutura do backup
      if (!backupData._metadata || !backupData.service_orders) {
        throw new Error('Estrutura de backup inválida');
      }

      // **CUIDADO: Esta operação SOBRESCREVERÁ os dados existentes**
      // Em produção, você pode querer fazer um backup antes da restauração

      // Limpar tabelas (em ordem para respeitar foreign keys)
      await supabase.from('defect_classifications').delete().neq('id', 0);
      await supabase.from('service_orders').delete().neq('id', 0);
      await supabase.from('defect_categories').delete().neq('id', 0);

      // Restaurar categorias primeiro
      if (backupData.defect_categories?.length > 0) {
        const { error: catError } = await supabase
          .from('defect_categories')
          .insert(backupData.defect_categories);
        
        if (catError) {
          throw new Error(`Erro ao restaurar categorias: ${catError.message}`);
        }
      }

      // Restaurar service orders
      if (backupData.service_orders?.length > 0) {
        // Dividir em chunks para evitar timeouts
        const chunkSize = 100;
        for (let i = 0; i < backupData.service_orders.length; i += chunkSize) {
          const chunk = backupData.service_orders.slice(i, i + chunkSize);
          const { error: ordersError } = await supabase
            .from('service_orders')
            .insert(chunk);
          
          if (ordersError) {
            throw new Error(`Erro ao restaurar service orders (chunk ${i}): ${ordersError.message}`);
          }
        }
      }

      // Restaurar classificações
      if (backupData.defect_classifications?.length > 0) {
        const chunkSize = 100;
        for (let i = 0; i < backupData.defect_classifications.length; i += chunkSize) {
          const chunk = backupData.defect_classifications.slice(i, i + chunkSize);
          const { error: classError } = await supabase
            .from('defect_classifications')
            .insert(chunk);
          
          if (classError) {
            throw new Error(`Erro ao restaurar classificações (chunk ${i}): ${classError.message}`);
          }
        }
      }

      await monitoring.log('info', 'Backup restaurado com sucesso', {
        backupId,
        recordsRestored: backupData._metadata.totalRecords
      });

      return true;

    } catch (error) {
      await monitoring.log('error', 'Falha na restauração de backup', {
        backupId,
        error: error.message
      });
      throw error;
    }
  }

  // Listar backups disponíveis
  getBackups(): BackupMetadata[] {
    return this.backups.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Verificar integridade de um backup
  async verifyBackup(backupId: string): Promise<boolean> {
    try {
      const backup = this.backups.find(b => b.id === backupId);
      if (!backup || !backup.filePath) {
        return false;
      }

      // Verificar se arquivo existe
      await fs.access(backup.filePath);

      // Verificar se é JSON válido
      const content = await fs.readFile(backup.filePath, 'utf-8');
      const data = JSON.parse(content);

      // Verificar estrutura básica
      return !!(data._metadata && data.service_orders);

    } catch (error) {
      await monitoring.log('warn', 'Backup com problemas de integridade', {
        backupId,
        error: error.message
      });
      return false;
    }
  }

  // Limpar backups antigos
  async cleanupOldBackups(daysToKeep = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const oldBackups = this.backups.filter(backup => 
        new Date(backup.timestamp) < cutoffDate && backup.type !== 'manual'
      );

      let removedCount = 0;

      for (const backup of oldBackups) {
        try {
          if (backup.filePath) {
            await fs.unlink(backup.filePath);
          }
          
          // Remover do histórico
          this.backups = this.backups.filter(b => b.id !== backup.id);
          removedCount++;

        } catch (error) {
          await monitoring.log('warn', 'Erro ao remover backup antigo', {
            backupId: backup.id,
            error: error.message
          });
        }
      }

      if (removedCount > 0) {
        await this.saveBackupHistory();
        await monitoring.log('info', `${removedCount} backups antigos removidos`);
      }

      return removedCount;

    } catch (error) {
      await monitoring.log('error', 'Erro na limpeza de backups antigos', { error });
      return 0;
    }
  }

  // Agendar backups automáticos
  private scheduleAutoBackups() {
    // Backup diário às 2:00 AM
    const scheduleBackup = async () => {
      const now = new Date();
      const next2AM = new Date();
      next2AM.setHours(2, 0, 0, 0);
      
      // Se já passou das 2h hoje, agendar para amanhã
      if (now > next2AM) {
        next2AM.setDate(next2AM.getDate() + 1);
      }

      const timeUntilBackup = next2AM.getTime() - now.getTime();

      setTimeout(async () => {
        try {
          await this.createFullBackup(false);
          await this.cleanupOldBackups(30); // Manter backups por 30 dias
        } catch (error) {
          await monitoring.log('error', 'Falha no backup automático', { error });
        }

        // Agendar próximo backup
        scheduleBackup();
      }, timeUntilBackup);

      await monitoring.log('info', 'Próximo backup automático agendado', {
        scheduledFor: next2AM.toISOString()
      });
    };

    scheduleBackup();
  }

  // Status do serviço de backup
  getStatus() {
    const completedBackups = this.backups.filter(b => b.status === 'completed').length;
    const failedBackups = this.backups.filter(b => b.status === 'failed').length;
    const lastBackup = this.backups
      .filter(b => b.status === 'completed')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    return {
      isRunning: this.isBackupRunning,
      totalBackups: this.backups.length,
      completedBackups,
      failedBackups,
      lastBackup: lastBackup ? {
        timestamp: lastBackup.timestamp,
        recordCount: lastBackup.recordCount,
        size: lastBackup.size
      } : null,
      backupDirectory: this.backupDir
    };
  }
}

// Instância singleton
export const backupService = new BackupService();

export default backupService;