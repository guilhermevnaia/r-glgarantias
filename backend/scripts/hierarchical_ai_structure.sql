-- EXECUTE ESTE SQL NO SUPABASE (SQL EDITOR)
-- ESTRUTURA HIERÁRQUICA COMPLETA PARA CLASSIFICAÇÃO DE DEFEITOS

-- 1. Grupos (nível mais alto)
CREATE TABLE IF NOT EXISTS defect_groups (
    id SERIAL PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color_hex VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'folder',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0
);

-- 2. Categorias (segundo nível)
CREATE TABLE IF NOT EXISTS defect_categories_hierarchical (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    group_id INTEGER REFERENCES defect_groups(id) ON DELETE CASCADE,
    color_hex VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'wrench',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    ai_confidence DECIMAL(5,4),
    sample_defects TEXT[],
    keywords TEXT[],
    total_occurrences INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    UNIQUE(group_id, category_name)
);

-- 3. Subgrupos (terceiro nível)
CREATE TABLE IF NOT EXISTS defect_subgroups (
    id SERIAL PRIMARY KEY,
    subgroup_name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES defect_categories_hierarchical(id) ON DELETE CASCADE,
    color_hex VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'folder-open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    ai_confidence DECIMAL(5,4),
    sample_defects TEXT[],
    keywords TEXT[],
    total_occurrences INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    UNIQUE(category_id, subgroup_name)
);

-- 4. Sub-subgrupos (quarto nível - máximo)
CREATE TABLE IF NOT EXISTS defect_subsubgroups (
    id SERIAL PRIMARY KEY,
    subsubgroup_name VARCHAR(255) NOT NULL,
    description TEXT,
    subgroup_id INTEGER REFERENCES defect_subgroups(id) ON DELETE CASCADE,
    color_hex VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'file',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    ai_confidence DECIMAL(5,4),
    sample_defects TEXT[],
    keywords TEXT[],
    total_occurrences INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    UNIQUE(subgroup_id, subsubgroup_name)
);

-- 5. Atualizar tabela de classificações para suportar hierarquia
ALTER TABLE defect_classifications 
ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES defect_groups(id),
ADD COLUMN IF NOT EXISTS subgroup_id INTEGER REFERENCES defect_subgroups(id),
ADD COLUMN IF NOT EXISTS subsubgroup_id INTEGER REFERENCES defect_subsubgroups(id),
ADD COLUMN IF NOT EXISTS classification_level VARCHAR(20) DEFAULT 'category' CHECK (classification_level IN ('group', 'category', 'subgroup', 'subsubgroup')),
ADD COLUMN IF NOT EXISTS hierarchy_confidence DECIMAL(5,4) DEFAULT 0.5;

-- 6. Índices para performance
CREATE INDEX IF NOT EXISTS idx_defect_groups_active ON defect_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_defect_categories_hierarchical_active ON defect_categories_hierarchical(is_active);
CREATE INDEX IF NOT EXISTS idx_defect_categories_hierarchical_group ON defect_categories_hierarchical(group_id);
CREATE INDEX IF NOT EXISTS idx_defect_subgroups_active ON defect_subgroups(is_active);
CREATE INDEX IF NOT EXISTS idx_defect_subgroups_category ON defect_subgroups(category_id);
CREATE INDEX IF NOT EXISTS idx_defect_subsubgroups_active ON defect_subsubgroups(is_active);
CREATE INDEX IF NOT EXISTS idx_defect_subsubgroups_subgroup ON defect_subsubgroups(subgroup_id);
CREATE INDEX IF NOT EXISTS idx_defect_classifications_hierarchy ON defect_classifications(group_id, category_id, subgroup_id, subsubgroup_id);

-- 7. Função para obter hierarquia completa de um defeito
CREATE OR REPLACE FUNCTION get_defect_hierarchy(classification_id INTEGER)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'classification_id', dc.id,
        'level', dc.classification_level,
        'group', json_build_object('id', dg.id, 'name', dg.group_name, 'color', dg.color_hex),
        'category', json_build_object('id', dch.id, 'name', dch.category_name, 'color', dch.color_hex),
        'subgroup', CASE WHEN ds.id IS NOT NULL THEN 
            json_build_object('id', ds.id, 'name', ds.subgroup_name, 'color', ds.color_hex)
            ELSE NULL END,
        'subsubgroup', CASE WHEN dss.id IS NOT NULL THEN 
            json_build_object('id', dss.id, 'name', dss.subsubgroup_name, 'color', dss.color_hex)
            ELSE NULL END,
        'confidence', dc.ai_confidence,
        'hierarchy_confidence', dc.hierarchy_confidence
    ) INTO result
    FROM defect_classifications dc
    LEFT JOIN defect_groups dg ON dc.group_id = dg.id
    LEFT JOIN defect_categories_hierarchical dch ON dc.category_id = dch.id
    LEFT JOIN defect_subgroups ds ON dc.subgroup_id = ds.id
    LEFT JOIN defect_subsubgroups dss ON dc.subsubgroup_id = dss.id
    WHERE dc.id = classification_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 8. DADOS INICIAIS - ESTRUTURA HIERÁRQUICA COMPLETA

