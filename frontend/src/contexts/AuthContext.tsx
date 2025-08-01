import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  last_login?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar se há token salvo no localStorage ao inicializar
  useEffect(() => {
    const savedToken = localStorage.getItem('auth-token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser && savedUser !== 'undefined') {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error('Erro ao parsear dados do usuário:', error);
        // Limpar dados inválidos
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user');
      }
    } else {
      // Limpar dados inválidos se existirem
      if (savedToken && (!savedUser || savedUser === 'undefined')) {
        localStorage.removeItem('auth-token');
      }
      if (savedUser && (!savedToken || savedUser === 'undefined')) {
        localStorage.removeItem('user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('auth-token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes('*') || user.permissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    hasPermission,
    hasRole
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};