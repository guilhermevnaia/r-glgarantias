import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, FileSpreadsheet, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Upload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

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

  const handleProcess = () => {
    if (uploadedFile) {
      toast({
        title: "Processamento iniciado",
        description: "O arquivo será processado automaticamente.",
      });
      // Aqui você faria o upload real
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Upload Excel</h1>
        <p className="text-muted-foreground">Enviar planilhas Excel</p>
      </div>

      {/* Upload Area */}
      <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadIcon className="h-5 w-5" />
            Upload de Planilha Excel
          </CardTitle>
          <CardDescription>
            Faça o upload da planilha GLU-Garantias.xlsx para processamento automático
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">
                  {uploadedFile ? uploadedFile.name : 'Arraste e solte sua planilha aqui'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  ou clique no botão abaixo para selecionar
                </p>
              </div>
              
              <Button variant="outline" className="mt-4">
                <UploadIcon className="h-4 w-4 mr-2" />
                Selecionar Arquivo
              </Button>
            </div>
          </div>

          {uploadedFile && (
            <div className="mt-6 p-4 bg-success/5 border border-success/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-success" />
                  <div>
                    <p className="font-medium text-success">{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button onClick={handleProcess} className="bg-gradient-primary">
                  Processar Arquivo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instruções</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              1
            </div>
            <div>
              <h4 className="font-medium">Prepare sua planilha</h4>
              <p className="text-sm text-muted-foreground">
                Certifique-se de que o arquivo Excel contém a <strong>planilha oculta "tabela"</strong> com os dados das ordens de serviço
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              2
            </div>
            <div>
              <h4 className="font-medium">Faça o upload</h4>
              <p className="text-sm text-muted-foreground">
                Selecione ou arraste o arquivo Excel. Arquivos de até 100MB são suportados
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              3
            </div>
            <div>
              <h4 className="font-medium">Aguarde o processamento</h4>
              <p className="text-sm text-muted-foreground">
                O sistema irá ler os dados, classificar os defeitos automaticamente e salvar no banco de dados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Upload;