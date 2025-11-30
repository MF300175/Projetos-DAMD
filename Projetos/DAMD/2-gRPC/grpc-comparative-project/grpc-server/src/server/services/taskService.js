const grpc = require('@grpc/grpc-js');
const { v4: uuidv4 } = require('uuid');
const storage = require('../../data/storage');
const AuthInterceptor = require('../../middleware/auth');

/**
 * Serviço de Tarefas gRPC
 * 
 * Implementa operações CRUD com autenticação, error handling e chat
 * Baseado no roteiro do professor com extensões
 */
class TaskServiceImpl {
    constructor() {
        this.streamingSessions = new Map();
        this.chatSessions = new Set();
    }

    /**
     * Wrapper para tratamento de erros gRPC
     */
    static wrapWithErrorHandling(serviceMethod) {
        return (call, callback) => {
            try {
                serviceMethod(call, callback);
            } catch (error) {
                console.error('Erro capturado:', error);
                
                const grpcError = new Error(error.message || 'Erro interno do servidor');
                
                // Mapear tipos de erro para códigos gRPC
                if (error.message.includes('não encontrado') || error.message.includes('not found')) {
                    grpcError.code = grpc.status.NOT_FOUND;
                } else if (error.message.includes('inválido') || error.message.includes('invalid')) {
                    grpcError.code = grpc.status.INVALID_ARGUMENT;
                } else if (error.message.includes('Token') || error.message.includes('token')) {
                    grpcError.code = grpc.status.UNAUTHENTICATED;
                } else if (error.message.includes('permissão') || error.message.includes('permission')) {
                    grpcError.code = grpc.status.PERMISSION_DENIED;
                } else {
                    grpcError.code = grpc.status.INTERNAL;
                }
                
                callback(grpcError);
            }
        };
    }

    /**
     * Login de usuário
     */
    login(call, callback) {
        TaskServiceImpl.wrapWithErrorHandling((call, callback) => {
            try {
                const { email, password } = call.request;

                const user = storage.findUserByEmail(email);
                
                if (!user) {
                    return callback(null, {
                        success: false,
                        message: 'Usuário não encontrado',
                        token: '',
                        user_id: ''
                    });
                }

                if (user.password !== password) {
                    return callback(null, {
                        success: false,
                        message: 'Senha incorreta',
                        token: '',
                        user_id: ''
                    });
                }

                const token = AuthInterceptor.createSimpleToken(user.userId);
                
                callback(null, {
                    success: true,
                    message: 'Login realizado com sucesso',
                    token,
                    user_id: user.userId
                });

            } catch (error) {
                console.error('Erro no login:', error);
                callback(null, {
                    success: false,
                    message: 'Erro interno do servidor',
                    token: '',
                    user_id: ''
                });
            }
        })(call, callback);
    }

    /**
     * Validar token
     */
    validateToken(call, callback) {
        TaskServiceImpl.wrapWithErrorHandling((call, callback) => {
            try {
                const { token } = call.request;

                if (!token) {
                    return callback(null, {
                        valid: false,
                        message: 'Token não fornecido',
                        user_id: ''
                    });
                }

                const decoded = AuthInterceptor.validateSimpleToken(token);
                const user = storage.findUserById(decoded.userId);

                if (!user) {
                    return callback(null, {
                        valid: false,
                        message: 'Usuário não encontrado',
                        user_id: ''
                    });
                }

                callback(null, {
                    valid: true,
                    message: 'Token válido',
                    user_id: decoded.userId
                });

            } catch (error) {
                callback(null, {
                    valid: false,
                    message: 'Token inválido',
                    user_id: ''
                });
            }
        })(call, callback);
    }

