-- =====================================================
-- DEBUG: Investigar problema das classificações
-- =====================================================

-- 1. Verificar estrutura da tabela defect_classifications
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'defect_classifications'
ORDER BY ordinal_position;

-- 2. Verificar se há constraints que podem estar bloqueando
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'defect_classifications'::regclass;

-- 3. Verificar quantas service_orders existem vs classificações
SELECT 
    'Total Service Orders' as tipo,
    COUNT(*) as quantidade
FROM service_orders
WHERE raw_defect_description IS NOT NULL 
    AND raw_defect_description != ''

UNION ALL

SELECT 
    'Total Classifications' as tipo,
    COUNT(*) as quantidade  
FROM defect_classifications;

-- 4. Verificar últimas classificações (se houver)
SELECT 
    dc.*,
    so.order_number,
    so.raw_defect_description
FROM defect_classifications dc
LEFT JOIN service_orders so ON dc.service_order_id = so.id
ORDER BY dc.created_at DESC
LIMIT 10;

-- 5. Verificar se as foreign keys estão corretas
SELECT 
    dc.service_order_id,
    CASE 
        WHEN so.id IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as service_order_status
FROM defect_classifications dc
LEFT JOIN service_orders so ON dc.service_order_id = so.id;

-- 6. Tentar inserir uma classificação de teste
INSERT INTO defect_classifications (
    service_order_id,
    original_defect_description,
    category_id,
    ai_confidence,
    ai_reasoning,
    alternative_categories,
    is_reviewed
) VALUES (
    42088,  -- ID que sabemos que existe
    'TESTE DE INSERÇÃO MANUAL',
    1,  -- Categoria Vazamentos
    0.99,
    'Teste manual para verificar se insert funciona',
    '[]'::jsonb,
    false
);

-- 7. Verificar se o teste foi inserido
SELECT COUNT(*) as total_after_test FROM defect_classifications;