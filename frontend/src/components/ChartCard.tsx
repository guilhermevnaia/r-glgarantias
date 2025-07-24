import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  height?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  children,
  className = '',
  height = 'h-80'
}) => {
  return (
    <Card className={`
      bg-white/80 backdrop-blur-sm 
      border-apple-gray-200 
      shadow-apple-md hover:shadow-apple-lg
      transition-all duration-300 ease-out
      ${className}
    `}>
      <CardHeader className="pb-4 border-b border-apple-gray-100">
        <CardTitle className="text-xl font-semibold text-apple-gray-900">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-apple-gray-500 font-medium">
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

export default ChartCard;

