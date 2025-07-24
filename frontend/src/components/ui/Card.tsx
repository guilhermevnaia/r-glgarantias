import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ 
  children, 
  title, 
  subtitle, 
  className, 
  variant = 'default',
  padding = 'lg'
}: CardProps) {
  const cardVariants = {
    default: 'bg-gradient-to-br from-background-card to-background-card/90 border border-border shadow-lg backdrop-blur-sm',
    elevated: 'bg-gradient-to-br from-background-card to-background-card/80 border border-border shadow-2xl backdrop-blur-md hover:shadow-3xl',
    outlined: 'bg-gradient-to-br from-background-card/50 to-background-card/30 border-2 border-border shadow-lg backdrop-blur-sm'
  };

  const paddingVariants = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const contentPadding = {
    none: '',
    sm: 'p-3',
    md: 'p-4', 
    lg: 'p-6'
  };

  return (
    <div className={cn(
      'rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] hover:border-primary/20',
      cardVariants[variant],
      !title && !subtitle && paddingVariants[padding],
      className
    )}>
      {(title || subtitle) && (
        <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-background-secondary/40 to-background-hover/20">
          {title && (
            <h3 className="text-xl font-bold text-foreground leading-tight bg-gradient-to-r from-foreground to-foreground-muted bg-clip-text text-transparent">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-foreground-muted mt-2 leading-relaxed font-medium">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <div className={cn(
        (title || subtitle) && contentPadding[padding]
      )}>
        {children}
      </div>
    </div>
  );
}