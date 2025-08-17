-- Tabela para armazenar métricas de qualidade das classificações
CREATE TABLE IF NOT EXISTS classification_quality_metrics (
  id SERIAL PRIMARY KEY,
  classification_id INTEGER NOT NULL REFERENCES defect_classifications(id) ON DELETE CASCADE,
  service_order_id INTEGER NOT NULL,
  
  -- Scores de qualidade (0.0 a 1.0)
  confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0.0,
  consistency_score DECIMAL(3,2) NOT NULL DEFAULT 0.0,
  relevance_score DECIMAL(3,2) NOT NULL DEFAULT 0.0,
  overall_quality_score DECIMAL(3,2) NOT NULL DEFAULT 0.0,
  
  -- Issues e recomendações
  identified_issues TEXT[] DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  
  -- Metadados
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analyzed_by VARCHAR(100) DEFAULT 'system',
  
  -- Índices
  UNIQUE(classification_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_quality_metrics_classification_id ON classification_quality_metrics(classification_id);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_service_order_id ON classification_quality_metrics(service_order_id);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_overall_score ON classification_quality_metrics(overall_quality_score);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_analyzed_at ON classification_quality_metrics(analyzed_at);

-- Comentários
COMMENT ON TABLE classification_quality_metrics IS 'Métricas de qualidade das classificações de defeitos pela IA';
COMMENT ON COLUMN classification_quality_metrics.confidence_score IS 'Score baseado na confiança da IA (0.0-1.0)';
COMMENT ON COLUMN classification_quality_metrics.consistency_score IS 'Score de consistência com outras classificações similares (0.0-1.0)';
COMMENT ON COLUMN classification_quality_metrics.relevance_score IS 'Score de relevância entre defeito e categoria (0.0-1.0)';
COMMENT ON COLUMN classification_quality_metrics.overall_quality_score IS 'Score geral de qualidade (média dos outros scores)';
COMMENT ON COLUMN classification_quality_metrics.identified_issues IS 'Lista de problemas identificados na classificação';
COMMENT ON COLUMN classification_quality_metrics.recommendations IS 'Lista de recomendações para melhorar a classificação';