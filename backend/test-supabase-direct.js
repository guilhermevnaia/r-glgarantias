const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseDirectly() {
    try {
        console.log('🔄 Testando Supabase diretamente...');
        
        // Teste sem limite
        console.log('📋 Teste 1: Sem limite específico');
        const test1 = await supabase
            .from('service_orders')
            .select('*', { count: 'exact' })
            .order('order_date', { ascending: false });
            
        console.log(`📊 Total count: ${test1.count}`);
        console.log(`📦 Registros retornados: ${test1.data?.length || 0}`);
        
        // Teste com limite 10000
        console.log('\n📋 Teste 2: Com limite 10000');
        const test2 = await supabase
            .from('service_orders')
            .select('*')
            .order('order_date', { ascending: false })
            .limit(10000);
            
        console.log(`📦 Registros retornados: ${test2.data?.length || 0}`);
        
        // Filtrar apenas 2019-2025
        const validOrders = (test2.data || []).filter(order => {
            if (!order.order_date) return false;
            const orderYear = new Date(order.order_date).getFullYear();
            return orderYear >= 2019 && orderYear <= 2025;
        });
        
        console.log(`📅 Registros válidos (2019-2025): ${validOrders.length}`);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

testSupabaseDirectly();