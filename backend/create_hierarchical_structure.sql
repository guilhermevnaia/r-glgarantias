-- ========================================
-- ESTRUTURA HIERÁRQUICA DE CLASSIFICAÇÃO
-- Grupo > Subgrupo > Subsubgrupo
-- ========================================

-- 1. Atualizar tabela de categorias para suportar hierarquia
ALTER TABLE defect_categories 
ADD COLUMN IF NOT EXISTS parent_category_id INTEGER REFERENCES defect_categories(id),
ADD COLUMN IF NOT EXISTS hierarchy_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS full_path TEXT,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_defect_categories_parent ON defect_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_defect_categories_level ON defect_categories(hierarchy_level);
CREATE INDEX IF NOT EXISTS idx_defect_categories_path ON defect_categories(full_path);

-- 3. Atualizar tabela de classificações para suportar hierarquia completa
ALTER TABLE defect_classifications 
ADD COLUMN IF NOT EXISTS primary_category_id INTEGER REFERENCES defect_categories(id),
ADD COLUMN IF NOT EXISTS secondary_category_id INTEGER REFERENCES defect_categories(id),
ADD COLUMN IF NOT EXISTS tertiary_category_id INTEGER REFERENCES defect_categories(id),
ADD COLUMN IF NOT EXISTS full_hierarchy_path TEXT;

-- 4. Criar função para calcular caminho hierárquico
CREATE OR REPLACE FUNCTION calculate_hierarchy_path(category_id INTEGER)
RETURNS TEXT AS $$
DECLARE
    path TEXT := '';
    current_id INTEGER := category_id;
    current_name TEXT;
    level_count INTEGER := 0;
BEGIN
    -- Construir caminho de baixo para cima (filho -> pai)
    WHILE current_id IS NOT NULL AND level_count < 10 LOOP
        SELECT category_name, parent_category_id 
        INTO current_name, current_id 
        FROM defect_categories 
        WHERE id = current_id;
        
        IF current_name IS NOT NULL THEN
            IF path = '' THEN
                path := current_name;
            ELSE
                path := current_name || ' > ' || path;
            END IF;
        END IF;
        
        level_count := level_count + 1;
    END LOOP;
    
    RETURN path;
END;
$$ LANGUAGE plpgsql;

-- 5. Função para obter classificação hierárquica completa
CREATE OR REPLACE FUNCTION get_hierarchical_classification(service_order_id INTEGER)
RETURNS TABLE(
    grupo TEXT,
    subgrupo TEXT,
    subsubgrupo TEXT,
    full_path TEXT,
    confidence DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(g.category_name, 'Não classificado') as grupo,
        COALESCE(sg.category_name, '') as subgrupo,
        COALESCE(ssg.category_name, '') as subsubgrupo,
        COALESCE(dc.full_hierarchy_path, COALESCE(c.category_name, 'Não classificado')) as full_path,
        COALESCE(dc.ai_confidence, 0.0) as confidence
    FROM defect_classifications dc
    LEFT JOIN defect_categories c ON dc.category_id = c.id
    LEFT JOIN defect_categories g ON dc.primary_category_id = g.id
    LEFT JOIN defect_categories sg ON dc.secondary_category_id = sg.id
    LEFT JOIN defect_categories ssg ON dc.tertiary_category_id = ssg.id
    WHERE dc.service_order_id = $1
    ORDER BY dc.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 6. View para facilitar consultas hierárquicas
CREATE OR REPLACE VIEW v_hierarchical_classifications AS
SELECT 
    so.id as service_order_id,
    so.order_number,
    so.raw_defect_description,
    COALESCE(g.category_name, c.category_name, 'Não classificado') as grupo,
    COALESCE(sg.category_name, '') as subgrupo,
    COALESCE(ssg.category_name, '') as subsubgrupo,
    COALESCE(dc.full_hierarchy_path, c.category_name, 'Não classificado') as caminho_completo,
    dc.ai_confidence,
    dc.created_at as classificado_em
FROM service_orders so
LEFT JOIN defect_classifications dc ON so.id = dc.service_order_id
LEFT JOIN defect_categories c ON dc.category_id = c.id
LEFT JOIN defect_categories g ON dc.primary_category_id = g.id
LEFT JOIN defect_categories sg ON dc.secondary_category_id = sg.id
LEFT JOIN defect_categories ssg ON dc.tertiary_category_id = ssg.id
WHERE so.raw_defect_description IS NOT NULL 
AND so.raw_defect_description != ''
ORDER BY so.id;

-- 7. Comentários para documentação
COMMENT ON TABLE defect_categories IS 'Categorias hierárquicas de defeitos (Grupo > Subgrupo > Subsubgrupo)';
COMMENT ON COLUMN defect_categories.parent_category_id IS 'ID da categoria pai (NULL para categorias de nível 1)';
COMMENT ON COLUMN defect_categories.hierarchy_level IS 'Nível na hierarquia (1=Grupo, 2=Subgrupo, 3=Subsubgrupo)';
COMMENT ON COLUMN defect_categories.full_path IS 'Caminho completo na hierarquia (ex: Vazamentos > Externos > Retentor)';
COMMENT ON COLUMN defect_categories.sort_order IS 'Ordem de exibição dentro do mesmo nível';

COMMENT ON COLUMN defect_classifications.primary_category_id IS 'Categoria primária (Grupo)';
COMMENT ON COLUMN defect_classifications.secondary_category_id IS 'Categoria secundária (Subgrupo)';
COMMENT ON COLUMN defect_classifications.tertiary_category_id IS 'Categoria terciária (Subsubgrupo)';
COMMENT ON COLUMN defect_classifications.full_hierarchy_path IS 'Caminho hierárquico completo da classificação';