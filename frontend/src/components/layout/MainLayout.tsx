import React from 'react';
import { Sidebar } from './Sidebar';
import { Menu, RotateCw } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const toggleSidebar = () => {
    // Mobile sidebar functionality can be added later
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
              onClick={toggleSidebar}
            >
              <Menu size={20} className="text-foreground" />
            </button>
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

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}