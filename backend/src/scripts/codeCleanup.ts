import * as fs from 'fs/promises';
import * as path from 'path';

class CodeCleanup {
  private projectRoot: string;
  private filesToRemove: string[] = [];
  private dirsToRemove: string[] = [];
  private totalSizeRemoved = 0;

  constructor() {
    this.projectRoot = path.join(__dirname, '..', '..', '..');
  }

  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private async removeFile(filePath: string, reason: string) {
    try {
      const size = await this.getFileSize(filePath);
      await fs.unlink(filePath);
      this.totalSizeRemoved += size;
      this.filesToRemove.push(`${filePath} (${reason}) [${this.formatBytes(size)}]`);
      console.log(`🗑️ Removido: ${path.basename(filePath)} - ${reason}`);
    } catch (error) {
      console.log(`⚠️ Não foi possível remover: ${path.basename(filePath)}`);
    }
  }

  private async removeDirectory(dirPath: string, reason: string) {
    try {
      await fs.rmdir(dirPath, { recursive: true });
      this.dirsToRemove.push(`${dirPath} (${reason})`);
      console.log(`🗂️ Diretório removido: ${path.basename(dirPath)} - ${reason}`);
    } catch (error) {
      console.log(`⚠️ Não foi possível remover diretório: ${path.basename(dirPath)}`);
    }
  }

  async cleanTempFiles() {
    console.log('🧹 Limpando arquivos temporários...');

    const tempPatterns = [
      '**/*.tmp',
      '**/*.temp',
      '**/*.log',
      '**/temp_*',
      '**/.DS_Store',
      '**/Thumbs.db',
      '**/*.swp',
      '**/*.swo',
      '**/*~'
    ];

    // Procurar e remover arquivos temporários
    const searchDirs = [
      path.join(this.projectRoot, 'backend'),
      path.join(this.projectRoot, 'frontend')
    ];

    for (const dir of searchDirs) {
      try {
        await this.cleanTempInDirectory(dir);
      } catch (error) {
        console.log(`⚠️ Erro ao limpar ${dir}:`, error);
      }
    }
  }

