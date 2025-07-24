import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, TrendingUp, FileText, Users, BarChart3, Calendar } from "lucide-react";

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
    switch (status) {
      case "Aprovado":
        return <Badge className="bg-success text-success-foreground">Aprovado</Badge>;
      case "Rejeitado":
        return <Badge className="bg-destructive text-destructive-foreground">Rejeitado</Badge>;
      case "Em Análise":
        return <Badge className="bg-warning text-warning-foreground">Em Análise</Badge>;
      case "Pendente":
        return <Badge variant="secondary">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-muted/30 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Voici un aperçu de votre exploitation agricole en Guadeloupe
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
            Alertas Meteórias
          </TabsTrigger>
          <TabsTrigger 
            value="tarefas" 
            className="data-[state=active]:bg-primary-foreground data-[state=active]:text-primary font-medium"
          >
            Tarefas
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
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-success flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  8.5 %
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-soft transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Garantias Ativas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-success">parcelles</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-soft transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Mecânicos Ativos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-success flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  5.2 %
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
                <p className="text-xs text-warning">Récent</p>
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
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="text-primary-foreground font-medium">ID</TableHead>
                    <TableHead className="text-primary-foreground font-medium">CLIENTE</TableHead>
                    <TableHead className="text-primary-foreground font-medium">VEÍCULO</TableHead>
                    <TableHead className="text-primary-foreground font-medium">DEFEITO</TableHead>
                    <TableHead className="text-primary-foreground font-medium">STATUS</TableHead>
                    <TableHead className="text-primary-foreground font-medium">DATA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{row.id}</TableCell>
                      <TableCell>{row.cliente}</TableCell>
                      <TableCell>{row.veiculo}</TableCell>
                      <TableCell>{row.defeito}</TableCell>
                      <TableCell>{getStatusBadge(row.status)}</TableCell>
                      <TableCell>{row.data}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
              <CardTitle>Alertas Meteorológicas</CardTitle>
              <CardDescription>Monitoramento de condições climáticas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Sistema de alertas em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tarefas Tab Content */}
        <TabsContent value="tarefas" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tarefas</CardTitle>
              <CardDescription>Gerenciamento de atividades e processos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Módulo de tarefas em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;