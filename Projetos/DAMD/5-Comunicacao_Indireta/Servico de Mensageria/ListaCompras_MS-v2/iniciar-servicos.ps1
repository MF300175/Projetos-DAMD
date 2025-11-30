Write-Host "========================================" -ForegroundColor Cyan
Write-Host " DAMD - ListaCompras MS v2" -ForegroundColor Cyan
Write-Host " Iniciando servicos com mensageria" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$basePath = Split-Path -Parent $PSScriptRoot
$damdProjetosPath = Join-Path $basePath "..\DAMD-Projetos\ListaCompras_MS-v2"
$mensageriaPath = $PSScriptRoot

Write-Host "[1/6] Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Node.js nao encontrado. Instale Node.js primeiro." -ForegroundColor Red
    pause
    exit 1
}
Write-Host "Node.js encontrado: $nodeVersion" -ForegroundColor Green
Write-Host ""

Write-Host "[2/6] Verificando caminhos..." -ForegroundColor Yellow
if (-not (Test-Path $damdProjetosPath)) {
    Write-Host "Caminho nao encontrado: $damdProjetosPath" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "Caminho validado: $damdProjetosPath" -ForegroundColor Green

# Instalar dependencias do diretorio compartilhado
Write-Host "Instalando dependencias compartilhadas (lista-compras-microservices)..." -ForegroundColor Cyan
$sharedPath = Join-Path $damdProjetosPath "lista-compras-microservices"
if (Test-Path (Join-Path $sharedPath "package.json")) {
    Push-Location $sharedPath
    npm install --silent 2>$null
    Pop-Location
    Write-Host "Dependencias compartilhadas instaladas" -ForegroundColor Green
}
Write-Host ""

Write-Host "[3/6] Instalando dependencias e iniciando servicos..." -ForegroundColor Yellow
Write-Host ""

# User Service
Write-Host "Instalando dependencias do User Service..." -ForegroundColor Cyan
$userServicePath = Join-Path $damdProjetosPath "services\user-service"
if (Test-Path (Join-Path $userServicePath "package.json")) {
    Push-Location $userServicePath
    npm install --silent 2>$null
    Pop-Location
}
Write-Host "Iniciando User Service (porta 3001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$userServicePath'; Write-Host 'User Service - Porta 3001' -ForegroundColor Green; npm start" -WindowStyle Normal

Start-Sleep -Seconds 2

# Item Service
Write-Host "Instalando dependencias do Item Service..." -ForegroundColor Cyan
$itemServicePath = Join-Path $damdProjetosPath "services\item-service"
if (Test-Path (Join-Path $itemServicePath "package.json")) {
    Push-Location $itemServicePath
    npm install --silent 2>$null
    Pop-Location
}
Write-Host "Iniciando Item Service (porta 3003)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$itemServicePath'; Write-Host 'Item Service - Porta 3003' -ForegroundColor Green; npm start" -WindowStyle Normal

Start-Sleep -Seconds 2

# List Service
Write-Host "Instalando dependencias do List Service..." -ForegroundColor Cyan
$listServicePath = Join-Path $damdProjetosPath "services\list-service"
if (Test-Path (Join-Path $listServicePath "package.json")) {
    Push-Location $listServicePath
    npm install --silent 2>$null
    Pop-Location
}
Write-Host "Iniciando List Service (porta 3002)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$listServicePath'; Write-Host 'List Service - Porta 3002' -ForegroundColor Green; npm start" -WindowStyle Normal

Start-Sleep -Seconds 2

# API Gateway
Write-Host "Instalando dependencias do API Gateway..." -ForegroundColor Cyan
$apiGatewayPath = Join-Path $damdProjetosPath "api-gateway"
if (Test-Path (Join-Path $apiGatewayPath "package.json")) {
    Push-Location $apiGatewayPath
    npm install --silent 2>$null
    Pop-Location
}
Write-Host "Iniciando API Gateway (porta 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$apiGatewayPath'; Write-Host 'API Gateway - Porta 3000' -ForegroundColor Green; npm start" -WindowStyle Normal

Write-Host ""
Write-Host "[4/6] Aguardando inicializacao dos servicos..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "[5/6] Iniciando consumers..." -ForegroundColor Yellow
Write-Host ""

# Consumer Notification
Write-Host "Instalando dependencias do Consumer Notification..." -ForegroundColor Cyan
$consumerNotificationPath = Join-Path $mensageriaPath "consumer-notification"
if (Test-Path (Join-Path $consumerNotificationPath "package.json")) {
    Push-Location $consumerNotificationPath
    npm install --silent 2>$null
    Pop-Location
}
Write-Host "Iniciando Consumer Notification..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$consumerNotificationPath'; Write-Host 'Consumer Notification' -ForegroundColor Green; npm start" -WindowStyle Normal

Start-Sleep -Seconds 2

# Consumer Analytics
Write-Host "Instalando dependencias do Consumer Analytics..." -ForegroundColor Cyan
$consumerAnalyticsPath = Join-Path $mensageriaPath "consumer-analytics"
if (Test-Path (Join-Path $consumerAnalyticsPath "package.json")) {
    Push-Location $consumerAnalyticsPath
    npm install --silent 2>$null
    Pop-Location
}
Write-Host "Iniciando Consumer Analytics..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$consumerAnalyticsPath'; Write-Host 'Consumer Analytics' -ForegroundColor Green; npm start" -WindowStyle Normal

Write-Host ""
Write-Host "[6/6] Verificando status..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Aguarde 10 segundos para inicializacao completa..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Servicos iniciados!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "URLs dos servicos:" -ForegroundColor Cyan
Write-Host "  API Gateway:    http://localhost:3000" -ForegroundColor White
Write-Host "  User Service:   http://localhost:3001" -ForegroundColor White
Write-Host "  List Service:   http://localhost:3002" -ForegroundColor White
Write-Host "  Item Service:   http://localhost:3003" -ForegroundColor White
Write-Host ""
Write-Host "RabbitMQ UI:     http://localhost:15672 (se Docker)" -ForegroundColor White
Write-Host ""
Write-Host "Para testar: node teste-manual.js" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pressione qualquer tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

