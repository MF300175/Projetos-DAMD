// shared/serviceRegistry.js - VERSÃO COM ARQUIVO COMPARTILHADO
const fs = require('fs');
const path = require('path');

class FileBasedServiceRegistry {
    constructor() {
        this.registryFile = path.join(__dirname, 'services-registry.json');
        this.ensureRegistryFile();
        console.log('File-based Service Registry inicializado:', this.registryFile);
    }

    ensureRegistryFile() {
        if (!fs.existsSync(this.registryFile)) {
            this.writeRegistry({});
        }
    }

    readRegistry() {
        try {
            const data = fs.readFileSync(this.registryFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Erro ao ler registry file:', error.message);
            return {};
        }
    }

    writeRegistry(services) {
        try {
            fs.writeFileSync(this.registryFile, JSON.stringify(services, null, 2));
        } catch (error) {
            console.error('Erro ao escrever registry file:', error.message);
        }
    }

    // Registrar um serviço
    register(serviceName, serviceInfo) {
        const services = this.readRegistry();
        
        services[serviceName] = {
            ...serviceInfo,
            registeredAt: Date.now(),
            lastHealthCheck: Date.now(),
            healthy: true,
            pid: process.pid
        };
        
        this.writeRegistry(services);
        console.log(`Serviço registrado: ${serviceName} - ${serviceInfo.url} (PID: ${process.pid})`);
        console.log(`Total de serviços: ${Object.keys(services).length}`);
    }

    // Descobrir um serviço
    discover(serviceName) {
        const services = this.readRegistry();
        console.log(`Procurando serviço: ${serviceName}`);
        console.log(`Serviços disponíveis: ${Object.keys(services).join(', ')}`);
        
        const service = services[serviceName];
        if (!service) {
            console.error(`Serviço não encontrado: ${serviceName}`);
            console.error(`Serviços registrados:`, Object.keys(services));
            throw new Error(`Serviço não encontrado: ${serviceName}`);
        }
        
        if (!service.healthy) {
            console.error(`Serviço indisponível: ${serviceName}`);
            throw new Error(`Serviço indisponível: ${serviceName}`);
        }
        
        console.log(`Serviço encontrado: ${serviceName} - ${service.url}`);
        return service;
    }

    // Listar todos os serviços
    listServices() {
        const services = this.readRegistry();
        const serviceList = {};
        
        Object.entries(services).forEach(([name, service]) => {
            serviceList[name] = {
                url: service.url,
                healthy: service.healthy,
                registeredAt: new Date(service.registeredAt).toISOString(),
                uptime: Date.now() - service.registeredAt,
                pid: service.pid
            };
        });
        
        return serviceList;
    }

    // Remover serviço
    unregister(serviceName) {
        const services = this.readRegistry();
        if (services[serviceName]) {
            delete services[serviceName];
            this.writeRegistry(services);
            console.log(`Serviço removido: ${serviceName}`);
        }
    }

    // Atualizar status de health check
    updateHealthCheck(serviceName, isHealthy) {
        const services = this.readRegistry();
        if (services[serviceName]) {
            services[serviceName].lastHealthCheck = Date.now();
            services[serviceName].healthy = isHealthy;
            this.writeRegistry(services);
            
            if (!isHealthy) {
                console.log(`⚠️  Health check falhou para: ${serviceName}`);
            } else {
                console.log(`✅ Health check OK para: ${serviceName}`);
            }
        }
    }

    // Limpar serviços inativos (útil para cleanup)
    cleanupInactiveServices(timeoutMs = 300000) { // 5 minutos
        const services = this.readRegistry();
        const now = Date.now();
        let cleaned = 0;
        
        Object.entries(services).forEach(([name, service]) => {
            if (now - service.lastHealthCheck > timeoutMs) {
                console.log(`🧹 Limpando serviço inativo: ${name}`);
                delete services[name];
                cleaned++;
            }
        });
        
        if (cleaned > 0) {
            this.writeRegistry(services);
            console.log(`✅ ${cleaned} serviços inativos removidos`);
        }
        
        return cleaned;
    }

    // Obter estatísticas do registry
    getStats() {
        const services = this.readRegistry();
        const now = Date.now();
        
        const stats = {
            totalServices: Object.keys(services).length,
            healthyServices: 0,
            unhealthyServices: 0,
            averageUptime: 0,
            services: {}
        };
        
        let totalUptime = 0;
        
        Object.entries(services).forEach(([name, service]) => {
            const uptime = now - service.registeredAt;
            totalUptime += uptime;
            
            stats.services[name] = {
                healthy: service.healthy,
                uptime: uptime,
                lastHealthCheck: service.lastHealthCheck
            };
            
            if (service.healthy) {
                stats.healthyServices++;
            } else {
                stats.unhealthyServices++;
            }
        });
        
        if (stats.totalServices > 0) {
            stats.averageUptime = totalUptime / stats.totalServices;
        }
        
        return stats;
    }
}

// Criar instância singleton
const serviceRegistry = new FileBasedServiceRegistry();

// Cleanup automático na saída do processo
process.on('SIGINT', () => {
    console.log('\n🛑 Limpando registry na saída...');
    serviceRegistry.cleanupInactiveServices(0); // Limpar todos
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Limpando registry na saída...');
    serviceRegistry.cleanupInactiveServices(0);
    process.exit(0);
});

module.exports = serviceRegistry;

