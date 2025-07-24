import { MainLayout } from '../components/layout/MainLayout';

export default function NotFound() {
  return (
    <MainLayout title="Página não encontrada">
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>404</h1>
        <p>A página que você procura não existe.</p>
      </div>
    </MainLayout>
  );
} 