-- Grupos principais
INSERT INTO defect_groups (group_name, description, color_hex, icon, sort_order) VALUES
('Problemas de Fluidos', 'Vazamentos, contaminações e problemas com fluidos do motor', '#EF4444', 'droplets', 1),
('Problemas Térmicos', 'Superaquecimento, resfriamento inadequado e problemas de temperatura', '#F97316', 'thermometer', 2),
('Problemas Mecânicos', 'Desgaste, quebras e problemas estruturais', '#64748B', 'settings', 3),
('Problemas Elétricos', 'Falhas no sistema elétrico, sensores e ignição', '#EAB308', 'zap', 4),
('Problemas de Combustão', 'Falhas na ignição, mistura ar-combustível e queima', '#8B5CF6', 'flame', 5),
('Problemas Operacionais', 'Testes, verificações e problemas administrativos', '#10B981', 'clipboard-check', 6)
ON CONFLICT (group_name) DO NOTHING;

-- Categorias para Problemas de Fluidos
INSERT INTO defect_categories_hierarchical (category_name, description, group_id, color_hex, icon, keywords, sample_defects, sort_order) VALUES
('Vazamentos de Óleo', 'Vazamentos de óleo lubrificante', (SELECT id FROM defect_groups WHERE group_name = 'Problemas de Fluidos'), '#EF4444', 'droplets', 
 ARRAY['vazamento', 'vaza', 'óleo', 'lubrificante', 'goteira', 'pinga', 'escorre'], 
 ARRAY['VAZAMENTO DE ÓLEO NO CARTER', 'VAZAMENTO NO RETENTOR'], 1),
('Vazamentos de Água/Líquido Arrefecedor', 'Vazamentos do sistema de arrefecimento', (SELECT id FROM defect_groups WHERE group_name = 'Problemas de Fluidos'), '#06B6D4', 'droplets',
 ARRAY['vazamento', 'água', 'arrefecedor', 'radiador', 'mangueira', 'líquido'], 
 ARRAY['VAZAMENTO DE ÁGUA', 'VAZAMENTO NO RADIADOR'], 2),
('Contaminação de Fluidos', 'Contaminação ou mistura inadequada de fluidos', (SELECT id FROM defect_groups WHERE group_name = 'Problemas de Fluidos'), '#F59E0B', 'droplets',
 ARRAY['contaminado', 'sujo', 'misturado', 'água no óleo'], 
 ARRAY['ÓLEO CONTAMINADO', 'ÁGUA NO ÓLEO'], 3)
ON CONFLICT (group_id, category_name) DO NOTHING;

-- Subgrupos para Vazamentos de Óleo
INSERT INTO defect_subgroups (subgroup_name, description, category_id, keywords, sort_order) VALUES
('Carter e Base do Motor', 'Vazamentos na parte inferior do motor', (SELECT id FROM defect_categories_hierarchical WHERE category_name = 'Vazamentos de Óleo'), ARRAY['carter', 'base', 'inferior'], 1),
('Cabeçote e Tampa de Válvulas', 'Vazamentos na parte superior do motor', (SELECT id FROM defect_categories_hierarchical WHERE category_name = 'Vazamentos de Óleo'), ARRAY['cabeçote', 'tampa', 'válvulas'], 2),
('Retentores e Vedações', 'Problemas com retentores e vedações', (SELECT id FROM defect_categories_hierarchical WHERE category_name = 'Vazamentos de Óleo'), ARRAY['retentor', 'vedação', 'anel'], 3)
ON CONFLICT (category_id, subgroup_name) DO NOTHING;

-- Sub-subgrupos para Carter e Base do Motor
INSERT INTO defect_subsubgroups (subsubgroup_name, description, subgroup_id, keywords, sort_order) VALUES
('Junta do Carter', 'Vazamento na junta do carter de óleo', (SELECT id FROM defect_subgroups WHERE subgroup_name = 'Carter e Base do Motor'), ARRAY['junta do carter', 'vedação carter'], 1),
('Bujão de Drenagem', 'Vazamento no bujão de drenagem do óleo', (SELECT id FROM defect_subgroups WHERE subgroup_name = 'Carter e Base do Motor'), ARRAY['bujão', 'dreno', 'drenagem'], 2),
('Cárter Rachado', 'Rachadura ou trinca no cárter', (SELECT id FROM defect_subgroups WHERE subgroup_name = 'Carter e Base do Motor'), ARRAY['rachado', 'trincado', 'quebrado'], 3)
ON CONFLICT (subgroup_id, subsubgroup_name) DO NOTHING;

