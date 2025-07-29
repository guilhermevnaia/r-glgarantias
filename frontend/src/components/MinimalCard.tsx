import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MinimalCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';
  className?: string;
}

const iconColorClasses = {
  blue: 'icon-blue',
  green: 'icon-green', 
  yellow: 'icon-yellow',
  red: 'icon-red',
  purple: 'icon-purple',
  orange: 'icon-orange'
};

export const MinimalCard: React.FC<MinimalCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'blue',
  className = ''
}) => {
  return (
    <Card className={`minimal-card ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium minimal-text-secondary mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold minimal-text-primary mb-1">
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </p>
            {subtitle && (
              <p className="text-sm minimal-text-muted">
                {subtitle}
              </p>
            )}
          </div>
          <div className="ml-4">
            <Icon className={`h-6 w-6 ${iconColorClasses[iconColor]}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MinimalCard;

