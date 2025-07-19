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
          background: '#fef2f2',
          border: '#fecaca',
          color: '#991b1b',
          icon: '⚠️'
        };
      case 'success':
        return {
          background: '#f0fdf4',
          border: '#bbf7d0',
          color: '#166534',
          icon: '✅'
        };
      case 'warning':
        return {
          background: '#fffbeb',
          border: '#fde68a',
          color: '#92400e',
          icon: '⚠️'
        };
      default:
        return {
          background: '#eff6ff',
          border: '#dbeafe',
          color: '#1e40af',
          icon: 'ℹ️'
        };
    }
  };

  const config = getAlertConfig();

  const alertStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: `1px solid ${config.border}`,
    backgroundColor: config.background,
    color: config.color,
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    marginTop: '0.125rem',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
  };

  const titleStyle: React.CSSProperties = {
    fontWeight: 'bold',
    marginBottom: title ? '0.25rem' : 0,
  };

  const textStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    margin: 0,
  };

  return (
    <div style={alertStyle}>
      <div style={iconStyle}>
        {config.icon}
      </div>
      
      <div style={contentStyle}>
        {title && (
          <div style={titleStyle}>
            {title}
          </div>
        )}
        <div style={textStyle}>
          {children}
        </div>
      </div>
    </div>
  );
}