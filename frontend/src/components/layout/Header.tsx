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
    <header className="bg-background-card/90 backdrop-blur-xl border-b border-border px-4 md:px-6 lg:px-8 py-6 shadow-xl">
      <div className="flex items-center justify-between">
        {/* Lado esquerdo: Menu + Título */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Botão do menu (apenas em mobile) */}
          {showMenuButton && (
            <button
              className="md:hidden p-3 rounded-xl hover:bg-background-hover transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              onClick={onMenuClick}
            >
              <Menu size={22} className="text-foreground" />
            </button>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground-muted bg-clip-text text-transparent">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-foreground-muted mt-1 font-medium">{subtitle}</p>
            )}
          </div>
        </div>
        
        {/* Lado direito: Botão de atualização */}
        <button 
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground-muted bg-gradient-to-r from-background to-background-secondary border border-border rounded-xl hover:from-background-hover hover:to-background-card hover:border-primary/30 hover:text-foreground hover:shadow-lg transition-all duration-300 hover:scale-105"
        >
          <RotateCw size={16} className="animate-pulse" />
          <span className="hidden sm:inline font-medium">Atualizado agora</span>
          <span className="sm:hidden font-medium">Atualizado</span>
        </button>
      </div>
    </header>
  );
}