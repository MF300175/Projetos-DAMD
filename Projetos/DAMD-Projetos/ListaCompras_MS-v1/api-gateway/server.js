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
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(morgan('combined'));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        // Gateway headers
        this.app.use((req, res, next) => {
            res.setHeader('X-Gateway', 'api-gateway');
            res.setHeader('X-Gateway-Version', '1.0.0');
            res.setHeader('X-Architecture', 'Microservices-NoSQL');
            next();
        });

        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${req.method} ${req.originalUrl} - ${req.ip}`);
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

    // Proxy para serviços
    proxyToService(serviceName) {
        return async (req, res, next) => {
            await this.proxyRequest(serviceName, req, res, next);
        };
    }

    // Proxy request to service
    async proxyRequest(serviceName, req, res, next) {
        try {
            console.log(`🔄 Proxy request: ${req.method} ${req.originalUrl} -> ${serviceName}`);
            
            // Verificar circuit breaker
            if (this.isCircuitOpen(serviceName)) {
                console.log(`⚡ Circuit breaker open for ${serviceName}`);
                return res.status(503).json({
                    success: false,
                    message: `Serviço ${serviceName} temporariamente indisponível`,
                    service: serviceName
                });
            }

            // Descobrir serviço
            let service;
            try {
                service = serviceRegistry.discover(serviceName);
            } catch (error) {
                console.error(`❌ Erro na descoberta do serviço ${serviceName}:`, error.message);
                
                // Debug: listar serviços disponíveis
                const availableServices = serviceRegistry.listServices();
                console.log(`📋 Serviços disponíveis:`, Object.keys(availableServices));
                
                return res.status(503).json({
                    success: false,
                    message: `Serviço ${serviceName} não encontrado`,
                    service: serviceName,
                    availableServices: Object.keys(availableServices)
                });
            }
            
            // Construir URL de destino
            const originalPath = req.originalUrl;
            let targetPath = '';
            
            // Extrair o path correto baseado no serviço
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

            // Configurar requisição
            const config = {
                method: req.method,
                url: targetUrl,
                headers: {
                    ...req.headers,
                    'X-Forwarded-For': req.ip,
                    'X-Forwarded-Proto': req.protocol,
                    'X-Gateway': 'api-gateway'
                },
                timeout: 10000
            };

            // Adicionar body para POST/PUT/PATCH
            if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
                config.data = req.body;
            }

            // Adicionar query parameters
            if (Object.keys(req.query).length > 0) {
                config.params = req.query;
            }

            // Remover headers problemáticos
            delete config.headers.host;
            delete config.headers['content-length'];

            console.log(`📤 Enviando ${req.method} para ${targetUrl}`);

            // Fazer requisição
            const response = await axios(config);
            
            // Resetar circuit breaker em caso de sucesso
            this.resetCircuitBreaker(serviceName);
            
            console.log(`📥 Resposta recebida: ${response.status}`);
            
            // Retornar resposta
            res.status(response.status).json(response.data);

        } catch (error) {
            // Registrar falha
            this.recordFailure(serviceName);
            
            console.error(`❌ Proxy error for ${serviceName}:`, {
                message: error.message,
                code: error.code,
                url: error.config?.url,
                status: error.response?.status
            });
            
            if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                res.status(503).json({
                    success: false,
                    message: `Serviço ${serviceName} indisponível`,
                    service: serviceName,
                    error: error.code
                });
            } else if (error.response) {
                // Encaminhar resposta de erro do serviço
                console.log(`🔄 Encaminhando erro ${error.response.status} do serviço`);
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

    // Health checks automáticos
    startHealthChecks() {
        console.log('🔄 Iniciando health checks automáticos...');
        
        setInterval(async () => {
            try {
                const services = serviceRegistry.listServices();
                
                for (const [serviceName, serviceInfo] of Object.entries(services)) {
                    try {
                        const response = await axios.get(`${serviceInfo.url}/health`, { timeout: 5000 });
                        serviceRegistry.updateHealthCheck(serviceName, true);
                        this.resetCircuitBreaker(serviceName);
                    } catch (error) {
                        serviceRegistry.updateHealthCheck(serviceName, false);
                        console.log(`⚠️  Health check falhou para ${serviceName}: ${error.message}`);
                    }
                }
                
                // Cleanup de serviços inativos
                serviceRegistry.cleanupInactiveServices();
                
            } catch (error) {
                console.error('Erro nos health checks:', error);
            }
        }, 30000); // A cada 30 segundos
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`🚀 API Gateway rodando na porta ${this.port}`);
            console.log(`📊 Health check: http://localhost:${this.port}/health`);
            console.log(`📋 Registry: http://localhost:${this.port}/registry`);
            console.log(`📋 Documentação: http://localhost:${this.port}/`);
        });
    }
}

// Inicializar gateway
const apiGateway = new APIGateway();
apiGateway.start();

module.exports = APIGateway;

