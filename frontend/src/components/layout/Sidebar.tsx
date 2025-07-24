import { NavLink } from "react-router-dom";
import {
  Home,
  ClipboardList,
  Upload,
  BarChart3,
  AlertTriangle,
  Users,
  FileBarChart,
  Settings,
} from "lucide-react";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Ordens de Serviço", url: "/orders", icon: ClipboardList },
  { title: "Upload Excel", url: "/upload", icon: Upload },
  { title: "Análises", url: "/analysis", icon: BarChart3 },
  { title: "Defeitos", url: "/defects", icon: AlertTriangle },
  { title: "Mecânicos", url: "/mechanics", icon: Users },
  { title: "Relatórios", url: "/reports", icon: FileBarChart },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function Sidebar() {
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium shadow-soft border-2 border-primary" 
      : "hover:bg-secondary/80 hover:text-foreground transition-colors border-2 border-transparent";

  return (
    <div className="border-r border-border bg-card" style={{ width: '16rem' }}>
      <div className="p-4">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-foreground">Retífica LÚCIO</h1>
            <p className="text-xs text-muted-foreground">Sistema de Análises</p>
          </div>
        </div>

        {/* Menu */}
        <div>
          <div className="text-muted-foreground text-xs uppercase tracking-wider mb-4">
            Menu Principal
          </div>

          <div className="space-y-2">
            {menuItems.map((item) => (
              <NavLink 
                key={item.title}
                to={item.url} 
                end 
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${getNavCls({ isActive })}`
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.title}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}