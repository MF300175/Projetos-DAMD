const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const TaskServiceImpl = require('./services/taskService');
const SimpleLoadBalancer = require('./loadBalancer');

/**
 * Servidor gRPC Avançado
 * 
 * Implementa comunicação RPC moderna com:
 * - Protocol Buffers para serialização
 * - HTTP/2 para transporte
 * - Streaming bidirecional
 * - Autenticação JWT
 * - Error handling robusto
 * - Performance otimizada
 * 
 * Baseado no roteiro do professor com extensões
 */
class GRPCServer {
    constructor() {
        this.server = new grpc.Server();
        this.port = process.env.PORT || process.env.GRPC_PORT || 50051;
        this.loadBalancer = new SimpleLoadBalancer();
        this.loadProtoDefinition();
        this.setupServices();
    }

    loadProtoDefinition() {
        const PROTO_PATH = path.join(__dirname, '../../proto/task.proto');
        
        const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true
        });

        this.protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
        this.taskProto = this.protoDescriptor.task;
    }

    setupServices() {
        const taskService = new TaskServiceImpl();

        // Registrar todos os serviços
        this.server.addService(this.taskProto.TaskService.service, {
            // Operações CRUD
            createTask: taskService.createTask.bind(taskService),
            getTask: taskService.getTask.bind(taskService),
            listTasks: taskService.listTasks.bind(taskService),
            updateTask: taskService.updateTask.bind(taskService),
            deleteTask: taskService.deleteTask.bind(taskService),
            
            // Streaming
            streamTaskUpdates: taskService.streamTaskUpdates.bind(taskService),
            
            // Autenticação
            login: taskService.login.bind(taskService),
            validateToken: taskService.validateToken.bind(taskService),
            
            // Chat bidirecional
            chatStream: taskService.chatStream.bind(taskService)
        });
    }

    start() {
        const bindAddress = `0.0.0.0:${this.port}`;
        
        this.server.bindAsync(
            bindAddress,
            grpc.ServerCredentials.createInsecure(),
            (error, port) => {
                if (error) {
                    console.error('❌ Erro ao iniciar servidor gRPC:', error);
                    process.exit(1);
                }

                console.log('🚀 =====================================');
                console.log(`🚀 Servidor gRPC Avançado iniciado`);
                console.log(`🚀 Porta: ${port}`);
                console.log(`🚀 Protocolo: HTTP/2 + Protocol Buffers`);
                console.log(`🚀 Recursos implementados:`);
                console.log(`🚀   ✅ Autenticação JWT`);
                console.log(`🚀   ✅ Error Handling Robusto`);
                console.log(`🚀   ✅ Streaming Bidirecional`);
                console.log(`🚀   ✅ Chat em Tempo Real`);
                console.log(`🚀   ✅ TaskService (CRUD + Streaming)`);
                console.log('🚀 =====================================');

                this.server.start();
                
                // Iniciar health checks do load balancer
                this.loadBalancer.startHealthChecks();
            }
        );
    }

    stop() {
        this.server.tryShutdown((error) => {
            if (error) {
                console.error('Erro ao parar servidor:', error);
            } else {
                console.log('✅ Servidor gRPC parado');
            }
        });
    }

    /**
     * Adicionar servidor ao load balancer
     */
    addToLoadBalancer(address, weight = 1) {
        this.loadBalancer.addServer(address, weight);
    }

    /**
     * Obter estatísticas do servidor
     */
    getStats() {
        return {
            port: this.port,
            loadBalancer: this.loadBalancer.getStats(),
            services: ['TaskService'],
            features: [
                'Authentication',
                'Error Handling',
                'Bidirectional Streaming',
                'Chat',
                'Load Balancing'
            ]
        };
    }
}

// Inicialização
if (require.main === module) {
    const server = new GRPCServer();
    
    // Adicionar servidor atual ao load balancer
    const currentAddress = `localhost:${server.port}`;
    server.addToLoadBalancer(currentAddress);
    
    server.start();

    // Graceful shutdown
    process.on('SIGTERM', () => server.stop());
    process.on('SIGINT', () => server.stop());
    
    // Log de estatísticas a cada 30 segundos
    setInterval(() => {
        console.log('📊 Estatísticas do servidor:', server.getStats());
    }, 30000);
}

module.exports = GRPCServer;
