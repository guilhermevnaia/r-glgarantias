#!/bin/bash
# Build script for Render.com deployment

echo "🔨 Iniciando build do backend..."

# Install Node.js dependencies
echo "📦 Instalando dependências Node.js..."
npm install

# Build TypeScript
echo "🏗️ Compilando TypeScript..."
npm run build

# Install Python dependencies
echo "🐍 Instalando dependências Python..."
pip install --user -r python/requirements.txt

# Verify Python dependencies
echo "✅ Verificando instalação Python..."
python -c "import pandas, openpyxl, numpy; print('✅ Todas as dependências Python instaladas com sucesso!')" || echo "❌ Erro na instalação de dependências Python"

echo "🎉 Build concluído!"