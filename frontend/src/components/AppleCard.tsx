import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface AppleCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  gradient?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  className?: string;
}

const gradientClasses = {
  blue: 'from-blue-50 to-cyan-50 border-blue-100',
  green: 'from-green-50 to-emerald-50 border-green-100',
  orange: 'from-orange-50 to-amber-50 border-orange-100',
  purple: 'from-purple-50 to-violet-50 border-purple-100',
  red: 'from-red-50 to-rose-50 border-red-100'
};

const iconClasses = {
  blue: 'text-apple-blue bg-blue-50',
  green: 'text-apple-green bg-green-50',
  orange: 'text-apple-orange bg-orange-50',
  purple: 'text-apple-purple bg-purple-50',
  red: 'text-apple-red bg-red-50'
};

const textClasses = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  orange: 'text-orange-600',
  purple: 'text-purple-600',
  red: 'text-red-600'
};

const valueClasses = {
  blue: 'text-blue-900',
  green: 'text-green-900',
  orange: 'text-orange-900',
  purple: 'text-purple-900',
  red: 'text-red-900'
};

export const AppleCard: React.FC<AppleCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  gradient = 'blue',
  className = ''
}) => {
  return (
    <Card className={`
      bg-gradient-to-br ${gradientClasses[gradient]} 
      shadow-apple-md hover:shadow-apple-lg 
      transition-all duration-300 ease-out
      hover:-translate-y-1
      border-0
      ${className}
    `}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`text-sm font-medium ${textClasses[gradient]} mb-1`}>
              {title}
            </p>
            <p className={`text-3xl font-bold ${valueClasses[gradient]} mb-1`}>
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </p>
            {subtitle && (
              <p className={`text-sm ${textClasses[gradient]}`}>
                {subtitle}
              </p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <span className={`text-sm font-medium ${
                  trend.isPositive ? 'text-apple-green' : 'text-apple-red'
                }`}>
                  {trend.value}
                </span>
                <span className="text-sm text-apple-gray-500">vs mês anterior</span>
              </div>
            )}
          </div>
          <div className={`
            p-3 rounded-xl ${iconClasses[gradient]}
            shadow-apple-sm
          `}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppleCard;