    /**
     * Criar tarefa (com autenticação)
     */
    createTask(call, callback) {
        TaskServiceImpl.wrapWithErrorHandling((call, callback) => {
            // Validar token antes de processar
            AuthInterceptor.validateToken(call, callback, (validatedCall) => {
                try {
                    const { title, description, priority, user_id } = validatedCall.request;

                    // Validação básica
                    if (!title?.trim()) {
                        return callback(null, {
                            success: false,
                            message: 'Título é obrigatório',
                            task: null
                        });
                    }

                    if (!user_id?.trim()) {
                        return callback(null, {
                            success: false,
                            message: 'User ID é obrigatório',
                            task: null
                        });
                    }

                    const task = storage.createTask({
                        title: title.trim(),
                        description: description?.trim() || '',
                        priority: priority || 'medium',
                        user_id: user_id.trim()
                    });

                    callback(null, {
                        success: true,
                        message: 'Tarefa criada com sucesso',
                        task
                    });
                } catch (error) {
                    console.error('Erro ao criar tarefa:', error);
                    callback(null, {
                        success: false,
                        message: 'Erro interno do servidor',
                        task: null
                    });
                }
            });
        })(call, callback);
    }

    /**
     * Buscar tarefa (com autenticação)
     */
    getTask(call, callback) {
        TaskServiceImpl.wrapWithErrorHandling((call, callback) => {
            AuthInterceptor.validateToken(call, callback, (validatedCall) => {
                try {
                    const { id } = validatedCall.request;
                    const task = storage.getTask(id);

                    if (!task) {
                        return callback(null, {
                            success: false,
                            message: 'Tarefa não encontrada',
                            task: null
                        });
                    }

                    callback(null, {
                        success: true,
                        message: 'Tarefa encontrada',
                        task
                    });
                } catch (error) {
                    console.error('Erro ao buscar tarefa:', error);
                    callback(null, {
                        success: false,
                        message: 'Erro interno do servidor',
                        task: null
                    });
                }
            });
        })(call, callback);
    }

    /**
     * Listar tarefas (com autenticação)
     */
    listTasks(call, callback) {
        TaskServiceImpl.wrapWithErrorHandling((call, callback) => {
            AuthInterceptor.validateToken(call, callback, (validatedCall) => {
                try {
                    const { user_id, completed, priority } = validatedCall.request;
                    
                    const tasks = storage.listTasks(
                        user_id,
                        completed !== null ? completed : null,
                        priority || null
                    );

                    callback(null, {
                        success: true,
                        message: `${tasks.length} tarefa(s) encontrada(s)`,
                        tasks,
                        total: tasks.length
                    });
                } catch (error) {
                    console.error('Erro ao listar tarefas:', error);
                    callback(null, {
                        success: false,
                        message: 'Erro interno do servidor',
                        tasks: [],
                        total: 0
                    });
                }
            });
        })(call, callback);
    }

    /**
     * Atualizar tarefa (com autenticação)
     */
    updateTask(call, callback) {
        TaskServiceImpl.wrapWithErrorHandling((call, callback) => {
            AuthInterceptor.validateToken(call, callback, (validatedCall) => {
                try {
                    const { id, title, description, completed, priority } = validatedCall.request;
                    
                    const updates = {};
                    if (title !== undefined) updates.title = title.trim();
                    if (description !== undefined) updates.description = description.trim();
                    if (completed !== undefined) updates.completed = completed;
                    if (priority !== undefined) updates.priority = priority;

                    const task = storage.updateTask(id, updates);

                    if (!task) {
                        return callback(null, {
                            success: false,
                            message: 'Tarefa não encontrada',
                            task: null
                        });
                    }

                    callback(null, {
                        success: true,
                        message: 'Tarefa atualizada com sucesso',
                        task
                    });
                } catch (error) {
                    console.error('Erro ao atualizar tarefa:', error);
                    callback(null, {
                        success: false,
                        message: 'Erro interno do servidor',
                        task: null
                    });
                }
            });
        })(call, callback);
    }

    /**
     * Deletar tarefa (com autenticação)
     */
    deleteTask(call, callback) {
        TaskServiceImpl.wrapWithErrorHandling((call, callback) => {
            AuthInterceptor.validateToken(call, callback, (validatedCall) => {
                try {
                    const { id } = validatedCall.request;
                    const deleted = storage.deleteTask(id);

                    if (!deleted) {
                        return callback(null, {
                            success: false,
                            message: 'Tarefa não encontrada'
                        });
                    }

                    callback(null, {
                        success: true,
                        message: 'Tarefa deletada com sucesso'
                    });
                } catch (error) {
                    console.error('Erro ao deletar tarefa:', error);
                    callback(null, {
                        success: false,
                        message: 'Erro interno do servidor'
                    });
                }
            });
        })(call, callback);
    }

