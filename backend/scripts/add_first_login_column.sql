-- Script SQL para adicionar a coluna requires_password_setup na tabela users
-- Execute este script no Supabase Dashboard > SQL Editor

-- Adicionar coluna para controle de primeiro acesso
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS requires_password_setup BOOLEAN DEFAULT false;

-- Atualizar usuários existentes para não precisar definir senha novamente
UPDATE users 
SET requires_password_setup = false 
WHERE requires_password_setup IS NULL;

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'requires_password_setup';

-- Mensagem de confirmação
SELECT 'Coluna requires_password_setup adicionada com sucesso na tabela users!' as message;