  private async cleanTempInDirectory(dir: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Recursão em subdiretórios (exceto node_modules, dist, etc.)
          if (!['node_modules', 'dist', '.git', '.next', 'build'].includes(entry.name)) {
            await this.cleanTempInDirectory(fullPath);
          }
        } else {
          // Verificar se é arquivo temporário
          const fileName = entry.name.toLowerCase();
          if (
            fileName.endsWith('.tmp') ||
            fileName.endsWith('.temp') ||
            fileName.endsWith('.log') ||
            fileName.startsWith('temp_') ||
            fileName === '.ds_store' ||
            fileName === 'thumbs.db' ||
            fileName.endsWith('.swp') ||
            fileName.endsWith('.swo') ||
            fileName.endsWith('~')
          ) {
            await this.removeFile(fullPath, 'Arquivo temporário');
          }
        }
      }
    } catch (error) {
      // Diretório pode não existir
    }
  }

  async cleanNodeModulesCaches() {
    console.log('\n📦 Limpando caches do Node.js...');

    const cacheDirs = [
      path.join(this.projectRoot, 'backend', 'node_modules', '.cache'),
      path.join(this.projectRoot, 'frontend', 'node_modules', '.cache'),
      path.join(this.projectRoot, 'backend', '.npm'),
      path.join(this.projectRoot, 'frontend', '.npm')
    ];

    for (const dir of cacheDirs) {
      try {
        await fs.access(dir);
        await this.removeDirectory(dir, 'Cache do Node.js');
      } catch {
        // Diretório não existe
      }
    }
  }

  async cleanBuildArtifacts() {
    console.log('\n🏗️ Limpando artefatos de build...');

    const buildDirs = [
      path.join(this.projectRoot, 'backend', 'dist'),
      path.join(this.projectRoot, 'frontend', 'dist'),
      path.join(this.projectRoot, 'frontend', 'build'),
      path.join(this.projectRoot, 'frontend', '.next')
    ];

    for (const dir of buildDirs) {
      try {
        await fs.access(dir);
        await this.removeDirectory(dir, 'Artefatos de build antigos');
      } catch {
        // Diretório não existe
      }
    }
  }

  async cleanTestFiles() {
    console.log('\n🧪 Removendo arquivos de teste desnecessários...');

    const testFiles = [
      path.join(this.projectRoot, 'backend', 'src', 'scripts', 'temp_performance_test.txt'),
      path.join(this.projectRoot, 'backend', 'test.js'),
      path.join(this.projectRoot, 'frontend', 'src', 'test.tsx')
    ];

    for (const file of testFiles) {
      try {
        await fs.access(file);
        await this.removeFile(file, 'Arquivo de teste');
      } catch {
        // Arquivo não existe
      }
    }
  }

  async optimizePackageJson() {
    console.log('\n📋 Otimizando package.json...');

    const packagePaths = [
      path.join(this.projectRoot, 'backend', 'package.json'),
      path.join(this.projectRoot, 'frontend', 'package.json')
    ];

    for (const packagePath of packagePaths) {
      try {
        const content = await fs.readFile(packagePath, 'utf8');
        const packageData = JSON.parse(content);

        // Adicionar campos úteis se não existirem
        if (!packageData.engines) {
          packageData.engines = {
            node: ">=18.0.0",
            npm: ">=8.0.0"
          };
        }

        if (!packageData.repository && packagePath.includes('backend')) {
          packageData.repository = {
            type: "git",
            url: "git+https://github.com/your-username/gl-garantias.git"
          };
        }

        // Organizar campos em ordem lógica
        const orderedPackage: any = {
          name: packageData.name,
          version: packageData.version,
          description: packageData.description,
          main: packageData.main,
          scripts: packageData.scripts,
          repository: packageData.repository,
          keywords: packageData.keywords,
          author: packageData.author,
          license: packageData.license,
          engines: packageData.engines,
          dependencies: packageData.dependencies,
          devDependencies: packageData.devDependencies
        };

        // Remover campos undefined
        Object.keys(orderedPackage).forEach(key => {
          if (orderedPackage[key] === undefined) {
            delete orderedPackage[key];
          }
        });

        await fs.writeFile(packagePath, JSON.stringify(orderedPackage, null, 2) + '\n');
        console.log(`✅ Otimizado: ${path.basename(path.dirname(packagePath))}/package.json`);
      } catch (error) {
        console.log(`⚠️ Erro ao otimizar ${packagePath}:`, error);
      }
    }
  }

  async createGitignore() {
    console.log('\n📝 Verificando .gitignore...');

    const gitignorePath = path.join(this.projectRoot, '.gitignore');
    const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/
.next/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local  
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs
logs/
*.log

# Temporary files
*.tmp
*.temp
temp_*

# Backups
backups/
*.backup

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# TypeScript cache
*.tsbuildinfo

# Cache directories
.cache/
.parcel-cache/
`;

    try {
      await fs.access(gitignorePath);
      console.log('✅ .gitignore já existe');
    } catch {
      await fs.writeFile(gitignorePath, gitignoreContent);
      console.log('✅ .gitignore criado');
    }
  }

  async generateCleanupReport() {
    console.log('\n📊 RELATÓRIO DE LIMPEZA');
    console.log('=' .repeat(50));
    console.log(`📁 Arquivos removidos: ${this.filesToRemove.length}`);
    console.log(`🗂️ Diretórios removidos: ${this.dirsToRemove.length}`);
    console.log(`💾 Espaço liberado: ${this.formatBytes(this.totalSizeRemoved)}`);

    if (this.filesToRemove.length > 0) {
      console.log('\nArquivos removidos:');
      this.filesToRemove.forEach(file => console.log(`  - ${file}`));
    }

    if (this.dirsToRemove.length > 0) {
      console.log('\nDiretórios removidos:');
      this.dirsToRemove.forEach(dir => console.log(`  - ${dir}`));
    }

    // Salvar relatório
    const reportPath = path.join(this.projectRoot, 'cleanup_report.json');
    const report = {
      timestamp: new Date().toISOString(),
      filesRemoved: this.filesToRemove,
      directoriesRemoved: this.dirsToRemove,
      totalSizeRemoved: this.totalSizeRemoved,
      totalFiles: this.filesToRemove.length,
      totalDirectories: this.dirsToRemove.length
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📋 Relatório salvo em: cleanup_report.json`);
  }

  async performFullCleanup() {
    console.log('🚀 INICIANDO LIMPEZA COMPLETA DO PROJETO');
    console.log('=' .repeat(50));

    const startTime = Date.now();

    await this.cleanTempFiles();
    await this.cleanNodeModulesCaches();
    await this.cleanBuildArtifacts();
    await this.cleanTestFiles();
    await this.optimizePackageJson();
    await this.createGitignore();

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log(`\n⏱️ Limpeza concluída em ${duration}s`);
    
    await this.generateCleanupReport();
    
    console.log('\n🎉 Projeto limpo e otimizado!');
    return true;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const cleanup = new CodeCleanup();
  cleanup.performFullCleanup().catch(console.error);
}

export { CodeCleanup };