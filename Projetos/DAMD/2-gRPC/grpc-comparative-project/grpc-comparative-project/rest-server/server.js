/**
 * =============================================================================
 * SERVIDOR REST PRINCIPAL
 * =============================================================================
 * 
 * Este arquivo implementa o servidor REST principal que disponibiliza
 * as rotas de autenticação, tarefas e chat. Ele configura o servidor Express,
 * middleware, rotas e WebSocket para funcionalidades equivalentes ao gRPC.
 * 
 * ARQUITETURA:
 * - Servidor Express com middleware de segurança
 * - Rotas de autenticação JWT
 * - CRUD de tarefas com validação
 * - WebSocket para chat em tempo real
 * - Rate limiting e CORS
 * - Tratamento de erros robusto
 * 
 * FUNCIONALIDADES EQUIVALENTES AO gRPC:
 * - Autenticação JWT (Login/Register vs Login/ValidateToken)
 * - CRUD de tarefas (Create/Read/Update/Delete vs CreateTask/GetTask/UpdateTask/DeleteTask)
 * - Chat bidirecional (WebSocket vs gRPC streaming)
 * - Load balancing (múltiplas instâncias)
 * - Error handling (códigos HTTP vs códigos gRPC)
 * =============================================================================
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');

// Importar rotas e middleware
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const ChatServer = require('./chat/chatServer');

class RESTServer {
    constructor(port = 3000) {
        this.app = express();
        this.port = port;
        this.server = http.createServer(this.app);
        this.chatServer = null;
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }

    /**
     * Configura middleware do Express
     */
    setupMiddleware() {
        // Segurança
        this.app.use(helmet());
        this.app.use(cors());

        // Rate limiting (ajustado para benchmarks)
        const limiter = rateLimit({
            windowMs: 1 * 60 * 1000, // 1 minuto
            max: 1000, // máximo 1000 requisições por IP (para benchmarks)
            message: {
                error: 'Muitas requisições deste IP, tente novamente em 1 minuto.'
            },
            skip: (req) => {
                // Pular rate limiting para health checks
                return req.path === '/health';
            }
        });
        this.app.use(limiter);

        // Body parsing
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));

        // Logging de requisições
        this.app.use((req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
            });
            next();
        });
    }

    /**
     * Configura rotas da API
     */
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: '1.0.0'
            });
        });

        // Informações da API
        this.app.get('/', (req, res) => {
            res.json({
                name: 'Servidor REST Comparativo',
                version: '1.0.0',
                description: 'Sistema de tarefas REST para comparação com gRPC',
                endpoints: {
                    auth: '/api/auth/*',
                    tasks: '/api/tasks/*',
                    health: '/health'
                },
                features: [
                    'Autenticação JWT',
                    'CRUD de tarefas',
                    'Chat WebSocket',
                    'Rate limiting',
                    'Error handling'
                ]
            });
        });

        // Rotas de autenticação
        this.app.use('/api/auth', authRoutes);

        // Rotas de tarefas (protegidas)
        this.app.use('/api/tasks', authenticateToken, taskRoutes);

        // Middleware de tratamento de erros
        this.app.use(errorHandler);
    }

    /**
     * Configura WebSocket para chat
     */
    setupWebSocket() {
        this.chatServer = new ChatServer(this.server);
        console.log('💬 WebSocket configurado para chat');
    }

    /**
     * Inicia o servidor
     */
    start() {
        this.server.listen(this.port, () => {
            console.log('🚀 =====================================');
            console.log(`🚀 Servidor REST iniciado`);
            console.log(`🚀 Porta: ${this.port}`);
            console.log(`🚀 Protocolo: HTTP/1.1 + WebSocket`);
            console.log(`🚀 Recursos implementados:`);
            console.log(`🚀   ✅ Autenticação JWT`);
            console.log(`🚀   ✅ Error Handling Robusto`);
            console.log(`🚀   ✅ Chat WebSocket`);
            console.log(`🚀   ✅ Rate Limiting`);
            console.log(`🚀   ✅ CRUD de Tarefas`);
            console.log(`🚀   ✅ CORS e Segurança`);
            console.log('🚀 =====================================');
            console.log(`🚀 Health check: http://localhost:${this.port}/health`);
            console.log(`🚀 API info: http://localhost:${this.port}/`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => this.stop());
        process.on('SIGINT', () => this.stop());
    }

    /**
     * Para o servidor
     */
    stop() {
        this.server.close(() => {
            console.log('✅ Servidor REST parado');
            process.exit(0);
        });
    }
}

// Executar servidor se chamado diretamente
if (require.main === module) {
    const port = process.env.REST_PORT || 3000;
    const server = new RESTServer(port);
    server.start();
}

module.exports = RESTServer;
