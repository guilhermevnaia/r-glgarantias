@echo off
title GLU-GARANTIAS - Inicialização Rápida

echo ==========================================
echo 🚀 GLU-GARANTIAS - INICIALIZAÇÃO RÁPIDA
echo ==========================================

REM Matar processos existentes
echo 🛑 Limpando portas...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3009 "') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 "') do taskkill /f /pid %%a >nul 2>&1

echo ✅ Portas liberadas!

echo.
echo 🚀 Iniciando Backend...
cd backend
start "BACKEND-3009" cmd /k "npm start"

echo ⏳ Aguardando backend (5s)...
timeout /t 5 /nobreak >nul

cd ..

echo.
echo 🎨 Iniciando Frontend...
cd frontend  
start "FRONTEND-5173" cmd /k "npm run dev"

echo ⏳ Aguardando frontend (3s)...
timeout /t 3 /nobreak >nul

cd ..

echo.
echo ✅ SISTEMA INICIADO!
echo.
echo 🌐 Frontend: http://localhost:5173
echo 🔌 Backend:  http://localhost:3009
echo.
echo 📝 Credenciais:
echo    Email: admin@test.com
echo    Senha: admin123
echo.
pause