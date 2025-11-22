const amqp = require('amqplib');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const JsonDatabase = require('../../lista-compras-microservices/shared/JsonDatabase');
const serviceRegistry = require('../../lista-compras-microservices/shared/serviceRegistry');

class ListService {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3002;
        this.serviceName = 'list-service';
        this.serviceUrl = `http://localhost:${this.port}`;
        
        this.setupDatabase();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
        this.registerService();
        this.seedInitialData();
    }

    setupDatabase() {
        const dbPath = path.join(__dirname, 'database');
        this.listsDb = new JsonDatabase(dbPath, 'lists');
        console.log('List Service: Banco NoSQL inicializado');
    }

    async seedInitialData() {
        // Aguardar inicialização e criar listas de exemplo se não existirem
        setTimeout(async () => {
            try {
                const existingLists = await this.listsDb.find();
                
                if (existingLists.length === 0) {
                    const sampleLists = [
                        {
                            id: uuidv4(),
                            userId: 'demo-user-id',
                            name: 'Lista de Compras Semanal',
                            description: 'Compras para a semana de 15/01 a 21/01',
                            status: 'active',
                            items: [],
                            summary: {
                                totalItems: 0,
                                purchasedItems: 0,
                                estimatedTotal: 0
                            },
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        },
                        {
                            id: uuidv4(),
                            userId: 'demo-user-id',
                            name: 'Lista de Limpeza',
                            description: 'Produtos de limpeza para o mês',
                            status: 'active',
                            items: [],
                            summary: {
                                totalItems: 0,
                                purchasedItems: 0,
                                estimatedTotal: 0
                            },
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        },
                        {
                            id: uuidv4(),
                            userId: 'demo-user-id',
                            name: 'Lista Concluída',
                            description: 'Compras do final de semana passado',
                            status: 'completed',
                            items: [],
                            summary: {
                                totalItems: 0,
                                purchasedItems: 0,
                                estimatedTotal: 0
                            },
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        }
                    ];

                    for (const list of sampleLists) {
                        await this.listsDb.create(list);
                    }
                    
                    console.log('Listas de exemplo criadas para demonstração');
                }
            } catch (error) {
                console.error('Erro ao criar dados iniciais:', error);
            }
        }, 1000);
    }

    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(morgan('combined'));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        // Service info headers
        this.app.use((req, res, next) => {
            res.setHeader('X-Service', this.serviceName);
            res.setHeader('X-Service-Version', '1.0.0');
            res.setHeader('X-Database', 'JSON-NoSQL');
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', async (req, res) => {
            try {
                const listCount = await this.listsDb.count();
                res.json({
                    service: this.serviceName,
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    version: '1.0.0',
                    database: {
                        type: 'JSON-NoSQL',
                        listCount: listCount
                    }
                });
            } catch (error) {
                res.status(503).json({
                    service: this.serviceName,
                    status: 'unhealthy',
                    error: error.message
                });
            }
        });

        // Service info
        this.app.get('/', (req, res) => {
            res.json({
                service: 'List Service',
                version: '1.0.0',
                description: 'Microsserviço para gerenciamento de listas de compras',
                database: 'JSON-NoSQL',
                endpoints: [
                    'POST /lists',
                    'GET /lists',
                    'GET /lists/:id',
                    'PUT /lists/:id',
                    'DELETE /lists/:id',
                    'POST /lists/:id/items',
                    'PUT /lists/:id/items/:itemId',
                    'DELETE /lists/:id/items/:itemId',
                    'GET /lists/:id/summary',
                    'POST /lists/:id/checkout'
                ]
            });
        });

        // Lists routes (all protected)
        this.app.post('/lists', this.authMiddleware.bind(this), this.createList.bind(this));
        this.app.get('/lists', this.authMiddleware.bind(this), this.getLists.bind(this));
        this.app.get('/lists/:id', this.authMiddleware.bind(this), this.getList.bind(this));
        this.app.put('/lists/:id', this.authMiddleware.bind(this), this.updateList.bind(this));
        this.app.delete('/lists/:id', this.authMiddleware.bind(this), this.deleteList.bind(this));
        
        // Items in lists routes
        this.app.post('/lists/:id/items', this.authMiddleware.bind(this), this.addItemToList.bind(this));
        this.app.put('/lists/:id/items/:itemId', this.authMiddleware.bind(this), this.updateItemInList.bind(this));
        this.app.delete('/lists/:id/items/:itemId', this.authMiddleware.bind(this), this.removeItemFromList.bind(this));
        
        // Summary route
        this.app.get('/lists/:id/summary', this.authMiddleware.bind(this), this.getListSummary.bind(this));
        
        // Checkout route
        this.app.post('/lists/:id/checkout', this.authMiddleware.bind(this), this.checkoutList.bind(this));
    }

    setupErrorHandling() {
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Endpoint não encontrado',
                service: this.serviceName
            });
        });

        this.app.use((error, req, res, next) => {
            console.error('List Service Error:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do serviço',
                service: this.serviceName
            });
        });
    }

    registerService() {
        setTimeout(() => {
            serviceRegistry.register(this.serviceName, {
                name: this.serviceName,
                url: this.serviceUrl,
                version: '1.0.0',
                description: 'Microsserviço de gerenciamento de listas de compras',
                endpoints: ['/lists/*']
            });
            console.log(`${this.serviceName} registrado no Service Registry`);
        }, 2000);
    }

    // Auth middleware (simplified - in real app, would validate JWT)
    authMiddleware(req, res, next) {
        const authHeader = req.header('Authorization');
        
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token obrigatório'
            });
        }

        try {
            const token = authHeader.replace('Bearer ', '');
            const userInfo = { id: 'demo-user-id', role: 'user' };
            req.user = userInfo;
            next();
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
    }

    async getItemDetails(itemId) {
        try {
            const itemService = serviceRegistry.discover('item-service');
            const response = await axios.get(`${itemService.url}/items/${itemId}`);
            return response.data.data;
        } catch (error) {
            console.error('Erro ao buscar item:', error.message);
            return null;
        }
    }

    calculateSummary(list) {
        const totalItems = list.items.length;
        const purchasedItems = list.items.filter(item => item.purchased).length;
        const estimatedTotal = list.items.reduce((total, item) => {
            return total + (item.estimatedPrice || 0);
        }, 0);

        return {
            totalItems,
            purchasedItems,
            estimatedTotal: parseFloat(estimatedTotal.toFixed(2))
        };
    }

    async createList(req, res) {
        try {
            const { name, description } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Nome da lista é obrigatório'
                });
            }

            const list = await this.listsDb.create({
                id: uuidv4(),
                userId: req.user.id,
                name,
                description: description || '',
                status: 'active',
                items: [],
                summary: {
                    totalItems: 0,
                    purchasedItems: 0,
                    estimatedTotal: 0
                }
            });

            res.status(201).json({
                success: true,
                message: 'Lista criada com sucesso',
                data: list
            });
        } catch (error) {
            console.error('Erro ao criar lista:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Get user's lists
    async getLists(req, res) {
        try {
            const { status } = req.query;
            
            let query = { userId: req.user.id };
            if (status) {
                query.status = status;
            }

            const lists = await this.listsDb.find(query);
            
            // Recalcular summary para cada lista
            const listsWithSummary = lists.map(list => ({
                ...list,
                summary: this.calculateSummary(list)
            }));

            res.json({
                success: true,
                data: listsWithSummary
            });
        } catch (error) {
            console.error('Erro ao buscar listas:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Get specific list
    async getList(req, res) {
        try {
            const { id } = req.params;
            const list = await this.listsDb.findById(id);
            
            if (!list) {
                return res.status(404).json({
                    success: false,
                    message: 'Lista não encontrada'
                });
            }

            // Verificar se usuário pode acessar esta lista
            if (list.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            // Recalcular summary
            list.summary = this.calculateSummary(list);

            res.json({
                success: true,
                data: list
            });
        } catch (error) {
            console.error('Erro ao buscar lista:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Update list
    async updateList(req, res) {
        try {
            const { id } = req.params;
            const { name, description, status } = req.body;

            const list = await this.listsDb.findById(id);
            if (!list) {
                return res.status(404).json({
                    success: false,
                    message: 'Lista não encontrada'
                });
            }

            // Verificar se usuário pode atualizar esta lista
            if (list.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            const updateData = {};
            if (name !== undefined) updateData.name = name;
            if (description !== undefined) updateData.description = description;
            if (status !== undefined) updateData.status = status;

            const updatedList = await this.listsDb.update(id, updateData);

            res.json({
                success: true,
                message: 'Lista atualizada com sucesso',
                data: updatedList
            });
        } catch (error) {
            console.error('Erro ao atualizar lista:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Delete list
    async deleteList(req, res) {
        try {
            const { id } = req.params;
            const list = await this.listsDb.findById(id);
            
            if (!list) {
                return res.status(404).json({
                    success: false,
                    message: 'Lista não encontrada'
                });
            }

            // Verificar se usuário pode deletar esta lista
            if (list.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            await this.listsDb.delete(id);

            res.json({
                success: true,
                message: 'Lista deletada com sucesso'
            });
        } catch (error) {
            console.error('Erro ao deletar lista:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Add item to list
    async addItemToList(req, res) {
        try {
            const { id } = req.params;
            const { itemId, quantity, notes } = req.body;

            if (!itemId || !quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'itemId e quantity são obrigatórios'
                });
            }

            const list = await this.listsDb.findById(id);
            if (!list) {
                return res.status(404).json({
                    success: false,
                    message: 'Lista não encontrada'
                });
            }

            // Verificar se usuário pode modificar esta lista
            if (list.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            // Verificar se item já existe na lista
            const existingItem = list.items.find(item => item.itemId === itemId);
            if (existingItem) {
                return res.status(409).json({
                    success: false,
                    message: 'Item já existe na lista'
                });
            }

            // Buscar detalhes do item
            const itemDetails = await this.getItemDetails(itemId);
            if (!itemDetails) {
                return res.status(404).json({
                    success: false,
                    message: 'Item não encontrado no catálogo'
                });
            }

            const listItem = {
                itemId,
                itemName: itemDetails.name,
                quantity: parseFloat(quantity),
                unit: itemDetails.unit,
                estimatedPrice: itemDetails.averagePrice * parseFloat(quantity),
                purchased: false,
                notes: notes || '',
                addedAt: new Date().toISOString()
            };

            list.items.push(listItem);
            list.summary = this.calculateSummary(list);

            const updatedList = await this.listsDb.update(id, {
                items: list.items,
                summary: list.summary
            });

            res.json({
                success: true,
                message: 'Item adicionado à lista com sucesso',
                data: updatedList
            });
        } catch (error) {
            console.error('Erro ao adicionar item:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Update item in list
    async updateItemInList(req, res) {
        try {
            const { id, itemId } = req.params;
            const { quantity, purchased, notes } = req.body;

            const list = await this.listsDb.findById(id);
            if (!list) {
                return res.status(404).json({
                    success: false,
                    message: 'Lista não encontrada'
                });
            }

            // Verificar se usuário pode modificar esta lista
            if (list.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            const itemIndex = list.items.findIndex(item => item.itemId === itemId);
            if (itemIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Item não encontrado na lista'
                });
            }

            // Atualizar item
            if (quantity !== undefined) {
                list.items[itemIndex].quantity = parseFloat(quantity);
                // Recalcular preço estimado
                const itemDetails = await this.getItemDetails(itemId);
                if (itemDetails) {
                    list.items[itemIndex].estimatedPrice = itemDetails.averagePrice * parseFloat(quantity);
                }
            }
            if (purchased !== undefined) {
                list.items[itemIndex].purchased = purchased;
            }
            if (notes !== undefined) {
                list.items[itemIndex].notes = notes;
            }

            list.summary = this.calculateSummary(list);

            const updatedList = await this.listsDb.update(id, {
                items: list.items,
                summary: list.summary
            });

            res.json({
                success: true,
                message: 'Item atualizado com sucesso',
                data: updatedList
            });
        } catch (error) {
            console.error('Erro ao atualizar item:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Remove item from list
    async removeItemFromList(req, res) {
        try {
            const { id, itemId } = req.params;

            const list = await this.listsDb.findById(id);
            if (!list) {
                return res.status(404).json({
                    success: false,
                    message: 'Lista não encontrada'
                });
            }

            // Verificar se usuário pode modificar esta lista
            if (list.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            const itemIndex = list.items.findIndex(item => item.itemId === itemId);
            if (itemIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Item não encontrado na lista'
                });
            }

            list.items.splice(itemIndex, 1);
            list.summary = this.calculateSummary(list);

            const updatedList = await this.listsDb.update(id, {
                items: list.items,
                summary: list.summary
            });

            res.json({
                success: true,
                message: 'Item removido da lista com sucesso',
                data: updatedList
            });
        } catch (error) {
            console.error('Erro ao remover item:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Get list summary
    async getListSummary(req, res) {
        try {
            const { id } = req.params;
            const list = await this.listsDb.findById(id);
            
            if (!list) {
                return res.status(404).json({
                    success: false,
                    message: 'Lista não encontrada'
                });
            }

            // Verificar se usuário pode acessar esta lista
            if (list.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            const summary = this.calculateSummary(list);

            res.json({
                success: true,
                data: {
                    listId: list.id,
                    listName: list.name,
                    summary: summary,
                    items: list.items.map(item => ({
                        itemName: item.itemName,
                        quantity: item.quantity,
                        unit: item.unit,
                        estimatedPrice: item.estimatedPrice,
                        purchased: item.purchased
                    }))
                }
            });
        } catch (error) {
            console.error('Erro ao obter resumo:', error);
        }
    }

    async checkoutList(req, res) {
        try {
            const { id } = req.params;
            const list = await this.listsDb.findById(id);
            
            if (!list) {
                return res.status(404).json({
                    success: false,
                    message: 'Lista nao encontrada'
                });
            }

            if (list.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            const updatedList = await this.listsDb.update(id, {
                status: 'completed',
                completedAt: new Date().toISOString(),
                summary: this.calculateSummary(list)
            });

            // Publicar mensagem no RabbitMQ
            try {
                const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
                const channel = await connection.createChannel();

                // Garantir que o exchange existe
                await channel.assertExchange('shopping_events', 'topic', { durable: true });

                // Publicar mensagem de checkout completado
                const message = {
                    listId: id,
                    userId: list.userId,
                    total: list.summary?.estimatedTotal || 0,
                    itemCount: list.items?.length || 0,
                    timestamp: new Date().toISOString()
                };

                channel.publish('shopping_events', 'list.checkout.completed', Buffer.from(JSON.stringify(message)));
                await channel.close();
                await connection.close();
            } catch (rabbitError) {
                console.error('Erro ao publicar mensagem no RabbitMQ:', rabbitError);
            }

            res.status(202).json({
                success: true,
                message: 'Checkout iniciado. Processamento em andamento.',
                data: {
                    listId: id,
                    status: 'processing'
                }
            });

        } catch (error) {
            console.error('Erro no checkout:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`List Service rodando na porta ${this.port}`);
            console.log(`Health check: http://localhost:${this.port}/health`);
        });
    }
}

const listService = new ListService();
listService.start();

module.exports = ListService;

