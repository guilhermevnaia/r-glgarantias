import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  ClipboardList,
  Upload,
  BarChart3,
  AlertTriangle,
  Users,
  FileBarChart,
  Settings,
  Menu,
  X
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

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

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium shadow-soft border-2 border-primary" 
      : "hover:bg-secondary/80 hover:text-foreground transition-colors border-2 border-transparent";

  return (
    <Sidebar
      className="border-r border-border bg-card"
      collapsible="icon"
    >
      <SidebarContent className="p-4">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          {!isCollapsed && (
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-foreground">Retífica GLÚCIO</h1>
              <p className="text-xs text-muted-foreground">Sistema de Análises</p>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">G</span>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider mb-4">
            {!isCollapsed && "Menu Principal"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${getNavCls({ isActive })}`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="text-sm font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}