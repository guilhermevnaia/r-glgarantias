import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import * as fsSync from 'fs';

interface PythonProcessingResult {
  success: boolean;
  data: any[];
  total_rows_excel: number;
  valid_rows: number;
  rejected_rows: number;
  processing_time_seconds: number;
  summary: {
    total_rows: number;
    valid_rows: number;
    rejected_rows: number;
    rejected_by_missing_fields: number;
    rejected_by_invalid_status: number;
    rejected_by_invalid_date: number;
    rejected_by_year_range: number;
    status_distribution: Record<string, number>;
    year_distribution: Record<string, number>;
    mathematically_correct: boolean;
    processing_errors: string[];
  };
  errors: string[];
  warnings: string[];
}

class PythonExcelService {
  private pythonScriptPath: string;
  private tempDir: string;

  constructor() {
    // CAMINHO RELATIVO PARA FUNCIONAR EM DESENVOLVIMENTO E PRODUÇÃO
    this.pythonScriptPath = path.resolve(__dirname, '../../../python/excel_processor.py');
    this.tempDir = os.tmpdir();
    console.log('🐍 Caminho do script Python:', this.pythonScriptPath);
    console.log('🐍 Diretório do service:', __dirname);
    console.log('🐍 Verificando se arquivo Python existe:', fsSync.existsSync(this.pythonScriptPath));
    console.log('🐍 Diretório atual:', process.cwd());
  }

  /**
   * PROCESSAMENTO DEFINITIVO DE EXCEL COM PYTHON
   * 
   * Este método substitui completamente o CleanDataProcessor.ts
   * e garante leitura 100% correta dos dados Excel.
   */
  async processExcelBuffer(buffer: Buffer, filename: string): Promise<PythonProcessingResult> {
    console.log('🐍 Iniciando processamento definitivo com Python pandas...');
    const startTime = Date.now();

    try {
      // 1. SALVAR BUFFER EM ARQUIVO TEMPORÁRIO
      const tempFilePath = await this.saveBufferToTempFile(buffer, filename);
      console.log(`📁 Arquivo temporário criado: ${tempFilePath}`);

      // 2. EXECUTAR SCRIPT PYTHON
      const result = await this.executePythonProcessor(tempFilePath);

      // 3. LIMPAR ARQUIVO TEMPORÁRIO
      await this.cleanupTempFile(tempFilePath);

      // 4. VALIDAR RESULTADO
      if (!result.success) {
        throw new Error(`Processamento Python falhou: ${result.errors.join(', ')}`);
      }

      console.log('✅ Processamento Python concluído com sucesso:');
      console.log(`   📊 Total Excel: ${result.total_rows_excel}`);
      console.log(`   ✅ Válidos: ${result.valid_rows}`);
      console.log(`   ❌ Rejeitados: ${result.rejected_rows}`);
      console.log(`   ⏱️ Tempo: ${result.processing_time_seconds.toFixed(2)}s`);
      console.log(`   🧮 Matemática correta: ${result.summary.mathematically_correct ? '✅' : '❌'}`);

      return result;

    } catch (error) {
      console.error('💥 Erro no processamento Python:', error);
      throw new Error(`Falha no processamento Python: ${(error as Error).message}`);
    }
  }

  /**
   * SALVAR BUFFER EM ARQUIVO TEMPORÁRIO
   */
  private async saveBufferToTempFile(buffer: Buffer, originalFilename: string): Promise<string> {
    const timestamp = Date.now();
    const extension = path.extname(originalFilename) || '.xlsx';
    const tempFilename = `excel_${timestamp}${extension}`;
    const tempFilePath = path.join(this.tempDir, tempFilename);

    try {
      await fs.writeFile(tempFilePath, buffer);
      return tempFilePath;
    } catch (error) {
      throw new Error(`Falha ao criar arquivo temporário: ${(error as Error).message}`);
    }
  }

