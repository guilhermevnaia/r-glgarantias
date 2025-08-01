-- =====================================================
-- ESTRUTURA HIERÁRQUICA DE CLASSIFICAÇÃO DE DEFEITOS
-- Categoria → Grupo → Subgrupo → Defeito Específico
-- =====================================================

-- Expandir tabela de categorias para incluir hierarquia
ALTER TABLE defect_categories ADD COLUMN IF NOT EXISTS parent_category_id INTEGER REFERENCES defect_categories(id);
ALTER TABLE defect_categories ADD COLUMN IF NOT EXISTS hierarchy_level INTEGER DEFAULT 1;
ALTER TABLE defect_categories ADD COLUMN IF NOT EXISTS hierarchy_path TEXT;

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_defect_categories_parent ON defect_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_defect_categories_level ON defect_categories(hierarchy_level);
CREATE INDEX IF NOT EXISTS idx_defect_categories_path ON defect_categories(hierarchy_path);

-- Atualizar categorias existentes para nível 1 (Categoria Principal)
UPDATE defect_categories 
SET hierarchy_level = 1, hierarchy_path = category_name 
WHERE hierarchy_level IS NULL;

-- =====================================================
-- INSERIR ESTRUTURA HIERÁRQUICA PADRÃO
-- =====================================================

-- Limpar e recriar estrutura hierárquica
DELETE FROM defect_categories WHERE hierarchy_level > 1;

-- 1. VAZAMENTOS (Categoria Principal)
INSERT INTO defect_categories (category_name, description, color_hex, icon, hierarchy_level, hierarchy_path, keywords, is_active, total_occurrences) 
VALUES 
-- Categoria Principal
('Vazamentos', 'Problemas relacionados ao escape de fluidos', '#EF4444', 'droplets', 1, 'Vazamentos', ARRAY['vazamento', 'vaza', 'escape', 'goteira'], true, 0),

-- Grupos (nível 2)
('Vazamentos de Óleo', 'Vazamentos específicos de óleo lubrificante', '#DC2626', 'droplets', 2, 'Vazamentos > Óleo', ARRAY['oleo', 'óleo', 'lubrificante'], true, 0),
('Vazamentos de Combustível', 'Vazamentos de diesel, gasolina ou etanol', '#B91C1C', 'droplets', 2, 'Vazamentos > Combustível', ARRAY['combustivel', 'diesel', 'gasolina'], true, 0),
('Vazamentos de Fluido de Arrefecimento', 'Vazamentos no sistema de refrigeração', '#991B1B', 'droplets', 2, 'Vazamentos > Arrefecimento', ARRAY['agua', 'água', 'radiador', 'antifreeze'], true, 0),

-- Subgrupos (nível 3) - Óleo
('Vazamento Carter', 'Vazamentos na parte inferior do motor', '#7F1D1D', 'droplets', 3, 'Vazamentos > Óleo > Carter', ARRAY['carter', 'parte inferior'], true, 0),
('Vazamento Tampa Válvulas', 'Vazamentos na parte superior do motor', '#7F1D1D', 'droplets', 3, 'Vazamentos > Óleo > Tampa Válvulas', ARRAY['tampa', 'valvulas', 'superior'], true, 0),
('Vazamento Retentor', 'Vazamentos em retentores e vedações', '#7F1D1D', 'droplets', 3, 'Vazamentos > Óleo > Retentor', ARRAY['retentor', 'vedação', 'selo'], true, 0);

-- 2. SUPERAQUECIMENTO (Categoria Principal)  
INSERT INTO defect_categories (category_name, description, color_hex, icon, hierarchy_level, hierarchy_path, keywords, is_active, total_occurrences)
VALUES
-- Categoria Principal
('Superaquecimento', 'Problemas de temperatura elevada', '#F97316', 'thermometer', 1, 'Superaquecimento', ARRAY['aquecimento', 'temperatura', 'esquentando'], true, 0),

