@echo off
echo ========================================
echo    SISTEMA DE AUTENTICACAO - GL GARANTIAS
echo ========================================
echo.

echo [1/4] Parando processos Node.js existentes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo [2/4] Iniciando servidor de autenticacao...
cd backend
start "Servidor de Autenticacao" cmd /k "node fix-auth.js"

echo [3/4] Aguardando servidor inicializar...
timeout /t 5 >nul

echo [4/4] Abrindo pagina de teste...
start test-login.html

echo.
echo ========================================
echo    SISTEMA INICIADO COM SUCESSO!
echo ========================================
echo.
echo Servidor de autenticacao: http://localhost:3010
echo Pagina de teste: test-login.html
echo.
echo Credenciais de teste:
echo Email: admin@glgarantias.com
echo Senha: Admin123
echo.
echo Pressione qualquer tecla para sair...
pause >nul 