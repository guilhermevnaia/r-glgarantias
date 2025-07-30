const express = require('express');
const app = express();
const port = 3008;

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/v1/test', (req, res) => {
  res.json({ message: 'Servidor de teste funcionando!', timestamp: new Date().toISOString() });
});

// Stats fake para testar frontend
app.get('/api/v1/stats', (req, res) => {
  const month = parseInt(req.query.month);
  const year = parseInt(req.query.year);
  
  console.log(`📊 Filtros recebidos: mês=${month}, ano=${year}`);
  
  // Simular dados baseados no mês/ano
  const mockDataByMonth = {
    1: { orders: 25, g: 20, go: 3, gu: 2, value: 45000 },
    2: { orders: 18, g: 15, go: 2, gu: 1, value: 32000 },
    3: { orders: 32, g: 28, go: 3, gu: 1, value: 58000 },
    4: { orders: 28, g: 24, go: 3, gu: 1, value: 51000 },
    5: { orders: 35, g: 30, go: 4, gu: 1, value: 63000 },
    6: { orders: 22, g: 18, go: 3, gu: 1, value: 39000 },
    7: { orders: 15, g: 12, go: 2, gu: 1, value: 27000 },
    8: { orders: 29, g: 25, go: 3, gu: 1, value: 52000 },
    9: { orders: 31, g: 27, go: 3, gu: 1, value: 56000 },
    10: { orders: 26, g: 22, go: 3, gu: 1, value: 47000 },
    11: { orders: 24, g: 20, go: 3, gu: 1, value: 43000 },
    12: { orders: 19, g: 16, go: 2, gu: 1, value: 34000 }
  };
  
  const monthData = mockDataByMonth[month] || mockDataByMonth[7]; // default julho
  
  // Gerar ordens para o mês específico
  const orders = [];
  for (let i = 1; i <= monthData.orders; i++) {
    const day = Math.floor(Math.random() * 28) + 1;
    orders.push({
      order_number: `OS${year}${month.toString().padStart(2, '0')}${i.toString().padStart(3, '0')}`,
      order_date: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
      engine_manufacturer: ["MWM", "CUMMINS", "MERCEDES-BENZ", "PERKINS", "FIAT"][Math.floor(Math.random() * 5)],
      engine_description: "Motor Diesel",
      vehicle_model: "Caminhão",
      raw_defect_description: "Manutenção preventiva",
      responsible_mechanic: ["João Silva", "Maria Santos", "Pedro Costa", "Ana Lima"][Math.floor(Math.random() * 4)],
      parts_total: Math.floor(Math.random() * 3000) + 500,
      labor_total: Math.floor(Math.random() * 1500) + 300,
      original_parts_value: Math.floor(Math.random() * 3000) + 500
    });
  }

  res.json({
    totalOrders: monthData.orders,
    statusDistribution: { 
      G: monthData.g, 
      GO: monthData.go, 
      GU: monthData.gu 
    },
    yearDistribution: { 
      [year.toString()]: monthData.orders 
    },
    topManufacturers: [
      { name: "MWM", count: Math.floor(monthData.orders * 0.3) },
      { name: "CUMMINS", count: Math.floor(monthData.orders * 0.25) },
      { name: "MERCEDES-BENZ", count: Math.floor(monthData.orders * 0.2) }
    ],
    financialSummary: {
      totalValue: monthData.value,
      averageValue: Math.floor(monthData.value / monthData.orders),
      partsTotal: Math.floor(monthData.value * 0.6),
      laborTotal: Math.floor(monthData.value * 0.4)
    },
    monthlyTrend: [
      { month: `${month}/${year}`, count: monthData.orders, value: monthData.value }
    ],
    mechanicsCount: 4,
    defectsCount: Math.floor(monthData.orders * 0.8),
    orders: orders
  });
});

app.listen(port, 'localhost', () => {
  console.log(`🧪 Servidor de teste rodando na porta ${port}`);
  console.log(`🔗 Health: http://localhost:${port}/health`);
  console.log(`📊 Stats: http://localhost:${port}/api/v1/stats`);
});