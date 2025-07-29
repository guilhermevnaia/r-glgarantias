import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface MinimalChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  height?: string;
}

export const MinimalChartCard: React.FC<MinimalChartCardProps> = ({
  title,
  description,
  children,
  className = '',
  height = 'h-80'
}) => {
  return (
    <Card className={`minimal-card ${className}`}>
      <CardHeader className="pb-4 minimal-border border-b">
        <CardTitle className="text-xl font-semibold minimal-text-primary">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="minimal-text-muted font-medium">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={`p-6 ${height}`}>
        {children}
      </CardContent>
    </Card>
  );
};

export default MinimalChartCard;

