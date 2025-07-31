@echo off
echo ========================================
echo   TESTE RAPIDO DO SISTEMA DEFINITIVO
echo ========================================
echo.

echo [1/3] Testando Python...
python --version
if errorlevel 1 (
    echo ERRO: Python nao encontrado!
    echo CODIGO: PYTHON_ENV_ERROR
    pause
    exit
)

echo [2/3] Testando API v2...
curl -s http://localhost:3008/api/v2/health > temp_health.json
if errorlevel 1 (
    echo ERRO: API v2 nao responde!
    echo CODIGO: PYTHON_UPLOAD_ERROR
    pause
    exit
)

echo [3/3] Verificando resposta...
findstr "ready.*true" temp_health.json >nul
if errorlevel 1 (
    echo ERRO: Sistema nao esta pronto!
    echo CODIGO: PYTHON_UPLOAD_ERROR
    pause
    exit
) else (
    echo.
    echo ========================================
    echo   ✅ SISTEMA FUNCIONANDO PERFEITAMENTE!
    echo   🎯 Pronto para processar 2.519 registros
    echo ========================================
)

del temp_health.json 2>nul
echo.
echo Pressione qualquer tecla para continuar...
pause >nul