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

  return (
    <Sidebar
      className="border-r border-border bg-card"
      collapsible="icon"
    >
      <SidebarContent className={isCollapsed ? "p-2" : "p-4"}>
        <SidebarGroup>
          <div className="flex flex-col items-center mb-4 px-2">
            {isCollapsed ? (
              <img src="/images/logo%20compacta.png" alt="Retífica GLÚCIO Logo" className="h-12 w-12" />
            ) : (
              <img src="/images/logo.png" alt="Retífica GLÚCIO Logo" className="h-20 object-contain mx-auto mb-2" />
            )}
            {!isCollapsed && (
              <span className="text-foreground text-base font-semibold text-center">
                Menu Principal
              </span>
            )}
          </div>

          <SidebarGroupContent>
            <SidebarMenu className={isCollapsed ? "!gap-0 !space-y-0" : "gap-1"}>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title} className={isCollapsed ? "!mb-0" : ""}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={`flex items-center gap-3 rounded-lg transition-all duration-200 ${isCollapsed ? 'justify-center px-1 py-1' : 'px-3 py-3'}`}
                    >
                      <item.icon className={`${isCollapsed ? 'h-6 w-6' : 'h-6 w-6'} flex-shrink-0`} />
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