import { Menu, RotateCw } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Header({ 
  title, 
  subtitle, 
  onMenuClick, 
  showMenuButton = true 
}: HeaderProps) {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        {/* Botão do menu (apenas em mobile) */}
        {showMenuButton && (
          <button
            className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
            onClick={onMenuClick}
          >
            <Menu size={20} className="text-foreground" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {subtitle && (
            <>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{subtitle}</span>
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RotateCw className="h-4 w-4" />
        <span>Atualizado agora</span>
      </div>
    </header>
  );
}