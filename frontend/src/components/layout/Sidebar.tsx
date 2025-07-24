import { Link, useLocation } from 'react-router-dom';
import { Home, Upload, FileText, BarChart3, Settings, Database } from 'lucide-react';

const menuItems = [
  { label: 'Dashboard', path: '/', icon: Home },
  { label: 'Upload Excel', path: '/upload', icon: Upload },
  { label: 'Ordens de Serviço', path: '/orders', icon: FileText },
  { label: 'Relatórios', path: '/reports', icon: BarChart3 },
  { label: 'Configurações', path: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  
  return (
    <aside className="fixed top-0 left-0 h-full w-sidebar bg-background-card border-r border-border flex flex-col z-30 shadow-2xl backdrop-blur-xl">
      {/* Logo Section */}
      <div className="p-6 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">LÚCIO</h1>
            <p className="text-xs text-foreground-muted">Retíficas de Motores</p>
          </div>
        </div>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 mt-6 px-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                  isActive 
                    ? 'bg-gradient-to-r from-primary to-primary-600 text-white shadow-lg shadow-primary/25 transform scale-[1.02]' 
                    : 'text-foreground-muted hover:bg-background-hover hover:text-foreground hover:shadow-md hover:scale-[1.01]'
                }`}
              >
                <IconComponent 
                  size={20} 
                  className={`${isActive ? 'text-white' : 'text-foreground-muted group-hover:text-foreground'} transition-colors duration-300`} 
                />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/30 rounded-l-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Status Section */}
      <div className="p-4 mt-auto">
        <div className="bg-gradient-to-br from-background-card to-background-hover rounded-xl p-4 border border-border shadow-lg">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-3 h-3 bg-gradient-to-r from-success to-green-400 rounded-full animate-pulse shadow-lg"></div>
            <span className="text-sm text-foreground font-medium">Sistema Online</span>
          </div>
          <p className="text-xs text-foreground-muted mb-3">2.519 registros processados</p>
          <div className="bg-background rounded-full h-2 shadow-inner overflow-hidden">
            <div 
              className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-1000 shadow-sm" 
              style={{ width: '85%' }}
            ></div>
          </div>
        </div>
      </div>
    </aside>
  );
}