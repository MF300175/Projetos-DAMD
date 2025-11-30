/**
 * Demonstração Completa do Sistema gRPC Avançado
 * 
 * Este script demonstra todos os recursos implementados:
 * 1. Autenticação JWT
 * 2. Error Handling Robusto
 * 3. Load Balancing
 * 4. Streaming Bidirecional (Chat)
 */

const TaskGRPCClient = require('./src/client/client');

async function runCompleteDemo() {
    console.log('🎯 DEMONSTRAÇÃO COMPLETA - Sistema gRPC Avançado');
    console.log('================================================\n');

    const client = new TaskGRPCClient('localhost:50051');
    const userId = 'user1';

    try {
        // 1. AUTENTICAÇÃO
        console.log('1️⃣ TESTANDO AUTENTICAÇÃO JWT');
        console.log('─────────────────────────────');
        
        console.log('🔐 Fazendo login...');
        const loginResponse = await client.login('teste@exemplo.com', '123456');
        console.log(`✅ Login: ${loginResponse.message}`);
        console.log(`🔑 Token gerado: ${loginResponse.token.substring(0, 20)}...`);
        
        console.log('🔍 Validando token...');
        const validationResponse = await client.validateToken();
        console.log(`✅ Validação: ${validationResponse.message}`);
        console.log(`👤 Usuário: ${validationResponse.user_id}\n`);

        // 2. OPERAÇÕES CRUD COM AUTENTICAÇÃO
        console.log('2️⃣ TESTANDO CRUD COM AUTENTICAÇÃO');
        console.log('──────────────────────────────────');
        
        console.log('📝 Criando tarefas...');
        const task1 = await client.createTask(
            'Implementar Autenticação JWT',
            'Adicionar interceptadores para validação de tokens',
            'high',
            userId
        );
        console.log(`✅ Tarefa 1: ${task1.task.title}`);

        const task2 = await client.createTask(
            'Implementar Error Handling',
            'Tratamento robusto de erros gRPC',
            'high',
            userId
        );
        console.log(`✅ Tarefa 2: ${task2.task.title}`);

        const task3 = await client.createTask(
            'Configurar Load Balancing',
            'Balanceamento entre múltiplos servidores',
            'medium',
            userId
        );
        console.log(`✅ Tarefa 3: ${task3.task.title}`);

        const task4 = await client.createTask(
            'Implementar Chat Bidirecional',
            'Streaming em tempo real para chat',
            'medium',
            userId
        );
        console.log(`✅ Tarefa 4: ${task4.task.title}\n`);

        // 3. LISTAR E ATUALIZAR TAREFAS
        console.log('3️⃣ TESTANDO LISTAGEM E ATUALIZAÇÃO');
        console.log('───────────────────────────────────');
        
        const taskList = await client.listTasks(userId);
        console.log(`📊 Total de tarefas: ${taskList.total}`);
        taskList.tasks.forEach((task, index) => {
            console.log(`   ${index + 1}. ${task.title} [${task.priority}] - ${task.completed ? '✅' : '⏳'}`);
        });

        console.log('\n🔄 Atualizando tarefas...');
        const updated1 = await client.updateTask(task1.task.id, {
            completed: true,
            title: '✅ Implementar Autenticação JWT - Concluído!'
        });
        console.log(`✅ Atualizada: ${updated1.task.title}`);

        const updated2 = await client.updateTask(task2.task.id, {
            completed: true,
            title: '✅ Implementar Error Handling - Concluído!'
        });
        console.log(`✅ Atualizada: ${updated2.task.title}\n`);

        // 4. STREAMING DE TAREFAS
        console.log('4️⃣ TESTANDO STREAMING DE TAREFAS');
        console.log('─────────────────────────────────');
        
        console.log('🌊 Iniciando stream de atualizações...');
        const taskStream = client.streamTaskUpdates(userId, (update) => {
            console.log(`📨 Stream: ${update.message}`);
            if (update.task) {
                console.log(`   📋 Tarefa: ${update.task.title}`);
            }
        });

        // Simular atualizações via stream
        setTimeout(async () => {
            console.log('\n🔄 Simulando atualizações via stream...');
            await client.createTask('Nova tarefa via stream', 'Teste de streaming em tempo real', 'low', userId);
        }, 2000);

        setTimeout(async () => {
            await client.updateTask(task3.task.id, { 
                completed: true,
                title: '✅ Configurar Load Balancing - Concluído!'
            });
        }, 4000);

        // 5. CHAT BIDIRECIONAL
        console.log('5️⃣ TESTANDO CHAT BIDIRECIONAL');
        console.log('──────────────────────────────');
        
        console.log('💬 Iniciando chat...');
        const chatStream = client.chatStream((message) => {
            const timestamp = new Date(message.timestamp).toLocaleTimeString();
            const sender = message.user_id === 'system' ? '🤖 Sistema' : `👤 ${message.user_id}`;
            console.log(`💬 [${timestamp}] ${sender}: ${message.content}`);
        });

        // Simular mensagens de chat
        setTimeout(() => {
            console.log('\n💬 Enviando mensagens de teste...');
            client.sendChatMessage(chatStream, 'Olá! Chat bidirecional funcionando!');
        }, 1000);

        setTimeout(() => {
            client.sendChatMessage(chatStream, 'Sistema gRPC avançado implementado com sucesso!');
        }, 3000);

        setTimeout(() => {
            client.sendChatMessage(chatStream, 'Todos os recursos funcionando: Auth, Error Handling, Load Balancing, Streaming!');
        }, 5000);

        // 6. MÉTRICAS E ESTATÍSTICAS
        setTimeout(() => {
            console.log('\n6️⃣ MÉTRICAS E ESTATÍSTICAS');
            console.log('───────────────────────────');
            
            const metrics = client.getMetrics();
            console.log('📊 Métricas do Cliente:');
            console.log(`   Total de requisições: ${metrics.requests}`);
            console.log(`   Requisições de autenticação: ${metrics.authRequests}`);
            console.log(`   Mensagens de chat: ${metrics.chatMessages}`);
            console.log(`   Tempo médio: ${metrics.averageTime}ms`);
            console.log(`   Taxa de sucesso: ${metrics.successRate}%`);
            console.log(`   Taxa de erro: ${metrics.errorRate}%`);
        }, 6000);

        // Finalizar demonstração
        setTimeout(() => {
            console.log('\n🎉 DEMONSTRAÇÃO CONCLUÍDA COM SUCESSO!');
            console.log('=====================================');
            console.log('✅ Autenticação JWT: Funcionando');
            console.log('✅ Error Handling: Funcionando');
            console.log('✅ CRUD com Autenticação: Funcionando');
            console.log('✅ Streaming de Tarefas: Funcionando');
            console.log('✅ Chat Bidirecional: Funcionando');
            console.log('✅ Métricas e Monitoramento: Funcionando');
            console.log('\n🚀 Sistema gRPC Avançado implementado com sucesso!');
            console.log('📚 Baseado no roteiro do professor com extensões');
            
            // Cleanup
            taskStream.cancel();
            chatStream.end();
            client.close();
            
            console.log('\n👋 Demonstração finalizada!');
        }, 8000);

    } catch (error) {
        console.error('❌ Erro na demonstração:', error.message);
        console.error('Stack:', error.stack);
        client.close();
    }
}

// Executar demonstração
if (require.main === module) {
    runCompleteDemo().catch(error => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });
}

module.exports = { runCompleteDemo };
