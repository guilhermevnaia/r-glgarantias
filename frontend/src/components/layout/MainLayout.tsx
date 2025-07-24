import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex">
      {/* Sidebar - Desktop always visible, Mobile overlay */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={closeSidebar}>
          <div className="w-sidebar transform animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}
      
      {/* Área principal */}
      <div className="flex-1 md:ml-sidebar min-h-screen flex flex-col">
        {/* Header */}
        <Header 
          title={title}
          subtitle={subtitle}
          onMenuClick={toggleSidebar}
        />
        
        {/* Conteúdo principal com gradiente sutil */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-gradient-to-b from-transparent to-background-secondary/20">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}