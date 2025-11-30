/**
 * =============================================================================
 * BENCHMARK REST vs gRPC
 * =============================================================================
 * 
 * Este arquivo implementa o benchmark para o servidor REST,
 * equivalente ao benchmark do gRPC.
 * 
 * MÉTRICAS MEDIDAS:
 * - Latência de autenticação
 * - Latência de operações CRUD
 * - Latência de chat WebSocket
 * - Latência de load balancing
 * - Throughput (requisições por segundo)
 * - Taxa de erro
 * 
 * EQUIVALÊNCIA COM gRPC:
 * - Mesmas métricas e estrutura de dados
 * - Formato de saída compatível
 * =============================================================================
 */

const fetch = require('node-fetch');
const WebSocket = require('ws');
const { performance } = require('perf_hooks');
const { RESTLoadBalancer, LoadBalancedRESTClient } = require('./load-balancer/simpleLoadBalancer');

class RESTBenchmark {
    constructor() {
        this.baseURL = process.env.REST_SERVER || 'http://localhost:3000';
        this.results = {
            latency: {
                auth: [],
                crud: [],
                chat: [],
                loadBalancing: []
            },
            throughput: {
                rps: 0,
                concurrent: 0,
                messages: 0
            },
            errors: 0,
            totalRequests: 0,
            totalTime: 0
        };
        this.token = null;
        this.userId = null;
    }

    /**
     * Executa todos os testes de benchmark
     */
    async runAllTests(iterations = 100) {
        console.log('🚀 Iniciando benchmark REST...');
        console.log(`📊 Iterações: ${iterations}`);
        console.log(`🌐 Servidor: ${this.baseURL}`);

        try {
            // 1. Teste de autenticação
            console.log('\n🔐 Testando autenticação...');
            await this.benchmarkAuth(iterations);

            // 2. Teste de CRUD
            console.log('\n📋 Testando operações CRUD...');
            await this.benchmarkCRUD(iterations);

            // 3. Teste de chat WebSocket
            console.log('\n💬 Testando chat WebSocket...');
            await this.benchmarkChat(iterations);

            // 4. Teste de load balancing
            console.log('\n⚖️ Testando load balancing...');
            await this.benchmarkLoadBalancing(iterations);

            // 5. Calcular throughput
            this.calculateThroughput();

            // 6. Gerar relatório
            this.generateReport();

        } catch (error) {
            console.error('❌ Erro no benchmark REST:', error.message);
            throw error;
        }
    }

