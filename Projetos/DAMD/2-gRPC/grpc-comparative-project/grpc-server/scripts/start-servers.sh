#!/bin/bash

echo "🚀 Iniciando múltiplos servidores gRPC para Load Balancing..."

# Servidor 1
echo "🖥️  Iniciando servidor na porta 50051..."
PORT=50051 node src/server/server.js &
SERVER1_PID=$!

# Servidor 2
echo "🖥️  Iniciando servidor na porta 50052..."
PORT=50052 node src/server/server.js &
SERVER2_PID=$!

# Servidor 3
echo "🖥️  Iniciando servidor na porta 50053..."
PORT=50053 node src/server/server.js &
SERVER3_PID=$!

echo ""
echo "✅ Todos os servidores iniciados!"
echo "Servidor 1 (PID: $SERVER1_PID) - Porta 50051"
echo "Servidor 2 (PID: $SERVER2_PID) - Porta 50052"
echo "Servidor 3 (PID: $SERVER3_PID) - Porta 50053"
echo ""
echo "📊 Para testar load balancing, execute:"
echo "   npm run client"
echo ""
echo "💬 Para testar chat, execute:"
echo "   npm run chat"
echo ""
echo "⏹️  Pressione Ctrl+C para parar todos os servidores"

# Aguardar interrupção
trap "echo ''; echo '🛑 Parando servidores...'; kill $SERVER1_PID $SERVER2_PID $SERVER3_PID; echo '✅ Servidores parados'; exit" INT

wait
