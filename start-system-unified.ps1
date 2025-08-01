# Script PowerShell para iniciar o sistema GL Garantias UNIFICADO
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    SISTEMA GL GARANTIAS - UNIFICADO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Parar processos Node.js existentes
Write-Host "[1/4] Parando processos Node.js existentes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Iniciar servidor principal (que inclui autenticação)
Write-Host "[2/4] Iniciando servidor principal..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd backend && npm run dev" -WindowStyle Minimized

# Aguardar servidor inicializar
Write-Host "[3/4] Aguardando servidor principal..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Testar servidor principal
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3009/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Servidor principal funcionando!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro no servidor principal" -ForegroundColor Red
    exit 1
}

# Iniciar frontend
Write-Host "[4/4] Iniciando frontend..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd frontend && npm run dev" -WindowStyle Minimized

# Aguardar frontend inicializar
Write-Host "[5/5] Aguardando frontend..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Testar frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 10
    Write-Host "✅ Frontend funcionando!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro no frontend" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    SISTEMA UNIFICADO INICIADO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 URLs:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Servidor Principal: http://localhost:3009" -ForegroundColor Cyan
Write-Host "   Auth: http://localhost:3009/api/v1/auth/login" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔐 Credenciais:" -ForegroundColor White
Write-Host "   Email: admin@glgarantias.com" -ForegroundColor Yellow
Write-Host "   Senha: Admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Para parar o sistema, feche as janelas do terminal" -ForegroundColor Gray
Write-Host ""

# Abrir navegador
Start-Process "http://localhost:5173" 