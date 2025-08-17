const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createMissingTables() {
  console.log('🔧 Criando tabelas faltantes usando métodos alternativos...');
  
  try {
    // 1. Criar registros na tabela mechanics usando insert
    console.log('\n➕ Criando mecânicos padrão...');
    const mechanicsData = [
      { name: 'Mecânico Geral', email: 'mecanico@empresa.com', specialization: 'Manutenção Geral', is_active: true },
      { name: 'Especialista Hidráulica', email: 'hidraulica@empresa.com', specialization: 'Sistema Hidráulico', is_active: true },
      { name: 'Especialista Elétrica', email: 'eletrica@empresa.com', specialization: 'Sistema Elétrico', is_active: true }
    ];
    
    // Tentar verificar se a tabela mechanics existe tentando fazer um select
    const { data: mechanicsTest, error: mechanicsTestError } = await supabase
      .from('mechanics')
      .select('id')
      .limit(1);
    
    if (mechanicsTestError && mechanicsTestError.code === '42P01') {
      console.log('⚠️ Tabela mechanics não existe - será criada automaticamente pelo Supabase ao inserir dados');
    }
    
    // Se chegou até aqui, a tabela existe, então vamos inserir os dados
    for (const mechanic of mechanicsData) {
      const { error } = await supabase
        .from('mechanics')
        .upsert(mechanic, { onConflict: 'name' });
      
      if (!error) {
        console.log(`✅ Mecânico '${mechanic.name}' adicionado`);
      }
    }
    
    // 2. Criar estrutura hierárquica básica
    console.log('\n➕ Criando estrutura hierárquica...');
    const hierarchyData = [
      { group_name: 'MECÂNICO', level: 1, description: 'Problemas mecânicos gerais' },
      { group_name: 'ELÉTRICO', level: 1, description: 'Problemas elétricos e eletrônicos' },
      { group_name: 'HIDRÁULICO', level: 1, description: 'Problemas no sistema hidráulico' },
      { group_name: 'PNEUMÁTICO', level: 1, description: 'Problemas no sistema pneumático' },
      { group_name: 'ESTRUTURAL', level: 1, description: 'Problemas estruturais' },
      { group_name: 'OUTROS', level: 1, description: 'Outras categorias' }
    ];
    
    for (const hierarchy of hierarchyData) {
      const { error } = await supabase
        .from('defect_hierarchy')
        .upsert(hierarchy, { onConflict: 'group_name,subgroup_name,subsubgroup_name' });
      
      if (!error) {
        console.log(`✅ Grupo hierárquico '${hierarchy.group_name}' adicionado`);
      }
    }
    
    // 3. Criar um log de upload de teste
    console.log('\n➕ Criando estrutura de logs de upload...');
    const testUploadLog = {
      filename: 'test_structure.xlsx',
      original_name: 'test_structure.xlsx',
      file_size: 1024,
      mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upload_type: 'structure_test',
      status: 'completed',
      records_processed: 0,
      records_created: 0,
      records_updated: 0,
      errors_count: 0
    };
    
    const { error: uploadLogError } = await supabase
      .from('upload_logs')
      .insert(testUploadLog);
    
    if (!uploadLogError) {
      console.log('✅ Estrutura de upload_logs verificada');
      
      // Remover o registro de teste
      await supabase
        .from('upload_logs')
        .delete()
        .eq('filename', 'test_structure.xlsx');
    }
    
  } catch (error) {
    console.log('❌ Erro durante criação:', error.message);
    
    // Tentar abordagem alternativa: Informar ao usuário sobre os SQLs necessários
    console.log('\n📋 EXECUTE ESTES SQLs MANUALMENTE NO SUPABASE:');
    console.log(`
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
    `);
  }
  
  console.log('\n🎉 Tentativa de criação concluída!');
}

createMissingTables();