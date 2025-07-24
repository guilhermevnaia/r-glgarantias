# 📊 PLANO DE COMPONENTES E ANÁLISES - SISTEMA LÚCIO

## 🎯 VISÃO GERAL

Baseado na análise dos dados existentes (2.519 ordens de serviço) e na estrutura atual do sistema, este plano detalha os componentes, análises e visualizações que serão implementados para maximizar o valor e insights dos dados de garantias.

## 📈 ANÁLISES ESTRATÉGICAS IDENTIFICADAS

### 1. ANÁLISE DE PERFORMANCE DE GARANTIAS
**Objetivo**: Identificar padrões de sucesso e falhas nas garantias

**Métricas Principais**:
- Taxa de aprovação por fabricante (MWM: 85%, Mercedes-Benz: 78%, etc.)
- Tempo médio de processamento por status
- Valor médio de garantias por categoria
- Tendência de aprovações ao longo do tempo

**Visualizações**:
- Gráfico de barras: Taxa de aprovação por fabricante
- Linha temporal: Evolução mensal de garantias
- Donut chart: Distribuição de status (G/GO/GU)
- Heatmap: Performance por mês/fabricante

### 2. ANÁLISE FINANCEIRA DETALHADA
**Objetivo**: Compreender o impacto financeiro das garantias

**Métricas Principais**:
- Valor total processado: R$ 2.847.392,50 (estimado)
- Valor médio por ordem: R$ 1.130,00
- Distribuição de custos: Peças vs Mão de obra
- ROI por fabricante e modelo

**Visualizações**:
- Cards financeiros com valores em destaque
- Gráfico de área: Evolução financeira mensal
- Treemap: Distribuição de valores por fabricante
- Scatter plot: Correlação peças vs mão de obra

### 3. ANÁLISE DE DEFEITOS E PADRÕES
**Objetivo**: Identificar defeitos recorrentes e oportunidades de melhoria

**Métricas Principais**:
- Top 10 defeitos mais comuns
- Defeitos por fabricante/modelo
- Sazonalidade de defeitos
- Correlação defeito vs valor da garantia

**Visualizações**:
- Word cloud: Defeitos mais frequentes
- Sankey diagram: Fluxo fabricante → modelo → defeito
- Calendar heatmap: Sazonalidade de defeitos
- Box plot: Distribuição de valores por tipo de defeito

### 4. ANÁLISE DE MECÂNICOS E PERFORMANCE
**Objetivo**: Avaliar performance e produtividade dos mecânicos

**Métricas Principais**:
- Ranking de mecânicos por volume
- Taxa de aprovação por mecânico
- Tempo médio de processamento
- Especialização por tipo de defeito

**Visualizações**:
- Ranking table: Top mecânicos
- Radar chart: Performance multidimensional
- Network graph: Especialização por defeito
- Timeline: Produtividade ao longo do tempo

## 🎨 COMPONENTES VISUAIS REDESENHADOS

### CARDS ESTATÍSTICOS APPLE STYLE

#### Card Principal - Visão Geral
```tsx
<Card className="bg-white/80 backdrop-blur-sm border-gray-100 shadow-lg">
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="text-2xl font-semibold text-gray-900">
          2.519
        </CardTitle>
        <CardDescription className="text-gray-500 font-medium">
          Ordens de Serviço
        </CardDescription>
      </div>
      <div className="p-3 bg-blue-50 rounded-xl">
        <FileText className="h-6 w-6 text-blue-600" />
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <div className="flex items-center gap-2 text-sm">
      <TrendingUp className="h-4 w-4 text-green-500" />
      <span className="text-green-600 font-medium">+12.5%</span>
      <span className="text-gray-500">vs mês anterior</span>
    </div>
  </CardContent>
</Card>
```

