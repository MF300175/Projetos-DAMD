@echo off
echo ========================================
echo  DAMD - ListaCompras MS v2
echo  Iniciando TODOS os servicos
echo ========================================
echo.

cd /d "%~dp0"

set "DAMD_PATH=C:\PUC_2025_2\DAMD\Projetos-DAMD\Projetos-DAMD\Projetos\DAMD-Projetos\ListaCompras_MS-v2"
set "MENSAGERIA_PATH=C:\PUC_2025_2\DAMD\Projetos-DAMD\Projetos-DAMD\Projetos\mensageria_01\ListaCompras_MS-v2"

REM Configurar URL do RabbitMQ CloudAMQP
REM Usando amqp:// (sem TLS) para evitar problemas de certificado SSL
set "RABBITMQ_URL=amqp://brvljsac:fgqB4Pcd8Pap6B8KiQ47BGBnx38kUumV@shark.rmq.cloudamqp.com/brvljsac"

echo RabbitMQ URL configurada para CloudAMQP
echo.

echo Iniciando User Service (porta 3001)...
start "User Service - Porta 3001" cmd /k "cd /d %DAMD_PATH%\services\user-service && echo === USER SERVICE - PORTA 3001 === && npm start"

timeout /t 2 /nobreak >nul

echo Iniciando Item Service (porta 3003)...
start "Item Service - Porta 3003" cmd /k "cd /d %DAMD_PATH%\services\item-service && echo === ITEM SERVICE - PORTA 3003 === && npm start"

timeout /t 2 /nobreak >nul

echo Iniciando List Service (porta 3002)...
start "List Service - Porta 3002" cmd /k "cd /d %DAMD_PATH%\services\list-service && set RABBITMQ_URL=amqp://brvljsac:fgqB4Pcd8Pap6B8KiQ47BGBnx38kUumV@shark.rmq.cloudamqp.com/brvljsac && echo === LIST SERVICE - PORTA 3002 === && echo RABBITMQ_URL configurada && npm start"

timeout /t 2 /nobreak >nul

echo Iniciando API Gateway (porta 3000)...
start "API Gateway - Porta 3000" cmd /k "cd /d %DAMD_PATH%\api-gateway && echo === API GATEWAY - PORTA 3000 === && npm start"

timeout /t 3 /nobreak >nul

echo Iniciando Consumer Notification...
start "Consumer Notification" cmd /k "cd /d %MENSAGERIA_PATH%\consumer-notification && set RABBITMQ_URL=amqp://brvljsac:fgqB4Pcd8Pap6B8KiQ47BGBnx38kUumV@shark.rmq.cloudamqp.com/brvljsac && echo === CONSUMER NOTIFICATION === && echo RABBITMQ_URL configurada && npm start"

timeout /t 2 /nobreak >nul

echo Iniciando Consumer Analytics...
start "Consumer Analytics" cmd /k "cd /d %MENSAGERIA_PATH%\consumer-analytics && set RABBITMQ_URL=amqp://brvljsac:fgqB4Pcd8Pap6B8KiQ47BGBnx38kUumV@shark.rmq.cloudamqp.com/brvljsac && echo === CONSUMER ANALYTICS === && echo RABBITMQ_URL configurada && npm start"

echo.
echo ========================================
echo Servicos iniciados!
echo ========================================
echo.
echo 6 janelas CMD devem estar abertas agora.
echo.
echo URLs:
echo   API Gateway:    http://localhost:3000
echo   RabbitMQ UI:    http://localhost:15672
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul

