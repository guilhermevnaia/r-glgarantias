-- EXECUTE ESTE SQL NO SUPABASE (SQL EDITOR)

-- 1. Tabela de categorias de defeitos
CREATE TABLE defect_categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color_hex VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'wrench',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    ai_confidence DECIMAL(5,4),
    sample_defects TEXT[],
    keywords TEXT[],
    total_occurrences INTEGER DEFAULT 0
);

-- 2. Tabela de classificações
CREATE TABLE defect_classifications (
    id SERIAL PRIMARY KEY,
    service_order_id INTEGER REFERENCES service_orders(id) ON DELETE CASCADE,
    original_defect_description TEXT NOT NULL,
    category_id INTEGER REFERENCES defect_categories(id) ON DELETE SET NULL,
    ai_confidence DECIMAL(5,4) NOT NULL,
    is_reviewed BOOLEAN DEFAULT false,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ai_reasoning TEXT,
    alternative_categories INTEGER[]
);

-- 3. Índices
CREATE INDEX idx_defect_categories_active ON defect_categories(is_active);
CREATE INDEX idx_defect_classifications_service_order ON defect_classifications(service_order_id);
CREATE INDEX idx_defect_classifications_category ON defect_classifications(category_id);

-- 4. Categorias padrão
INSERT INTO defect_categories (category_name, description, color_hex, icon, keywords, sample_defects) VALUES
('Vazamentos', 'Problemas relacionados a vazamentos de fluidos', '#EF4444', 'droplets', ARRAY['vazamento', 'vaza', 'goteira'], ARRAY['VAZAMENTO DE ÓLEO', 'VAZAMENTO DE ÁGUA']),
('Superaquecimento', 'Problemas de temperatura elevada', '#F97316', 'thermometer', ARRAY['esquenta', 'quente', 'temperatura'], ARRAY['ESQUENTANDO', 'MOTOR QUENTE']),
('Falhas de Ignição', 'Problemas para ligar ou funcionar', '#8B5CF6', 'zap', ARRAY['não pega', 'não liga', 'falha'], ARRAY['NÃO PEGA', 'NÃO LIGA']),
('Ruídos Anômalos', 'Barulhos estranhos ou anormais', '#06B6D4', 'volume-2', ARRAY['barulho', 'ruído', 'som'], ARRAY['BARULHO NO MOTOR', 'RUÍDO ESTRANHO']),
('Problemas Elétricos', 'Falhas no sistema elétrico', '#EAB308', 'zap', ARRAY['elétrico', 'bateria', 'alternador'], ARRAY['PROBLEMA ELÉTRICO', 'FALHA NO CHICOTE']),
('Desgaste de Componentes', 'Peças desgastadas', '#64748B', 'settings', ARRAY['desgaste', 'gasto', 'troca'], ARRAY['DESGASTE', 'PEÇA GASTA']);