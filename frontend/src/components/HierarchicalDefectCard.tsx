import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HierarchyBadges } from '@/components/ui/hierarchy-badges';
import { mapToHierarchy } from '@/utils/hierarchyMapper';
import { Brain, AlertCircle } from 'lucide-react';

interface HierarchicalDefectCardProps {
  order: any;
  classification?: any;
  className?: string;
  compact?: boolean;
}

// Função para mapear categoria usando sistema inteligente

export const HierarchicalDefectCard: React.FC<HierarchicalDefectCardProps> = ({
  order,
  classification,
  className = "",
  compact = false
}) => {
  // Se tem classificação da IA, usar ela
  if (classification && classification.defect_categories) {
    const category = classification.defect_categories;
    const hierarchy = mapToHierarchy(
      category.category_name,
      classification.original_defect_description || order.raw_defect_description
    );
    const confidence = Math.round(classification.ai_confidence * 100);

    if (compact) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className={`${className} border-2 hover:shadow-md transition-all duration-200 cursor-pointer`} 
                    style={{ borderColor: category.color_hex }}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4" style={{ color: category.color_hex }} />
                    <span className="font-semibold text-sm" style={{ color: category.color_hex }}>
                      {category.category_name}
                    </span>
                  </div>
                  <HierarchyBadges
                    group={hierarchy.group}
                    subgroup={hierarchy.subgroup}
                    subsubgroup={hierarchy.subsubgroup}
                    color={category.color_hex}
                    size="sm"
                  />
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="right" className="w-80">
              <div className="space-y-3">
                <div className="text-sm font-semibold border-b pb-2">Classificação Hierárquica</div>
                
                <div><strong>Categoria:</strong> {category.category_name}</div>
                <div><strong>Confiança:</strong> {confidence}%</div>
                
                <div><strong>Hierarquia:</strong></div>
                <HierarchyBadges
                  group={hierarchy.group}
                  subgroup={hierarchy.subgroup}
                  subsubgroup={hierarchy.subsubgroup}
                  color={category.color_hex}
                  size="md"
                  className="ml-2"
                />

                <div className="mt-3 pt-2 border-t">
                  <div><strong>Defeito Original:</strong></div>
                  <div className="text-sm bg-gray-100 p-2 rounded mt-1">
                    {classification.original_defect_description}
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Versão completa (não compacta)
    return (
      <Card className={`${className} border-2 hover:shadow-lg transition-all duration-300`} 
            style={{ borderColor: category.color_hex }}>
        <CardContent className="p-4">
          {/* Header com IA */}
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-5 w-5" style={{ color: category.color_hex }} />
            <div className="flex-1">
              <div className="font-semibold" style={{ color: category.color_hex }}>
                {category.category_name}
              </div>
              <div className="text-sm text-gray-500">Classificado por IA • {confidence}% confiança</div>
            </div>
          </div>

          {/* Hierarquia Clean */}
          <div className="mb-4">
            <HierarchyBadges
              group={hierarchy.group}
              subgroup={hierarchy.subgroup}
              subsubgroup={hierarchy.subsubgroup}
              color={category.color_hex}
              size="md"
            />
          </div>

          {/* Footer com defeito original */}
          {classification.original_defect_description && (
            <div className="pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500 mb-1">DEFEITO ORIGINAL:</div>
              <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded border-l-2"
                   style={{ borderLeftColor: category.color_hex }}>
                {classification.original_defect_description}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Fallback para defeito não classificado
  const rawDefect = order.raw_defect_description || 'Não informado';
  
  return (
    <Card className={`${className} border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all duration-200`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-700">Não Classificado</div>
            <div className="text-xs text-gray-500 mt-1">
              {rawDefect.length > 60 ? `${rawDefect.substring(0, 60)}...` : rawDefect}
            </div>
          </div>
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
            Pendente IA
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};