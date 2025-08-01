-- Migração para criar tabela de categorias de defeitos
-- Execute este SQL no Supabase

-- Tabela para armazenar categorias de defeitos criadas pela IA
CREATE TABLE IF NOT EXISTS defect_categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color_hex VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'wrench',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    ai_confidence DECIMAL(5,4), -- Confiança da IA na criação da categoria
    sample_defects TEXT[], -- Exemplos de defeitos desta categoria
    keywords TEXT[], -- Palavras-chave associadas
    total_occurrences INTEGER DEFAULT 0
);

-- Tabela para armazenar a classificação de cada defeito
CREATE TABLE IF NOT EXISTS defect_classifications (
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
    ai_reasoning TEXT, -- Explicação da IA sobre a classificação
    alternative_categories INTEGER[] -- IDs de categorias alternativas sugeridas
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_defect_categories_active ON defect_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_defect_categories_name ON defect_categories(category_name);
CREATE INDEX IF NOT EXISTS idx_defect_classifications_service_order ON defect_classifications(service_order_id);
CREATE INDEX IF NOT EXISTS idx_defect_classifications_category ON defect_classifications(category_id);
CREATE INDEX IF NOT EXISTS idx_defect_classifications_reviewed ON defect_classifications(is_reviewed);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_defect_categories_updated_at BEFORE UPDATE ON defect_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_defect_classifications_updated_at BEFORE UPDATE ON defect_classifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir algumas categorias padrão para começar
INSERT INTO defect_categories (category_name, description, color_hex, icon, keywords, sample_defects) VALUES
('Vazamentos', 'Problemas relacionados a vazamentos de fluidos', '#EF4444', 'droplets', ARRAY['vazamento', 'vaza', 'goteira', 'escape'], ARRAY['VAZAMENTO DE ÓLEO', 'VAZAMENTO DE ÁGUA', 'VAZAMENTO NO RETENTOR']),
('Superaquecimento', 'Problemas de temperatura elevada do motor', '#F97316', 'thermometer', ARRAY['esquenta', 'quente', 'temperatura', 'aquecimento'], ARRAY['ESQUENTANDO', 'MOTOR QUENTE', 'SUPERAQUECIMENTO']),
('Falhas de Ignição', 'Problemas para ligar ou manter funcionamento', '#8B5CF6', 'zap', ARRAY['não pega', 'não liga', 'não funciona', 'falha'], ARRAY['NÃO PEGA', 'NÃO LIGA', 'FALHA NA PARTIDA']),
('Ruídos Anômalos', 'Barulhos estranhos ou anormais', '#06B6D4', 'volume-2', ARRAY['barulho', 'ruído', 'som', 'batida'], ARRAY['BARULHO NO MOTOR', 'RUÍDO ESTRANHO', 'BATIDA']),
('Problemas Elétricos', 'Falhas no sistema elétrico', '#EAB308', 'zap', ARRAY['elétrico', 'bateria', 'alternador', 'chicote'], ARRAY['PROBLEMA ELÉTRICO', 'FALHA NO CHICOTE', 'BATERIA']),
('Desgaste de Componentes', 'Peças desgastadas que precisam substituição', '#64748B', 'settings', ARRAY['desgaste', 'gasto', 'troca', 'substituir'], ARRAY['DESGASTE', 'PEÇA GASTA', 'PRECISA TROCAR'])
ON CONFLICT (category_name) DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE defect_categories IS 'Armazena as categorias de defeitos criadas e gerenciadas pela IA';
COMMENT ON TABLE defect_classifications IS 'Armazena a classificação de cada defeito individual feita pela IA';
COMMENT ON COLUMN defect_categories.ai_confidence IS 'Confiança da IA ao criar esta categoria (0.0 a 1.0)';
COMMENT ON COLUMN defect_classifications.ai_confidence IS 'Confiança da IA nesta classificação específica (0.0 a 1.0)';
COMMENT ON COLUMN defect_classifications.ai_reasoning IS 'Explicação textual da IA sobre por que escolheu esta categoria';