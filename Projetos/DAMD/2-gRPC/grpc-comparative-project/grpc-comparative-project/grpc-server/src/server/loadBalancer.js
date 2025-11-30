/**
 * Load Balancer Simples para gRPC
 * 
 * Implementa balanceamento round-robin básico usando apenas Node.js nativo
 * Conforme escopo limitado do roteiro do professor
 */
class SimpleLoadBalancer {
    constructor() {
        this.servers = [];
        this.currentIndex = 0;
        this.healthChecks = new Map();
    }

    /**
     * Adicionar servidor ao pool
     */
    addServer(address, weight = 1) {
        const server = {
            address,
            weight,
            healthy: true,
            connections: 0,
            lastHealthCheck: Date.now()
        };
        
        this.servers.push(server);
        this.healthChecks.set(address, server);
        
        console.log(`✅ Servidor adicionado: ${address} (peso: ${weight})`);
    }

    /**
     * Round Robin simples
     */
    getNextServer() {
        if (this.servers.length === 0) {
            throw new Error('Nenhum servidor disponível');
        }

        // Filtrar apenas servidores saudáveis
        const healthyServers = this.servers.filter(s => s.healthy);
        
        if (healthyServers.length === 0) {
            throw new Error('Nenhum servidor saudável disponível');
        }

        // Selecionar servidor com menor número de conexões
        let selectedServer = healthyServers[0];
        
        for (const server of healthyServers) {
            if (server.connections < selectedServer.connections) {
                selectedServer = server;
            }
        }

        selectedServer.connections++;
        return selectedServer;
    }

    /**
     * Liberar conexão do servidor
     */
    releaseServer(address) {
        const server = this.servers.find(s => s.address === address);
        if (server && server.connections > 0) {
            server.connections--;
        }
    }

    /**
     * Health check simples (simulação)
     */
    async performHealthCheck(address) {
        try {
            // Simulação de health check
            // Em produção, fazer uma chamada gRPC real
            const server = this.healthChecks.get(address);
            if (server) {
                server.healthy = true;
                server.lastHealthCheck = Date.now();
            }
            return true;
        } catch (error) {
            const server = this.healthChecks.get(address);
            if (server) {
                server.healthy = false;
                console.log(`❌ Servidor ${address} não saudável:`, error.message);
            }
            return false;
        }
    }

    /**
     * Health check periódico
     */
    startHealthChecks(intervalMs = 30000) {
        setInterval(async () => {
            console.log('🔍 Executando health checks...');
            
            for (const address of this.healthChecks.keys()) {
                await this.performHealthCheck(address);
            }
        }, intervalMs);
    }

    /**
     * Estatísticas do load balancer
     */
    getStats() {
        return {
            totalServers: this.servers.length,
            healthyServers: this.servers.filter(s => s.healthy).length,
            totalConnections: this.servers.reduce((sum, s) => sum + s.connections, 0),
            servers: this.servers.map(s => ({
                address: s.address,
                healthy: s.healthy,
                connections: s.connections,
                lastHealthCheck: s.lastHealthCheck
            }))
        };
    }

    /**
     * Remover servidor do pool
     */
    removeServer(address) {
        const index = this.servers.findIndex(s => s.address === address);
        if (index !== -1) {
            this.servers.splice(index, 1);
            this.healthChecks.delete(address);
            console.log(`❌ Servidor removido: ${address}`);
        }
    }

    /**
     * Listar servidores disponíveis
     */
    listServers() {
        return this.servers.map(s => ({
            address: s.address,
            healthy: s.healthy,
            connections: s.connections,
            weight: s.weight
        }));
    }
}

module.exports = SimpleLoadBalancer;
