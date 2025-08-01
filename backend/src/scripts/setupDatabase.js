// Script para configurar tabelas do banco de dados
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const setupUsersTable = async () => {
  console.log('🗄️ Configurando tabela de usuários...');
  
  try {
    // SQL para criar a tabela users
    const createUsersTableSQL = `
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

      -- 3. Função para atualizar updated_at automaticamente
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- 4. Trigger para updated_at
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `;

    // Executar o SQL através de uma query simples
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: createUsersTableSQL 
    });

    if (error) {
      console.error('❌ Erro ao criar tabela users:', error);
      
      // Tentar criar tabela com queries individuais
      console.log('🔄 Tentando criar tabela com queries individuais...');
      
      // Query básica para criar tabela
      const { error: createError } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (createError && createError.code === '42P01') {
        console.log('📝 Tabela users não existe, mas não podemos criá-la via API.');
        console.log('⚠️ Execute o SQL manualmente no Supabase SQL Editor:');
        console.log(createUsersTableSQL);
        return false;
      }
    } else {
      console.log('✅ Tabela users configurada com sucesso!');
    }

    return true;
  } catch (error) {
    console.error('💥 Erro na configuração:', error);
    return false;
  }
};

const setupAITables = async () => {
  console.log('🤖 Configurando tabelas de IA...');
  
  const createAITablesSQL = `
    -- 1. Tabela de categorias de defeitos
    CREATE TABLE IF NOT EXISTS defect_categories (
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
        ai_reasoning TEXT,
        alternative_categories INTEGER[]
    );

    -- 3. Índices
    CREATE INDEX IF NOT EXISTS idx_defect_categories_active ON defect_categories(is_active);
    CREATE INDEX IF NOT EXISTS idx_defect_classifications_service_order ON defect_classifications(service_order_id);
    CREATE INDEX IF NOT EXISTS idx_defect_classifications_category ON defect_classifications(category_id);

    -- 4. Categorias padrão (apenas se não existirem)
    INSERT INTO defect_categories (category_name, description, color_hex, icon, keywords, sample_defects) 
    SELECT * FROM (VALUES
        ('Vazamentos', 'Problemas relacionados a vazamentos de fluidos', '#EF4444', 'droplets', ARRAY['vazamento', 'vaza', 'goteira'], ARRAY['VAZAMENTO DE ÓLEO', 'VAZAMENTO DE ÁGUA']),
        ('Superaquecimento', 'Problemas de temperatura elevada', '#F97316', 'thermometer', ARRAY['esquenta', 'quente', 'temperatura'], ARRAY['ESQUENTANDO', 'MOTOR QUENTE']),
        ('Falhas de Ignição', 'Problemas para ligar ou funcionar', '#8B5CF6', 'zap', ARRAY['não pega', 'não liga', 'falha'], ARRAY['NÃO PEGA', 'NÃO LIGA']),
        ('Ruídos Anômalos', 'Barulhos estranhos ou anormais', '#06B6D4', 'volume-2', ARRAY['barulho', 'ruído', 'som'], ARRAY['BARULHO NO MOTOR', 'RUÍDO ESTRANHO']),
        ('Problemas Elétricos', 'Falhas no sistema elétrico', '#EAB308', 'zap', ARRAY['elétrico', 'bateria', 'alternador'], ARRAY['PROBLEMA ELÉTRICO', 'FALHA NO CHICOTE']),
        ('Desgaste de Componentes', 'Peças desgastadas', '#64748B', 'settings', ARRAY['desgaste', 'gasto', 'troca'], ARRAY['DESGASTE', 'PEÇA GASTA'])
    ) AS new_categories(category_name, description, color_hex, icon, keywords, sample_defects)
    WHERE NOT EXISTS (
        SELECT 1 FROM defect_categories WHERE category_name = new_categories.category_name
    );
  `;

  try {
    // Verificar se as tabelas já existem consultando uma delas
    const { data, error } = await supabase
      .from('defect_categories')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      console.log('📝 Tabelas de IA não existem, mas não podemos criá-las via API.');
      console.log('⚠️ Execute o SQL manualmente no Supabase SQL Editor:');
      console.log(createAITablesSQL);
      return false;
    } else {
      console.log('✅ Tabelas de IA já existem!');
      return true;
    }
  } catch (error) {
    console.error('💥 Erro na verificação das tabelas de IA:', error);
    return false;
  }
};

async function setupDatabase() {
  console.log('🚀 Iniciando configuração do banco de dados...\n');

  const usersOk = await setupUsersTable();
  const aiOk = await setupAITables();

  if (usersOk && aiOk) {
    console.log('\n🎉 Banco de dados configurado com sucesso!');
  } else {
    console.log('\n⚠️ Algumas tabelas precisam ser criadas manualmente no Supabase.');
    console.log('📖 Consulte os arquivos SQL em src/database/');
  }
}

// Se executado diretamente
if (require.main === module) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Erro na configuração:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabase, setupUsersTable, setupAITables };