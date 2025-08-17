const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function completeAISystemReset() {
  console.log('🔥 === RESET COMPLETO DO SISTEMA DE IA ===\n');
  console.log('🧹 Limpando TUDO para começar do zero...\n');
  
  try {
    // 1. LIMPAR DADOS DO BANCO
    console.log('1️⃣ LIMPEZA COMPLETA DO BANCO DE DADOS');
    
    console.log('🗑️  Removendo TODAS as classificações...');
    const { error: deleteClassificationsError } = await supabase
      .from('defect_classifications')
      .delete()
      .neq('id', 0);
    
    if (deleteClassificationsError) {
      console.error('❌ Erro ao limpar classificações:', deleteClassificationsError);
    } else {
      console.log('✅ Todas as classificações removidas');
    }
    
    console.log('🗑️  Removendo TODAS as categorias...');
    const { error: deleteCategoriesError } = await supabase
      .from('defect_categories')
      .delete()
      .neq('id', 0);
    
    if (deleteCategoriesError) {
      console.error('❌ Erro ao limpar categorias:', deleteCategoriesError);
    } else {
      console.log('✅ Todas as categorias removidas');
    }
    
    // 2. RENOMEAR/MOVER SERVIÇOS ANTIGOS
    console.log('\\n2️⃣ MOVENDO SERVIÇOS DE IA ANTIGOS');
    
    const servicesDir = path.join(__dirname, 'src', 'services');
    const backupDir = path.join(__dirname, 'OLD_AI_SERVICES_BACKUP');
    
    // Criar diretório de backup
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log(`📁 Diretório de backup criado: ${backupDir}`);
    }
    
    // Lista dos serviços antigos para mover
    const oldAIServices = [
      'GroqAIService.ts',
      'EnhancedLocalAIService.ts',
      'LocalAIService.ts',
      'HierarchicalAIService.ts',
      'HierarchicalAIServiceV2.ts',
      'EnhancedHierarchicalAIService.ts',
      'ComprehensiveAIClassificationService.ts'
    ];
    
    for (const service of oldAIServices) {
      const oldPath = path.join(servicesDir, service);
      const newPath = path.join(backupDir, service);
      
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`📦 Movido: ${service} → backup`);
      } else {
        console.log(`⚠️  Não encontrado: ${service}`);
      }
    }
    
    // 3. LIMPAR SCRIPTS DE CLASSIFICAÇÃO ANTIGOS
    console.log('\\n3️⃣ MOVENDO SCRIPTS ANTIGOS');
    
    const scriptsBackupDir = path.join(__dirname, 'OLD_SCRIPTS_BACKUP');
    if (!fs.existsSync(scriptsBackupDir)) {
      fs.mkdirSync(scriptsBackupDir, { recursive: true });
    }
    
    // Mover scripts de classificação antigos
    const oldScripts = fs.readdirSync(__dirname).filter(file => 
      file.includes('classify') || 
      file.includes('ai') || 
      file.includes('fix') ||
      file.includes('mass') ||
      file.includes('force')
    );
    
    for (const script of oldScripts) {
      const oldPath = path.join(__dirname, script);
      const newPath = path.join(scriptsBackupDir, script);
      
      try {
        fs.renameSync(oldPath, newPath);
        console.log(`📦 Script movido: ${script}`);
      } catch (error) {
        console.log(`⚠️  Erro ao mover ${script}: ${error.message}`);
      }
    }
    
    // 4. CRIAR ESTRUTURA LIMPA
    console.log('\\n4️⃣ CRIANDO ESTRUTURA LIMPA');
    
    // Criar tabela de categorias simples
    console.log('📊 Recriando tabela de categorias...');
    
    const basicCategories = [
      {
        category_name: 'Vazamentos',
        description: 'Vazamentos de óleo, água ou outros fluidos',
        color_hex: '#DC2626',
        icon: 'droplet',
        keywords: ['vazamento', 'vaza', 'gotej', 'ping', 'escorr', 'oleo', 'agua'],
        is_active: true,
        total_occurrences: 0
      },
      {
        category_name: 'Problemas Mecânicos',
        description: 'Desgaste, quebra ou dano em componentes mecânicos',
        color_hex: '#7C2D12',
        icon: 'wrench',
        keywords: ['quebr', 'rachad', 'danific', 'desgast', 'gast', 'pistao', 'biela'],
        is_active: true,
        total_occurrences: 0
      },
      {
        category_name: 'Superaquecimento',
        description: 'Problemas relacionados a temperatura alta',
        color_hex: '#EA580C',
        icon: 'thermometer',
        keywords: ['esquent', 'quent', 'temperatura', 'superaque', 'fervend', 'calor'],
        is_active: true,
        total_occurrences: 0
      },
      {
        category_name: 'Problemas Elétricos',
        description: 'Falhas em componentes elétricos',
        color_hex: '#1D4ED8',
        icon: 'zap',
        keywords: ['eletric', 'vela', 'bobina', 'bateria', 'sensor', 'chicote'],
        is_active: true,
        total_occurrences: 0
      },
      {
        category_name: 'Ruídos Anômalos',
        description: 'Barulhos, sons ou ruídos incomuns',
        color_hex: '#C2410C',
        icon: 'volume-2',
        keywords: ['barulh', 'ruido', 'som', 'estalo', 'batid', 'zunid'],
        is_active: true,
        total_occurrences: 0
      },
      {
        category_name: 'Operacional',
        description: 'Testes, verificações e procedimentos operacionais',
        color_hex: '#059669',
        icon: 'settings',
        keywords: ['test', 'verifica', 'revision', 'manutencao', 'ajust'],
        is_active: true,
        total_occurrences: 0
      }
    ];
    
    for (const category of basicCategories) {
      const { error } = await supabase
        .from('defect_categories')
        .insert(category);
      
      if (error) {
        console.error(`❌ Erro ao criar categoria ${category.category_name}:`, error);
      } else {
        console.log(`✅ Categoria criada: ${category.category_name}`);
      }
    }
    
    console.log('\\n5️⃣ VERIFICAÇÃO FINAL');
    
    // Verificar estado final
    const { count: finalCategories } = await supabase
      .from('defect_categories')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalClassifications } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Categorias no sistema: ${finalCategories}`);
    console.log(`🤖 Classificações no sistema: ${finalClassifications}`);
    
    console.log('\\n✅ === RESET COMPLETO CONCLUÍDO ===');
    console.log('🎯 Sistema limpo e pronto para novo desenvolvimento!');
    console.log('📁 Arquivos antigos salvos em: OLD_AI_SERVICES_BACKUP/');
    console.log('📁 Scripts antigos salvos em: OLD_SCRIPTS_BACKUP/');
    console.log('\\n🚀 Próximo passo: Criar novo sistema de IA simples e eficiente');
    
  } catch (error) {
    console.error('🚨 Erro crítico no reset:', error);
  }
}

// Executar reset
completeAISystemReset();