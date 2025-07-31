-- Script para adicionar campos de proteção de edições manuais
-- Execute este script no banco Supabase para proteger dados editados pelo usuário

-- Adicionar campos de controle para service_orders
ALTER TABLE service_orders 
ADD COLUMN IF NOT EXISTS manually_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS protected_fields JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_edited_by TEXT,
ADD COLUMN IF NOT EXISTS last_edit_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0;

-- Comentários para documentação
COMMENT ON COLUMN service_orders.manually_edited IS 'Indica se este registro foi editado manualmente pelo usuário';
COMMENT ON COLUMN service_orders.protected_fields IS 'JSON com campos que foram editados e devem ser protegidos de uploads futuros';
COMMENT ON COLUMN service_orders.last_edited_by IS 'Usuário que fez a última edição manual';
COMMENT ON COLUMN service_orders.last_edit_date IS 'Data da última edição manual';
COMMENT ON COLUMN service_orders.edit_count IS 'Número de vezes que o registro foi editado manualmente';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_service_orders_manually_edited ON service_orders (manually_edited);
CREATE INDEX IF NOT EXISTS idx_service_orders_last_edit_date ON service_orders (last_edit_date);

-- Trigger para atualizar automaticamente os campos de edição
CREATE OR REPLACE FUNCTION update_edit_tracking()
RETURNS TRIGGER AS $$
BEGIN
  -- Se algum campo foi alterado (exceto campos de controle), marcar como editado
  IF OLD.order_number IS DISTINCT FROM NEW.order_number OR
     OLD.engine_manufacturer IS DISTINCT FROM NEW.engine_manufacturer OR
     OLD.engine_description IS DISTINCT FROM NEW.engine_description OR
     OLD.vehicle_model IS DISTINCT FROM NEW.vehicle_model OR
     OLD.raw_defect_description IS DISTINCT FROM NEW.raw_defect_description OR
     OLD.responsible_mechanic IS DISTINCT FROM NEW.responsible_mechanic OR
     OLD.parts_total IS DISTINCT FROM NEW.parts_total OR
     OLD.labor_total IS DISTINCT FROM NEW.labor_total OR
     OLD.grand_total IS DISTINCT FROM NEW.grand_total OR
     OLD.order_status IS DISTINCT FROM NEW.order_status OR
     OLD.order_date IS DISTINCT FROM NEW.order_date THEN
    
    -- Marcar como editado manualmente
    NEW.manually_edited := TRUE;
    NEW.last_edit_date := NOW();
    NEW.edit_count := COALESCE(OLD.edit_count, 0) + 1;
    
    -- Atualizar protected_fields com os campos que foram alterados
    NEW.protected_fields := COALESCE(OLD.protected_fields, '{}');
    
    IF OLD.order_number IS DISTINCT FROM NEW.order_number THEN
      NEW.protected_fields := NEW.protected_fields || '{"order_number": true}';
    END IF;
    
    IF OLD.engine_manufacturer IS DISTINCT FROM NEW.engine_manufacturer THEN
      NEW.protected_fields := NEW.protected_fields || '{"engine_manufacturer": true}';
    END IF;
    
    IF OLD.engine_description IS DISTINCT FROM NEW.engine_description THEN
      NEW.protected_fields := NEW.protected_fields || '{"engine_description": true}';
    END IF;
    
    IF OLD.vehicle_model IS DISTINCT FROM NEW.vehicle_model THEN
      NEW.protected_fields := NEW.protected_fields || '{"vehicle_model": true}';
    END IF;
    
    IF OLD.raw_defect_description IS DISTINCT FROM NEW.raw_defect_description THEN
      NEW.protected_fields := NEW.protected_fields || '{"raw_defect_description": true}';
    END IF;
    
    IF OLD.responsible_mechanic IS DISTINCT FROM NEW.responsible_mechanic THEN
      NEW.protected_fields := NEW.protected_fields || '{"responsible_mechanic": true}';
    END IF;
    
    IF OLD.parts_total IS DISTINCT FROM NEW.parts_total THEN
      NEW.protected_fields := NEW.protected_fields || '{"parts_total": true}';
    END IF;
    
    IF OLD.labor_total IS DISTINCT FROM NEW.labor_total THEN
      NEW.protected_fields := NEW.protected_fields || '{"labor_total": true}';
    END IF;
    
    IF OLD.grand_total IS DISTINCT FROM NEW.grand_total THEN
      NEW.protected_fields := NEW.protected_fields || '{"grand_total": true}';
    END IF;
    
    IF OLD.order_status IS DISTINCT FROM NEW.order_status THEN
      NEW.protected_fields := NEW.protected_fields || '{"order_status": true}';
    END IF;
    
    IF OLD.order_date IS DISTINCT FROM NEW.order_date THEN
      NEW.protected_fields := NEW.protected_fields || '{"order_date": true}';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para executar a função automaticamente
DROP TRIGGER IF EXISTS trigger_update_edit_tracking ON service_orders;
CREATE TRIGGER trigger_update_edit_tracking
    BEFORE UPDATE ON service_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_edit_tracking();

-- Criar tabela de log de edições para auditoria
CREATE TABLE IF NOT EXISTS service_orders_edit_log (
    id SERIAL PRIMARY KEY,
    service_order_id INTEGER REFERENCES service_orders(id),
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    edited_by TEXT,
    edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    edit_reason TEXT
);

COMMENT ON TABLE service_orders_edit_log IS 'Log de todas as edições manuais feitas nas ordens de serviço';

-- Índices para performance do log
CREATE INDEX IF NOT EXISTS idx_edit_log_service_order_id ON service_orders_edit_log (service_order_id);
CREATE INDEX IF NOT EXISTS idx_edit_log_edited_at ON service_orders_edit_log (edited_at);
CREATE INDEX IF NOT EXISTS idx_edit_log_field_name ON service_orders_edit_log (field_name);

-- Função para limpar logs antigos (manter apenas 1 ano)
CREATE OR REPLACE FUNCTION cleanup_old_edit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM service_orders_edit_log 
  WHERE edited_at < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Visualização para relatórios de edições
CREATE OR REPLACE VIEW service_orders_edit_summary AS
SELECT 
    so.order_number,
    so.manually_edited,
    so.protected_fields,
    so.last_edited_by,
    so.last_edit_date,
    so.edit_count,
    COUNT(log.id) as total_edits_logged
FROM service_orders so
LEFT JOIN service_orders_edit_log log ON so.id = log.service_order_id
WHERE so.manually_edited = TRUE
GROUP BY so.id, so.order_number, so.manually_edited, so.protected_fields, 
         so.last_edited_by, so.last_edit_date, so.edit_count
ORDER BY so.last_edit_date DESC;

COMMENT ON VIEW service_orders_edit_summary IS 'Resumo de todas as ordens de serviço que foram editadas manualmente';

-- Conceder permissões necessárias
-- (Ajustar conforme as permissões do seu ambiente)
-- GRANT SELECT, UPDATE ON service_orders TO authenticated;
-- GRANT SELECT, INSERT ON service_orders_edit_log TO authenticated;
-- GRANT SELECT ON service_orders_edit_summary TO authenticated;