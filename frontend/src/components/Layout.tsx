import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardFilters } from "@/components/DashboardFilters";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { RefreshCw, LogOut, User } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isDashboard = location.pathname === '/';
  const { user, logout } = useAuth();
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleExport = () => {
    // Implementar exportação dos dados
    console.log('Exportando dados do dashboard...');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-white">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  GLúcio - Análise das Garantias
                </h2>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4" />
                <span>Atualizado agora</span>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {user?.name}
                </span>
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                  {user?.role}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 mx-auto w-full">
            {isDashboard ? (
              React.cloneElement(children as React.ReactElement, {
                selectedMonth,
                selectedYear,
                onMonthChange: setSelectedMonth,
                onYearChange: setSelectedYear
              })
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}