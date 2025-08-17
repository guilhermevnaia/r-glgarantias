const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function analyzeDataStructure() {
  console.log('=== ANÁLISE DA ESTRUTURA DOS DADOS ===');
  
  const { data, error } = await supabase
    .from('service_orders')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Erro:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Campos disponíveis:');
    Object.keys(data[0]).forEach(key => {
      const value = data[0][key];
      const type = typeof value;
      const sample = type === 'string' && value ? value.slice(0, 50) + '...' : value;
      console.log(`  ${key}: ${type} - ${sample}`);
    });
    
    console.log('\n=== ANÁLISE DE CAMPOS ESPECÍFICOS ===');
    
    // Verificar campos únicos para filtros
    const uniqueQueries = [
      { field: 'engine_manufacturer', label: 'Fabricantes' },
      { field: 'engine_model', label: 'Modelos de Motor' },
      { field: 'engine_type', label: 'Tipos de Motor' },
      { field: 'responsible_mechanic', label: 'Mecânicos' },
      { field: 'order_status', label: 'Status' },
      { field: 'defect_description', label: 'Defeitos' }
    ];
    
    for (const query of uniqueQueries) {
      const { data: uniqueData } = await supabase
        .from('service_orders')
        .select(query.field)
        .not(query.field, 'is', null)
        .not(query.field, 'eq', '')
        .limit(10);
        
      if (uniqueData && uniqueData.length > 0) {
        const unique = [...new Set(uniqueData.map(d => d[query.field]))];
        console.log(`${query.label}: ${unique.length} únicos - ${unique.slice(0, 3).join(', ')}...`);
      }
    }
  }
}

analyzeDataStructure();