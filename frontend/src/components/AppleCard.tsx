import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface AppleCardProps {
  title: string;
  value: string | number | React.ReactNode;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean; // isPositive means improvement (less is better)
  };
  gradient?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
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

export const AppleCard: React.FC<AppleCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  gradient = 'blue',
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
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className={`text-xs sm:text-sm font-medium ${textClasses[gradient]} mb-1 truncate`}>
              {title}
            </p>
            <div className={`text-xl sm:text-3xl font-bold ${valueClasses[gradient]} mb-2 break-words`}>
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </div>
            {trend && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium truncate">
                  {trend.value}
                </span>
              </div>
            )}
          </div>
          <div className={`
            p-2 sm:p-3 rounded-xl ${iconClasses[gradient]}
            shadow-sm flex-shrink-0 ml-2
          `}>
            <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppleCard;

