# Script para instalar o app no dispositivo Samsung conectado
# Execute: .\scripts\instalar.ps1
# OU: cd app && flutter run

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Instalacao no Dispositivo Samsung" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos na pasta correta
if (-not (Test-Path "app\pubspec.yaml")) {
    Write-Host "ERRO: Execute este script da raiz do projeto!" -ForegroundColor Red
    Write-Host "Ou navegue para a pasta app e execute: flutter run" -ForegroundColor Yellow
    exit 1
}

# Navegar para pasta app
Set-Location app

# Verificar se Flutter está instalado
Write-Host "Verificando Flutter..." -ForegroundColor Yellow
try {
    $flutterVersion = flutter --version 2>&1 | Select-Object -First 1
    Write-Host "Flutter encontrado: $flutterVersion" -ForegroundColor Green
} catch {
    Write-Host "ERRO: Flutter nao encontrado!" -ForegroundColor Red
    Write-Host "Instale o Flutter primeiro: https://flutter.dev/docs/get-started/install" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Verificar dispositivos conectados
Write-Host "Verificando dispositivos conectados..." -ForegroundColor Yellow
flutter devices
Write-Host ""

# Verificar se há dispositivo Android conectado
$devices = flutter devices 2>&1 | Select-String "android"
if (-not $devices) {
    Write-Host "AVISO: Nenhum dispositivo Android detectado!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Verifique:" -ForegroundColor Yellow
    Write-Host "  1. Dispositivo conectado via USB" -ForegroundColor White
    Write-Host "  2. Depuracao USB habilitada" -ForegroundColor White
    Write-Host "  3. Autorizacao concedida no dispositivo" -ForegroundColor White
    Write-Host ""
    Write-Host "Teste: adb devices" -ForegroundColor Cyan
    Write-Host ""
    $continuar = Read-Host "Deseja continuar mesmo assim? (s/n)"
    if ($continuar -ne "s" -and $continuar -ne "S") {
        exit 1
    }
}

Write-Host ""

# Instalar dependências
Write-Host "Instalando dependencias..." -ForegroundColor Yellow
flutter pub get
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO ao instalar dependencias!" -ForegroundColor Red
    exit 1
}
Write-Host "Dependencias instaladas com sucesso!" -ForegroundColor Green
Write-Host ""

# Perguntar modo de compilação
Write-Host "Escolha o modo de compilacao:" -ForegroundColor Cyan
Write-Host "  1. Debug (rapido, permite hot reload)" -ForegroundColor White
Write-Host "  2. Release (otimizado, mais lento)" -ForegroundColor White
Write-Host ""
$modo = Read-Host "Digite 1 ou 2 (padrao: 1)"

if ($modo -eq "2") {
    Write-Host ""
    Write-Host "Compilando em modo RELEASE..." -ForegroundColor Green
    Write-Host "Isso pode demorar alguns minutos..." -ForegroundColor Yellow
    flutter run --release
} else {
    Write-Host ""
    Write-Host "Compilando em modo DEBUG..." -ForegroundColor Green
    flutter run
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Concluido!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# Voltar para raiz
Set-Location ..