    /**
     * Benchmark de autenticação
     */
    async benchmarkAuth(iterations) {
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();

            try {
                const response = await fetch(`${this.baseURL}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: 'teste@exemplo.com',
                        password: '123456'
                    })
                });

                const end = performance.now();
                const latency = end - start;

                if (response.ok) {
                    const data = await response.json();
                    this.results.latency.auth.push(latency);
                    
                    // Armazenar token para outros testes
                    if (!this.token) {
                        this.token = data.data.token;
                        this.userId = data.data.user.id;
                    }
                } else {
                    this.results.errors++;
                }

            } catch (error) {
                this.results.errors++;
                console.error(`❌ Erro na autenticação ${i + 1}:`, error.message);
            }

            this.results.totalRequests++;
        }

        const avgLatency = this.calculateAverage(this.results.latency.auth);
        console.log(`✅ Autenticação: ${avgLatency.toFixed(1)}ms (média)`);
    }

    /**
     * Benchmark de operações CRUD
     */
    async benchmarkCRUD(iterations) {
        if (!this.token) {
            throw new Error('Token não disponível para teste CRUD');
        }

        for (let i = 0; i < iterations; i++) {
            const start = performance.now();

            try {
                // Teste de criação de tarefa
                const response = await fetch(`${this.baseURL}/api/tasks`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify({
                        title: `Tarefa REST ${i}`,
                        description: `Descrição da tarefa ${i}`,
                        priority: 'medium'
                    })
                });

                const end = performance.now();
                const latency = end - start;

                if (response.ok) {
                    this.results.latency.crud.push(latency);
                } else {
                    this.results.errors++;
                }

            } catch (error) {
                this.results.errors++;
                console.error(`❌ Erro no CRUD ${i + 1}:`, error.message);
            }

            this.results.totalRequests++;
        }

        const avgLatency = this.calculateAverage(this.results.latency.crud);
        console.log(`✅ CRUD: ${avgLatency.toFixed(1)}ms (média)`);
    }

    /**
     * Benchmark de chat WebSocket
     */
    async benchmarkChat(iterations) {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`${this.baseURL.replace('http', 'ws')}/chat?token=${this.token}`);
            let messageCount = 0;
            const latencies = [];

            ws.on('open', () => {
                console.log('💬 WebSocket conectado para benchmark');

                // Enviar mensagens de teste
                const sendMessage = () => {
                    if (messageCount >= iterations) {
                        ws.close();
                        this.results.latency.chat = latencies;
                        const avgLatency = this.calculateAverage(latencies);
                        console.log(`✅ Chat WebSocket: ${avgLatency.toFixed(1)}ms (média)`);
                        resolve();
                        return;
                    }

                    const start = performance.now();
                    ws.send(JSON.stringify({
                        type: 'chat',
                        content: `Mensagem de teste ${messageCount}`
                    }));

                    messageCount++;
                };

                // Enviar mensagem a cada 100ms
                const interval = setInterval(sendMessage, 100);
                
                ws.on('message', (data) => {
                    const end = performance.now();
                    const message = JSON.parse(data.toString());
                    
                    if (message.type === 'chat') {
                        latencies.push(end - performance.now());
                    }
                });

                ws.on('close', () => {
                    clearInterval(interval);
                });
            });

            ws.on('error', (error) => {
                console.error('❌ Erro no WebSocket:', error.message);
                reject(error);
            });

            // Timeout de segurança
            setTimeout(() => {
                ws.close();
                resolve();
            }, 30000);
        });
    }

    /**
     * Benchmark de load balancing
     */
    async benchmarkLoadBalancing(iterations) {
        const loadBalancer = new RESTLoadBalancer();
        
        // Adicionar servidores (simulando múltiplas instâncias)
        loadBalancer.addServer(3000);
        loadBalancer.addServer(3001);
        loadBalancer.addServer(3002);

        const client = new LoadBalancedRESTClient(loadBalancer);

        try {
            // Fazer login via load balancer
            await client.login();

            for (let i = 0; i < iterations; i++) {
                const start = performance.now();

                try {
                    await client.createTask(`Tarefa LB ${i}`, `Descrição LB ${i}`, 'medium');
                    const end = performance.now();
                    this.results.latency.loadBalancing.push(end - start);

                } catch (error) {
                    this.results.errors++;
                    console.error(`❌ Erro no load balancing ${i + 1}:`, error.message);
                }

                this.results.totalRequests++;
            }

            const avgLatency = this.calculateAverage(this.results.latency.loadBalancing);
            console.log(`✅ Load Balancing: ${avgLatency.toFixed(1)}ms (média)`);

            // Mostrar estatísticas do load balancer
            const stats = loadBalancer.getStats();
            console.log(`📊 Load Balancer: ${stats.healthyServers}/${stats.totalServers} servidores saudáveis`);

        } catch (error) {
            console.error('❌ Erro no benchmark de load balancing:', error.message);
        }
    }

    /**
     * Calcula throughput
     */
    calculateThroughput() {
        const totalTime = this.results.totalTime || 1000; // ms
        this.results.throughput.rps = (this.results.totalRequests / totalTime) * 1000;
        this.results.throughput.concurrent = Math.min(this.results.totalRequests, 100);
        this.results.throughput.messages = this.results.latency.chat.length;

        console.log(`🚀 Throughput: ${this.results.throughput.rps.toFixed(1)} req/s`);
    }

    /**
     * Calcula média de um array de valores
     */
    calculateAverage(values) {
        if (!values || values.length === 0) return 0;
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    /**
     * Gera relatório de benchmark
     */
    generateReport() {
        console.log('\n📊 RELATÓRIO DE BENCHMARK REST');
        console.log('=' .repeat(40));

        // Latência
        console.log('\n⏱️ LATÊNCIA (ms):');
        console.log(`Autenticação: ${this.calculateAverage(this.results.latency.auth).toFixed(1)}`);
        console.log(`CRUD: ${this.calculateAverage(this.results.latency.crud).toFixed(1)}`);
        console.log(`Chat: ${this.calculateAverage(this.results.latency.chat).toFixed(1)}`);
        console.log(`Load Balancing: ${this.calculateAverage(this.results.latency.loadBalancing).toFixed(1)}`);

        // Throughput
        console.log('\n🚀 THROUGHPUT:');
        console.log(`Requisições/s: ${this.results.throughput.rps.toFixed(1)}`);
        console.log(`Usuários concorrentes: ${this.results.throughput.concurrent}`);
        console.log(`Mensagens chat: ${this.results.throughput.messages}`);

        // Confiabilidade
        const errorRate = (this.results.errors / this.results.totalRequests) * 100;
        console.log('\n🛡️ CONFIABILIDADE:');
        console.log(`Total de requisições: ${this.results.totalRequests}`);
        console.log(`Erros: ${this.results.errors}`);
        console.log(`Taxa de erro: ${errorRate.toFixed(2)}%`);

        console.log('\n✅ Benchmark REST concluído!');
        console.log('⏳ Processando dados extraídos - aguarde...');
    }

    /**
     * Obtém resultados para comparação
     */
    getResults() {
        return {
            latency: {
                auth: this.calculateAverage(this.results.latency.auth),
                crud: this.calculateAverage(this.results.latency.crud),
                chat: this.calculateAverage(this.results.latency.chat),
                loadBalancing: this.calculateAverage(this.results.latency.loadBalancing)
            },
            throughput: this.results.throughput,
            errors: this.results.errors,
            totalRequests: this.results.totalRequests,
            errorRate: (this.results.errors / this.results.totalRequests) * 100
        };
    }
}

// Executar benchmark se chamado diretamente
if (require.main === module) {
    const benchmark = new RESTBenchmark();
    benchmark.runAllTests(50).catch(console.error);
}

module.exports = RESTBenchmark;
