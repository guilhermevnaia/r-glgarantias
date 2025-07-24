import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/orders" element={<div>Ordens de Serviço (Em desenvolvimento)</div>} />
            <Route path="/analysis" element={<div>Análises (Em desenvolvimento)</div>} />
            <Route path="/defects" element={<div>Defeitos (Em desenvolvimento)</div>} />
            <Route path="/mechanics" element={<div>Mecânicos (Em desenvolvimento)</div>} />
            <Route path="/reports" element={<div>Relatórios (Em desenvolvimento)</div>} />
            <Route path="/settings" element={<div>Configurações (Em desenvolvimento)</div>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
