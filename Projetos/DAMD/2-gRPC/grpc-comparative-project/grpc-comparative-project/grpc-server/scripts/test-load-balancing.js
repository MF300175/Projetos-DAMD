const TaskGRPCClient = require('../src/client/client');

/**
 * Teste de Load Balancing
 * 
 * Simula múltiplas chamadas para testar distribuição de carga
 */
class LoadBalancingTest {
    constructor() {
        this.servers = [
            'localhost:50051',
            'localhost:50052', 
            'localhost:50053'
        ];
        this.clients = [];
        this.results = [];
    }

    /**
     * Criar clientes para cada servidor
     */
    async createClients() {
        console.log('🔗 Criando clientes para cada servidor...');
        
        for (const server of this.servers) {
            const client = new TaskGRPCClient(server);
            try {
                await client.login();
                this.clients.push(client);
                console.log(`✅ Cliente conectado a ${server}`);
            } catch (error) {
                console.log(`❌ Falha ao conectar a ${server}: ${error.message}`);
            }
        }
    }

    /**
     * Executar teste de carga
     */
    async runLoadTest(iterations = 20) {
        console.log(`\n🚀 Iniciando teste de carga com ${iterations} iterações...`);
        
        const promises = [];
        
        for (let i = 0; i < iterations; i++) {
            const client = this.clients[i % this.clients.length];
            const promise = this.singleRequest(client, i);
            promises.push(promise);
        }

        try {
            const results = await Promise.all(promises);
            this.analyzeResults(results);
        } catch (error) {
            console.error('❌ Erro no teste de carga:', error);
        }
    }

    /**
     * Executar uma única requisição
     */
    async singleRequest(client, requestId) {
        const start = Date.now();
        
        try {
            const response = await client.createTask(
                `Tarefa de teste ${requestId}`,
                `Descrição da tarefa ${requestId}`,
                'medium',
                'user1'
            );
            
            const duration = Date.now() - start;
            
            return {
                success: true,
                duration,
                requestId,
                server: client.serverAddress
            };
        } catch (error) {
            const duration = Date.now() - start;
            
            return {
                success: false,
                duration,
                requestId,
                server: client.serverAddress,
                error: error.message
            };
        }
    }

    /**
     * Analisar resultados do teste
     */
    analyzeResults(results) {
        console.log('\n📊 Análise dos Resultados:');
        console.log('==========================');

        const serverStats = {};
        let totalRequests = 0;
        let successfulRequests = 0;
        let totalDuration = 0;

        // Inicializar estatísticas por servidor
        this.servers.forEach(server => {
            serverStats[server] = {
                requests: 0,
                successful: 0,
                totalDuration: 0,
                errors: 0
            };
        });

        // Processar resultados
        results.forEach(result => {
            totalRequests++;
            totalDuration += result.duration;
            
            if (result.success) {
                successfulRequests++;
            }

            const stats = serverStats[result.server];
            stats.requests++;
            stats.totalDuration += result.duration;
            
            if (result.success) {
                stats.successful++;
            } else {
                stats.errors++;
            }
        });

        // Exibir estatísticas gerais
        console.log(`\n📈 Estatísticas Gerais:`);
        console.log(`   Total de requisições: ${totalRequests}`);
        console.log(`   Requisições bem-sucedidas: ${successfulRequests}`);
        console.log(`   Taxa de sucesso: ${((successfulRequests / totalRequests) * 100).toFixed(2)}%`);
        console.log(`   Tempo médio: ${(totalDuration / totalRequests).toFixed(2)}ms`);

        // Exibir estatísticas por servidor
        console.log(`\n🖥️  Estatísticas por Servidor:`);
        Object.entries(serverStats).forEach(([server, stats]) => {
            if (stats.requests > 0) {
                const avgTime = (stats.totalDuration / stats.requests).toFixed(2);
                const successRate = ((stats.successful / stats.requests) * 100).toFixed(2);
                
                console.log(`   ${server}:`);
                console.log(`     Requisições: ${stats.requests}`);
                console.log(`     Sucessos: ${stats.successful}`);
                console.log(`     Erros: ${stats.errors}`);
                console.log(`     Taxa de sucesso: ${successRate}%`);
                console.log(`     Tempo médio: ${avgTime}ms`);
            }
        });

        // Verificar distribuição de carga
        console.log(`\n⚖️  Análise de Distribuição de Carga:`);
        const requestCounts = Object.values(serverStats).map(s => s.requests);
        const minRequests = Math.min(...requestCounts);
        const maxRequests = Math.max(...requestCounts);
        const distributionVariance = maxRequests - minRequests;
        
        if (distributionVariance <= 2) {
            console.log(`   ✅ Distribuição equilibrada (variação: ${distributionVariance})`);
        } else {
            console.log(`   ⚠️  Distribuição desequilibrada (variação: ${distributionVariance})`);
        }
    }

    /**
     * Fechar todas as conexões
     */
    close() {
        this.clients.forEach(client => client.close());
        console.log('\n✅ Todas as conexões fechadas');
    }
}

/**
 * Executar teste de load balancing
 */
async function runLoadBalancingTest() {
    console.log('🎯 Teste de Load Balancing gRPC');
    console.log('================================\n');

    const test = new LoadBalancingTest();

    try {
        await test.createClients();
        
        if (test.clients.length === 0) {
            console.log('❌ Nenhum servidor disponível para teste');
            return;
        }

        await test.runLoadTest(30);
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        test.close();
    }
}

// Executar teste se chamado diretamente
if (require.main === module) {
    runLoadBalancingTest().catch(error => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });
}

module.exports = LoadBalancingTest;
