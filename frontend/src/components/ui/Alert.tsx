import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps {
  variant?: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
}

export function Alert({ variant = 'info', title, children }: AlertProps) {
  const getAlertConfig = () => {
    switch (variant) {
      case 'error':
        return {
          containerClass: 'bg-red-50 border-red-200 text-red-800',
          iconClass: 'text-red-500',
          icon: XCircle
        };
      case 'success':
        return {
          containerClass: 'bg-green-50 border-green-200 text-green-800',
          iconClass: 'text-green-500',
          icon: CheckCircle
        };
      case 'warning':
        return {
          containerClass: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          iconClass: 'text-yellow-500',
          icon: AlertTriangle
        };
      default:
        return {
          containerClass: 'bg-blue-50 border-blue-200 text-blue-800',
          iconClass: 'text-blue-500',
          icon: Info
        };
    }
  };

  const config = getAlertConfig();
  const IconComponent = config.icon;

  return (
    <div className={`flex gap-3 p-4 rounded-lg border ${config.containerClass}`}>
      <div className="flex-shrink-0 mt-0.5">
        <IconComponent size={20} className={config.iconClass} />
      </div>
      
      <div className="flex-1">
        {title && (
          <div className="font-bold mb-1">
            {title}
          </div>
        )}
        <div className="text-sm">
          {children}
        </div>
      </div>
    </div>
  );
}