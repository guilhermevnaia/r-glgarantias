import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import NotFound from "./pages/NotFound";

const App = () => (
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  </BrowserRouter>
);

export default App;