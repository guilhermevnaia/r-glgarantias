interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function Card({ children, title, subtitle, className }: CardProps) {
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    padding: '1.5rem',
    borderBottom: '1px solid #e5e7eb',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginTop: '0.25rem',
    margin: 0,
  };

  const contentStyle: React.CSSProperties = {
    padding: '1.5rem',
  };

  return (
    <div style={cardStyle} className={className}>
      {(title || subtitle) && (
        <div style={headerStyle}>
          {title && (
            <h3 style={titleStyle}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p style={subtitleStyle}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
}