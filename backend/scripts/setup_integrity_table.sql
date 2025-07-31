-- Script para criar a tabela data_integrity_logs no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Criar tabela para logs de integridade de dados
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

-- Comentários para documentação
COMMENT ON TABLE data_integrity_logs IS 'Logs de verificação de integridade dos dados do sistema';
COMMENT ON COLUMN data_integrity_logs.check_type IS 'Tipo de verificação: TOTAL_RECORDS_COUNT, VALID_DATE_RANGE_2019_2025, FINANCIAL_CALCULATIONS, etc.';
COMMENT ON COLUMN data_integrity_logs.expected_count IS 'Quantidade esperada de registros';
COMMENT ON COLUMN data_integrity_logs.actual_count IS 'Quantidade real encontrada';
COMMENT ON COLUMN data_integrity_logs.status IS 'Status da verificação: OK, ERROR, FIXED';
COMMENT ON COLUMN data_integrity_logs.details IS 'Detalhes da verificação';
COMMENT ON COLUMN data_integrity_logs.error_details IS 'Detalhes do erro quando status = ERROR';

-- Inserir um registro de teste para verificar se a tabela está funcionando
INSERT INTO data_integrity_logs (check_type, expected_count, actual_count, status, details) 
VALUES ('TABLE_SETUP_TEST', 1, 1, 'OK', 'Tabela data_integrity_logs criada com sucesso');

-- Verificar se o registro foi inserido
SELECT * FROM data_integrity_logs WHERE check_type = 'TABLE_SETUP_TEST';

-- Limpar o registro de teste
DELETE FROM data_integrity_logs WHERE check_type = 'TABLE_SETUP_TEST'; 