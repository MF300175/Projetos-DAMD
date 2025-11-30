/**
 * =============================================================================
 * CLIENTE DE CHAT WEBSOCKET
 * =============================================================================
 * 
 * Este arquivo implementa o cliente de chat WebSocket para o servidor REST,
 * equivalente ao chatClient do gRPC.
 * 
 * FUNCIONALIDADES:
 * - Conexão WebSocket para chat em tempo real
 * - Autenticação via token JWT
 * - Envio e recebimento de mensagens
 * - Interface de linha de comando
 * - Tratamento de erros e reconexão
 * 
 * EQUIVALÊNCIA COM gRPC:
 * - gRPC: ChatClient com streaming bidirecional
 * - REST: WebSocket com conexão persistente
 * =============================================================================
 */

const WebSocket = require('ws');
const readline = require('readline');

class ChatClient {
    constructor(serverUrl = 'ws://localhost:3000/chat') {
        this.serverUrl = serverUrl;
        this.ws = null;
        this.token = null;
        this.userId = null;
        this.rl = null;
        this.connected = false;
    }

    /**
     * Conecta ao servidor de chat
     */
    connect(token, userId) {
        if (!token || !userId) {
            throw new Error('Token e User ID são obrigatórios para o chat');
        }

        this.token = token;
        this.userId = userId;

        console.log(`💬 Conectando ao chat como ${userId}...`);

        // Conectar WebSocket com token
        this.ws = new WebSocket(`${this.serverUrl}?token=${this.token}`);

        this.ws.on('open', () => {
            console.log('✅ Conectado ao chat com sucesso!');
            this.connected = true;
            this.startInteractiveChat();
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleMessage(message);
            } catch (error) {
                console.error('❌ Erro ao processar mensagem:', error.message);
            }
        });

        this.ws.on('close', (code, reason) => {
            console.log(`❌ Conexão fechada (${code}: ${reason})`);
            this.connected = false;
            if (this.rl) {
                this.rl.close();
            }
        });

        this.ws.on('error', (error) => {
            console.error('❌ Erro na conexão WebSocket:', error.message);
            this.connected = false;
        });
    }

    /**
     * Inicia chat interativo
     */
    startInteractiveChat() {
        console.log('💬 Chat iniciado! Digite suas mensagens (ou "sair" para sair):\n');

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // Processar entrada do usuário
        this.rl.on('line', (input) => {
            const message = input.trim();

            if (message.toLowerCase() === 'sair') {
                this.disconnect();
                return;
            }

            if (message) {
                this.sendMessage(message);
            }
        });

        // Enviar mensagem de entrada
        this.sendMessage(`Olá, sou ${this.userId} e acabei de entrar no chat!`);
    }

    /**
     * Processa mensagens recebidas
     */
    handleMessage(message) {
        const timestamp = new Date(message.timestamp).toLocaleTimeString();

        switch (message.type) {
            case 'chat':
                const sender = message.userId === this.userId ? 'Você' : message.userId;
                console.log(`[${timestamp}] ${sender}: ${message.content}`);
                break;

            case 'system':
                console.log(`[${timestamp}] 🔔 ${message.message}`);
                break;

            case 'error':
                console.log(`[${timestamp}] ❌ Erro: ${message.message}`);
                break;

            case 'pong':
                // Resposta ao ping - conexão está viva
                break;

            default:
                console.log(`[${timestamp}] 📨 Mensagem desconhecida:`, message);
        }
    }

    /**
     * Envia mensagem para o chat
     */
    sendMessage(content) {
        if (!this.connected || !this.ws) {
            console.log('❌ Não conectado ao chat');
            return;
        }

        const message = {
            type: 'chat',
            content: content
        };

        this.ws.send(JSON.stringify(message));
    }

    /**
     * Desconecta do chat
     */
    disconnect() {
        console.log('👋 Desconectando do chat...');
        
        if (this.ws) {
            this.ws.close();
        }
        
        if (this.rl) {
            this.rl.close();
        }
        
        this.connected = false;
    }

    /**
     * Envia ping para manter conexão viva
     */
    ping() {
        if (this.connected && this.ws) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
        }
    }

    /**
     * Verifica se está conectado
     */
    isConnected() {
        return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
    }
}

/**
 * Função para demonstrar o chat
 */
async function demonstrateChat() {
    // Simular token e userId (em produção, obter via login)
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMSIsImVtYWlsIjoidGVzdGVAZXhlbXBsby5jb20iLCJ0aW1lc3RhbXAiOjE3MzY5NzQ0MDAwMDAsImlhdCI6MTczNjk3NDQwMCwiZXhwIjoxNzM2OTc0NDAwfQ.example';
    const userId = 'user1';

    const chatClient = new ChatClient();
    
    try {
        chatClient.connect(token, userId);
    } catch (error) {
        console.error('❌ Erro no chat:', error.message);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    demonstrateChat();
}

module.exports = ChatClient;