    /**
     * Stream de atualizações em tempo real
     */
    streamTaskUpdates(call) {
        try {
            const { user_id } = call.request;
            console.log(`🔄 Cliente conectado ao stream: ${user_id}`);

            // Enviar tarefas existentes
            const existingTasks = storage.listTasks(user_id);
            existingTasks.forEach(task => {
                call.write({
                    success: true,
                    message: 'Tarefa existente',
                    task
                });
            });

            // Inscrever para futuras atualizações
            const unsubscribe = storage.subscribe(({ action, task }) => {
                if (task.user_id === user_id) {
                    call.write({
                        success: true,
                        message: `Tarefa ${action.toLowerCase()}`,
                        task
                    });
                }
            });

            // Cleanup quando cliente desconectar
            call.on('cancelled', () => {
                console.log(`❌ Cliente desconectado do stream: ${user_id}`);
                unsubscribe();
            });

            call.on('error', (error) => {
                console.error('Erro no stream:', error);
                unsubscribe();
            });
        } catch (error) {
            console.error('Erro no stream de tarefas:', error);
            call.destroy(new Error(error.message || 'Erro no streaming'));
        }
    }

    /**
     * Chat bidirecional
     */
    chatStream(call) {
        let user = null;
        let sessionId = null;
        
        console.log('🔄 Nova conexão de chat estabelecida');

        // Processar mensagens recebidas do cliente
        call.on('data', (request) => {
            try {
                const { token, content } = request;

                // Validar token na primeira mensagem
                if (!user) {
                    try {
                        const decoded = AuthInterceptor.validateSimpleToken(token);
                        user = decoded;
                        sessionId = uuidv4();

                        // Adicionar sessão ao storage
                        const session = { call, user, sessionId };
                        storage.addChatSession(session);
                        this.chatSessions.add(session);

                        console.log(`👤 Usuário ${user.userId} conectado ao chat`);

                        // Enviar mensagem de boas-vindas
                        const welcomeMessage = {
                            id: uuidv4(),
                            user_id: 'system',
                            content: `Usuário ${user.userId} entrou no chat`,
                            timestamp: Date.now()
                        };

                        storage.broadcastToChat(welcomeMessage, session);

                    } catch (error) {
                        console.error('Token inválido no chat:', error);
                        call.destroy(new Error('Token inválido'));
                        return;
                    }
                }

                // Criar mensagem
                const message = {
                    id: uuidv4(),
                    user_id: user.userId,
                    content: content.trim(),
                    timestamp: Date.now()
                };

                // Broadcast para todos os clientes conectados
                storage.broadcastToChat(message, { call, user, sessionId });

            } catch (error) {
                console.error('Erro ao processar mensagem de chat:', error);
            }
        });

        // Cliente desconectou
        call.on('cancelled', () => {
            console.log(`❌ Cliente desconectado do chat: ${sessionId}`);
            this.removeUserFromChat(sessionId);
        });

        call.on('error', (error) => {
            console.error('Erro no stream de chat:', error);
            this.removeUserFromChat(sessionId);
        });
    }

    /**
     * Remover usuário do chat
     */
    removeUserFromChat(sessionId) {
        const session = Array.from(this.chatSessions).find(s => s.sessionId === sessionId);
        if (!session) return;

        // Remover da sessão local
        this.chatSessions.delete(session);
        storage.removeChatSession(session);

        // Notificar outros usuários
        const leaveMessage = {
            id: uuidv4(),
            user_id: 'system',
            content: `Usuário ${session.user.userId} saiu do chat`,
            timestamp: Date.now()
        };

        storage.broadcastToChat(leaveMessage);
    }

    /**
     * Obter estatísticas do serviço
     */
    getServiceStats() {
        return {
            streamingSessions: this.streamingSessions.size,
            chatSessions: this.chatSessions.size,
            storageStats: storage.getStats('user1')
        };
    }
}

module.exports = TaskServiceImpl;