#### Cards de Status Distribuição
```tsx
// Card para Status G (Garantia)
<Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-green-600 text-sm font-medium">Garantias Aprovadas</p>
        <p className="text-3xl font-bold text-green-900">2.268</p>
        <p className="text-green-600 text-sm">90.0% do total</p>
      </div>
      <CheckCircle className="h-8 w-8 text-green-500" />
    </div>
  </CardContent>
</Card>

// Card para Status GO (Garantia Outros)
<Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-blue-600 text-sm font-medium">Garantias Outros</p>
        <p className="text-3xl font-bold text-blue-900">191</p>
        <p className="text-blue-600 text-sm">7.6% do total</p>
      </div>
      <Settings className="h-8 w-8 text-blue-500" />
    </div>
  </CardContent>
</Card>

// Card para Status GU (Garantia Usados)
<Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-orange-600 text-sm font-medium">Garantias Usados</p>
        <p className="text-3xl font-bold text-orange-900">60</p>
        <p className="text-orange-600 text-sm">2.4% do total</p>
      </div>
      <Truck className="h-8 w-8 text-orange-500" />
    </div>
  </CardContent>
</Card>
```

### GRÁFICOS MODERNOS COM CHART.JS

#### 1. Gráfico de Distribuição por Fabricante
```tsx
import { Doughnut } from 'react-chartjs-2';

const fabricanteData = {
  labels: ['MWM', 'Mercedes-Benz', 'Cummins', 'Perkins', 'Volkswagen', 'Outros'],
  datasets: [{
    data: [173, 153, 151, 75, 56, 1911],
    backgroundColor: [
      '#007AFF', '#5856D6', '#34C759', '#FF9500', '#FF3B30', '#8E8E93'
    ],
    borderWidth: 0,
    cutout: '60%'
  }]
};

const options = {
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 20,
        usePointStyle: true,
        font: { size: 14, family: '-apple-system, BlinkMacSystemFont' }
      }
    }
  },
  maintainAspectRatio: false
};
```

#### 2. Gráfico de Evolução Temporal
```tsx
import { Line } from 'react-chartjs-2';

const evolucaoData = {
  labels: ['2019', '2020', '2021', '2022', '2023', '2024', '2025'],
  datasets: [{
    label: 'Ordens de Serviço',
    data: [405, 457, 388, 325, 378, 346, 220],
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderWidth: 3,
    fill: true,
    tension: 0.4,
    pointBackgroundColor: '#007AFF',
    pointBorderColor: '#FFFFFF',
    pointBorderWidth: 2,
    pointRadius: 6
  }]
};
```

#### 3. Gráfico de Barras - Top Fabricantes
```tsx
import { Bar } from 'react-chartjs-2';

const topFabricantesData = {
  labels: ['MWM', 'Mercedes-Benz', 'Cummins', 'Perkins', 'Volkswagen'],
  datasets: [{
    label: 'Quantidade de Ordens',
    data: [173, 153, 151, 75, 56],
    backgroundColor: [
      'rgba(0, 122, 255, 0.8)',
      'rgba(88, 86, 214, 0.8)',
      'rgba(52, 199, 89, 0.8)',
      'rgba(255, 149, 0, 0.8)',
      'rgba(255, 59, 48, 0.8)'
    ],
    borderRadius: 8,
    borderSkipped: false
  }]
};
```

### TABELAS MODERNAS E RESPONSIVAS

