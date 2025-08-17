import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Tag, 
  FileText, 
  X,
  Droplets,
  Thermometer,
  Volume2,
  Settings,
  Wrench,
  Zap
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DefectCategory {
  id: number;
  category_name: string;
  description: string;
  color_hex: string;
  icon: string;
  keywords: string[];
  sample_defects: string[];
  total_occurrences: number;
  is_active: boolean;
  created_at: string;
}

interface DefectDetailModalProps {
  category: DefectCategory | null;
  isOpen: boolean;
  onClose: () => void;
}

const DefectDetailModal: React.FC<DefectDetailModalProps> = ({
  category,
  isOpen,
  onClose
}) => {
  if (!category) return null;

  const getGroupFromDescription = (description: string) => {
    const match = description?.match(/\[GRUPO: (.+?)\]/);
    return match ? match[1] : 'Não categorizado';
  };

  const getCleanDescription = (description: string) => {
    return description?.replace(/\[GRUPO: .+?\]\s*/, '') || 'Sem descrição disponível';
  };

  const getCategoryIcon = (iconName: string) => {
    const icons = {
      droplets: Droplets,
      thermometer: Thermometer,
      zap: Zap,
      'volume-2': Volume2,
      settings: Settings,
      wrench: Wrench
    };
    const Icon = icons[iconName as keyof typeof icons] || FileText;
    return <Icon className="h-6 w-6" />;
  };

  const getGroupColor = (groupName: string) => {
    const colorMap: { [key: string]: string } = {
      'Vazamentos': '#ef4444',
      'Temperatura': '#dc2626',
      'Ruídos e Sons': '#eab308',
      'Sistema Elétrico': '#2563eb',
      'Problemas Mecânicos': '#f97316',
      'Operacional': '#059669'
    };
    return colorMap[groupName] || '#6b7280';
  };

  const group = getGroupFromDescription(category.description || '');
  const cleanDescription = getCleanDescription(category.description || '');
  const groupColor = getGroupColor(group);

  // Dados simulados para gráfico temporal (você pode implementar dados reais)
  const temporalData = [
    { month: 'Jan', occurrences: Math.floor(category.total_occurrences * 0.08) },
    { month: 'Fev', occurrences: Math.floor(category.total_occurrences * 0.09) },
    { month: 'Mar', occurrences: Math.floor(category.total_occurrences * 0.12) },
    { month: 'Abr', occurrences: Math.floor(category.total_occurrences * 0.11) },
    { month: 'Mai', occurrences: Math.floor(category.total_occurrences * 0.13) },
    { month: 'Jun', occurrences: Math.floor(category.total_occurrences * 0.10) },
    { month: 'Jul', occurrences: Math.floor(category.total_occurrences * 0.15) },
    { month: 'Ago', occurrences: Math.floor(category.total_occurrences * 0.22) }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="p-2 rounded-lg" 
                  style={{ backgroundColor: `${category.color_hex}20` }}
                >
                  {getCategoryIcon(category.icon)}
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold" style={{ color: category.color_hex }}>
                    {category.category_name}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      style={{ 
                        backgroundColor: `${groupColor}20`,
                        color: groupColor
                      }}
                    >
                      {group}
                    </Badge>
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                </div>
              </div>
              <DialogDescription className="text-sm text-muted-foreground">
                {cleanDescription}
              </DialogDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Estatísticas Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Ocorrências</p>
                    <p className="text-2xl font-bold" style={{ color: category.color_hex }}>
                      {category.total_occurrences.toLocaleString()}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Palavras-chave</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {category.keywords?.length || 0}
                    </p>
                  </div>
                  <Tag className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <p className="text-2xl font-bold text-green-600">
                      {category.is_active ? 'Ativa' : 'Inativa'}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico Temporal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Ocorrências por Mês (2025)
              </CardTitle>
              <CardDescription>
                Distribuição temporal dos defeitos desta categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={temporalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="occurrences" 
                      fill={category.color_hex}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Palavras-chave */}
          {category.keywords && category.keywords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Palavras-chave para Classificação
                </CardTitle>
                <CardDescription>
                  Termos utilizados pela IA para identificar esta categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {category.keywords.map((keyword, index) => (
                    <Badge 
                      key={index} 
                      variant="outline"
                      className="text-sm"
                      style={{ 
                        borderColor: category.color_hex,
                        color: category.color_hex
                      }}
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Exemplos de Defeitos */}
          {category.sample_defects && category.sample_defects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Exemplos de Defeitos
                </CardTitle>
                <CardDescription>
                  Descrições reais de defeitos classificados nesta categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.sample_defects.slice(0, 5).map((defect, index) => (
                    <div 
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg border-l-4"
                      style={{ borderLeftColor: category.color_hex }}
                    >
                      <p className="text-sm text-foreground">
                        "{defect}"
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações Técnicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Informações Técnicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">ID da Categoria:</span>
                    <span className="font-mono">{category.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Cor Hex:</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: category.color_hex }}
                      />
                      <span className="font-mono">{category.color_hex}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Ícone:</span>
                    <span className="font-mono">{category.icon}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Criado em:</span>
                    <span>{new Date(category.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DefectDetailModal;