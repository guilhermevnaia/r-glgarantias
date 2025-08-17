import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';

interface HierarchyBadgesProps {
  group?: string;
  subgroup?: string;
  subsubgroup?: string;
  color?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const HierarchyBadges: React.FC<HierarchyBadgesProps> = ({
  group,
  subgroup,
  subsubgroup,
  color = '#6B7280',
  size = 'sm',
  className = ''
}) => {
  const badgeSize = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  const chevronSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  
  const levels = [
    { label: group, type: 'group' },
    { label: subgroup, type: 'subgroup' },
    { label: subsubgroup, type: 'subsubgroup' }
  ].filter(level => level.label && level.label.trim() !== '' && level.label !== 'undefined');

  if (levels.length === 0) return null;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {levels.map((level, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight 
              className={`${chevronSize} text-gray-400`} 
              strokeWidth={1.5}
            />
          )}
          <Badge
            variant="outline"
            className={`${badgeSize} font-medium border-opacity-60 bg-opacity-5`}
            style={{
              borderColor: color,
              color: color,
              backgroundColor: `${color}10`
            }}
          >
            {level.label}
          </Badge>
        </React.Fragment>
      ))}
    </div>
  );
};