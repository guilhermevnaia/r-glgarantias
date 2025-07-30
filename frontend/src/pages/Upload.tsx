import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload as UploadIcon, FileSpreadsheet, Download, CheckCircle, AlertCircle, AlertTriangle, Clock, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { useDataIntegrity } from "@/hooks/useDataIntegrity";

interface UploadStatus {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  message?: string;
  progress?: number;
  details?: any;
}

const Upload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ status: 'idle' });
  const { toast } = useToast();
  const { integrityStatus, checkIntegrity } = useDataIntegrity();

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
    const excelFile = files.find(file => 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel'
    );

    if (excelFile) {
      setUploadedFile(excelFile);
      toast({
        title: "Arquivo carregado com sucesso!",
        description: `${excelFile.name} está pronto para processamento.`,
      });
    } else {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione apenas arquivos Excel (.xlsx ou .xls)",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast({
        title: "Arquivo selecionado!",
        description: `${file.name} está pronto para processamento.`,
      });
    }
  }, [toast]);

  const handleProcess = async () => {
    if (!uploadedFile) {
      toast({
        title: "❌ Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo Excel antes de processar.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Validar tipo de arquivo
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (!validTypes.includes(uploadedFile.type)) {
        toast({
          title: "❌ Formato inválido",
          description: "Por favor, selecione apenas arquivos Excel (.xlsx ou .xls).",
          variant: "destructive",
        });
        return;
      }

      // Validar tamanho do arquivo (100MB máximo)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (uploadedFile.size > maxSize) {
        toast({
          title: "❌ Arquivo muito grande",
          description: "O arquivo deve ter no máximo 100MB.",
          variant: "destructive",
        });
        return;
      }

      setUploadStatus({ status: 'uploading', message: 'Enviando arquivo...', progress: 0 });

      console.log('📤 Iniciando upload do arquivo:', uploadedFile.name);
      console.log('📁 Tamanho:', (uploadedFile.size / 1024 / 1024).toFixed(2), 'MB');
      
      // Progresso realista baseado no tempo
      const progressInterval = setInterval(() => {
        setUploadStatus(prev => ({
          ...prev,
          progress: Math.min((prev.progress || 0) + Math.random() * 15, 85)
        }));
      }, 300);

      const result = await apiService.uploadExcel(uploadedFile);
      
      clearInterval(progressInterval);
      console.log('✅ Upload concluído:', result);
      
      setUploadStatus({ 
        status: 'processing', 
        message: 'Processando dados...',
        progress: 90 
      });

      // Aguardar processamento baseado no resultado
      await new Promise(resolve => setTimeout(resolve, 1500));

      setUploadStatus({ 
        status: 'success', 
        message: 'Upload concluído com sucesso!',
        progress: 100,
        details: result
      });

      // Toast com detalhes do resultado
      if (result.summary) {
        toast({
          title: "✅ Upload realizado com sucesso!",
          description: `${result.summary.rowsProcessed || 0} registros processados de ${result.summary.totalRowsInExcel || 0} linhas do Excel.`,
        });
      } else {
        toast({
          title: "✅ Upload realizado com sucesso!",
          description: `${uploadedFile.name} foi processado e os dados foram atualizados.`,
        });
      }

      // Verificar integridade após upload
      setTimeout(() => {
        checkIntegrity();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Erro durante upload:', error);
      
      let errorMessage = 'Erro desconhecido durante o processamento';
      let errorDetails = '';

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (error.response?.status === 413) {
        errorMessage = 'Arquivo muito grande';
        errorDetails = 'O arquivo excede o limite de tamanho permitido.';
      } else if (error.response?.status === 400) {
        errorDetails = 'Verifique se o arquivo é um Excel válido com a aba "Tabela".';
      } else if (error.response?.status === 500) {
        errorDetails = 'Erro interno do servidor. Tente novamente em alguns minutos.';
      }
      
      setUploadStatus({ 
        status: 'error', 
        message: errorMessage,
        details: errorDetails || errorMessage
      });

      toast({
        title: "❌ Erro no upload",
        description: errorDetails || errorMessage,
        variant: "destructive",
      });
    }
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setUploadStatus({ status: 'idle' });
  };

  const getStatusIcon = () => {
    switch (uploadStatus.status) {
      case 'uploading':
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (uploadStatus.status) {
      case 'uploading':
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700">Enviando</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">Processando</Badge>;
      case 'success':
        return <Badge variant="secondary" className="bg-green-50 text-green-700">Concluído</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Upload Excel</h1>

      {/* Upload Area */}
      <Card className="bg-white/80 backdrop-blur-sm border-2 border-black shadow-sm">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                <UploadIcon className="h-5 w-5" />
                Upload de Planilha Excel
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Faça o upload da planilha GLU-Garantias.xlsx para processamento automático
              </CardDescription>
            </div>
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {integrityStatus?.isHealthy && (
                <Badge variant="secondary" className="bg-green-50 text-green-700">
                  Sistema Íntegro
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              isDragging 
                ? 'border-blue-400 bg-blue-50' 
                : uploadStatus.status === 'idle'
                  ? 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  : uploadStatus.status === 'success'
                    ? 'border-green-400 bg-green-50'
                    : uploadStatus.status === 'error'
                      ? 'border-red-400 bg-red-50'
                      : 'border-blue-400 bg-blue-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {uploadStatus.status === 'idle' && (
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploadStatus.status !== 'idle'}
              />
            )}
            
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                {getStatusIcon()}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {uploadStatus.status !== 'idle' && uploadStatus.message
                    ? uploadStatus.message
                    : uploadedFile 
                      ? uploadedFile.name 
                      : 'Arraste e solte sua planilha aqui'
                  }
                </h3>
                <p className="text-sm text-gray-600">
                  {uploadStatus.status === 'idle' 
                    ? 'Arquivos Excel (.xlsx, .xls) até 100MB' 
                    : uploadStatus.details 
                      ? `Detalhes: ${uploadStatus.details}`
                      : 'Processando arquivo...'
                  }
                </p>
              </div>
              
              {/* Barra de Progresso */}
              {uploadStatus.status !== 'idle' && uploadStatus.progress !== undefined && (
                <div className="w-full max-w-md mx-auto">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        uploadStatus.status === 'success' ? 'bg-green-500' : 
                        uploadStatus.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${uploadStatus.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {uploadStatus.progress}% concluído
                  </p>
                </div>
              )}
              
              {uploadStatus.status === 'idle' && !uploadedFile && (
                <Button variant="outline" className="mt-4 border-gray-300 hover:border-blue-400">
                  <UploadIcon className="h-4 w-4 mr-2" />
                  Selecionar Arquivo
                </Button>
              )}
            </div>
          </div>

          {/* Ações do Arquivo */}
          {uploadedFile && uploadStatus.status === 'idle' && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-600">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • Pronto para processamento
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={resetUpload}
                    className="border-gray-300"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                  <Button 
                    onClick={handleProcess} 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Processar Arquivo
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Status de Sucesso */}
          {uploadStatus.status === 'success' && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Upload concluído com sucesso!</p>
                      <p className="text-xs text-green-700">
                        Os dados foram processados e atualizados no sistema.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => checkIntegrity()}
                      className="border-green-300 text-green-700"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Verificar Integridade
                    </Button>
                    <Button 
                      onClick={resetUpload}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Novo Upload
                    </Button>
                  </div>
                </div>
              </div>

              {/* Detalhes do Processamento */}
              {uploadStatus.details?.summary && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Resumo do Processamento
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="font-bold text-lg text-blue-600">{uploadStatus.details.summary.totalRowsInExcel || 0}</div>
                      <div className="text-gray-600">Linhas no Excel</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="font-bold text-lg text-green-600">{uploadStatus.details.summary.rowsProcessed || 0}</div>
                      <div className="text-gray-600">Registros Processados</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="font-bold text-lg text-blue-600">{uploadStatus.details.summary.rowsInserted || 0}</div>
                      <div className="text-gray-600">Registros Inseridos</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="font-bold text-lg text-yellow-600">{uploadStatus.details.summary.rowsRejected || 0}</div>
                      <div className="text-gray-600">Registros Rejeitados</div>
                    </div>
                  </div>
                  
                  {uploadStatus.details.processingTime && (
                    <div className="mt-3 text-xs text-blue-700 text-center">
                      Processamento concluído em {(uploadStatus.details.processingTime / 1000).toFixed(2)} segundos
                    </div>
                  )}
                </div>
              )}

              {/* Status de Integridade */}
              {integrityStatus && (
                <div className={`p-4 rounded-lg border ${
                  integrityStatus.isHealthy 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {integrityStatus.isHealthy ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      integrityStatus.isHealthy ? 'text-green-900' : 'text-yellow-900'
                    }`}>
                      {integrityStatus.isHealthy ? 'Sistema íntegro' : 'Verificação de integridade em andamento'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status de Erro */}
          {uploadStatus.status === 'error' && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-900">{uploadStatus.message || 'Erro durante o processamento'}</p>
                      <p className="text-xs text-red-700">
                        {uploadStatus.details || 'Ocorreu um erro inesperado.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={resetUpload}
                      className="border-red-300"  
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                    <Button 
                      onClick={handleProcess}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Tentar Novamente
                    </Button>
                  </div>
                </div>
              </div>

              {/* Dicas para resolução */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Dicas para resolver o erro
                </h4>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>Verifique se o arquivo é um Excel válido (.xlsx ou .xls)</li>
                  <li>Certifique-se de que existe uma aba chamada "Tabela" no arquivo</li>
                  <li>Confirme que o arquivo tem no máximo 100MB</li>
                  <li>Tente fechar e reabrir o arquivo Excel antes do upload</li>
                  <li>Se o erro persistir, verifique sua conexão com a internet</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-white/80 backdrop-blur-sm border-2 border-black shadow-sm">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Como Usar o Upload
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Siga estas etapas para fazer o upload e processamento dos dados Excel
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm">
              1
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-1">Prepare sua planilha</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Certifique-se de que o arquivo Excel contém a <strong className="text-foreground">aba "Tabela"</strong> com os dados das ordens de serviço formatados corretamente. O arquivo deve ter as colunas necessárias para processamento automático.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm">
              2
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-1">Faça o upload</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Selecione ou arraste o arquivo Excel na área acima. Arquivos <strong className="text-foreground">até 100MB</strong> são suportados (.xlsx ou .xls)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm">
              3
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-1">Aguarde o processamento</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                O sistema irá <strong className="text-foreground">ler os dados</strong>, classificar os defeitos automaticamente e <strong className="text-foreground">salvar no banco de dados</strong>. O processo é monitorado em tempo real
              </p>
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm text-blue-900 font-medium mb-1">Processamento Inteligente</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  O sistema valida automaticamente os dados (anos 2019-2025), classifica defeitos por IA e mantém a integridade dos dados durante todo o processo.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Upload;