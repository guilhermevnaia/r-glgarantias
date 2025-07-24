import { useState, useCallback } from 'react';
import { MainLayout } from '../layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { uploadService } from '../../services/api';
import type { UploadResult } from '../../services/types';
import { FileText, Folder, Clock } from 'lucide-react';

export function UploadExcel() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Apenas arquivos Excel (.xlsx, .xls) são permitidos');
      return;
    }

    // Validar tamanho (100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo permitido: 100MB');
      return;
    }

    setError(null);
    setUploadResult(null);
    setIsUploading(true);

    try {
      console.log('Iniciando upload do arquivo:', file.name);
      
      // Simular upload para o backend
      const formData = new FormData();
      formData.append('file', file);
      
      // Usar o serviço de API
      const result = await uploadService.uploadExcel(file);
      console.log('Upload concluído:', result);
      setUploadResult(result);
    } catch (err) {
      console.error('Erro no upload:', err);
      setError('Erro ao processar arquivo. Verifique se o backend está rodando na porta 3006.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);


  return (
    <MainLayout 
      title="Upload Excel" 
      subtitle="Enviar planilhas Excel"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Card principal de upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload de Planilha Excel</CardTitle>
            <CardDescription>Faça o upload da planilha GLú-Garantias.xlsx para processamento automático</CardDescription>
          </CardHeader>
          <CardContent>
          {/* Área de drag & drop */}
          <div
            className={`
              border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer
              ${isDragging 
                ? 'border-primary bg-primary-50 scale-[1.02]' 
                : 'border-border bg-background-secondary hover:border-primary hover:bg-primary-50/50'
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            {/* Ícone central */}
            <div className={`mb-6 transition-colors duration-200 ${isDragging ? 'text-primary scale-110' : 'text-foreground-muted'}`}>
              <FileText size={64} className="mx-auto" />
            </div>

            {/* Texto principal */}
            <div className={`text-xl font-semibold mb-2 transition-colors duration-200 ${isDragging ? 'text-primary' : 'text-foreground'}`}>
              Arraste e solte sua planilha aqui
            </div>
            <div className="text-sm text-foreground-muted mb-8">
              ou clique no botão abaixo para selecionar
            </div>

            {/* Botão de seleção */}
            <Button 
              variant="primary" 
              size="lg"
              disabled={isUploading}
              className="shadow-lg hover:shadow-xl transition-shadow duration-200"
            >
              <Folder className="h-5 w-5 mr-2" />
              {isUploading ? 'Processando...' : 'Selecionar Arquivo'}
            </Button>
            
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>

          {/* Barra de progresso */}
          {isUploading && (
            <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">Processando arquivo...</span>
                <Clock className="h-5 w-5 text-primary animate-spin" />
              </div>
              <div className="w-full bg-white rounded-full h-3 shadow-inner overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-primary-600 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}

          {/* Resultado do upload */}
          {uploadResult && (
            <div className="mt-6">
              <Alert variant="success" title="Upload Concluído com Sucesso!">
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="font-semibold">Arquivo:</span> {uploadResult.summary?.fileName}</div>
                  <div><span className="font-semibold">Linhas processadas:</span> {uploadResult.summary?.rowsProcessed}</div>
                  <div><span className="font-semibold">Linhas válidas:</span> {uploadResult.summary?.rowsValid}</div>
                  <div><span className="font-semibold">Linhas inseridas:</span> {uploadResult.summary?.rowsInserted}</div>
                  <div><span className="font-semibold">Linhas atualizadas:</span> {uploadResult.summary?.rowsUpdated}</div>
                  <div><span className="font-semibold">Tempo:</span> {uploadResult.processingTime ? (uploadResult.processingTime / 1000).toFixed(1) + 's' : 'N/A'}</div>
                </div>
              </Alert>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="mt-6">
              <Alert variant="error" title="Erro no Upload">
                {error}
              </Alert>
            </div>
          )}
          </CardContent>
        </Card>

        {/* Seção de Instruções */}
        <Card>
          <CardHeader>
            <CardTitle>Como usar</CardTitle>
            <CardDescription>Siga os passos abaixo para um upload bem-sucedido</CardDescription>
          </CardHeader>
          <CardContent>
          <div className="space-y-6">
            {/* Instrução 1 */}
            <div className="flex gap-4 group">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                1
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground mb-1">Prepare sua planilha</div>
                <p className="text-foreground-muted text-sm leading-relaxed">
                  Certifique-se de que o arquivo Excel contém a aba 'Tabela' com os dados das ordens de serviço
                </p>
              </div>
            </div>

            {/* Instrução 2 */}
            <div className="flex gap-4 group">
              <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                2
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground mb-1">Faça o upload</div>
                <p className="text-foreground-muted text-sm leading-relaxed">
                  Selecione ou arraste o arquivo Excel. Arquivos de até 100MB são suportados
                </p>
              </div>
            </div>

            {/* Instrução 3 */}
            <div className="flex gap-4 group">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                3
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground mb-1">Aguarde o processamento</div>
                <p className="text-foreground-muted text-sm leading-relaxed">
                  O sistema irá ler os dados, validar e salvar automaticamente no banco de dados
                </p>
              </div>
            </div>
          </div>
          
          {/* Informações adicionais */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center space-x-6 text-sm text-foreground-muted">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span>Formatos: .xlsx, .xls</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Tamanho máximo: 100MB</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-warning rounded-full"></div>
                <span>Processamento automático</span>
              </div>
            </div>
          </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}