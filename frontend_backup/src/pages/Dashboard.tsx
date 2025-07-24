import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { TrendingUp, FileText, Users, BarChart3, Calendar } from "lucide-react";

const Dashboard = () => {
  // Dados mock para a tabela
  const tableData = [
    { id: "001", cliente: "João Silva", veiculo: "Honda Civic 2020", defeito: "Motor", status: "Em Análise", data: "10/01/2025" },
    { id: "002", cliente: "Maria Santos", veiculo: "Toyota Corolla 2019", defeito: "Transmissão", status: "Aprovado", data: "08/01/2025" },
    { id: "003", cliente: "Pedro Costa", veiculo: "Ford Focus 2021", defeito: "Sistema Elétrico", status: "Pendente", data: "05/01/2025" },
    { id: "004", cliente: "Ana Lima", veiculo: "Chevrolet Onix 2022", defeito: "Motor", status: "Rejeitado", data: "03/01/2025" },
    { id: "005", cliente: "Carlos Ferreira", veiculo: "Hyundai HB20 2020", defeito: "Freios", status: "Em Análise", data: "01/01/2025" },
  ];

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-md";
    switch (status) {
      case "Aprovado":
        return <span className={`${baseClasses} bg-success text-success-foreground`}>Aprovado</span>;
      case "Rejeitado":
        return <span className={`${baseClasses} bg-destructive text-destructive-foreground`}>Rejeitado</span>;
      case "Em Análise":
        return <span className={`${baseClasses} bg-warning text-warning-foreground`}>Em Análise</span>;
      case "Pendente":
        return <span className={`${baseClasses} bg-secondary text-secondary-foreground`}>Pendente</span>;
      default:
        return <span className={`${baseClasses} bg-muted text-muted-foreground`}>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-muted/30 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Sistema de análise de garantias - Retífica LÚCIO
        </p>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="menu" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-primary text-primary-foreground">
          <TabsTrigger 
            value="menu" 
            className="data-[state=active]:bg-primary-foreground data-[state=active]:text-primary font-medium"
          >
            Menu
          </TabsTrigger>
          <TabsTrigger 
            value="graficos" 
            className="data-[state=active]:bg-primary-foreground data-[state=active]:text-primary font-medium"
          >
            Gráficos
          </TabsTrigger>
          <TabsTrigger 
            value="alertas" 
            className="data-[state=active]:bg-primary-foreground data-[state=active]:text-primary font-medium"
          >
            Análise de Defeitos
          </TabsTrigger>
          <TabsTrigger 
            value="tarefas" 
            className="data-[state=active]:bg-primary-foreground data-[state=active]:text-primary font-medium"
          >
            Relatórios
          </TabsTrigger>
        </TabsList>

        {/* Menu Tab Content */}
        <TabsContent value="menu" className="space-y-6 mt-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-soft transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ordens de Serviço</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,519</div>
                <p className="text-xs text-success flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  8.5%
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-soft transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Garantias Ativas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,268</div>
                <p className="text-xs text-success">90% do total</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-soft transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Fabricantes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15</div>
                <p className="text-xs text-success flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  5.2%
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-soft transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Análises</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">567</div>
                <p className="text-xs text-warning">Recente</p>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Ordens de Serviço Recentes</CardTitle>
              <CardDescription>Lista das últimas ordens processadas no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-primary hover:bg-primary">
                      <th className="text-left py-2 px-4 text-primary-foreground font-medium">ID</th>
                      <th className="text-left py-2 px-4 text-primary-foreground font-medium">CLIENTE</th>
                      <th className="text-left py-2 px-4 text-primary-foreground font-medium">VEÍCULO</th>
                      <th className="text-left py-2 px-4 text-primary-foreground font-medium">DEFEITO</th>
                      <th className="text-left py-2 px-4 text-primary-foreground font-medium">STATUS</th>
                      <th className="text-left py-2 px-4 text-primary-foreground font-medium">DATA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/50 border-b border-border">
                        <td className="py-2 px-4 font-medium">{row.id}</td>
                        <td className="py-2 px-4">{row.cliente}</td>
                        <td className="py-2 px-4">{row.veiculo}</td>
                        <td className="py-2 px-4">{row.defeito}</td>
                        <td className="py-2 px-4">{getStatusBadge(row.status)}</td>
                        <td className="py-2 px-4">{row.data}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gráficos Tab Content */}
        <TabsContent value="graficos" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gráficos e Análises</CardTitle>
              <CardDescription>Visualizações e relatórios detalhados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Conteúdo dos gráficos em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alertas Tab Content */}
        <TabsContent value="alertas" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Defeitos</CardTitle>
              <CardDescription>Monitoramento de padrões e tendências</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Sistema de análise de defeitos em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tarefas Tab Content */}
        <TabsContent value="tarefas" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios</CardTitle>
              <CardDescription>Gerenciamento de relatórios e exportações</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Módulo de relatórios em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;