#!/usr/bin/env node

/**
 * Script de Verificação do Sistema GL-Garantias
 * Verifica se todos os pré-requisitos estão atendidos
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando Sistema GL-Garantias...\n');

// Verificar versão do Node.js
const nodeVersion = process.version;
const requiredNode = '18.0.0';
console.log(`📦 Node.js: ${nodeVersion}`);

if (parseFloat(nodeVersion.substring(1)) < parseFloat(requiredNode)) {
    console.log(`❌ Node.js ${requiredNode}+ é necessário`);
    process.exit(1);
} else {
    console.log('✅ Versão do Node.js adequada');
}

// Verificar estrutura de pastas
const requiredFolders = ['backend', 'frontend', 'tests'];
const missingFolders = [];

requiredFolders.forEach(folder => {
    if (fs.existsSync(path.join(__dirname, folder))) {
        console.log(`✅ Pasta ${folder} encontrada`);
    } else {
        console.log(`❌ Pasta ${folder} não encontrada`);
        missingFolders.push(folder);
    }
});

// Verificar arquivos essenciais
const requiredFiles = [
    'package.json',
    'README.md',
    'CRONOGRAMA.md',
    'COMO_EXECUTAR.md',
    '.gitignore',
    'backend/package.json',
    'backend/.env.example',
    'backend/src/app.ts',
    'frontend/package.json',
    'frontend/src/App.tsx',
    'start-backend.bat',
    'start-frontend.bat'
];

const missingFiles = [];

requiredFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, file))) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} não encontrado`);
        missingFiles.push(file);
    }
});

// Verificar dependências instaladas
console.log('\n📚 Verificando dependências...');

const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');
const frontendNodeModules = path.join(__dirname, 'frontend', 'node_modules');

if (fs.existsSync(backendNodeModules)) {
    console.log('✅ Dependências backend instaladas');
} else {
    console.log('⚠️  Dependências backend não instaladas (execute: cd backend && npm install)');
}

if (fs.existsSync(frontendNodeModules)) {
    console.log('✅ Dependências frontend instaladas');
} else {
    console.log('⚠️  Dependências frontend não instaladas (execute: cd frontend && npm install)');
}

// Verificar arquivo .env
console.log('\n🔧 Verificando configuração...');

const envFile = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(envFile)) {
    console.log('✅ Arquivo .env configurado');
    
    // Verificar se tem as variáveis essenciais
    const envContent = fs.readFileSync(envFile, 'utf8');
    const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
    
    requiredEnvVars.forEach(envVar => {
        if (envContent.includes(envVar) && !envContent.includes(`${envVar}=your_`)) {
            console.log(`✅ ${envVar} configurado`);
        } else {
            console.log(`⚠️  ${envVar} precisa ser configurado`);
        }
    });
} else {
    console.log('⚠️  Arquivo .env não encontrado (copie de .env.example)');
}

// Resumo final
console.log('\n📋 Resumo da Verificação:');

if (missingFolders.length === 0 && missingFiles.length === 0) {
    console.log('🎉 Sistema está pronto para uso!');
    console.log('\n🚀 Para iniciar o sistema:');
    console.log('   npm run dev');
    console.log('\n🌐 URLs:');
    console.log('   Frontend: http://localhost:5173');
    console.log('   Backend:  http://localhost:3006');
} else {
    console.log('❌ Sistema precisa de correções antes do uso');
    
    if (missingFolders.length > 0) {
        console.log(`\n📁 Pastas faltando: ${missingFolders.join(', ')}`);
    }
    
    if (missingFiles.length > 0) {
        console.log(`\n📄 Arquivos faltando: ${missingFiles.join(', ')}`);
    }
}

console.log('\n📚 Para mais informações, consulte o README.md');