// api-gateway/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios');
const path = require('path');

// Importar service registry
const serviceRegistry = require('../lista-compras-microservices/shared/serviceRegistry');

class APIGateway {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        
        // Circuit breaker simples
        this.circuitBreakers = new Map();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
        setTimeout(() => {
            this.startHealthChecks();
        }, 3000); // Aguardar 3 segundos antes de iniciar health checks
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Gateway headers
        this.app.use((req, res, next) => {
            res.setHeader('X-Gateway', 'api-gateway');
            res.setHeader('X-Gateway-Version', '1.0.0');
            res.setHeader('X-Architecture', 'Microservices-NoSQL');
            next();
        });

    }

    setupRoutes() {
        // Health check
        this.app.get('/health', this.getHealth.bind(this));
        
        // Registry info
        this.app.get('/registry', this.getRegistry.bind(this));

        // Service info
        this.app.get('/', (req, res) => {
            res.json({
                service: 'API Gateway',
                version: '1.0.0',
                description: 'Gateway para Sistema de Listas de Compras - PUC Minas',
                architecture: 'Microservices with NoSQL',
                endpoints: [
                    'GET /health - Status de todos os serviços',
                    'GET /registry - Lista de serviços registrados',
                    'GET /api/dashboard - Dashboard agregado',
                    'GET /api/search - Busca global',
                    '/api/auth/* → User Service',
                    '/api/users/* → User Service',
                    '/api/items/* → Item Service',
                    '/api/lists/* → List Service'
                ]
            });
        });

        // Dashboard agregado
        this.app.get('/api/dashboard', this.getDashboard.bind(this));
        
        // Busca global
        this.app.get('/api/search', this.globalSearch.bind(this));

        // Auth routes → User Service
        this.app.use('/api/auth', this.proxyToService.bind(this, 'user-service'));
        
        // User routes → User Service
        this.app.use('/api/users', this.proxyToService.bind(this, 'user-service'));
        
        // Item routes → Item Service
        this.app.use('/api/items', this.proxyToService.bind(this, 'item-service'));
        
        // List routes → List Service
        this.app.use('/api/lists', this.proxyToService.bind(this, 'list-service'));
    }

    setupErrorHandling() {
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Endpoint não encontrado',
                service: 'api-gateway',
                availableEndpoints: [
                    '/health',
                    '/registry',
                    '/api/dashboard',
                    '/api/search',
                    '/api/auth/*',
                    '/api/users/*',
                    '/api/items/*',
                    '/api/lists/*'
                ]
            });
        });

        this.app.use((error, req, res, next) => {
            console.error('API Gateway Error:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do gateway',
                service: 'api-gateway'
            });
        });
    }

    // Health check de todos os serviços
    async getHealth(req, res) {
        try {
            const services = serviceRegistry.listServices();
            const healthChecks = {};
            let allHealthy = true;

            // Verificar saúde de cada serviço
            for (const [serviceName, serviceInfo] of Object.entries(services)) {
                try {
                    const response = await axios.get(`${serviceInfo.url}/health`, { timeout: 5000 });
                    healthChecks[serviceName] = {
                        status: 'healthy',
                        response: response.data,
                        url: serviceInfo.url
                    };
                } catch (error) {
                    healthChecks[serviceName] = {
                        status: 'unhealthy',
                        error: error.message,
                        url: serviceInfo.url
                    };
                    allHealthy = false;
                }
            }

            res.json({
                service: 'api-gateway',
                status: allHealthy ? 'healthy' : 'degraded',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: '1.0.0',
                services: healthChecks,
                totalServices: Object.keys(services).length,
                healthyServices: Object.values(healthChecks).filter(h => h.status === 'healthy').length
            });
        } catch (error) {
            console.error('Erro no health check:', error);
            res.status(503).json({
                service: 'api-gateway',
                status: 'unhealthy',
                error: error.message
            });
        }
    }

    // Registry info
    getRegistry(req, res) {
        try {
            const services = serviceRegistry.listServices();
            const stats = serviceRegistry.getStats();
            
            res.json({
                success: true,
                service: 'api-gateway',
                registry: services,
                stats: stats,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Erro ao obter registry:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter informações do registry',
                service: 'api-gateway'
            });
        }
    }

    // Dashboard agregado
    async getDashboard(req, res) {
        try {
            const authHeader = req.header('Authorization');
            if (!authHeader?.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    message: 'Token obrigatório para dashboard'
                });
            }

            // Obter dados de todos os serviços
            const [userService, itemService, listService] = await Promise.allSettled([
                this.getServiceData('user-service', '/users', authHeader),
                this.getServiceData('item-service', '/items?limit=5'),
                this.getServiceData('list-service', '/lists', authHeader)
            ]);

            const dashboard = {
                user: userService.status === 'fulfilled' ? userService.value : null,
                recentItems: itemService.status === 'fulfilled' ? itemService.value : null,
                userLists: listService.status === 'fulfilled' ? listService.value : null,
                timestamp: new Date().toISOString()
            };

            res.json({
                success: true,
                data: dashboard,
                service: 'api-gateway'
            });
        } catch (error) {
            console.error('Erro no dashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter dashboard',
                service: 'api-gateway'
            });
        }
    }

    // Busca global
    async globalSearch(req, res) {
        try {
            const { q } = req.query;
            
            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetro de busca obrigatório'
                });
            }

            // Buscar em todos os serviços
            const [items, users] = await Promise.allSettled([
                this.getServiceData('item-service', `/search?q=${encodeURIComponent(q)}`),
                this.getServiceData('user-service', `/search?q=${encodeURIComponent(q)}`, req.header('Authorization'))
            ]);

            const results = {
                items: items.status === 'fulfilled' ? items.value : [],
                users: users.status === 'fulfilled' ? users.value : [],
                query: q,
                timestamp: new Date().toISOString()
            };

            res.json({
                success: true,
                data: results,
                service: 'api-gateway'
            });
        } catch (error) {
            console.error('Erro na busca global:', error);
            res.status(500).json({
                success: false,
                message: 'Erro na busca global',
                service: 'api-gateway'
            });
        }
    }

    // Helper: Obter dados de um serviço
    async getServiceData(serviceName, endpoint, authHeader = null) {
        try {
            const service = serviceRegistry.discover(serviceName);
            const config = {
                method: 'GET',
                url: `${service.url}${endpoint}`,
                timeout: 5000
            };

            if (authHeader) {
                config.headers = { Authorization: authHeader };
            }

            const response = await axios(config);
            return response.data.data || response.data;
        } catch (error) {
            console.error(`Erro ao obter dados do ${serviceName}:`, error.message);
            return null;
        }
    }

    proxyToService(serviceName) {
        return async (req, res, next) => {
            try {
                await this.proxyRequest(serviceName, req, res, next);
            } catch (error) {
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        message: 'Erro interno do gateway',
                        service: 'api-gateway',
                        error: error.message
                    });
                }
            }
        };
    }

    async proxyRequest(serviceName, req, res, next) {
        try {
            if (this.isCircuitOpen(serviceName)) {
                return res.status(503).json({
                    success: false,
                    message: `Serviço ${serviceName} temporariamente indisponível`,
                    service: serviceName
                });
            }

            let service;
            try {
                const discoverPromise = Promise.resolve(serviceRegistry.discover(serviceName));
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout no discover')), 2000)
                );
                service = await Promise.race([discoverPromise, timeoutPromise]);
            } catch (error) {
                const availableServices = serviceRegistry.listServices();
                if (!res.headersSent) {
                    return res.status(503).json({
                        success: false,
                        message: `Serviço ${serviceName} não encontrado`,
                        service: serviceName,
                        availableServices: Object.keys(availableServices)
                    });
                }
                return;
            }
            
            const originalPath = req.originalUrl;
            let targetPath = '';
            
            if (serviceName === 'user-service') {
                targetPath = originalPath.replace('/api/auth', '/auth').replace('/api/users', '/users');
            } else if (serviceName === 'item-service') {
                targetPath = originalPath.replace('/api/items', '/items');
            } else if (serviceName === 'list-service') {
                targetPath = originalPath.replace('/api/lists', '/lists');
            } else {
                targetPath = originalPath;
            }

            const targetUrl = `${service.url}${targetPath}`;
            const config = {
                method: req.method,
                url: targetUrl,
                headers: {
                    ...req.headers,
                    'X-Forwarded-For': req.ip,
                    'X-Forwarded-Proto': req.protocol,
                    'X-Gateway': 'api-gateway'
                },
                timeout: 20000
            };

            if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
                config.data = req.body;
            }

            if (Object.keys(req.query).length > 0) {
                config.params = req.query;
            }

            delete config.headers.host;
            delete config.headers['content-length'];

            const response = await axios(config);
            this.resetCircuitBreaker(serviceName);
            
            if (res.headersSent) {
                return;
            }
            
            res.status(response.status).json(response.data);

        } catch (error) {
            this.recordFailure(serviceName);
            
            if (res.headersSent) {
                return;
            }
            
            if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                res.status(503).json({
                    success: false,
                    message: `Serviço ${serviceName} indisponível`,
                    service: serviceName,
                    error: error.code
                });
            } else if (error.response) {
                res.status(error.response.status).json(error.response.data);
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Erro interno do gateway',
                    service: 'api-gateway',
                    error: error.message
                });
            }
        }
    }

    // Circuit Breaker 
    isCircuitOpen(serviceName) {
        const breaker = this.circuitBreakers.get(serviceName);
        if (!breaker) return false;

        const now = Date.now();
        
        // Verificar se o circuito deve ser meio-aberto
        if (breaker.isOpen && (now - breaker.lastFailure) > 30000) { // 30 segundos
            breaker.isOpen = false;
            breaker.isHalfOpen = true;
            console.log(`Circuit breaker half-open for ${serviceName}`);
            return false;
        }

        return breaker.isOpen;
    }

    recordFailure(serviceName) {
        let breaker = this.circuitBreakers.get(serviceName) || {
            failures: 0,
            isOpen: false,
            isHalfOpen: false,
            lastFailure: null
        };

        breaker.failures++;
        breaker.lastFailure = Date.now();

        // Abrir circuito após 3 falhas
        if (breaker.failures >= 3) {
            breaker.isOpen = true;
            breaker.isHalfOpen = false;
            console.log(`Circuit breaker opened for ${serviceName}`);
        }

        this.circuitBreakers.set(serviceName, breaker);
    }

    resetCircuitBreaker(serviceName) {
        const breaker = this.circuitBreakers.get(serviceName);
        if (breaker) {
            breaker.failures = 0;
            breaker.isOpen = false;
            breaker.isHalfOpen = false;
            console.log(`Circuit breaker reset for ${serviceName}`);
        }
    }

    startHealthChecks() {
        setInterval(async () => {
            try {
                const services = serviceRegistry.listServices();
                
                for (const [serviceName, serviceInfo] of Object.entries(services)) {
                    try {
                        await axios.get(`${serviceInfo.url}/health`, { timeout: 5000 });
                        serviceRegistry.updateHealthCheck(serviceName, true);
                        this.resetCircuitBreaker(serviceName);
                    } catch (error) {
                        serviceRegistry.updateHealthCheck(serviceName, false);
                    }
                }
                
                serviceRegistry.cleanupInactiveServices();
            } catch (error) {
                console.error('Erro nos health checks:', error);
            }
        }, 3000); // Intervalo de 3 segundos para apresentacao mais dinamica
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`API Gateway rodando na porta ${this.port}`);
            console.log(`Health check: http://localhost:${this.port}/health`);
            console.log(`Registry: http://localhost:${this.port}/registry`);
        });
    }
}

// Inicializar gateway
const apiGateway = new APIGateway();
apiGateway.start();

module.exports = APIGateway;

