import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Brain, AlertCircle } from 'lucide-react';

interface ClassifiedDefectProps {
  order: any;
  classification?: any;
  showConfidence?: boolean;
  showIcon?: boolean;
  className?: string;
}

export const ClassifiedDefect: React.FC<ClassifiedDefectProps> = ({
  order,
  classification,
  showConfidence = false,
  showIcon = true,
  className = ""
}) => {
  // Se tem classificação da IA, usar ela
  if (classification && classification.defect_categories) {
    const category = classification.defect_categories;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`${className} text-xs`}
              style={{ 
                backgroundColor: `${category.color_hex}20`,
                borderColor: category.color_hex,
                color: category.color_hex
              }}
            >
              {showIcon && <Brain className="h-3 w-3 mr-1" />}
              {category.category_name}
              {showConfidence && (
                <span className="ml-1 opacity-75">
                  ({Math.round(classification.ai_confidence * 100)}%)
                </span>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p><strong>Categoria:</strong> {category.category_name}</p>
              <p><strong>Confiança:</strong> {Math.round(classification.ai_confidence * 100)}%</p>
              <p><strong>Defeito Original:</strong> {classification.original_defect_description}</p>
              {classification.ai_reasoning && (
                <p><strong>Razão:</strong> {classification.ai_reasoning}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Fallback para defeito bruto
  const rawDefect = order.raw_defect_description || 'Não informado';
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${className} bg-gray-50 text-gray-700 border-gray-300 text-xs`}>
            {showIcon && <AlertCircle className="h-3 w-3 mr-1" />}
            {rawDefect.length > 20 ? `${rawDefect.substring(0, 20)}...` : rawDefect}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p><strong>Defeito Bruto:</strong> {rawDefect}</p>
            <p className="text-yellow-600">⚠️ Não classificado pela IA</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Componente para exibir defeito em formato de texto simples
 */
export const ClassifiedDefectText: React.FC<{
  order: any;
  classification?: any;
  maxLength?: number;
}> = ({ order, classification, maxLength = 50 }) => {
  if (classification && classification.defect_categories) {
    return (
      <span className="font-medium" style={{ color: classification.defect_categories.color_hex }}>
        {classification.defect_categories.category_name}
      </span>
    );
  }

  const rawDefect = order.raw_defect_description || 'Não informado';
  const displayText = maxLength && rawDefect.length > maxLength 
    ? `${rawDefect.substring(0, maxLength)}...` 
    : rawDefect;

  return <span className="text-gray-600">{displayText}</span>;
};