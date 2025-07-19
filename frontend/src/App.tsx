import { useState, useEffect } from 'react';
import { Dashboard } from './components/pages/Dashboard';
import { UploadExcel } from './components/pages/UploadExcel';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Escutar mudanças na URL
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/upload') {
        setCurrentPage('upload');
      } else if (path === '/') {
        setCurrentPage('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState(); // Verificar URL inicial

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Renderizar página baseada na rota atual
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'upload':
        return <UploadExcel />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return renderCurrentPage();
}

export default App;