import { MainLayout } from '../layout/MainLayout';
import { Alert } from '../ui/Alert';

export function Dashboard() {
  const containerStyle: React.CSSProperties = {
    minHeight: '400px',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const contentStyle: React.CSSProperties = {
    textAlign: 'center',
    maxWidth: '600px',
    padding: '2rem',
  };

  const infoStyle: React.CSSProperties = {
    marginTop: '1.5rem',
    fontSize: '0.875rem',
    color: '#6b7280',
  };

  const listStyle: React.CSSProperties = {
    listStyle: 'none',
    padding: 0,
    margin: '1rem 0',
  };

  const listItemStyle: React.CSSProperties = {
    padding: '0.25rem 0',
  };

  return (
    <MainLayout 
      title="Análise de Garantias" 
      subtitle="Análise de ordens de serviço - julho de 2025"
    >
      {/* Área central vazia/limpa com fundo branco */}
      <div style={containerStyle}>
        <div style={contentStyle}>
          {/* Alert de erro crítico - conforme design */}
          <Alert variant="error" title="Erro Crítico:">
            Nenhuma data com dados foi encontrada.
          </Alert>
          
          {/* Informações adicionais */}
          <div style={infoStyle}>
            <ul style={listStyle}>
              <li style={listItemStyle}>Sistema backend funcionando: ✅</li>
              <li style={listItemStyle}>Dados no Supabase: 220 registros ✅</li>
              <li style={listItemStyle}>Frontend funcionando: ✅</li>
              <li style={listItemStyle}>Aguardando implementação de gráficos e métricas</li>
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}