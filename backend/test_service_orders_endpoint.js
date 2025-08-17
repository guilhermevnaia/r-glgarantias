const axios = require('axios');

async function testServiceOrdersEndpoint() {
  try {
    console.log('🧪 TESTANDO ENDPOINT /api/v1/service-orders...');
    
    const response = await axios.get('http://localhost:3020/api/v1/service-orders', {
      params: {
        page: 1,
        limit: 5
      },
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MzM5MjM2MjQsImV4cCI6MTczMzkyNzIyNH0.example' // Token de exemplo
      }
    });

    console.log('✅ Status:', response.status);
    console.log('📊 Total registros:', response.data.total);
    console.log('📋 Dados recebidos:', response.data.data?.length, 'registros');
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\n🔍 PRIMEIRO REGISTRO:');
      const firstOrder = response.data.data[0];
      console.log('OS:', firstOrder.order_number);
      console.log('Defeito:', firstOrder.raw_defect_description?.substring(0, 60));
      console.log('defect_classifications presente:', !!firstOrder.defect_classifications);
      console.log('defect_classifications length:', firstOrder.defect_classifications?.length || 0);
      
      if (firstOrder.defect_classifications && firstOrder.defect_classifications.length > 0) {
        const cl = firstOrder.defect_classifications[0];
        console.log('✅ CLASSIFICAÇÃO:');
        console.log('  Categoria:', cl.defect_categories?.category_name);
        console.log('  Confiança:', (cl.ai_confidence * 100).toFixed(1) + '%');
        console.log('  Cor:', cl.defect_categories?.color_hex);
        console.log('  Estrutura completa:', JSON.stringify(cl, null, 2));
      } else {
        console.log('❌ SEM CLASSIFICAÇÃO - deve aparecer PENDENTE no frontend');
      }
    }

  } catch (error) {
    console.error('❌ ERRO no teste do endpoint:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
  }
}

testServiceOrdersEndpoint();