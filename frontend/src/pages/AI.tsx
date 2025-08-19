import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Brain,
  Bot,
  Zap,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  Play,
  Settings,
  Eye,
  FileText
} from "lucide-react";
import { useAI } from '@/hooks/useAI';
import { ClassifiedDefect } from '@/components/ClassifiedDefect';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const AI = () => {
  const { classifications, stats, loading, error, refreshData } = useAI();
  const [classifyInput, setClassifyInput] = useState('');
  const [classifyResult, setClassifyResult] = useState<any>(null);
  const [isClassifying, setIsClassifying] = useState(false);

  // Função para classificar um defeito individual
  const handleClassifyDefect = async () => {
    if (!classifyInput.trim()) return;
    
    setIsClassifying(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'https://gl-garantias-backend.onrender.com';
      const response = await fetch(`${API_BASE}/api/v1/ai/classify-defect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          defectDescription: classifyInput.trim()
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setClassifyResult(data.data);
      } else {
        setClassifyResult({ error: data.error || 'Erro na classificação' });
      }
    } catch (error) {
      setClassifyResult({ error: 'Erro de conexão' });
    } finally {
      setIsClassifying(false);
    }
  };

  // Função para iniciar classificação em massa
  const handleMassClassification = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'https://gl-garantias-backend.onrender.com';
      const response = await fetch(`${API_BASE}/api/v1/ai/classify-all`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Classificação em massa iniciada!\n${data.message}\nTempo estimado: ${data.estimated_time}`);
        // Atualizar dados após alguns segundos
        setTimeout(() => refreshData(), 3000);
      }
    } catch (error) {
      alert('Erro ao iniciar classificação em massa');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-6 max-w-7xl mx-auto">
          <div className="h-8 bg-white rounded-lg w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-white rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full">
          <CardContent>
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Erro ao carregar dados da IA</p>
            <Button onClick={refreshData} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryData = stats?.categories?.map(cat => ({
    name: cat.category_name,
    value: cat.total_occurrences,
    color: cat.color_hex
  })) || [];

  const COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#6366F1'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            Inteligência Artificial de Defeitos
          </h1>
          <p className="text-muted-foreground mt-2">
            Sistema de classificação automática de defeitos usando IA
          </p>
        </div>
        <Button onClick={refreshData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar Dados
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classificado</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.totalClassified || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              de {stats?.totalDefects || 0} defeitos totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Classificação</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats ? Math.round(stats.classificationRate * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Progresso atual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias Ativas</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats?.categories?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Tipos identificados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats ? stats.totalDefects - stats.totalClassified : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando classificação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações da IA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Classificação Individual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Classificação Individual
            </CardTitle>
            <CardDescription>
              Classifique um defeito específico usando IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="defect-input">Descrição do Defeito</Label>
              <Input
                id="defect-input"
                placeholder="Ex: Motor com vazamento de óleo no cabeçote..."
                value={classifyInput}
                onChange={(e) => setClassifyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleClassifyDefect()}
              />
            </div>
            
            <Button 
              onClick={handleClassifyDefect} 
              disabled={isClassifying || !classifyInput.trim()}
              className="w-full"
            >
              {isClassifying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Classificando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Classificar Defeito
                </>
              )}
            </Button>

            {classifyResult && (
              <div className="mt-4 p-4 rounded-lg border bg-gray-50">
                {classifyResult.error ? (
                  <div className="text-red-600">
                    <AlertTriangle className="h-4 w-4 inline mr-2" />
                    {classifyResult.error}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                        style={{ backgroundColor: '#EF4444' }}
                        className="text-white"
                      >
                        {classifyResult.category_name}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {Math.round(classifyResult.ai_confidence * 100)}% confiança
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {classifyResult.ai_reasoning}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Classificação em Massa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Classificação em Massa
            </CardTitle>
            <CardDescription>
              Classifique todos os defeitos pendentes automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 space-y-2">
              <p>• Classifica todos os defeitos não processados</p>
              <p>• Usa sistema híbrido GroqAI + LocalAI</p>
              <p>• Processo executado em segundo plano</p>
            </div>
            
            <Button 
              onClick={handleMassClassification} 
              className="w-full"
              variant="outline"
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar Classificação em Massa
            </Button>

            {stats && (
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  {stats.totalDefects - stats.totalClassified} defeitos pendentes
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Categorias */}
      {categoryData.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* Gráfico de Barras */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Categorias</CardTitle>
              <CardDescription>
                Tipos de defeitos mais comuns identificados pela IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData.slice(0, 8)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={10}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Pizza */}
          <Card>
            <CardHeader>
              <CardTitle>Proporção de Categorias</CardTitle>
              <CardDescription>
                Distribuição percentual dos defeitos classificados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData.slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Categorias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Categorias de Defeitos
          </CardTitle>
          <CardDescription>
            Todas as categorias identificadas pela IA com estatísticas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Ocorrências</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Ícone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.categories?.map((category, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {category.category_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">
                        {category.total_occurrences}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: category.color_hex }}
                        />
                        <code className="text-xs">{category.color_hex}</code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {category.icon}
                      </code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AI;