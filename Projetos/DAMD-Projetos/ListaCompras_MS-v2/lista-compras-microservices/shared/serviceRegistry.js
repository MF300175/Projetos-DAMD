// shared/serviceRegistry.js
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
    }

    discover(serviceName) {
        const services = this.readRegistry();
        const service = services[serviceName];
        
        if (!service) {
            throw new Error(`Serviço não encontrado: ${serviceName}`);
        }
        
        if (!service.healthy) {
            throw new Error(`Serviço indisponível: ${serviceName}`);
        }
        
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

    unregister(serviceName) {
        const services = this.readRegistry();
        if (services[serviceName]) {
            delete services[serviceName];
            this.writeRegistry(services);
        }
    }

    updateHealthCheck(serviceName, isHealthy) {
        const services = this.readRegistry();
        if (services[serviceName]) {
            services[serviceName].lastHealthCheck = Date.now();
            services[serviceName].healthy = isHealthy;
            this.writeRegistry(services);
        }
    }

    cleanupInactiveServices(timeoutMs = 300000) {
        const services = this.readRegistry();
        const now = Date.now();
        let cleaned = 0;
        
        Object.entries(services).forEach(([name, service]) => {
            if (now - service.lastHealthCheck > timeoutMs) {
                delete services[name];
                cleaned++;
            }
        });
        
        if (cleaned > 0) {
            this.writeRegistry(services);
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

process.on('SIGINT', () => {
    serviceRegistry.cleanupInactiveServices(0);
    process.exit(0);
});

process.on('SIGTERM', () => {
    serviceRegistry.cleanupInactiveServices(0);
    process.exit(0);
});

module.exports = serviceRegistry;