-- Categorias para Problemas Térmicos
INSERT INTO defect_categories_hierarchical (category_name, description, group_id, color_hex, icon, keywords, sample_defects, sort_order) VALUES
('Superaquecimento', 'Motor aquecendo excessivamente', (SELECT id FROM defect_groups WHERE group_name = 'Problemas Térmicos'), '#F97316', 'thermometer',
 ARRAY['esquenta', 'quente', 'superaquece', 'temperatura', 'calor', 'fervendo'],
 ARRAY['MOTOR ESQUENTANDO', 'SUPERAQUECIMENTO'], 1),
('Resfriamento Inadequado', 'Falhas no sistema de arrefecimento', (SELECT id FROM defect_groups WHERE group_name = 'Problemas Térmicos'), '#3B82F6', 'snowflake',
 ARRAY['radiador', 'ventoinha', 'bomba água', 'termostato'],
 ARRAY['RADIADOR ENTUPIDO', 'VENTOINHA NÃO FUNCIONA'], 2)
ON CONFLICT (group_id, category_name) DO NOTHING;

-- Categorias para Problemas Mecânicos  
INSERT INTO defect_categories_hierarchical (category_name, description, group_id, color_hex, icon, keywords, sample_defects, sort_order) VALUES
('Desgaste de Componentes', 'Peças desgastadas que precisam substituição', (SELECT id FROM defect_groups WHERE group_name = 'Problemas Mecânicos'), '#64748B', 'settings',
 ARRAY['desgaste', 'gasto', 'desgastado', 'troca', 'substituir'],
 ARRAY['PISTÃO DESGASTADO', 'BRONZINA GASTA'], 1),
('Quebras e Rupturas', 'Componentes quebrados ou rompidos', (SELECT id FROM defect_groups WHERE group_name = 'Problemas Mecânicos'), '#DC2626', 'wrench',
 ARRAY['quebrado', 'quebra', 'rompido', 'partido', 'rachado'],
 ARRAY['BIELA QUEBRADA', 'PISTÃO PARTIDO'], 2),
('Ruídos Anômalos', 'Barulhos estranhos ou anormais', (SELECT id FROM defect_groups WHERE group_name = 'Problemas Mecânicos'), '#06B6D4', 'volume-2',
 ARRAY['barulho', 'ruído', 'som', 'batendo', 'estranho'],
 ARRAY['BARULHO NO MOTOR', 'RUÍDO ESTRANHO'], 3)
ON CONFLICT (group_id, category_name) DO NOTHING;

-- Categorias para Problemas Elétricos
INSERT INTO defect_categories_hierarchical (category_name, description, group_id, color_hex, icon, keywords, sample_defects, sort_order) VALUES
('Sistema de Ignição', 'Problemas com velas, bobinas e ignição', (SELECT id FROM defect_groups WHERE group_name = 'Problemas Elétricos'), '#EAB308', 'zap',
 ARRAY['vela', 'bobina', 'ignição', 'centelha', 'faísca'],
 ARRAY['VELA QUEIMADA', 'BOBINA DEFEITUOSA'], 1),
('Sistema de Carga', 'Problemas com alternador, bateria', (SELECT id FROM defect_groups WHERE group_name = 'Problemas Elétricos'), '#F59E0B', 'battery',
 ARRAY['alternador', 'bateria', 'carga', 'elétrico'],
 ARRAY['ALTERNADOR DEFEITUOSO', 'BATERIA DESCARREGADA'], 2),
('Sensores e Atuadores', 'Problemas com sensores eletrônicos', (SELECT id FROM defect_groups WHERE group_name = 'Problemas Elétricos'), '#8B5CF6', 'cpu',
 ARRAY['sensor', 'atuador', 'eletrônico', 'ECU'],
 ARRAY['SENSOR DEFEITUOSO', 'FALHA NA ECU'], 3)
ON CONFLICT (group_id, category_name) DO NOTHING;

-- Categorias para Problemas Operacionais
INSERT INTO defect_categories_hierarchical (category_name, description, group_id, color_hex, icon, keywords, sample_defects, sort_order) VALUES
('Testes e Verificações', 'Testes de funcionamento e verificações', (SELECT id FROM defect_groups WHERE group_name = 'Problemas Operacionais'), '#10B981', 'clipboard-check',
 ARRAY['teste', 'verificação', 'inspeção', 'análise'],
 ARRAY['TESTE DE FUNCIONAMENTO', 'VERIFICAÇÃO GERAL'], 1),
('Problemas Administrativos', 'Erros de registro, codificação, etc.', (SELECT id FROM defect_groups WHERE group_name = 'Problemas Operacionais'), '#8BC34A', 'file-text',
 ARRAY['erro', 'registro', 'codificação', 'administrativo'],
 ARRAY['ERRO DE CODIFICAÇÃO', 'PROBLEMA DE REGISTRO'], 2),
('Montagem e Instalação', 'Problemas na montagem ou instalação', (SELECT id FROM defect_groups WHERE group_name = 'Problemas Operacionais'), '#06B6D4', 'tool',
 ARRAY['montagem', 'instalação', 'montado', 'instalado'],
 ARRAY['ERRO NA MONTAGEM', 'INSTALAÇÃO INCORRETA'], 3)
ON CONFLICT (group_id, category_name) DO NOTHING;