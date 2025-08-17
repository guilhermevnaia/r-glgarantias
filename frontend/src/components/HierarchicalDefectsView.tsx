import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  FolderOpen, 
  FileText,
  BarChart3,
  Filter,
  Search,
  Eye,
  Droplets,
  Thermometer,
  Volume2,
  Settings,
  Wrench,
  Zap
} from "lucide-react";
import { Input } from "@/components/ui/input";
import DefectDetailModal from './DefectDetailModal';

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

interface HierarchicalDefectsViewProps {
  categories: DefectCategory[];
  onCategorySelect?: (category: DefectCategory) => void;
  selectedCategory?: string;
}

interface HierarchyGroup {
  groupName: string;
  groupIcon: string;
  groupColor: string;
  categories: DefectCategory[];
  totalOccurrences: number;
}

const HierarchicalDefectsView: React.FC<HierarchicalDefectsViewProps> = ({
  categories,
  onCategorySelect,
  selectedCategory
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Vazamentos']));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [detailModalCategory, setDetailModalCategory] = useState<DefectCategory | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Funções auxiliares (movidas para antes do useMemo)
  const getGroupIcon = (groupName: string) => {
    const iconMap: { [key: string]: any } = {
      'Vazamentos': Droplets,
      'Temperatura': Thermometer,
      'Ruídos e Sons': Volume2,
      'Sistema Elétrico': Zap,
      'Problemas Mecânicos': Wrench,
      'Operacional': Settings
    };
    return iconMap[groupName] || FileText;
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

  // Processar categorias em hierarquia
  const hierarchyData = useMemo(() => {
    const groups: { [key: string]: HierarchyGroup } = {};

    categories.forEach(category => {
      // Extrair grupo da description
      const groupMatch = category.description?.match(/\[GRUPO: (.+?)\]/);
      const groupName = groupMatch ? groupMatch[1] : 'Outros';

      if (!groups[groupName]) {
        groups[groupName] = {
          groupName,
          groupIcon: getGroupIcon(groupName),
          groupColor: getGroupColor(groupName),
          categories: [],
          totalOccurrences: 0
        };
      }

      groups[groupName].categories.push(category);
      groups[groupName].totalOccurrences += category.total_occurrences || 0;
    });

    // Ordenar categorias dentro de cada grupo
    Object.values(groups).forEach(group => {
      group.categories.sort((a, b) => (b.total_occurrences || 0) - (a.total_occurrences || 0));
    });

    return Object.values(groups).sort((a, b) => b.totalOccurrences - a.totalOccurrences);
  }, [categories]);

  // Filtrar grupos baseado na busca
  const filteredGroups = useMemo(() => {
    if (!searchTerm && selectedGroup === 'all') return hierarchyData;

    return hierarchyData.filter(group => {
      const matchesGroup = selectedGroup === 'all' || group.groupName === selectedGroup;
      const matchesSearch = !searchTerm || 
        group.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.categories.some(cat => 
          cat.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );

      return matchesGroup && matchesSearch;
    }).map(group => ({
      ...group,
      categories: group.categories.filter(cat => 
        !searchTerm || 
        cat.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }));
  }, [hierarchyData, searchTerm, selectedGroup]);

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
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
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Filtros e Busca */}
      <Card className="bg-white/80 backdrop-blur-sm border-2 border-black shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Navegação Hierárquica de Defeitos
          </CardTitle>
          <CardDescription>
            Explore os defeitos organizados por grupos principais, subgrupos e detalhes específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar Defeitos</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por categoria ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Filtrar por Grupo</label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🎯 Todos os Grupos</SelectItem>
                  {hierarchyData.map(group => (
                    <SelectItem key={group.groupName} value={group.groupName}>
                      {group.groupName} ({group.totalOccurrences} ocorrências)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estrutura Hierárquica */}
      <div className="space-y-4">
        {filteredGroups.map((group) => (
          <Card key={group.groupName} className="bg-white/80 backdrop-blur-sm border-2 border-black shadow-sm">
            <Collapsible 
              open={expandedGroups.has(group.groupName)}
              onOpenChange={() => toggleGroup(group.groupName)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {expandedGroups.has(group.groupName) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        {expandedGroups.has(group.groupName) ? (
                          <FolderOpen className="h-6 w-6" style={{ color: group.groupColor }} />
                        ) : (
                          <Folder className="h-6 w-6" style={{ color: group.groupColor }} />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg" style={{ color: group.groupColor }}>
                          {group.groupName}
                        </CardTitle>
                        <CardDescription>
                          {group.categories.length} subcategorias • {group.totalOccurrences.toLocaleString()} ocorrências totais
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary"
                        style={{ 
                          backgroundColor: `${group.groupColor}20`,
                          color: group.groupColor
                        }}
                      >
                        {group.totalOccurrences.toLocaleString()}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          // Abrir modal com análise do grupo completo
                          if (group.categories.length > 0) {
                            setDetailModalCategory(group.categories[0]); // Categoria principal do grupo
                            setIsDetailModalOpen(true);
                          }
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Análise
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {group.categories.map((category) => (
                      <div
                        key={category.id}
                        className={`p-4 rounded-lg border-l-4 transition-all duration-200 cursor-pointer hover:shadow-md ${
                          selectedCategory === category.category_name
                            ? 'bg-blue-50 border-l-blue-500'
                            : 'bg-gray-50/50 border-l-gray-300 hover:bg-gray-100/50'
                        }`}
                        style={{ borderLeftColor: category.color_hex }}
                        onClick={() => onCategorySelect?.(category)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div 
                                className="p-1.5 rounded" 
                                style={{ backgroundColor: `${category.color_hex}20` }}
                              >
                                {getCategoryIcon(category.icon)}
                              </div>
                              <h4 className="font-semibold text-foreground">
                                {category.category_name}
                              </h4>
                              <Badge 
                                variant={category.is_active ? "default" : "secondary"}
                                className="ml-2"
                              >
                                {category.is_active ? 'Ativa' : 'Inativa'}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-3">
                              {category.description?.replace(/\[GRUPO: .+?\]\s*/, '') || 'Sem descrição disponível'}
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                              <div>
                                <span className="font-medium text-muted-foreground">Ocorrências:</span>
                                <span className="ml-2 font-semibold text-foreground">
                                  {(category.total_occurrences || 0).toLocaleString()}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Palavras-chave:</span>
                                <span className="ml-2 font-semibold text-foreground">
                                  {category.keywords?.length || 0}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">% do Grupo:</span>
                                <span className="ml-2 font-semibold text-foreground">
                                  {group.totalOccurrences > 0 ? 
                                    ((category.total_occurrences || 0) / group.totalOccurrences * 100).toFixed(1) 
                                    : '0'
                                  }%
                                </span>
                              </div>
                            </div>
                            
                            {category.keywords && category.keywords.length > 0 && (
                              <div className="mt-3">
                                <div className="flex flex-wrap gap-1">
                                  {category.keywords.slice(0, 8).map((keyword, index) => (
                                    <Badge 
                                      key={index} 
                                      variant="outline" 
                                      className="text-xs"
                                    >
                                      {keyword}
                                    </Badge>
                                  ))}
                                  {category.keywords.length > 8 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{category.keywords.length - 8} mais
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end gap-2 ml-4">
                            <div className="text-right">
                              <div className="text-sm font-semibold" style={{ color: category.color_hex }}>
                                {(category.total_occurrences || 0).toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground">casos</div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailModalCategory(category);
                                setIsDetailModalOpen(true);
                              }}
                            >
                              <BarChart3 className="h-3 w-3 mr-1" />
                              Detalhes
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {/* Resumo */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-black shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {filteredGroups.length}
              </div>
              <div className="text-sm text-muted-foreground">Grupos Principais</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {filteredGroups.reduce((acc, group) => acc + group.categories.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Subcategorias</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {filteredGroups.reduce((acc, group) => acc + group.totalOccurrences, 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total de Casos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {filteredGroups.reduce((acc, group) => acc + group.categories.filter(c => c.is_active).length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Categorias Ativas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <DefectDetailModal
        category={detailModalCategory}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailModalCategory(null);
        }}
      />
    </div>
  );
};

export default HierarchicalDefectsView;