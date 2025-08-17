-- Sistema Hierárquico de Classificação de Defeitos
-- Grupos > Subgrupos > Subsubgrupos

-- Tabela de hierarquia (substitui defect_categories)
CREATE TABLE IF NOT EXISTS defect_hierarchy (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  level INTEGER NOT NULL CHECK (level IN (1, 2, 3)), -- 1=Grupo, 2=Subgrupo, 3=Subsubgrupo
  parent_id INTEGER REFERENCES defect_hierarchy(id) ON DELETE CASCADE,
  color_hex VARCHAR(7) DEFAULT '#3B82F6',
  icon VARCHAR(50) DEFAULT 'folder',
  keywords TEXT[] DEFAULT '{}',
  ai_confidence DECIMAL(3,2) DEFAULT 0.0,
  total_occurrences INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_name_per_parent UNIQUE(name, parent_id, level),
  CONSTRAINT parent_level_constraint CHECK (
    (level = 1 AND parent_id IS NULL) OR
    (level = 2 AND parent_id IS NOT NULL) OR  
    (level = 3 AND parent_id IS NOT NULL)
  )
);

-- Tabela de classificações hierárquicas
CREATE TABLE IF NOT EXISTS hierarchical_classifications (
  id SERIAL PRIMARY KEY,
  service_order_id INTEGER NOT NULL,
  original_defect_description TEXT NOT NULL,
  
  -- Hierarquia (Grupo > Subgrupo > Subsubgrupo)
  group_id INTEGER REFERENCES defect_hierarchy(id),
  subgroup_id INTEGER REFERENCES defect_hierarchy(id), 
  subsubgroup_id INTEGER REFERENCES defect_hierarchy(id),
  
  ai_confidence DECIMAL(3,2) NOT NULL,
  ai_reasoning TEXT,
  classification_path TEXT, -- Ex: "Vazamentos > Óleo > Motor"
  
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_service_order UNIQUE(service_order_id),
  CONSTRAINT hierarchy_consistency CHECK (
    (group_id IS NOT NULL) AND
    (subgroup_id IS NULL OR EXISTS (SELECT 1 FROM defect_hierarchy WHERE id = subgroup_id AND parent_id = group_id)) AND
    (subsubgroup_id IS NULL OR EXISTS (SELECT 1 FROM defect_hierarchy WHERE id = subsubgroup_id AND parent_id = subgroup_id))
  )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_defect_hierarchy_level ON defect_hierarchy(level);
CREATE INDEX IF NOT EXISTS idx_defect_hierarchy_parent ON defect_hierarchy(parent_id);
CREATE INDEX IF NOT EXISTS idx_hierarchical_classifications_service_order ON hierarchical_classifications(service_order_id);
CREATE INDEX IF NOT EXISTS idx_hierarchical_classifications_group ON hierarchical_classifications(group_id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_defect_hierarchy_updated_at ON defect_hierarchy;
CREATE TRIGGER update_defect_hierarchy_updated_at 
    BEFORE UPDATE ON defect_hierarchy 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hierarchical_classifications_updated_at ON hierarchical_classifications;
CREATE TRIGGER update_hierarchical_classifications_updated_at 
    BEFORE UPDATE ON hierarchical_classifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migrar dados existentes das categorias atuais para hierarquia
INSERT INTO defect_hierarchy (name, description, level, parent_id, color_hex, icon, keywords, ai_confidence, total_occurrences, is_active)
SELECT 
  category_name,
  description,
  1 as level, -- Tornar todos grupos (nível 1)
  NULL as parent_id,
  color_hex,
  icon,
  keywords,
  ai_confidence,
  total_occurrences,
  is_active
FROM defect_categories
WHERE is_active = true
ON CONFLICT DO NOTHING;

-- View para facilitar consultas hierárquicas
CREATE OR REPLACE VIEW v_hierarchy_full AS
SELECT 
  h1.id as group_id,
  h1.name as group_name,
  h1.color_hex as group_color,
  h1.icon as group_icon,
  h1.total_occurrences as group_occurrences,
  
  h2.id as subgroup_id,
  h2.name as subgroup_name,
  h2.color_hex as subgroup_color,
  h2.icon as subgroup_icon,
  h2.total_occurrences as subgroup_occurrences,
  
  h3.id as subsubgroup_id,
  h3.name as subsubgroup_name,
  h3.color_hex as subsubgroup_color,
  h3.icon as subsubgroup_icon,
  h3.total_occurrences as subsubgroup_occurrences
FROM defect_hierarchy h1
LEFT JOIN defect_hierarchy h2 ON h2.parent_id = h1.id AND h2.level = 2
LEFT JOIN defect_hierarchy h3 ON h3.parent_id = h2.id AND h3.level = 3
WHERE h1.level = 1 AND h1.is_active = true;

-- View para classificações com hierarquia completa
CREATE OR REPLACE VIEW v_classifications_hierarchical AS
SELECT 
  hc.*,
  g.name as group_name,
  g.color_hex as group_color,
  g.icon as group_icon,
  sg.name as subgroup_name,
  sg.color_hex as subgroup_color,
  sg.icon as subgroup_icon,
  ssg.name as subsubgroup_name,
  ssg.color_hex as subsubgroup_color,
  ssg.icon as subsubgroup_icon,
  so.order_number,
  so.order_date,
  so.responsible_mechanic
FROM hierarchical_classifications hc
LEFT JOIN defect_hierarchy g ON hc.group_id = g.id
LEFT JOIN defect_hierarchy sg ON hc.subgroup_id = sg.id  
LEFT JOIN defect_hierarchy ssg ON hc.subsubgroup_id = ssg.id
LEFT JOIN service_orders so ON hc.service_order_id = so.id;

-- Dados iniciais hierárquicos (expandindo as categorias atuais)
-- Vazamentos (expandir em subgrupos)
INSERT INTO defect_hierarchy (name, description, level, parent_id, color_hex, icon, keywords) VALUES
('Óleo', 'Vazamentos de óleo do motor, transmissão, direção', 2, (SELECT id FROM defect_hierarchy WHERE name = 'Vazamentos' AND level = 1), '#DC2626', 'droplet', ARRAY['oleo', 'vazamento oleo', 'mancha oleo']),
('Água', 'Vazamentos do sistema de arrefecimento', 2, (SELECT id FROM defect_hierarchy WHERE name = 'Vazamentos' AND level = 1), '#3B82F6', 'droplet', ARRAY['agua', 'radiador', 'mangueira', 'liquido arrefecimento']),
('Combustível', 'Vazamentos de combustível', 2, (SELECT id FROM defect_hierarchy WHERE name = 'Vazamentos' AND level = 1), '#F59E0B', 'droplet', ARRAY['combustivel', 'gasolina', 'diesel', 'tanque']);

-- Expandir Óleo em subsubgrupos
INSERT INTO defect_hierarchy (name, description, level, parent_id, color_hex, icon, keywords) VALUES
('Motor', 'Vazamento de óleo do motor', 3, (SELECT id FROM defect_hierarchy WHERE name = 'Óleo' AND level = 2), '#DC2626', 'engine', ARRAY['carter', 'cabecote', 'junta cabecote', 'retentor']),
('Transmissão', 'Vazamento de óleo da transmissão', 3, (SELECT id FROM defect_hierarchy WHERE name = 'Óleo' AND level = 2), '#DC2626', 'settings', ARRAY['transmissao', 'cambio', 'diferencial']),
('Direção', 'Vazamento de óleo da direção hidráulica', 3, (SELECT id FROM defect_hierarchy WHERE name = 'Óleo' AND level = 2), '#DC2626', 'steering-wheel', ARRAY['direcao', 'bomba direcao', 'reservatorio direcao']);

-- Problemas Mecânicos (expandir)
INSERT INTO defect_hierarchy (name, description, level, parent_id, color_hex, icon, keywords) VALUES
('Motor', 'Problemas internos do motor', 2, (SELECT id FROM defect_hierarchy WHERE name = 'Problemas Mecânicos' AND level = 1), '#7C2D12', 'engine', ARRAY['pistao', 'biela', 'virabrequim', 'valvula']),
('Suspensão', 'Problemas na suspensão', 2, (SELECT id FROM defect_hierarchy WHERE name = 'Problemas Mecânicos' AND level = 1), '#7C2D12', 'spring', ARRAY['amortecedor', 'mola', 'bucha', 'batente']),
('Freios', 'Problemas no sistema de freios', 2, (SELECT id FROM defect_hierarchy WHERE name = 'Problemas Mecânicos' AND level = 1), '#7C2D12', 'disc', ARRAY['pastilha', 'disco', 'tambor', 'fluido freio']);

COMMIT;