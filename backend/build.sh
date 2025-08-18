#!/bin/bash
# Build script for Render.com deployment

set -e  # Exit on any error

echo "🔨 Iniciando build do backend..."

# Install Node.js dependencies
echo "📦 Instalando dependências Node.js..."
npm ci --only=production

# Build TypeScript
echo "🏗️ Compilando TypeScript..."
npm run build

# Check if Python is available
echo "🐍 Verificando Python..."
python --version || python3 --version || { echo "❌ Python não encontrado"; exit 1; }

# Try different Python commands
PYTHON_CMD="python"
if ! command -v python &> /dev/null; then
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
    else
        echo "❌ Nenhum comando Python encontrado"
        exit 1
    fi
fi

echo "🐍 Usando comando: $PYTHON_CMD"

# Install Python dependencies with more robust approach
echo "🐍 Instalando dependências Python..."
$PYTHON_CMD -m pip install --upgrade pip
$PYTHON_CMD -m pip install pandas>=2.0.0 openpyxl>=3.1.0 numpy>=1.24.0

# Verify Python dependencies
echo "✅ Verificando instalação Python..."
$PYTHON_CMD -c "import pandas, openpyxl, numpy; print('Todas as dependencias Python instaladas com sucesso!')" || {
    echo "❌ Erro na verificação de dependências Python"
    $PYTHON_CMD -c "import sys; print('Python path:', sys.path)"
    exit 1
}

echo "🎉 Build concluído com sucesso!"