import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface AppleCardProps {
  title: string;
  value: string | number | React.ReactNode;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  gradient?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  status?: 'good' | 'warning' | 'bad' | 'neutral';
  className?: string;
}

const gradientClasses = {
  blue: 'bg-white border-black',
  green: 'bg-white border-black',
  orange: 'bg-white border-black',
  purple: 'bg-white border-black',
  red: 'bg-white border-black'
};

const iconClasses = {
  blue: 'text-apple-blue bg-blue-50',
  green: 'text-apple-green bg-green-50',
  orange: 'text-apple-orange bg-orange-50',
  purple: 'text-apple-purple bg-purple-50',
  red: 'text-apple-red bg-red-50'
};

const textClasses = {
  blue: 'text-black',
  green: 'text-black',
  orange: 'text-black',
  purple: 'text-black',
  red: 'text-black'
};

const valueClasses = {
  blue: 'text-black',
  green: 'text-black',
  orange: 'text-black',
  purple: 'text-black',
  red: 'text-black'
};

const statusIndicators = {
  good: { emoji: '🟢', color: 'text-green-600' },
  warning: { emoji: '🟡', color: 'text-yellow-600' },
  bad: { emoji: '🔴', color: 'text-red-600' },
  neutral: { emoji: '⚫', color: 'text-gray-600' }
};

export const AppleCard: React.FC<AppleCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  gradient = 'blue',
  status = 'neutral',
  className = ''
}) => {
  return (
    <Card className={`
      ${gradientClasses[gradient]} 
      shadow-md hover:shadow-lg 
      transition-all duration-300 ease-out
      hover:-translate-y-1
      border-2
      ${className}
    `}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`text-sm font-medium ${textClasses[gradient]} mb-1`}>
              {title}
            </p>
            <div className={`text-3xl font-bold ${valueClasses[gradient]} mb-1`}>
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </div>
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
            shadow-sm
          `}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppleCard;