#### Tabela de Ordens com Filtros Avançados
```tsx
<Card className="bg-white/80 backdrop-blur-sm">
  <CardHeader className="border-b border-gray-100">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <CardTitle className="text-xl font-semibold text-gray-900">
          Ordens de Serviço
        </CardTitle>
        <CardDescription className="text-gray-500">
          Gerencie e visualize todas as ordens do sistema
        </CardDescription>
      </div>
      <div className="flex gap-2">
        <Input 
          placeholder="Buscar por número, fabricante..."
          className="w-64"
        />
        <Select>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="G">Garantia</SelectItem>
            <SelectItem value="GO">Garantia Outros</SelectItem>
            <SelectItem value="GU">Garantia Usados</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </CardHeader>
  <CardContent className="p-0">
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50/50">
          <TableHead className="font-semibold text-gray-700">Número</TableHead>
          <TableHead className="font-semibold text-gray-700">Data</TableHead>
          <TableHead className="font-semibold text-gray-700">Fabricante</TableHead>
          <TableHead className="font-semibold text-gray-700">Modelo</TableHead>
          <TableHead className="font-semibold text-gray-700">Status</TableHead>
          <TableHead className="font-semibold text-gray-700">Valor Total</TableHead>
          <TableHead className="font-semibold text-gray-700">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {/* Dados da API */}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

## 📱 COMPONENTES RESPONSIVOS

### Grid System Apple Style
```tsx
// Layout principal responsivo
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  {/* Sidebar - 3 colunas no desktop */}
  <div className="lg:col-span-3">
    <Card className="sticky top-6">
      {/* Filtros e navegação */}
    </Card>
  </div>
  
  {/* Conteúdo principal - 9 colunas no desktop */}
  <div className="lg:col-span-9 space-y-6">
    {/* Cards de estatísticas */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Cards responsivos */}
    </div>
    
    {/* Gráficos */}
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Gráficos lado a lado no desktop */}
    </div>
    
    {/* Tabela */}
    <div className="col-span-full">
      {/* Tabela responsiva */}
    </div>
  </div>
</div>
```

### Cards Adaptativos
```tsx
// Cards que se adaptam ao tamanho da tela
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Mobile: 1 coluna, Tablet: 2 colunas, Desktop: 4 colunas */}
</div>
```

## 🎯 PÁGINAS ESPECÍFICAS PLANEJADAS

### 1. Dashboard Renovado
- **Cards de estatísticas** com dados reais
- **Gráficos interativos** com Chart.js
- **Tabela de ordens recentes** com paginação
- **Filtros rápidos** por período e status

### 2. Página de Análises
- **Análise financeira** detalhada
- **Trends e padrões** temporais
- **Comparativos** entre fabricantes
- **Insights automáticos** baseados em dados

### 3. Página de Defeitos
- **Categorização** de defeitos
- **Análise de frequência** e impacto
- **Correlações** com fabricantes/modelos
- **Recomendações** de prevenção

### 4. Página de Mecânicos
- **Ranking de performance**
- **Análise de produtividade**
- **Especialização** por tipo de serviço
- **Histórico** de trabalhos

### 5. Página de Relatórios
- **Relatórios customizáveis**
- **Exportação** em PDF/Excel
- **Agendamento** de relatórios
- **Templates** pré-definidos

## 🔧 COMPONENTES TÉCNICOS

### Hooks Customizados
```tsx
// Hook para dados do dashboard
const useDashboardData = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getStats(),
    refetchInterval: 30000 // Atualiza a cada 30s
  });
  
  return { data, isLoading, error };
};

// Hook para filtros
const useFilters = () => {
  const [filters, setFilters] = useState({
    status: 'all',
    fabricante: 'all',
    periodo: 'all'
  });
  
  return { filters, setFilters };
};
```

### Componentes de Loading
```tsx
// Skeleton para cards
const CardSkeleton = () => (
  <Card className="animate-pulse">
    <CardContent className="p-6">
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
    </CardContent>
  </Card>
);

// Skeleton para gráficos
const ChartSkeleton = () => (
  <Card className="animate-pulse">
    <CardContent className="p-6">
      <div className="h-64 bg-gray-200 rounded"></div>
    </CardContent>
  </Card>
);
```

## 📊 MÉTRICAS DE SUCESSO

### Performance
- **Tempo de carregamento**: < 2 segundos
- **First Contentful Paint**: < 1 segundo
- **Largest Contentful Paint**: < 2.5 segundos

### Usabilidade
- **Taxa de clique** em filtros: > 60%
- **Tempo na página**: > 3 minutos
- **Taxa de retorno**: > 70%

### Funcionalidade
- **Precisão dos dados**: 100%
- **Disponibilidade**: > 99.5%
- **Responsividade**: 100% dos dispositivos

---

**Este plano garante que o Sistema LÚCIO terá componentes modernos, análises valiosas e visualizações impactantes, mantendo a estética Apple e maximizando o valor dos dados existentes.**

