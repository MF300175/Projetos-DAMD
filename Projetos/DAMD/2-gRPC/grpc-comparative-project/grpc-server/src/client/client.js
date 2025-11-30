const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

/**
 * Cliente gRPC Avançado
 * 
 * Implementa cliente com autenticação, métricas e demonstração
 * de todos os recursos implementados
 */
class TaskGRPCClient {
    constructor(serverAddress = 'localhost:50051') {
        this.serverAddress = serverAddress;
        this.loadProtoDefinition();
        this.createClient();
        this.currentToken = null;
        this.metrics = {
            requests: 0,
            totalTime: 0,
            errors: 0,
            authRequests: 0,
            chatMessages: 0
        };
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

    createClient() {
        this.client = new this.taskProto.TaskService(
            this.serverAddress,
            grpc.credentials.createInsecure()
        );
    }

    /**
     * Promisificar chamada gRPC com métricas
     */
    promisify(client, method, request) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            this.metrics.requests++;
            
            client[method](request, (error, response) => {
                const duration = Date.now() - start;
                this.metrics.totalTime += duration;
                
                if (error) {
                    this.metrics.errors++;
                    console.error(`❌ ${method} failed (${duration}ms):`, error.message);
                    reject(error);
                } else {
                    console.log(`✅ ${method} success (${duration}ms)`);
                    resolve(response);
                }
            });
        });
    }

    /**
     * Login de usuário
     */
    async login(email = 'teste@exemplo.com', password = '123456') {
        try {
            this.metrics.authRequests++;
            const response = await this.promisify(this.client, 'login', {
                email,
                password
            });
            
            if (response.success) {
                this.currentToken = response.token;
                console.log(`🔐 Login realizado: ${response.message}`);
                return response;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Erro no login:', error.message);
            throw error;
        }
    }

    /**
     * Validar token
     */
    async validateToken(token = null) {
        try {
            const tokenToValidate = token || this.currentToken;
            if (!tokenToValidate) {
                throw new Error('Nenhum token disponível');
            }

            const response = await this.promisify(this.client, 'validateToken', {
                token: tokenToValidate
            });
            
            console.log(`🔍 Validação de token: ${response.message}`);
            return response;
        } catch (error) {
            console.error('Erro na validação:', error.message);
            throw error;
        }
    }

    /**
     * Criar tarefa (com autenticação)
     */
    async createTask(title, description = '', priority = 'medium', userId = 'user1') {
        if (!this.currentToken) {
            throw new Error('Token de autenticação necessário');
        }

        return await this.promisify(this.client, 'createTask', {
            title,
            description,
            priority,
            user_id: userId,
            token: this.currentToken
        });
    }

    /**
     * Buscar tarefa (com autenticação)
     */
    async getTask(id) {
        if (!this.currentToken) {
            throw new Error('Token de autenticação necessário');
        }

        return await this.promisify(this.client, 'getTask', {
            id,
            token: this.currentToken
        });
    }

    /**
     * Listar tarefas (com autenticação)
     */
    async listTasks(userId = 'user1', completed = null, priority = null) {
        if (!this.currentToken) {
            throw new Error('Token de autenticação necessário');
        }

        const request = { 
            user_id: userId,
            token: this.currentToken
        };
        
        if (completed !== null) request.completed = completed;
        if (priority) request.priority = priority;

        return await this.promisify(this.client, 'listTasks', request);
    }

    /**
     * Atualizar tarefa (com autenticação)
     */
    async updateTask(id, updates) {
        if (!this.currentToken) {
            throw new Error('Token de autenticação necessário');
        }

        const request = { 
            id, 
            token: this.currentToken,
            ...updates 
        };
        
        return await this.promisify(this.client, 'updateTask', request);
    }

    /**
     * Deletar tarefa (com autenticação)
     */
    async deleteTask(id) {
        if (!this.currentToken) {
            throw new Error('Token de autenticação necessário');
        }

        return await this.promisify(this.client, 'deleteTask', {
            id,
            token: this.currentToken
        });
    }

    /**
     * Stream de atualizações em tempo real
     */
    streamTaskUpdates(userId = 'user1', onUpdate) {
        if (!this.currentToken) {
            throw new Error('Token de autenticação necessário');
        }

        const stream = this.client.streamTaskUpdates({
            user_id: userId,
            token: this.currentToken
        });

        stream.on('data', (response) => {
            onUpdate(response);
        });

        stream.on('error', (error) => {
            // Ignorar erro de cancelamento (comportamento normal)
            if (error.code !== 1 || error.details !== 'Cancelled on client') {
                console.error('Erro no stream:', error);
            }
        });

        stream.on('end', () => {
            console.log('Stream de tarefas finalizado');
        });

        return stream;
    }

    /**
     * Chat bidirecional
     */
    chatStream(onMessage) {
        if (!this.currentToken) {
            throw new Error('Token de autenticação necessário');
        }

        const stream = this.client.chatStream();

        // Enviar token na primeira mensagem
        stream.write({
            token: this.currentToken,
            content: 'Conectado ao chat'
        });

        stream.on('data', (message) => {
            this.metrics.chatMessages++;
            onMessage(message);
        });

        stream.on('error', (error) => {
            console.error('Erro no chat:', error);
        });

        stream.on('end', () => {
            console.log('Chat finalizado');
        });

        return stream;
    }

    /**
     * Enviar mensagem no chat
     */
    sendChatMessage(stream, content) {
        if (!this.currentToken) {
            throw new Error('Token de autenticação necessário');
        }

        stream.write({
            token: this.currentToken,
            content
        });
    }

    /**
     * Obter métricas do cliente
     */
    getMetrics() {
        return {
            ...this.metrics,
            averageTime: this.metrics.requests > 0 ? 
                (this.metrics.totalTime / this.metrics.requests).toFixed(2) : 0,
            errorRate: this.metrics.requests > 0 ? 
                ((this.metrics.errors / this.metrics.requests) * 100).toFixed(2) : 0,
            successRate: this.metrics.requests > 0 ? 
                (((this.metrics.requests - this.metrics.errors) / this.metrics.requests) * 100).toFixed(2) : 0
        };
    }

    /**
     * Fechar conexão
     */
    close() {
        this.client.close();
    }
}

