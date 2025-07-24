import { useState, useEffect } from 'react';
import { MainLayout } from '../layout/MainLayout';
import { Card } from '../ui/Card';  
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { uploadService } from '../../services/api';
import type { ServiceOrder } from '../../services/types';
import { Search, Filter, Eye, FileText, Calendar } from 'lucide-react';

export function ServiceOrders() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const ordersPerPage = 20;

  useEffect(() => {
    loadOrders();
  }, [currentPage]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Tentar carregar dados reais do backend
      const result = await uploadService.getServiceOrders(currentPage, ordersPerPage);
      setOrders(result.data);
      setTotalOrders(result.total);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar ordens:', err);
      setError('Erro ao carregar ordens de serviço. Usando dados simulados. Verifique se o backend está rodando na porta 3006.');
      
      // Fallback para dados mock em caso de erro
      const mockOrders: ServiceOrder[] = Array.from({ length: ordersPerPage }, (_, i) => ({
        id: (currentPage - 1) * ordersPerPage + i + 1,
        order_number: `OS-${String((currentPage - 1) * ordersPerPage + i + 1).padStart(6, '0')}`,
        order_date: new Date(2019 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        order_status: ['G', 'GO', 'GU'][Math.floor(Math.random() * 3)] as 'G' | 'GO' | 'GU',
        engine_manufacturer: ['MWM', 'Mercedes-Benz', 'Cummins', 'Perkins', 'Volkswagen'][Math.floor(Math.random() * 5)],
        engine_description: `Motor ${['4.0L', '6.0L', '8.0L', '12.0L', '16.0L'][Math.floor(Math.random() * 5)]}`,
        vehicle_model: ['Agrale', 'Iveco', 'Mercedes', 'Volvo', 'Scania'][Math.floor(Math.random() * 5)],
        raw_defect_description: ['Problema no motor', 'Vazamento de óleo', 'Superaquecimento', 'Ruído anormal'][Math.floor(Math.random() * 4)],
        responsible_mechanic: ['João Silva', 'Pedro Santos', 'Carlos Lima', 'Ana Costa'][Math.floor(Math.random() * 4)],
        parts_total: Math.random() * 5000 + 500,
        labor_total: Math.random() * 2000 + 200,
        grand_total: 0,
      })).map(order => ({
        ...order,
        grand_total: (order.parts_total || 0) + (order.labor_total || 0)
      }));

      setOrders(mockOrders);
      setTotalOrders(2519); // Total conhecido dos dados reais
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.engine_manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.vehicle_model?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || order.order_status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(totalOrders / ordersPerPage);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'G': 'Garantia',
      'GO': 'Garantia Outros',
      'GU': 'Garantia Usados'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'G': 'bg-green-100 text-green-800',
      'GO': 'bg-blue-100 text-blue-800', 
      'GU': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <MainLayout 
        title="Ordens de Serviço" 
        subtitle="Listagem completa das ordens de serviço"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-text-secondary">Carregando ordens...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout 
        title="Ordens de Serviço" 
        subtitle="Listagem completa das ordens de serviço"
      >
        <Alert variant="error" title="Erro ao Carregar Dados">
          {error}
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Ordens de Serviço" 
      subtitle={`${totalOrders.toLocaleString()} ordens registradas no sistema`}
    >
      {/* Filtros e busca */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Campo de busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por número da ordem, fabricante ou modelo..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro de status */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">Todos os Status</option>
              <option value="G">Garantia</option>
              <option value="GO">Garantia Outros</option>
              <option value="GU">Garantia Usados</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tabela de ordens */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número da Ordem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fabricante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modelo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {order.order_number}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {new Date(order.order_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.order_status)}`}>
                      {getStatusLabel(order.order_status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.engine_manufacturer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.vehicle_model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    R$ {order.grand_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span>Página {currentPage} de {totalPages}</span>
                <span>•</span>
                <span>{totalOrders.toLocaleString()} registros</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Anterior
                </Button>
                
                {/* Números das páginas */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "primary" : "ghost"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </MainLayout>
  );
}