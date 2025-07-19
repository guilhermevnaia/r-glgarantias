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
  const headerStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    padding: '1rem 1.5rem',
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const leftSideStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  };

  const menuButtonStyle: React.CSSProperties = {
    display: window.innerWidth >= 1024 ? 'none' : 'block',
    padding: '0.5rem',
    borderRadius: '0.375rem',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '1.25rem',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginTop: '0.25rem',
    margin: 0,
  };

  const updateButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.75rem',
    color: '#6b7280',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  };

  return (
    <header style={headerStyle}>
      <div style={containerStyle}>
        {/* Lado esquerdo: Menu + Título */}
        <div style={leftSideStyle}>
          {/* Botão do menu (apenas em mobile) */}
          {showMenuButton && (
            <button
              style={menuButtonStyle}
              onClick={onMenuClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ☰
            </button>
          )}

          {/* Título e subtítulo */}
          <div>
            <h1 style={titleStyle}>
              {title}
            </h1>
            {subtitle && (
              <p style={subtitleStyle}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Lado direito: Botão de atualização */}
        <button 
          style={updateButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span style={{ fontSize: '0.75rem' }}>🔄</span>
          <span>Atualizado agora</span>
        </button>
      </div>
    </header>
  );
}