interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  style,
  ...props 
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: '#1e40af',
          color: 'white',
          border: 'none',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        };
      case 'secondary':
        return {
          backgroundColor: '#f3f4f6',
          color: '#111827',
          border: 'none',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: '#374151',
          border: '1px solid #d1d5db',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: '#6b7280',
          border: 'none',
        };
      default:
        return {
          backgroundColor: '#1e40af',
          color: 'white',
          border: 'none',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '0.375rem 0.75rem',
          fontSize: '0.875rem',
        };
      case 'md':
        return {
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
        };
      case 'lg':
        return {
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
        };
      default:
        return {
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
        };
    }
  };

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    borderRadius: '0.5rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (variant === 'primary') {
      e.currentTarget.style.backgroundColor = '#1d4ed8';
    } else if (variant === 'secondary') {
      e.currentTarget.style.backgroundColor = '#e5e7eb';
    } else if (variant === 'outline') {
      e.currentTarget.style.backgroundColor = '#f9fafb';
    } else if (variant === 'ghost') {
      e.currentTarget.style.backgroundColor = '#f3f4f6';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const variantStyles = getVariantStyles();
    e.currentTarget.style.backgroundColor = variantStyles.backgroundColor;
  };

  return (
    <button
      style={baseStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </button>
  );
}