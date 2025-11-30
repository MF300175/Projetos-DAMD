const TaskGRPCClient = require('./client');
const readline = require('readline');

/**
 * Cliente de Chat Interativo
 * 
 * Interface de linha de comando para testar o chat bidirecional
 */
class ChatClient {
    constructor(serverAddress = 'localhost:50051') {
        this.client = new TaskGRPCClient(serverAddress);
        this.rl = null;
        this.chatStream = null;
        this.isConnected = false;
    }

    /**
     * Conectar e iniciar chat
     */
    async startChat() {
        try {
            console.log('🔐 Fazendo login...');
            await this.client.login();
            
            console.log('💬 Iniciando chat...');
            this.chatStream = this.client.chatStream((message) => {
                this.displayMessage(message);
            });

            this.isConnected = true;
            this.setupReadline();
            
            console.log('✅ Conectado ao chat! Digite suas mensagens (ou "sair" para sair):\n');

        } catch (error) {
            console.error('❌ Erro ao conectar:', error.message);
            process.exit(1);
        }
    }

    /**
     * Configurar interface de linha de comando
     */
    setupReadline() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '> '
        });

        this.rl.prompt();

        this.rl.on('line', (input) => {
            const message = input.trim();
            
            if (message.toLowerCase() === 'sair' || message.toLowerCase() === 'exit') {
                this.disconnect();
                return;
            }

            if (message && this.isConnected) {
                this.client.sendChatMessage(this.chatStream, message);
                this.rl.prompt();
            } else if (message) {
                console.log('❌ Não conectado ao chat');
                this.rl.prompt();
            } else {
                this.rl.prompt();
            }
        });

        this.rl.on('close', () => {
            this.disconnect();
        });
    }

    /**
     * Exibir mensagem recebida
     */
    displayMessage(message) {
        const timestamp = new Date(message.timestamp).toLocaleTimeString();
        const sender = message.user_id === 'system' ? '🤖 Sistema' : `👤 ${message.user_id}`;
        
        console.log(`\n[${timestamp}] ${sender}: ${message.content}`);
        if (this.rl) {
            this.rl.prompt();
        }
    }

    /**
     * Desconectar do chat
     */
    disconnect() {
        console.log('\n👋 Desconectando do chat...');
        
        this.isConnected = false;
        
        if (this.chatStream) {
            this.chatStream.end();
        }
        
        if (this.rl) {
            this.rl.close();
        }
        
        this.client.close();
        console.log('✅ Desconectado com sucesso!');
        process.exit(0);
    }
}

/**
 * Função principal para executar o chat
 */
async function runChat() {
    console.log('🚀 Cliente de Chat gRPC');
    console.log('========================\n');
    
    const chatClient = new ChatClient();
    await chatClient.startChat();
}

// Executar se chamado diretamente
if (require.main === module) {
    runChat().catch(error => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });
}

module.exports = ChatClient;
