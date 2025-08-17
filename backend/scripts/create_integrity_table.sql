-- Script SQL para criar a tabela de logs de integridade de dados
-- Execute este script no Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS data_integrity_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_type VARCHAR(100) NOT NULL,
    expected_count INTEGER NOT NULL DEFAULT 0,
    actual_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL CHECK (status IN ('OK', 'ERROR', 'FIXED')),
    details TEXT,
    error_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_data_integrity_logs_timestamp ON data_integrity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_data_integrity_logs_check_type ON data_integrity_logs(check_type);
CREATE INDEX IF NOT EXISTS idx_data_integrity_logs_status ON data_integrity_logs(status);

-- Comentário para confirmar criação
SELECT 'Tabela data_integrity_logs criada com sucesso!' as message;