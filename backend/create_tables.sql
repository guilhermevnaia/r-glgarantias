-- Script SQL para criar tabelas faltantes no Supabase
-- Execute este script no Dashboard do Supabase > SQL Editor

-- 1. Tabela mechanics
CREATE TABLE IF NOT EXISTS public.mechanics (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(50),
  specialization VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir mecânicos padrão
INSERT INTO public.mechanics (name, email, specialization) VALUES
  ('Mecânico Geral', 'mecanico@empresa.com', 'Manutenção Geral'),
  ('Especialista Hidráulica', 'hidraulica@empresa.com', 'Sistema Hidráulico'),
  ('Especialista Elétrica', 'eletrica@empresa.com', 'Sistema Elétrico')
ON CONFLICT (name) DO NOTHING;

-- 2. Tabela defect_hierarchy
CREATE TABLE IF NOT EXISTS public.defect_hierarchy (
  id BIGSERIAL PRIMARY KEY,
  group_name VARCHAR(255) NOT NULL,
  subgroup_name VARCHAR(255),
  subsubgroup_name VARCHAR(255),
  description TEXT,
  level INTEGER NOT NULL DEFAULT 1,
  parent_id BIGINT REFERENCES public.defect_hierarchy(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_name, subgroup_name, subsubgroup_name)
);

-- Inserir estrutura hierárquica básica
INSERT INTO public.defect_hierarchy (group_name, level, description) VALUES
  ('MECÂNICO', 1, 'Problemas mecânicos gerais'),
  ('ELÉTRICO', 1, 'Problemas elétricos e eletrônicos'),
  ('HIDRÁULICO', 1, 'Problemas no sistema hidráulico'),
  ('PNEUMÁTICO', 1, 'Problemas no sistema pneumático'),
  ('ESTRUTURAL', 1, 'Problemas estruturais'),
  ('OUTROS', 1, 'Outras categorias')
ON CONFLICT (group_name, subgroup_name, subsubgroup_name) DO NOTHING;

-- 3. Tabela upload_logs
CREATE TABLE IF NOT EXISTS public.upload_logs (
  id BIGSERIAL PRIMARY KEY,
  filename VARCHAR(500) NOT NULL,
  original_name VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  user_id BIGINT,
  upload_type VARCHAR(50) DEFAULT 'excel',
  status VARCHAR(50) DEFAULT 'processing',
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  error_details JSONB,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_upload_logs_created_at ON public.upload_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_upload_logs_user_id ON public.upload_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_logs_status ON public.upload_logs(status);

-- Verificar se tudo foi criado
SELECT 'Tabelas criadas com sucesso!' as message;