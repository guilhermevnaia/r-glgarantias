import { useState } from 'react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems = [
  { label: 'Dashboard', path: '/', icon: '🏠' },
  { label: 'Ordens de Serviço', path: '/service-orders', icon: '📋' },
  { label: 'Upload Excel', path: '/upload', icon: '📤' },
  { label: 'Análises', path: '/analytics', icon: '📊' },
  { label: 'Defeitos', path: '/defects', icon: '⚠️' },
  { label: 'Mecânicos', path: '/mechanics', icon: '👥' },
  { label: 'Relatórios', path: '/reports', icon: '📈' },
  { label: 'Configurações', path: '/settings', icon: '⚙️' },
];

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const handleItemClick = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
    if (onClose) onClose();
  };

  const sidebarStyle: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    top: 0,
    width: '200px',
    height: '100vh',
    backgroundColor: '#1f2937',
    color: 'white',
    zIndex: 50,
    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.3s ease-in-out',
  };

  const headerStyle: React.CSSProperties = {
    padding: '1.5rem',
    borderBottom: '1px solid #374151',
    textAlign: 'center',
  };

  const logoStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '0.25rem',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#d1d5db',
  };

  const menuStyle: React.CSSProperties = {
    padding: '1rem',
  };

  const getItemStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '0.5rem',
    backgroundColor: isActive ? '#1e40af' : 'transparent',
    color: isActive ? 'white' : '#d1d5db',
    transition: 'all 0.2s ease',
  });

  const footerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '1rem',
    borderTop: '1px solid #374151',
    fontSize: '0.75rem',
    color: '#9ca3af',
    textAlign: 'center',
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
            display: window.innerWidth >= 1024 ? 'none' : 'block',
          }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div style={sidebarStyle}>
        {/* Logo/Cabeçalho */}
        <div style={headerStyle}>
          <h1 style={logoStyle}>LÚCIO</h1>
          <p style={subtitleStyle}>Retíficas de Motores</p>
        </div>

        {/* Menu de Navegação */}
        <nav style={menuStyle}>
          {menuItems.map((item) => {
            const isActive = currentPath === item.path;
            
            return (
              <div
                key={item.path}
                style={getItemStyle(isActive)}
                onClick={() => handleItemClick(item.path)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#374151';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#d1d5db';
                  }
                }}
              >
                <span style={{ fontSize: '1.125rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        {/* Rodapé da Sidebar */}
        <div style={footerStyle}>
          <p>Sistema de Análise</p>
          <p>v2.0.0</p>
        </div>
      </div>
    </>
  );
}