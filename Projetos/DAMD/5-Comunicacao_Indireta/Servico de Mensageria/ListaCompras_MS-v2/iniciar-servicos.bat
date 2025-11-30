@echo off
echo ========================================
echo  DAMD - ListaCompras MS v2
echo  Iniciando servicos com mensageria
echo ========================================
echo.

echo [1/6] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js nao encontrado. Instale Node.js primeiro.
    pause
    exit /b 1
)
echo Node.js encontrado
echo.

echo [2/6] Instalando dependencias...
echo Instalando no diretorio raiz...
call npm install
echo.

echo [3/6] Iniciando servicos...
echo.

echo Iniciando User Service (porta 3001)...
start "User Service" cmd /c "cd services\user-service && npm start"

echo Iniciando Item Service (porta 3003)...
start "Item Service" cmd /c "cd services\item-service && npm start"

echo Iniciando List Service (porta 3002)...
start "List Service" cmd /c "cd services\list-service && npm start"

echo Iniciando API Gateway (porta 3000)...
start "API Gateway" cmd /c "cd api-gateway && npm start"

echo.
echo [4/6] Aguardando inicializacao dos servicos...
timeout /t 5 /nobreak >nul

echo.
echo [5/6] Iniciando consumers...
echo.

echo Iniciando Consumer Notification...
start "Consumer Notification" cmd /c "cd consumer-notification && npm start"

echo Iniciando Consumer Analytics...
start "Consumer Analytics" cmd /c "cd consumer-analytics && npm start"

echo.
echo [6/6] Verificando status...
echo.
echo Aguarde 10 segundos para inicializacao completa...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo Servicos iniciados!
echo ========================================
echo.
echo URLs dos servicos:
echo   API Gateway:    http://localhost:3000
echo   User Service:   http://localhost:3001
echo   List Service:   http://localhost:3002
echo   Item Service:   http://localhost:3003
echo.
echo RabbitMQ UI:     http://localhost:15672 (se Docker)
echo.
echo Para testar: node teste-manual.js
echo Para app: configure IP no Flutter app
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
