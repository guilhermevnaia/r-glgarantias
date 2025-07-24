import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Upload as UploadIcon, FileText, CheckCircle } from "lucide-react";

const Upload = () => {
  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Upload de Planilha Excel</CardTitle>
          <CardDescription>Faça o upload da planilha GLú-Garantias.xlsx para processamento automático</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
            <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Arraste e solte seu arquivo aqui</p>
              <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
            </div>
            <div className="mt-4">
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                Selecionar Arquivo
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Como usar</CardTitle>
          <CardDescription>Siga os passos abaixo para um upload bem-sucedido</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex gap-4 group">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Prepare seu arquivo Excel
                </h3>
                <p className="text-sm text-muted-foreground">
                  Certifique-se de que o arquivo está no formato .xlsx ou .xls e contém as colunas necessárias.
                </p>
              </div>
            </div>

            <div className="flex gap-4 group">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <UploadIcon className="h-4 w-4" />
                  Faça o upload do arquivo
                </h3>
                <p className="text-sm text-muted-foreground">
                  Arraste o arquivo para a área acima ou clique em "Selecionar Arquivo".
                </p>
              </div>
            </div>

            <div className="flex gap-4 group">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Aguarde o processamento
                </h3>
                <p className="text-sm text-muted-foreground">
                  O sistema processará automaticamente os dados e você será notificado quando concluído.
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