  /**
   * EXECUTAR SCRIPT PYTHON
   */
  private async executePythonProcessor(filePath: string): Promise<PythonProcessingResult> {
    return new Promise((resolve, reject) => {
      console.log(`🚀 DEBUG: pythonScriptPath = "${this.pythonScriptPath}"`);
      console.log(`🚀 DEBUG: filePath = "${filePath}"`);
      console.log(`🚀 Executando: python ${this.pythonScriptPath} "${filePath}"`);

      const pythonProcess = spawn('python', [this.pythonScriptPath, filePath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        const logMessage = data.toString().trim();
        stderr += logMessage;
        // Only log non-INFO messages as errors
        if (!logMessage.includes('- INFO -')) {
          console.log(`🐍 Python log: ${logMessage}`);
        }
      });

      pythonProcess.on('close', (code) => {
        console.log(`🔍 DEBUG: Processo Python terminou com código: ${code}`);
        console.log(`🔍 DEBUG: Stdout length: ${stdout.length}`);
        console.log(`🔍 DEBUG: Stderr: ${stderr}`);
        
        // Check if we have valid JSON output with success=true
        if (stdout.trim().length > 0 && stdout.includes('"success":true')) {
          console.log(`✅ Python processamento bem-sucedido (stdout válido encontrado)`);
          console.log(`📏 Tamanho do stdout: ${stdout.length} caracteres`);
          console.log(`🔍 Primeiros 200 chars do stdout:`, stdout.substring(0, 200));
          // Force success if we have valid JSON output
          code = 0;
        }
        
        if (code !== 0) {
          console.error(`❌ Processo Python terminou com código: ${code}`);
          console.error(`❌ Stderr: ${stderr}`);
          // Filter out INFO logging from stderr for cleaner error messages
          const actualErrors = stderr.split('\n').filter(line => 
            !line.includes('- INFO -') && line.trim().length > 0
          ).join('\n');
          reject(new Error(`Processo Python falhou (código ${code}): ${actualErrors}`));
          return;
        }

        try {
          // Parsing do resultado JSON
          const result = JSON.parse(stdout) as PythonProcessingResult;
          resolve(result);
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse do resultado Python:', parseError);
          console.error('❌ Stdout recebido:', stdout);
          reject(new Error(`Erro ao fazer parse do resultado: ${(parseError as Error).message}`));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('❌ Erro ao executar processo Python:', error);
        reject(new Error(`Erro ao executar Python: ${error.message}`));
      });

      // Timeout de segurança (10 minutos)
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Timeout: Processamento Python demorou mais de 10 minutos'));
      }, 10 * 60 * 1000);
    });
  }

  /**
   * LIMPAR ARQUIVO TEMPORÁRIO
   */
  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      console.log(`🧹 Arquivo temporário removido: ${filePath}`);
    } catch (error) {
      console.warn(`⚠️ Falha ao remover arquivo temporário: ${(error as Error).message}`);
      // Não é crítico, apenas log de warning
    }
  }

  /**
   * VALIDAR SE PYTHON ESTÁ DISPONÍVEL
   */
  async validatePythonEnvironment(): Promise<{ valid: boolean; error?: string }> {
    return new Promise((resolve) => {
      const pythonProcess = spawn('python', ['--version'], { stdio: 'pipe' });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ valid: true });
        } else {
          resolve({ 
            valid: false, 
            error: 'Python não encontrado. Certifique-se de que Python 3.x está instalado e no PATH.' 
          });
        }
      });

      pythonProcess.on('error', () => {
        resolve({ 
          valid: false, 
          error: 'Python não encontrado. Certifique-se de que Python 3.x está instalado e no PATH.' 
        });
      });
    });
  }

  /**
   * INSTALAR DEPENDÊNCIAS PYTHON
   */
  async installPythonDependencies(): Promise<{ success: boolean; error?: string }> {
    const requirementsPath = path.resolve(__dirname, '../../../python/requirements.txt');

    return new Promise((resolve) => {
      console.log('📦 Instalando dependências Python...');
      
      const pipProcess = spawn('pip', ['install', '-r', requirementsPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stderr = '';

      pipProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.log(`📦 Pip: ${data.toString().trim()}`);
      });

      pipProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Dependências Python instaladas com sucesso');
          resolve({ success: true });
        } else {
          console.error(`❌ Falha na instalação das dependências: ${stderr}`);
          resolve({ 
            success: false, 
            error: `Falha na instalação: ${stderr}` 
          });
        }
      });

      pipProcess.on('error', (error) => {
        console.error('❌ Erro ao executar pip:', error);
        resolve({ 
          success: false, 
          error: `Erro ao executar pip: ${error.message}` 
        });
      });
    });
  }
}

export { PythonExcelService, PythonProcessingResult };