Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INICIANDO TODOS OS SERVICOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se há processos Node.js rodando
$processos = Get-Process node -ErrorAction SilentlyContinue
if ($processos) {
    Write-Host "Encerrando processos Node.js existentes..." -ForegroundColor Yellow
    $processos | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Configurar RABBITMQ_URL
$env:RABBITMQ_URL = "amqp://brvljsac:fgqB4Pcd8Pap6B8KiQ47BGBnx38kUumV@shark.rmq.cloudamqp.com/brvljsac"
[System.Environment]::SetEnvironmentVariable('RABBITMQ_URL', $env:RABBITMQ_URL, 'User')
Write-Host "RABBITMQ_URL configurada" -ForegroundColor Green
Write-Host "URL: amqp://shark.rmq.cloudamqp.com/brvljsac" -ForegroundColor Green
Write-Host ""

# Caminhos
$DAMD_PATH = "C:\PUC_2025_2\DAMD\Projetos-DAMD\Projetos-DAMD\Projetos\DAMD-Projetos\ListaCompras_MS-v2"
$MENSAGERIA_PATH = "C:\PUC_2025_2\DAMD\Projetos-DAMD\Projetos-DAMD\Projetos\mensageria_01\ListaCompras_MS-v2"

Write-Host "Iniciando servicos...`n" -ForegroundColor Cyan

# User Service
Write-Host "1. User Service (porta 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$DAMD_PATH\services\user-service'; Write-Host '=== USER SERVICE - PORTA 3001 ===' -ForegroundColor Cyan; npm start"
Start-Sleep -Seconds 2

# Item Service
Write-Host "2. Item Service (porta 3003)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$DAMD_PATH\services\item-service'; Write-Host '=== ITEM SERVICE - PORTA 3003 ===' -ForegroundColor Cyan; npm start"
Start-Sleep -Seconds 2

# List Service (COM RABBITMQ_URL)
Write-Host "3. List Service (porta 3002)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:RABBITMQ_URL='$env:RABBITMQ_URL'; cd '$DAMD_PATH\services\list-service'; Write-Host '=== LIST SERVICE - PORTA 3002 ===' -ForegroundColor Cyan; Write-Host 'RABBITMQ_URL configurada' -ForegroundColor Green; npm start"
Start-Sleep -Seconds 2

# API Gateway
Write-Host "4. API Gateway (porta 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$DAMD_PATH\api-gateway'; Write-Host '=== API GATEWAY - PORTA 3000 ===' -ForegroundColor Cyan; npm start"
Start-Sleep -Seconds 3

# Consumer Notification (COM RABBITMQ_URL)
Write-Host "5. Consumer Notification..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:RABBITMQ_URL='$env:RABBITMQ_URL'; cd '$MENSAGERIA_PATH\consumer-notification'; Write-Host '=== CONSUMER NOTIFICATION ===' -ForegroundColor Cyan; Write-Host 'RABBITMQ_URL configurada' -ForegroundColor Green; npm start"
Start-Sleep -Seconds 2

# Consumer Analytics (COM RABBITMQ_URL)
Write-Host "6. Consumer Analytics..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:RABBITMQ_URL='$env:RABBITMQ_URL'; cd '$MENSAGERIA_PATH\consumer-analytics'; Write-Host '=== CONSUMER ANALYTICS ===' -ForegroundColor Cyan; Write-Host 'RABBITMQ_URL configurada' -ForegroundColor Green; npm start"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "SERVICOS INICIADOS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "6 janelas PowerShell devem estar abertas agora." -ForegroundColor Cyan
Write-Host ""
Write-Host "AGUARDE 15-20 SEGUNDOS para inicializacao completa." -ForegroundColor Yellow
Write-Host ""
Write-Host "VERIFICACOES:" -ForegroundColor Cyan
Write-Host "  1. Verifique as janelas dos consumers:" -ForegroundColor White
Write-Host "     - Devem mostrar 'Conectado ao RabbitMQ'" -ForegroundColor Green
Write-Host "     - Devem mostrar 'Exchange shopping_events verificado'" -ForegroundColor Green
Write-Host "  2. Acesse CloudAMQP Management UI:" -ForegroundColor White
Write-Host "     - https://shark.rmq.cloudamqp.com/#/" -ForegroundColor Cyan
Write-Host "     - Vá para aba 'Overview'" -ForegroundColor White
Write-Host "     - Deve mostrar: Connections: 2, Queues: 2" -ForegroundColor Green
Write-Host "  3. Execute teste:" -ForegroundColor White
Write-Host "     node teste-checkout-completo.js" -ForegroundColor Cyan
Write-Host "  4. Gere eventos para gravação:" -ForegroundColor White
Write-Host "     node gerar-eventos-demonstracao.js" -ForegroundColor Cyan
Write-Host ""

