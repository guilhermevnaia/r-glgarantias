@echo off
echo ==========================================
echo 🚀 INICIANDO SISTEMA GLU-GARANTIAS
echo ==========================================

echo.
echo 📋 1. Verificando requisitos...

REM Verificar se Node.js esta instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js nao encontrado! Instale o Node.js primeiro.
    pause
    exit /b 1
)

REM Verificar se npm esta instalado
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ NPM nao encontrado! Instale o Node.js primeiro.
    pause
    exit /b 1
)

echo ✅ Node.js encontrado!
echo ✅ NPM encontrado!

echo.
echo 📋 2. Instalando dependencias...

REM Instalar dependencias do backend
echo.
echo 🔧 Instalando dependencias do backend...
cd backend
call npm install --silent
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao instalar dependencias do backend!
    pause
    exit /b 1
)

REM Voltar para o diretorio raiz
cd ..

REM Instalar dependencias do frontend
echo.
echo 🔧 Instalando dependencias do frontend...
cd frontend
call npm install --silent --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao instalar dependencias do frontend!
    pause
    exit /b 1
)

REM Voltar para o diretorio raiz
cd ..

echo.
echo 📋 3. Testando conexao com o banco de dados...
cd backend
call node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('service_orders').select('count', { count: 'exact', head: true })
.then(result => {
    if (result.error) {
        console.log('❌ Erro de conexao:', result.error.message);
        process.exit(1);
    } else {
        console.log('✅ Banco conectado! Registros:', result.count || 0);
        process.exit(0);
    }
})
.catch(err => {
    console.log('❌ Erro:', err.message);
    process.exit(1);
});
" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Falha na conexao com o banco!
    pause
    exit /b 1
)

cd ..

echo.
echo 📋 4. Iniciando servicos...

REM Matar processos existentes nas portas
echo.
echo 🛑 Parando servicos existentes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3009 "') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 "') do taskkill /f /pid %%a >nul 2>&1

echo ✅ Portas liberadas!

REM Aguardar um momento
timeout /t 2 /nobreak >nul

echo.
echo 🚀 Iniciando Backend (porta 3009)...
cd backend
start "GLU-GARANTIAS BACKEND" cmd /k "echo Iniciando backend... && npm start"

REM Aguardar backend inicializar
echo ⏳ Aguardando backend inicializar...
timeout /t 10 /nobreak >nul

cd ..

echo.
echo 🎨 Iniciando Frontend (porta 5173)...
cd frontend
start "GLU-GARANTIAS FRONTEND" cmd /k "echo Iniciando frontend... && npm run dev"

REM Aguardar frontend inicializar
echo ⏳ Aguardando frontend inicializar...
timeout /t 8 /nobreak >nul

cd ..

echo.
echo 📋 5. Testando conectividade...

REM Testar backend
echo.
echo 🔍 Testando backend...
curl -s http://localhost:3009/health >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend funcionando!
) else (
    echo ❌ Backend nao respondeu!
)

REM Testar frontend
echo.
echo 🔍 Testando frontend...
curl -s http://localhost:5173 >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Frontend funcionando!
) else (
    echo ❌ Frontend nao respondeu!
)

echo.
echo ==========================================
echo ✅ SISTEMA INICIADO COM SUCESSO!
echo ==========================================
echo.
echo 🌐 Frontend: http://localhost:5173
echo 🔌 Backend:  http://localhost:3009
echo 💾 Health:   http://localhost:3009/health
echo.
echo 📝 Credenciais padroes:
echo    Email: admin@test.com
echo    Senha: admin123
echo.
echo Pressione qualquer tecla para sair...
pause >nul