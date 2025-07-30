import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Settings as SettingsIcon,
  Users, 
  Wrench,
  UserPlus,
  UserMinus,
  Edit,
  Plus,
  Trash2,
  Save,
  X,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiService, Mechanic, User } from "@/services/api";


const Settings = () => {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMechanic, setEditingMechanic] = useState<Mechanic | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newMechanic, setNewMechanic] = useState({ name: '', email: '' });
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'user' as 'admin' | 'user' });
  const [showAddMechanic, setShowAddMechanic] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Carregar dados das APIs
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Carregando dados das configurações...');
      
      // Carregar mecânicos e usuários em paralelo
      const [mechanicsData, usersData] = await Promise.all([
        apiService.getMechanics().catch(error => {
          console.error('❌ Erro ao carregar mecânicos:', error);
          return [];
        }),
        apiService.getUsers().catch(error => {
          console.error('❌ Erro ao carregar usuários:', error);
          return [];
        })
      ]);

      setMechanics(mechanicsData);
      setUsers(usersData);
      
      console.log('✅ Dados carregados:', { mechanics: mechanicsData.length, users: usersData.length });
    } catch (error) {
      console.error('❌ Erro geral ao carregar dados:', error);
      showAlert('error', 'Erro ao carregar dados das configurações');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleAddMechanic = async () => {
    if (!newMechanic.name.trim()) {
      showAlert('error', 'Nome do mecânico é obrigatório');
      return;
    }

    try {
      const mechanicData = {
        name: newMechanic.name.trim(),
        email: newMechanic.email.trim() || undefined
      };

      const addedMechanic = await apiService.addMechanic(mechanicData);
      setMechanics([...mechanics, addedMechanic]);
      setNewMechanic({ name: '', email: '' });
      setShowAddMechanic(false);
      showAlert('success', 'Mecânico adicionado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao adicionar mecânico:', error);
      showAlert('error', 'Erro ao adicionar mecânico');
    }
  };

  const handleUpdateMechanic = async (mechanic: Mechanic) => {
    try {
      const updatedMechanic = await apiService.updateMechanic(mechanic.id, {
        name: mechanic.name,
        email: mechanic.email,
        active: mechanic.active
      });
      
      setMechanics(mechanics.map(m => m.id === updatedMechanic.id ? updatedMechanic : m));
      setEditingMechanic(null);
      showAlert('success', 'Mecânico atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar mecânico:', error);
      showAlert('error', 'Erro ao atualizar mecânico');
    }
  };

  const handleToggleMechanicStatus = async (id: number) => {
    try {
      const mechanic = mechanics.find(m => m.id === id);
      if (!mechanic) return;

      const updatedMechanic = await apiService.updateMechanic(id, {
        active: !mechanic.active
      });

      setMechanics(mechanics.map(m => m.id === id ? updatedMechanic : m));
      showAlert('success', 'Status do mecânico alterado');
    } catch (error) {
      console.error('❌ Erro ao alterar status do mecânico:', error);
      showAlert('error', 'Erro ao alterar status do mecânico');
    }
  };

  const handleRemoveMechanic = async (id: number) => {
    try {
      await apiService.removeMechanic(id);
      setMechanics(mechanics.filter(m => m.id !== id));
      showAlert('success', 'Mecânico removido com sucesso');
    } catch (error) {
      console.error('❌ Erro ao remover mecânico:', error);
      showAlert('error', 'Erro ao remover mecânico');
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      showAlert('error', 'Nome e email são obrigatórios');
      return;
    }

    try {
      const userData = {
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        role: newUser.role
      };

      const addedUser = await apiService.addUser(userData);
      setUsers([...users, addedUser]);
      setNewUser({ name: '', email: '', role: 'user' });
      setShowAddUser(false);
      showAlert('success', 'Usuário adicionado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao adicionar usuário:', error);
      showAlert('error', 'Erro ao adicionar usuário');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-apple-gray-50 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white rounded-lg w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-96 bg-white rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8 bg-apple-gray-50 min-h-screen">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 text-gray-600" />
          Configurações do Sistema
        </h1>
        <p className="text-muted-foreground">
          Gerencie mecânicos, usuários e configurações gerais do sistema
        </p>
      </div>

      {/* Alert */}
      {alert && (
        <Alert className={`${alert.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          {alert.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={alert.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs de Configuração */}
      <Tabs defaultValue="mechanics" className="w-full">
        <div className="flex justify-center">
          <TabsList className="inline-flex w-auto bg-black rounded-md p-1 mb-6 h-10">
            <TabsTrigger 
              value="mechanics" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              <Wrench className="h-4 w-4 mr-2" />
              Mecânicos
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white font-medium rounded-sm text-sm h-8 px-6"
            >
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Gerenciamento de Mecânicos */}
        <TabsContent value="mechanics" className="space-y-6">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-blue-600" />
                    Gerenciamento de Mecânicos
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Adicione, edite ou remova mecânicos do sistema
                  </CardDescription>
                </div>
                <Dialog open={showAddMechanic} onOpenChange={setShowAddMechanic}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Mecânico
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Mecânico</DialogTitle>
                      <DialogDescription>
                        Preencha as informações do novo mecânico
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nome *</Label>
                        <Input
                          id="name"
                          value={newMechanic.name}
                          onChange={(e) => setNewMechanic({ ...newMechanic, name: e.target.value })}
                          placeholder="Nome completo do mecânico"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newMechanic.email}
                          onChange={(e) => setNewMechanic({ ...newMechanic, email: e.target.value })}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setShowAddMechanic(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleAddMechanic} className="bg-blue-600 hover:bg-blue-700">
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold text-foreground">Nome</TableHead>
                      <TableHead className="font-semibold text-foreground">Email</TableHead>
                      <TableHead className="font-semibold text-foreground">Status</TableHead>
                      <TableHead className="font-semibold text-foreground">Total OS</TableHead>
                      <TableHead className="font-semibold text-foreground">Cadastrado em</TableHead>
                      <TableHead className="font-semibold text-foreground text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mechanics.map((mechanic) => (
                      <TableRow key={mechanic.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-foreground">
                          {editingMechanic?.id === mechanic.id ? (
                            <Input
                              value={editingMechanic.name}
                              onChange={(e) => setEditingMechanic({ ...editingMechanic, name: e.target.value })}
                              className="h-8"
                            />
                          ) : (
                            mechanic.name
                          )}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {editingMechanic?.id === mechanic.id ? (
                            <Input
                              value={editingMechanic.email || ''}
                              onChange={(e) => setEditingMechanic({ ...editingMechanic, email: e.target.value })}
                              className="h-8"
                            />
                          ) : (
                            mechanic.email || '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={mechanic.active ? "default" : "secondary"}
                            className={mechanic.active ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                          >
                            {mechanic.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {mechanic.totalOrders}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {new Date(mechanic.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            {editingMechanic?.id === mechanic.id ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateMechanic(editingMechanic)}
                                  className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingMechanic(null)}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingMechanic(mechanic)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleMechanicStatus(mechanic.id)}
                                  className={`h-8 w-8 p-0 ${mechanic.active ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                                >
                                  {mechanic.active ? <UserMinus className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveMechanic(mechanic.id)}
                                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gerenciamento de Usuários */}
        <TabsContent value="users" className="space-y-6">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Gerenciamento de Usuários
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Gerencie usuários com acesso ao sistema
                  </CardDescription>
                </div>
                <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                      <DialogDescription>
                        Preencha as informações do novo usuário
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="userName">Nome *</Label>
                        <Input
                          id="userName"
                          value={newUser.name}
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          placeholder="Nome completo do usuário"
                        />
                      </div>
                      <div>
                        <Label htmlFor="userEmail">Email *</Label>
                        <Input
                          id="userEmail"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="userRole">Função</Label>
                        <select
                          id="userRole"
                          value={newUser.role}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'user' })}
                          className="w-full h-10 px-3 py-2 text-sm border border-input rounded-md bg-background"
                        >
                          <option value="user">Usuário</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                      <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setShowAddUser(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleAddUser} className="bg-purple-600 hover:bg-purple-700">
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold text-foreground">Nome</TableHead>
                      <TableHead className="font-semibold text-foreground">Email</TableHead>
                      <TableHead className="font-semibold text-foreground">Função</TableHead>
                      <TableHead className="font-semibold text-foreground">Status</TableHead>
                      <TableHead className="font-semibold text-foreground">Cadastrado em</TableHead>
                      <TableHead className="font-semibold text-foreground text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-foreground">
                          {user.name}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.role === 'admin' ? "default" : "secondary"}
                            className={user.role === 'admin' ? "bg-purple-100 text-purple-800 hover:bg-purple-100" : ""}
                          >
                            {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.active ? "default" : "secondary"}
                            className={user.active ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                          >
                            {user.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingUser(user)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className={`h-8 w-8 p-0 ${user.active ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                            >
                              {user.active ? <UserMinus className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;