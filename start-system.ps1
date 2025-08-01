# Script PowerShell para iniciar o sistema GL Garantias
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    SISTEMA GL GARANTIAS - INICIANDO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Parar processos Node.js existentes
Write-Host "[1/5] Parando processos Node.js existentes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Iniciar servidor de autenticação
Write-Host "[2/5] Iniciando servidor de autenticação..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd backend && node fix-auth.js" -WindowStyle Minimized

# Aguardar servidor inicializar
Write-Host "[3/5] Aguardando servidor de autenticação..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Testar servidor de autenticação
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3010/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Servidor de autenticação funcionando!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro no servidor de autenticação" -ForegroundColor Red
    exit 1
}

# Iniciar frontend
Write-Host "[4/5] Iniciando frontend..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd frontend && npm run dev" -WindowStyle Minimized

# Aguardar frontend inicializar
Write-Host "[5/5] Aguardando frontend..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Testar frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 5
    Write-Host "✅ Frontend funcionando!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro no frontend" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    SISTEMA INICIADO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 URLs:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Servidor Auth: http://localhost:3010" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔐 Credenciais:" -ForegroundColor White
Write-Host "   Email: admin@glgarantias.com" -ForegroundColor Yellow
Write-Host "   Senha: Admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Para parar o sistema, feche as janelas do terminal" -ForegroundColor Gray
Write-Host ""

# Abrir navegador
Start-Process "http://localhost:5173" 