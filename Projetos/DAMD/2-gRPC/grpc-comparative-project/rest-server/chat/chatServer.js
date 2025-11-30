/**
 * =============================================================================
 * SERVIDOR DE CHAT WEBSOCKET
 * =============================================================================
 * 
 * Este arquivo implementa o servidor de chat WebSocket para o servidor REST,
 * equivalente ao streaming bidirecional do gRPC.
 * 
 * FUNCIONALIDADES:
 * - Conexões WebSocket para chat em tempo real
 * - Autenticação via token JWT
 * - Broadcast de mensagens para todos os clientes
 * - Gerenciamento de sessões de chat
 * - Tratamento de desconexões
 * 
 * EQUIVALÊNCIA COM gRPC:
 * - gRPC: chatStream() - streaming bidirecional
 * - REST: WebSocket - conexão persistente bidirecional
 * =============================================================================
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class ChatServer {
    constructor(httpServer) {
        this.wss = new WebSocket.Server({ 
            server: httpServer,
            path: '/chat'
        });
        this.clients = new Map(); // Map<userId, WebSocket>
        this.sessions = new Set(); // Set de sessões ativas
        this.setupWebSocket();
    }

    /**
     * Configura o servidor WebSocket
     */
    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            console.log('💬 Nova conexão WebSocket estabelecida');

            // Autenticação via query parameter ou header
            const token = this.extractToken(req);
            
            if (!token) {
                ws.close(1008, 'Token de autenticação obrigatório');
                return;
            }

            try {
                // Validar token JWT
                const JWT_SECRET = process.env.JWT_SECRET || 'grpc-comparative-secret-key';
                const decoded = jwt.verify(token, JWT_SECRET);
                
                // Associar WebSocket ao usuário
                const userId = decoded.userId;
                this.clients.set(userId, ws);
                this.sessions.add({ ws, userId, connectedAt: new Date() });

                // Configurar eventos do WebSocket
                this.setupWebSocketEvents(ws, userId);

                // Enviar mensagem de boas-vindas
                this.sendMessage(ws, {
                    type: 'system',
                    message: 'Conectado ao chat com sucesso',
                    timestamp: Date.now()
                });

                // Notificar outros usuários sobre a conexão
                this.broadcastSystemMessage(`${userId} entrou no chat`, userId);

                console.log(`✅ Usuário ${userId} conectado ao chat`);

            } catch (error) {
                console.error('❌ Erro de autenticação WebSocket:', error.message);
                ws.close(1008, 'Token inválido');
            }
        });

        console.log('💬 Servidor WebSocket configurado em /chat');
    }

    /**
     * Configura eventos do WebSocket
     */
    setupWebSocketEvents(ws, userId) {
        // Processar mensagens recebidas
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleMessage(ws, userId, message);
            } catch (error) {
                console.error('❌ Erro ao processar mensagem WebSocket:', error.message);
                this.sendError(ws, 'Mensagem inválida');
            }
        });

        // Cliente desconectou
        ws.on('close', (code, reason) => {
            console.log(`❌ Usuário ${userId} desconectado do chat (${code}: ${reason})`);
            this.handleDisconnection(userId);
        });

        // Erro na conexão
        ws.on('error', (error) => {
            console.error(`❌ Erro WebSocket para usuário ${userId}:`, error.message);
            this.handleDisconnection(userId);
        });

        // Ping/Pong para manter conexão viva
        ws.on('pong', () => {
            ws.isAlive = true;
        });
    }

    /**
     * Processa mensagens recebidas
     */
    handleMessage(ws, userId, message) {
        switch (message.type) {
            case 'chat':
                this.handleChatMessage(ws, userId, message);
                break;
            case 'ping':
                this.sendMessage(ws, { type: 'pong', timestamp: Date.now() });
                break;
            default:
                this.sendError(ws, 'Tipo de mensagem não suportado');
        }
    }

    /**
     * Processa mensagens de chat
     */
    handleChatMessage(ws, userId, message) {
        const { content } = message;
        
        if (!content || content.trim().length === 0) {
            this.sendError(ws, 'Conteúdo da mensagem não pode estar vazio');
            return;
        }

        // Criar mensagem de chat
        const chatMessage = {
            id: uuidv4(),
            type: 'chat',
            userId,
            content: content.trim(),
            timestamp: Date.now()
        };

        // Broadcast para todos os clientes conectados
        this.broadcastMessage(chatMessage);

        console.log(`💬 Mensagem de ${userId}: ${content.substring(0, 50)}...`);
    }

    /**
     * Envia mensagem para um WebSocket específico
     */
    sendMessage(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    /**
     * Envia erro para um WebSocket específico
     */
    sendError(ws, errorMessage) {
        this.sendMessage(ws, {
            type: 'error',
            message: errorMessage,
            timestamp: Date.now()
        });
    }

    /**
     * Broadcast de mensagem para todos os clientes
     */
    broadcastMessage(message, excludeUserId = null) {
        this.clients.forEach((ws, userId) => {
            if (userId !== excludeUserId) {
                this.sendMessage(ws, message);
            }
        });
    }

    /**
     * Broadcast de mensagem do sistema
     */
    broadcastSystemMessage(message, excludeUserId = null) {
        const systemMessage = {
            type: 'system',
            message,
            timestamp: Date.now()
        };
        this.broadcastMessage(systemMessage, excludeUserId);
    }

    /**
     * Processa desconexão de usuário
     */
    handleDisconnection(userId) {
        // Remover cliente
        this.clients.delete(userId);
        
        // Remover sessão
        this.sessions.forEach(session => {
            if (session.userId === userId) {
                this.sessions.delete(session);
            }
        });

        // Notificar outros usuários sobre a desconexão
        this.broadcastSystemMessage(`${userId} saiu do chat`);
    }

    /**
     * Extrai token de autenticação da requisição
     */
    extractToken(req) {
        // Tentar extrair do query parameter
        const url = new URL(req.url, `http://${req.headers.host}`);
        const tokenFromQuery = url.searchParams.get('token');
        
        if (tokenFromQuery) {
            return tokenFromQuery;
        }

        // Tentar extrair do header Authorization
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        return null;
    }

    /**
     * Obtém estatísticas do chat
     */
    getStats() {
        return {
            totalConnections: this.clients.size,
            activeSessions: this.sessions.size,
            connectedUsers: Array.from(this.clients.keys())
        };
    }

    /**
     * Inicia ping/pong para manter conexões vivas
     */
    startHeartbeat() {
        setInterval(() => {
            this.clients.forEach((ws, userId) => {
                if (ws.isAlive === false) {
                    console.log(`💔 Conexão morta detectada para usuário ${userId}`);
                    this.handleDisconnection(userId);
                    return;
                }

                ws.isAlive = false;
                ws.ping();
            });
        }, 30000); // 30 segundos
    }
}

module.exports = ChatServer;