-- Grupos (nível 2)
('Superaquecimento do Motor', 'Temperatura excessiva do motor', '#EA580C', 'thermometer', 2, 'Superaquecimento > Motor', ARRAY['motor', 'bloco'], true, 0),
('Superaquecimento do Sistema', 'Problemas no sistema de arrefecimento', '#C2410C', 'thermometer', 2, 'Superaquecimento > Sistema', ARRAY['sistema', 'radiador', 'bomba'], true, 0),

-- Subgrupos (nível 3)
('Falha na Bomba D\'água', 'Bomba de água com defeito', '#9A3412', 'thermometer', 3, 'Superaquecimento > Sistema > Bomba', ARRAY['bomba', 'água'], true, 0),
('Radiador Entupido', 'Obstrução no radiador', '#9A3412', 'thermometer', 3, 'Superaquecimento > Sistema > Radiador', ARRAY['radiador', 'entupido'], true, 0);

-- 3. RUÍDOS ANÔMALOS (Categoria Principal)
INSERT INTO defect_categories (category_name, description, color_hex, icon, hierarchy_level, hierarchy_path, keywords, is_active, total_occurrences)
VALUES
-- Categoria Principal  
('Ruídos Anômalos', 'Sons anormais durante funcionamento', '#06B6D4', 'volume-2', 1, 'Ruídos Anômalos', ARRAY['barulho', 'ruido', 'som', 'batida'], true, 0),

-- Grupos (nível 2)
('Ruídos do Motor', 'Sons provenientes do motor', '#0891B2', 'volume-2', 2, 'Ruídos Anômalos > Motor', ARRAY['motor', 'interno'], true, 0),
('Ruídos da Transmissão', 'Sons da caixa de câmbio', '#0E7490', 'volume-2', 2, 'Ruídos Anômalos > Transmissão', ARRAY['cambio', 'transmissão'], true, 0),

-- Subgrupos (nível 3)
('Batida de Pino', 'Ruído característico de pino/biela', '#155E75', 'volume-2', 3, 'Ruídos Anômalos > Motor > Batida Pino', ARRAY['pino', 'biela', 'batida'], true, 0),
('Ruído de Válvulas', 'Som anormal das válvulas', '#155E75', 'volume-2', 3, 'Ruídos Anômalos > Motor > Válvulas', ARRAY['valvula', 'válvula', 'tucotuco'], true, 0);

-- 4. FALHAS ELÉTRICAS (Categoria Principal)
INSERT INTO defect_categories (category_name, description, color_hex, icon, hierarchy_level, hierarchy_path, keywords, is_active, total_occurrences)
VALUES
-- Categoria Principal
('Falhas Elétricas', 'Problemas no sistema elétrico', '#EAB308', 'zap', 1, 'Falhas Elétricas', ARRAY['eletrico', 'elétrico', 'energia'], true, 0),

-- Grupos (nível 2)
('Falhas de Ignição', 'Problemas na ignição/partida', '#CA8A04', 'zap', 2, 'Falhas Elétricas > Ignição', ARRAY['ignição', 'partida', 'arranque'], true, 0),
('Falhas de Sensores', 'Defeitos em sensores eletrônicos', '#A16207', 'zap', 2, 'Falhas Elétricas > Sensores', ARRAY['sensor', 'sonda'], true, 0);

-- 5. DESGASTE DE COMPONENTES (Categoria Principal)
INSERT INTO defect_categories (category_name, description, color_hex, icon, hierarchy_level, hierarchy_path, keywords, is_active, total_occurrences)
VALUES
-- Categoria Principal
('Desgaste de Componentes', 'Peças que precisam substituição', '#64748B', 'settings', 1, 'Desgaste de Componentes', ARRAY['desgaste', 'gasto', 'substituir'], true, 0),

