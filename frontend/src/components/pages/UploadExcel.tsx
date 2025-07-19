import { useState, useCallback } from 'react';
import { MainLayout } from '../layout/MainLayout';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

export function UploadExcel() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
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
      
      const response = await fetch('http://localhost:3004/api/v1/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Erro no servidor');
      }
      
      const result = await response.json();
      console.log('Upload concluído:', result);
      setUploadResult(result);
    } catch (err) {
      console.error('Erro no upload:', err);
      setError('Erro ao processar arquivo. Verifique se o backend está rodando na porta 3004.');
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

  const dropAreaStyle: React.CSSProperties = {
    border: `2px dashed ${isDragging ? '#1e40af' : '#d1d5db'}`,
    borderRadius: '0.5rem',
    padding: '2rem',
    textAlign: 'center',
    backgroundColor: isDragging ? '#eff6ff' : 'transparent',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '3rem',
    color: isDragging ? '#1e40af' : '#9ca3af',
    marginBottom: '1rem',
  };

  const mainTextStyle: React.CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: '500',
    color: '#111827',
    marginBottom: '0.5rem',
  };

  const subTextStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '1.5rem',
  };

  const progressStyle: React.CSSProperties = {
    width: '100%',
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '1rem',
  };

  const progressBarStyle: React.CSSProperties = {
    height: '100%',
    backgroundColor: '#1e40af',
    width: '100%',
    animation: 'pulse 2s infinite',
  };

  const instructionStyle: React.CSSProperties = {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
  };

  const numberStyle: React.CSSProperties = {
    width: '2rem',
    height: '2rem',
    backgroundColor: '#1e40af',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: 'bold',
    flexShrink: 0,
  };

  const instructionTextStyle: React.CSSProperties = {
    flex: 1,
  };

  const instructionTitleStyle: React.CSSProperties = {
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '0.25rem',
  };

  const instructionDescStyle: React.CSSProperties = {
    color: '#6b7280',
    fontSize: '0.875rem',
    margin: 0,
  };

  return (
    <MainLayout 
      title="Upload Excel" 
      subtitle="Enviar planilhas Excel"
    >
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        {/* Card principal de upload */}
        <Card 
          title="📤 Upload de Planilha Excel"
          subtitle="Faça o upload da planilha GLú-Garantias.xlsx para processamento automático"
        >
          {/* Área de drag & drop */}
          <div
            style={dropAreaStyle}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            {/* Ícone central */}
            <div style={iconStyle}>
              📄
            </div>

            {/* Texto principal */}
            <div style={mainTextStyle}>
              Arraste e solte sua planilha aqui
            </div>
            <div style={subTextStyle}>
              ou clique no botão abaixo para selecionar
            </div>

            {/* Botão de seleção */}
            <Button 
              variant="primary" 
              size="lg"
              disabled={isUploading}
            >
              <span style={{ fontSize: '1.125rem' }}>📁</span>
              {isUploading ? 'Processando...' : 'Selecionar Arquivo'}
            </Button>
            
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Barra de progresso */}
          {isUploading && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Processando arquivo...</span>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>⏳</span>
              </div>
              <div style={progressStyle}>
                <div style={progressBarStyle}></div>
              </div>
            </div>
          )}

          {/* Resultado do upload */}
          {uploadResult && (
            <div style={{ marginTop: '1rem' }}>
              <Alert variant="success" title="Upload Concluído com Sucesso!">
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ margin: '0.25rem 0' }}><strong>Arquivo:</strong> {uploadResult.summary?.fileName}</p>
                  <p style={{ margin: '0.25rem 0' }}><strong>Linhas processadas:</strong> {uploadResult.summary?.rowsProcessed}</p>
                  <p style={{ margin: '0.25rem 0' }}><strong>Linhas válidas:</strong> {uploadResult.summary?.rowsValid}</p>
                  <p style={{ margin: '0.25rem 0' }}><strong>Linhas inseridas:</strong> {uploadResult.summary?.rowsInserted}</p>
                  <p style={{ margin: '0.25rem 0' }}><strong>Linhas atualizadas:</strong> {uploadResult.summary?.rowsUpdated}</p>
                  <p style={{ margin: '0.25rem 0' }}><strong>Tempo:</strong> {uploadResult.processingTime ? (uploadResult.processingTime / 1000).toFixed(1) + 's' : 'N/A'}</p>
                </div>
              </Alert>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div style={{ marginTop: '1rem' }}>
              <Alert variant="error" title="Erro no Upload">
                {error}
              </Alert>
            </div>
          )}
        </Card>

        {/* Seção de Instruções */}
        <div style={{ marginTop: '1.5rem' }}>
          <Card title="Instruções">
            {/* Instrução 1 */}
            <div style={instructionStyle}>
              <div style={numberStyle}>1</div>
              <div style={instructionTextStyle}>
                <div style={instructionTitleStyle}>Prepare sua planilha</div>
                <p style={instructionDescStyle}>
                  Certifique-se de que o arquivo Excel contém a planilha oculta 'Tabela' com os dados das ordens de serviço
                </p>
              </div>
            </div>

            {/* Instrução 2 */}
            <div style={instructionStyle}>
              <div style={numberStyle}>2</div>
              <div style={instructionTextStyle}>
                <div style={instructionTitleStyle}>Faça o upload</div>
                <p style={instructionDescStyle}>
                  Selecione ou arraste o arquivo Excel. Arquivos de até 100MB são suportados
                </p>
              </div>
            </div>

            {/* Instrução 3 */}
            <div style={instructionStyle}>
              <div style={numberStyle}>3</div>
              <div style={instructionTextStyle}>
                <div style={instructionTitleStyle}>Aguarde o processamento</div>
                <p style={instructionDescStyle}>
                  O sistema irá ler os dados, classificar os defeitos automaticamente e salvar no banco de dados
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}