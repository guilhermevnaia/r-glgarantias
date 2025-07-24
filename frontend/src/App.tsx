import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/pages/Dashboard';
import { UploadExcel } from './components/pages/UploadExcel';
import { ServiceOrders } from './components/pages/ServiceOrders';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/upload" element={<UploadExcel />} />
        <Route path="/orders" element={<ServiceOrders />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;