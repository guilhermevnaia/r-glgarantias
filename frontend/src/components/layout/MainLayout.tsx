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

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
  };

  const mainAreaStyle: React.CSSProperties = {
    marginLeft: window.innerWidth >= 1024 ? '200px' : '0',
    transition: 'margin-left 0.3s ease-in-out',
  };

  const contentStyle: React.CSSProperties = {
    padding: '1.5rem',
  };

  return (
    <div style={containerStyle}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Área principal */}
      <div style={mainAreaStyle}>
        {/* Header */}
        <Header 
          title={title}
          subtitle={subtitle}
          onMenuClick={toggleSidebar}
        />

        {/* Conteúdo principal */}
        <main style={contentStyle}>
          {children}
        </main>
      </div>
    </div>
  );
}