-- Grupos (nível 2)  
('Desgaste Natural', 'Desgaste por uso normal', '#475569', 'settings', 2, 'Desgaste de Componentes > Natural', ARRAY['natural', 'uso'], true, 0),
('Quebras e Danos', 'Componentes quebrados ou danificados', '#334155', 'settings', 2, 'Desgaste de Componentes > Quebras', ARRAY['quebrou', 'danificado', 'rachado'], true, 0);

-- =====================================================
-- ATUALIZAR FOREIGN KEYS
-- =====================================================

-- Definir relacionamentos pai-filho
UPDATE defect_categories SET parent_category_id = (SELECT id FROM defect_categories WHERE category_name = 'Vazamentos' AND hierarchy_level = 1) 
WHERE category_name IN ('Vazamentos de Óleo', 'Vazamentos de Combustível', 'Vazamentos de Fluido de Arrefecimento');

UPDATE defect_categories SET parent_category_id = (SELECT id FROM defect_categories WHERE category_name = 'Vazamentos de Óleo' AND hierarchy_level = 2)
WHERE category_name IN ('Vazamento Carter', 'Vazamento Tampa Válvulas', 'Vazamento Retentor');

UPDATE defect_categories SET parent_category_id = (SELECT id FROM defect_categories WHERE category_name = 'Superaquecimento' AND hierarchy_level = 1)
WHERE category_name IN ('Superaquecimento do Motor', 'Superaquecimento do Sistema');

UPDATE defect_categories SET parent_category_id = (SELECT id FROM defect_categories WHERE category_name = 'Superaquecimento do Sistema' AND hierarchy_level = 2)
WHERE category_name IN ('Falha na Bomba D\'água', 'Radiador Entupido');

UPDATE defect_categories SET parent_category_id = (SELECT id FROM defect_categories WHERE category_name = 'Ruídos Anômalos' AND hierarchy_level = 1)
WHERE category_name IN ('Ruídos do Motor', 'Ruídos da Transmissão');

UPDATE defect_categories SET parent_category_id = (SELECT id FROM defect_categories WHERE category_name = 'Ruídos do Motor' AND hierarchy_level = 2)
WHERE category_name IN ('Batida de Pino', 'Ruído de Válvulas');

UPDATE defect_categories SET parent_category_id = (SELECT id FROM defect_categories WHERE category_name = 'Falhas Elétricas' AND hierarchy_level = 1)
WHERE category_name IN ('Falhas de Ignição', 'Falhas de Sensores');

UPDATE defect_categories SET parent_category_id = (SELECT id FROM defect_categories WHERE category_name = 'Desgaste de Componentes' AND hierarchy_level = 1)
WHERE category_name IN ('Desgaste Natural', 'Quebras e Danos');

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para obter hierarquia completa
CREATE OR REPLACE FUNCTION get_category_hierarchy(category_id INTEGER)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    SELECT hierarchy_path INTO result 
    FROM defect_categories 
    WHERE id = category_id;
    
    RETURN COALESCE(result, 'Não categorizado');
END;
$$ LANGUAGE plpgsql;

-- Função para obter categorias filhas
CREATE OR REPLACE FUNCTION get_child_categories(parent_id INTEGER)
RETURNS TABLE(id INTEGER, category_name TEXT, hierarchy_level INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT dc.id, dc.category_name, dc.hierarchy_level
    FROM defect_categories dc
    WHERE dc.parent_category_id = parent_id
    ORDER BY dc.category_name;
END;
$$ LANGUAGE plpgsql;

-- Comentários sobre a estrutura
COMMENT ON TABLE defect_categories IS 'Estrutura hierárquica: Categoria (1) > Grupo (2) > Subgrupo (3)';
COMMENT ON COLUMN defect_categories.hierarchy_level IS '1=Categoria, 2=Grupo, 3=Subgrupo';
COMMENT ON COLUMN defect_categories.hierarchy_path IS 'Caminho completo: "Categoria > Grupo > Subgrupo"';
COMMENT ON COLUMN defect_categories.parent_category_id IS 'ID da categoria pai na hierarquia';