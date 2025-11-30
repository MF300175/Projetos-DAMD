/**
 * =============================================================================
 * LOAD BALANCER SIMPLES PARA REST
 * =============================================================================
 * 
 * Este arquivo implementa um load balancer simples para o servidor REST,
 * equivalente ao load balancer do gRPC.
 * 
 * FUNCIONALIDADES:
 * - Round-robin entre múltiplos servidores
 * - Rastreamento de conexões
 * - Health check básico
 * - Estatísticas de uso
 * 
 * EQUIVALÊNCIA COM gRPC:
 * - gRPC: SimpleLoadBalancer com round-robin
 * - REST: SimpleLoadBalancer com round-robin
 * =============================================================================
 */

class RESTLoadBalancer {
    constructor() {
        this.servers = [];
        this.currentIndex = 0;
        this.stats = {
            totalRequests: 0,
            totalErrors: 0,
            startTime: Date.now()
        };
    }

    /**
     * Adiciona servidor ao pool
     */
    addServer(port, host = 'localhost') {
        const server = {
            id: `${host}:${port}`,
            host,
            port,
            healthy: true,
            connections: 0,
            errors: 0,
            lastCheck: Date.now()
        };

        this.servers.push(server);
        console.log(`✅ Servidor REST adicionado: ${server.id}`);
        return server;
    }

    /**
     * Obtém próximo servidor usando round-robin
     */
    getNextServer() {
        if (this.servers.length === 0) {
            throw new Error('Nenhum servidor REST disponível');
        }

        // Filtrar apenas servidores saudáveis
        const healthyServers = this.servers.filter(server => server.healthy);
        
        if (healthyServers.length === 0) {
            throw new Error('Nenhum servidor REST saudável disponível');
        }

        // Round-robin simples
        const server = healthyServers[this.currentIndex % healthyServers.length];
        this.currentIndex = (this.currentIndex + 1) % healthyServers.length;

        // Incrementar contador de conexões
        server.connections++;
        this.stats.totalRequests++;

        return server;
    }

    /**
     * Libera conexão de um servidor
     */
    releaseServer(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        if (server && server.connections > 0) {
            server.connections--;
        }
    }

    /**
     * Marca servidor como não saudável
     */
    markServerUnhealthy(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        if (server) {
            server.healthy = false;
            server.errors++;
            this.stats.totalErrors++;
            console.log(`❌ Servidor ${serverId} marcado como não saudável`);
        }
    }

    /**
     * Marca servidor como saudável
     */
    markServerHealthy(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        if (server) {
            server.healthy = true;
            server.lastCheck = Date.now();
            console.log(`✅ Servidor ${serverId} marcado como saudável`);
        }
    }

    /**
     * Health check básico de todos os servidores
     */
    async healthCheck() {
        console.log('🔍 Executando health check dos servidores REST...');
        
        for (const server of this.servers) {
            try {
                const response = await fetch(`http://${server.host}:${server.port}/health`, {
                    method: 'GET',
                    timeout: 5000
                });

                if (response.ok) {
                    this.markServerHealthy(server.id);
                } else {
                    this.markServerUnhealthy(server.id);
                }
            } catch (error) {
                console.error(`❌ Health check falhou para ${server.id}:`, error.message);
                this.markServerUnhealthy(server.id);
            }
        }
    }

    /**
     * Obtém estatísticas do load balancer
     */
    getStats() {
        const uptime = Date.now() - this.stats.startTime;
        const healthyServers = this.servers.filter(s => s.healthy).length;
        const totalConnections = this.servers.reduce((sum, s) => sum + s.connections, 0);

        return {
            totalServers: this.servers.length,
            healthyServers,
            totalConnections,
            totalRequests: this.stats.totalRequests,
            totalErrors: this.stats.totalErrors,
            errorRate: this.stats.totalRequests > 0 ? 
                (this.stats.totalErrors / this.stats.totalRequests * 100).toFixed(2) : 0,
            uptime: Math.floor(uptime / 1000),
            servers: this.servers.map(s => ({
                id: s.id,
                healthy: s.healthy,
                connections: s.connections,
                errors: s.errors,
                lastCheck: new Date(s.lastCheck).toISOString()
            }))
        };
    }

    /**
     * Obtém servidor por ID
     */
    getServer(serverId) {
        return this.servers.find(s => s.id === serverId);
    }

    /**
     * Remove servidor do pool
     */
    removeServer(serverId) {
        const index = this.servers.findIndex(s => s.id === serverId);
        if (index !== -1) {
            const server = this.servers.splice(index, 1)[0];
            console.log(`🗑️ Servidor REST removido: ${serverId}`);
            return server;
        }
        return null;
    }

    /**
     * Reinicia contador de round-robin
     */
    resetRoundRobin() {
        this.currentIndex = 0;
        console.log('🔄 Round-robin resetado');
    }

    /**
     * Limpa estatísticas
     */
    clearStats() {
        this.stats = {
            totalRequests: 0,
            totalErrors: 0,
            startTime: Date.now()
        };
        
        this.servers.forEach(server => {
            server.connections = 0;
            server.errors = 0;
        });
        
        console.log('📊 Estatísticas limpas');
    }
}

/**
 * Cliente para testar load balancing
 */
class LoadBalancedRESTClient {
    constructor(loadBalancer) {
        this.loadBalancer = loadBalancer;
        this.token = null;
    }

    /**
     * Faz login para obter token
     */
    async login(email = 'teste@exemplo.com', password = '123456') {
        const server = this.loadBalancer.getNextServer();
        const url = `http://${server.host}:${server.port}/api/auth/login`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                this.token = data.data.token;
                console.log(`✅ Login realizado via ${server.id}`);
                return data;
            } else {
                throw new Error(`Login falhou: ${response.status}`);
            }
        } catch (error) {
            this.loadBalancer.markServerUnhealthy(server.id);
            throw error;
        } finally {
            this.loadBalancer.releaseServer(server.id);
        }
    }

    /**
     * Cria tarefa via load balancer
     */
    async createTask(title, description = '', priority = 'medium') {
        if (!this.token) {
            throw new Error('Não autenticado. Faça login primeiro.');
        }

        const server = this.loadBalancer.getNextServer();
        const url = `http://${server.host}:${server.port}/api/tasks`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ title, description, priority })
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Tarefa criada via ${server.id}: ${title}`);
                return data;
            } else {
                throw new Error(`Criação de tarefa falhou: ${response.status}`);
            }
        } catch (error) {
            this.loadBalancer.markServerUnhealthy(server.id);
            throw error;
        } finally {
            this.loadBalancer.releaseServer(server.id);
        }
    }

    /**
     * Lista tarefas via load balancer
     */
    async listTasks() {
        if (!this.token) {
            throw new Error('Não autenticado. Faça login primeiro.');
        }

        const server = this.loadBalancer.getNextServer();
        const url = `http://${server.host}:${server.port}/api/tasks`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Tarefas listadas via ${server.id}: ${data.data.length} tarefas`);
                return data;
            } else {
                throw new Error(`Listagem de tarefas falhou: ${response.status}`);
            }
        } catch (error) {
            this.loadBalancer.markServerUnhealthy(server.id);
            throw error;
        } finally {
            this.loadBalancer.releaseServer(server.id);
        }
    }
}

module.exports = {
    RESTLoadBalancer,
    LoadBalancedRESTClient
};
