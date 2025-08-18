import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import React, { lazy, Suspense } from "react";

// ⚡ Lazy loading para melhorar performance de navegação
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Upload = lazy(() => import("./pages/Upload"));
const Defects = lazy(() => import("./pages/Defects"));
const Mechanics = lazy(() => import("./pages/Mechanics"));
const Reports = lazy(() => import("./pages/Reports"));
const ServiceOrders = lazy(() => import("./pages/ServiceOrders"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));

// ⚡ Preload páginas críticas para melhor UX
const preloadCriticalPages = () => {
  // Preload páginas mais acessadas após 2 segundos
  setTimeout(() => {
    import("./pages/ServiceOrders");
    import("./pages/Defects");
    import("./pages/Mechanics");
  }, 2000);
};

// Componente de Loading
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-pulse space-y-4 w-full max-w-4xl p-6">
      <div className="h-8 bg-gray-300 rounded w-1/4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        <div className="h-4 bg-gray-300 rounded w-2/3"></div>
      </div>
    </div>
  </div>
);

// ⚡ Query Client otimizado para melhor performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 30 * 60 * 1000, // 30 minutos
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1, // Reduzir tentativas de retry
    },
  },
});

// Componente que precisa acessar o contexto de auth
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  
  // ⚡ Preload páginas críticas quando usuário está autenticado
  React.useEffect(() => {
    if (isAuthenticated) {
      preloadCriticalPages();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    );
  }

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/orders" element={<ServiceOrders />} />
          <Route path="/defects" element={<Defects />} />
          <Route path="/mechanics" element={<Mechanics />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
