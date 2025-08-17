import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HierarchyBadges } from '@/components/ui/hierarchy-badges';
import { mapToHierarchy } from '@/utils/hierarchyMapper';
import { Brain, AlertCircle } from 'lucide-react';

interface SimpleDefectCardProps {
  order: any;
  classification?: any;
  className?: string;
}

export const SimpleDefectCard: React.FC<SimpleDefectCardProps> = ({
  order,
  classification,
  className = ""
}) => {
  
  // Se tem classificação da IA, usar ela
  if (classification && classification.defect_categories) {
    const category = classification.defect_categories;
    const confidence = Math.round(classification.ai_confidence * 100);

    // Usar sistema inteligente de hierarquia
    const hierarchy = mapToHierarchy(
      category.category_name,
      classification.original_defect_description || order.raw_defect_description
    );

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`${className} px-3 py-2 rounded-lg border-2 text-sm font-medium cursor-pointer hover:shadow-sm transition-all duration-200`}
              style={{ 
                borderColor: category.color_hex,
                color: category.color_hex,
                backgroundColor: `${category.color_hex}08`
              }}
            >
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate mb-1">{category.category_name}</div>
                  <HierarchyBadges
                    group={hierarchy.group}
                    subgroup={hierarchy.subgroup}
                    subsubgroup={hierarchy.subsubgroup}
                    color={category.color_hex}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-80">
            <div className="space-y-2">
              <div className="font-semibold">Classificação da IA</div>
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
              <div><strong>Defeito Original:</strong></div>
              <div className="text-sm bg-gray-100 p-2 rounded border-l-2" style={{ borderLeftColor: category.color_hex }}>
                {classification.original_defect_description || order.raw_defect_description}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Fallback para defeito não classificado
  const rawDefect = order.raw_defect_description || 'Não informado';
  const displayText = rawDefect.length > 40 ? `${rawDefect.substring(0, 40)}...` : rawDefect;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`${className} px-3 py-2 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 text-amber-700 text-sm cursor-pointer hover:border-amber-400 transition-all duration-200`}>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="truncate flex-1">{displayText}</span>
              <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300 ml-auto">
                Pendente
              </Badge>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-80">
          <div className="space-y-2">
            <div className="font-semibold text-amber-700">Não Classificado</div>
            <div><strong>Status:</strong> Aguardando processamento da IA</div>
            <div><strong>Defeito Original:</strong></div>
            <div className="text-sm bg-gray-100 p-2 rounded">
              {rawDefect}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};