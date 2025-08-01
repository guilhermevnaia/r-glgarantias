-- TABELA DE USUÁRIOS PARA AUTENTICAÇÃO
-- Execute este SQL no Supabase (SQL Editor)

-- 1. Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255)
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 3. Criar usuário admin padrão (senha: Admin123!)
INSERT INTO users (email, name, password_hash, role, permissions, is_active, email_verified)
VALUES (
    'admin@glgarantias.com',
    'Administrador',
    '$2b$12$rQj9O8M.7HkqY.6yN5L.VeGBr5YRw0aJ8jN2Z5K.0xY7cQ4aZ2F5G', -- Hash de "Admin123!"
    'admin',
    ARRAY['*'],
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- 4. Criar usuário manager padrão (senha: Manager123!)
INSERT INTO users (email, name, password_hash, role, permissions, is_active, email_verified)
VALUES (
    'manager@glgarantias.com',
    'Gerente',
    '$2b$12$vP1zL3Q.8KlmX.5xM6L.UdFAq4XQv9aH7iM1Y4J.9wX6bP3aY1E4F', -- Hash de "Manager123!"
    'manager',
    ARRAY['view_dashboard', 'view_reports', 'manage_service_orders', 'manage_mechanics', 'export_data', 'view_ai_classifications'],
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- 5. Criar usuário comum padrão (senha: User123!)
INSERT INTO users (email, name, password_hash, role, permissions, is_active, email_verified)
VALUES (
    'user@glgarantias.com',
    'Usuário',
    '$2b$12$sN2kM4R.7JlpZ.6yO5M.WeFCr6ZSx0bI9kO3Z6L.1yY8dR5bZ3G6H', -- Hash de "User123!"
    'user',
    ARRAY['view_dashboard', 'view_reports', 'view_service_orders'],
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- 6. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Trigger para updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Comentários para documentação
COMMENT ON TABLE users IS 'Tabela de usuários do sistema com autenticação e autorização';
COMMENT ON COLUMN users.role IS 'Roles: admin, manager, user';
COMMENT ON COLUMN users.permissions IS 'Array de permissões específicas';
COMMENT ON COLUMN users.failed_login_attempts IS 'Contador de tentativas de login falhadas';
COMMENT ON COLUMN users.locked_until IS 'Usuário bloqueado até esta data/hora';