/**
 * Demonstração completa dos recursos implementados
 */
async function demonstrateAdvancedFeatures() {
    const client = new TaskGRPCClient();
    const userId = 'user1';

    console.log('🎯 Demonstração de Recursos Avançados gRPC\n');

    try {
        // 1. Autenticação
        console.log('1️⃣ Testando Autenticação...');
        await client.login();
        await client.validateToken();
        console.log('✅ Autenticação funcionando\n');

        // 2. Operações CRUD com autenticação
        console.log('2️⃣ Testando CRUD com Autenticação...');
        
        const task1 = await client.createTask(
            'Estudar gRPC Avançado',
            'Implementar autenticação e streaming',
            'high',
            userId
        );
        console.log(`✅ Tarefa criada: ${task1.task.title}`);

        const task2 = await client.createTask(
            'Implementar Chat',
            'Streaming bidirecional em tempo real',
            'medium',
            userId
        );
        console.log(`✅ Tarefa criada: ${task2.task.title}`);

        // 3. Listar e atualizar tarefas
        const taskList = await client.listTasks(userId);
        console.log(`📊 Total de tarefas: ${taskList.total}`);

        const updated = await client.updateTask(task1.task.id, {
            completed: true,
            title: 'Estudar gRPC Avançado - Concluído!'
        });
        console.log(`✅ Tarefa atualizada: ${updated.task.title}\n`);

        // 4. Streaming de tarefas
        console.log('3️⃣ Testando Streaming de Tarefas...');
        const taskStream = client.streamTaskUpdates(userId, (update) => {
            console.log(`📨 Atualização: ${update.message}`);
            if (update.task) {
                console.log(`   Tarefa: ${update.task.title}`);
            }
        });

        // Simular algumas atualizações
        setTimeout(async () => {
            await client.createTask('Nova tarefa via stream', 'Teste de streaming', 'low', userId);
        }, 2000);

        setTimeout(async () => {
            await client.updateTask(task2.task.id, { completed: true });
        }, 4000);

        // 5. Chat bidirecional
        console.log('4️⃣ Testando Chat Bidirecional...');
        const chatStream = client.chatStream((message) => {
            const timestamp = new Date(message.timestamp).toLocaleTimeString();
            console.log(`💬 [${timestamp}] ${message.user_id}: ${message.content}`);
        });

        // Simular algumas mensagens
        setTimeout(() => {
            client.sendChatMessage(chatStream, 'Olá, mundo!');
        }, 1000);

        setTimeout(() => {
            client.sendChatMessage(chatStream, 'Chat funcionando perfeitamente!');
        }, 3000);

        // Finalizar demonstração
        setTimeout(() => {
            taskStream.cancel();
            chatStream.end();
            
            console.log('\n📊 Métricas Finais:');
            console.log(client.getMetrics());
            
            client.close();
            console.log('\n✅ Demonstração concluída com sucesso!');
        }, 8000);

    } catch (error) {
        console.error('❌ Erro na demonstração:', error);
        client.close();
    }
}

// Executar demonstração se script for chamado diretamente
if (require.main === module) {
    demonstrateAdvancedFeatures();
}

module.exports = TaskGRPCClient;
