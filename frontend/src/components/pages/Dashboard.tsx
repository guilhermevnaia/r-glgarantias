import { useState, useEffect } from 'react';
import { MainLayout } from '../layout/MainLayout';
import { Alert } from '../ui/Alert';
import { Card } from '../ui/Card';
import { uploadService } from '../../services/api';
import type { Stats } from '../../services/types';
import { BarChart3, Users, Calendar, TrendingUp } from 'lucide-react';

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await uploadService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
      setError('Erro ao carregar estatísticas. Verifique se o backend está rodando na porta 3006.');
      
      // Fallback para dados mock em caso de erro
      setStats({
        totalOrders: 2519,
        statusDistribution: {
          'G': 2268,
          'GO': 191,
          'GU': 60
        },
        yearDistribution: {
          '2019': 405,
          '2020': 457,
          '2021': 388,
          '2022': 325,
          '2023': 378,
          '2024': 346,
          '2025': 220
        },
        topManufacturers: [
          { name: 'MWM', count: 173 },
          { name: 'Mercedes-Benz', count: 153 },
          { name: 'Cummins', count: 151 },
          { name: 'Perkins', count: 75 },
          { name: 'Volkswagen', count: 56 }
        ],
        recentUploads: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout 
        title="Análise de Garantias" 
        subtitle="Análise de ordens de serviço - Sistema LÚCIO"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto mb-4 shadow-lg"></div>
            <p className="text-foreground-muted font-medium">Carregando dados...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !stats) {
    return (
      <MainLayout 
        title="Análise de Garantias" 
        subtitle="Análise de ordens de serviço - Sistema LÚCIO"
      >
        <Alert variant="error" title="Erro Crítico:">
          Nenhuma data com dados foi encontrada.
        </Alert>
      </MainLayout>
    );
  }

  const statusLabels: Record<string, string> = {
    'G': 'Garantia',
    'GO': 'Garantia Outros', 
    'GU': 'Garantia Usados'
  };

  return (
    <MainLayout 
      title="Análise de Garantias" 
      subtitle="Análise de ordens de serviço - Sistema LÚCIO"
    >
      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card variant="elevated" padding="md" className="group hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-background-card to-background-card/80 border-primary/20 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground-muted">Total de Ordens</p>
              <p className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                {stats.totalOrders.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl shadow-lg group-hover:shadow-xl group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="md" className="group hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-background-card to-background-card/80 border-success/20 hover:border-success/40 hover:shadow-2xl hover:shadow-success/10">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground-muted">Fabricantes</p>
              <p className="text-3xl font-bold text-foreground group-hover:text-success transition-colors duration-300">
                {stats.topManufacturers.length}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-success/20 to-success/10 rounded-xl shadow-lg group-hover:shadow-xl group-hover:from-success/30 group-hover:to-success/20 transition-all duration-300">
              <Users className="h-8 w-8 text-success" />
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="md" className="group hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-background-card to-background-card/80 border-warning/20 hover:border-warning/40 hover:shadow-2xl hover:shadow-warning/10">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground-muted">Período</p>
              <p className="text-3xl font-bold text-foreground group-hover:text-warning transition-colors duration-300">
                2019-2025
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-warning/20 to-warning/10 rounded-xl shadow-lg group-hover:shadow-xl group-hover:from-warning/30 group-hover:to-warning/20 transition-all duration-300">
              <Calendar className="h-8 w-8 text-warning" />
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="md" className="group hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-background-card to-background-card/80 border-accent/20 hover:border-accent/40 hover:shadow-2xl hover:shadow-accent/10">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground-muted">Taxa Garantia</p>
              <p className="text-3xl font-bold text-foreground group-hover:text-accent transition-colors duration-300">
                90%
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-accent/20 to-accent/10 rounded-xl shadow-lg group-hover:shadow-xl group-hover:from-accent/30 group-hover:to-accent/20 transition-all duration-300">
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
          </div>
        </Card>
      </div>

      {/* Distribuição por Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card 
          title="Distribuição por Status" 
          subtitle="Análise dos tipos de garantia processados"
          variant="elevated"
        >
          <div className="space-y-4">
            {Object.entries(stats.statusDistribution).map(([status, count]) => {
              const percentage = ((count / stats.totalOrders) * 100).toFixed(1);
              const statusColors = {
                'G': 'bg-success',
                'GO': 'bg-primary', 
                'GU': 'bg-warning'
              };
              
              return (
                <div key={status} className="group p-3 rounded-lg hover:bg-background-secondary transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-4 h-4 rounded-full ${statusColors[status as keyof typeof statusColors] || 'bg-gray-400'} group-hover:scale-110 transition-transform duration-200`}></div>
                      <div>
                        <span className="text-base font-semibold text-foreground">
                          {statusLabels[status] || status}
                        </span>
                        <p className="text-sm text-foreground-muted">
                          {percentage}% do total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-foreground">{count.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-2 bg-background-secondary rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${statusColors[status as keyof typeof statusColors] || 'bg-gray-400'}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card 
          title="Top Fabricantes" 
          subtitle="Principais marcas de motores processadas"
          variant="elevated"
        >
          <div className="space-y-4">
            {stats.topManufacturers.map((manufacturer, index) => {
              const percentage = ((manufacturer.count / stats.totalOrders) * 100).toFixed(1);
              const rankColors = [
                'bg-gradient-to-r from-yellow-400 to-yellow-600',
                'bg-gradient-to-r from-gray-300 to-gray-500', 
                'bg-gradient-to-r from-orange-400 to-orange-600',
                'bg-gradient-to-r from-blue-400 to-blue-600',
                'bg-gradient-to-r from-purple-400 to-purple-600'
              ];
              
              return (
                <div key={manufacturer.name} className="group p-3 rounded-lg hover:bg-background-secondary transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 ${rankColors[index] || 'bg-gray-400'} rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                        <span className="text-sm font-bold text-white">#{index + 1}</span>
                      </div>
                      <div>
                        <span className="text-base font-semibold text-foreground">
                          {manufacturer.name}
                        </span>
                        <p className="text-sm text-foreground-muted">
                          {percentage}% do total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-foreground">{manufacturer.count}</p>
                    </div>
                  </div>
                  <div className="mt-2 bg-background-secondary rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary-600 transition-all duration-500"
                      style={{ width: `${Math.min(parseFloat(percentage) * 2, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Distribuição por Ano */}
      <Card 
        title="Distribuição por Ano" 
        subtitle="Timeline de ordens de serviço processadas"
        variant="elevated"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {Object.entries(stats.yearDistribution).map(([year, count]) => {
            const percentage = ((count / stats.totalOrders) * 100).toFixed(1);
            const maxCount = Math.max(...Object.values(stats.yearDistribution));
            const relativeHeight = (count / maxCount) * 100;
            
            return (
              <div key={year} className="group">
                <div className="text-center p-4 bg-background-secondary border border-border rounded-xl hover:shadow-md hover:scale-105 transition-all duration-200">
                  <p className="text-sm font-semibold text-foreground-muted mb-2">{year}</p>
                  
                  {/* Mini chart bar */}
                  <div className="h-16 flex items-end justify-center mb-3">
                    <div 
                      className="w-8 bg-gradient-to-t from-primary to-primary-500 rounded-t-md transition-all duration-500 group-hover:from-primary-600 group-hover:to-primary-700"
                      style={{ height: `${Math.max(relativeHeight, 10)}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-2xl font-bold text-foreground mb-1">{count}</p>
                  <p className="text-xs text-foreground-muted font-medium">{percentage}% do total</p>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Resumo temporal */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span className="text-foreground-muted">
                  Período: {Math.min(...Object.keys(stats.yearDistribution).map(Number))} - {Math.max(...Object.keys(stats.yearDistribution).map(Number))}
                </span>
              </div>
            </div>
            <div className="text-foreground-muted">
              Média anual: {Math.round(stats.totalOrders / Object.keys(stats.yearDistribution).length)} ordens
            </div>
          </div>
        </div>
      </Card>
    </MainLayout>
  );
}