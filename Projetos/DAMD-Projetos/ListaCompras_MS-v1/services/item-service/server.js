// services/item-service/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Importar banco NoSQL e service registry
const JsonDatabase = require('../../lista-compras-microservices/shared/JsonDatabase');
const serviceRegistry = require('../../lista-compras-microservices/shared/serviceRegistry');

class ItemService {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3003;
        this.serviceName = 'item-service';
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
        this.itemsDb = new JsonDatabase(dbPath, 'items');
        this.categoriesDb = new JsonDatabase(dbPath, 'categories');
        console.log('Item Service: Banco NoSQL inicializado');
    }

    async seedInitialData() {
        setTimeout(async () => {
            try {
                const existingItems = await this.itemsDb.find();
                
                if (existingItems.length === 0) {
                    // Criar categorias
                    const categories = [
                        { id: uuidv4(), name: 'Alimentos', description: 'Produtos alimentícios em geral' },
                        { id: uuidv4(), name: 'Limpeza', description: 'Produtos de limpeza doméstica' },
                        { id: uuidv4(), name: 'Higiene', description: 'Produtos de higiene pessoal' },
                        { id: uuidv4(), name: 'Bebidas', description: 'Bebidas e líquidos' },
                        { id: uuidv4(), name: 'Padaria', description: 'Produtos de padaria e confeitaria' }
                    ];

                    for (const category of categories) {
                        await this.categoriesDb.create(category);
                    }

                    // Criar itens de exemplo
                    const items = [
                        // Alimentos
                        { name: 'Arroz 5kg', category: 'Alimentos', brand: 'Tio João', unit: 'un', averagePrice: 12.50, barcode: '7891234567890', description: 'Arroz tipo 1, 5kg' },
                        { name: 'Feijão 1kg', category: 'Alimentos', brand: 'Camil', unit: 'un', averagePrice: 8.90, barcode: '7891234567891', description: 'Feijão carioca, 1kg' },
                        { name: 'Macarrão 500g', category: 'Alimentos', brand: 'Barilla', unit: 'un', averagePrice: 4.20, barcode: '7891234567892', description: 'Macarrão espaguete, 500g' },
                        { name: 'Óleo de Soja 900ml', category: 'Alimentos', brand: 'Liza', unit: 'un', averagePrice: 6.80, barcode: '7891234567893', description: 'Óleo de soja refinado, 900ml' },
                        { name: 'Açúcar 1kg', category: 'Alimentos', brand: 'União', unit: 'un', averagePrice: 3.50, barcode: '7891234567894', description: 'Açúcar cristal, 1kg' },

                        // Limpeza
                        { name: 'Detergente 500ml', category: 'Limpeza', brand: 'Ypê', unit: 'un', averagePrice: 2.80, barcode: '7891234567895', description: 'Detergente neutro, 500ml' },
                        { name: 'Sabão em Pó 1kg', category: 'Limpeza', brand: 'Omo', unit: 'un', averagePrice: 12.90, barcode: '7891234567896', description: 'Sabão em pó multiação, 1kg' },
                        { name: 'Amaciante 2L', category: 'Limpeza', brand: 'Comfort', unit: 'un', averagePrice: 8.50, barcode: '7891234567897', description: 'Amaciante concentrado, 2L' },
                        { name: 'Desinfetante 1L', category: 'Limpeza', brand: 'Pinho Sol', unit: 'un', averagePrice: 5.90, barcode: '7891234567898', description: 'Desinfetante pinho, 1L' },
                        { name: 'Papel Higiênico 4 rolos', category: 'Limpeza', brand: 'Neve', unit: 'un', averagePrice: 7.20, barcode: '7891234567899', description: 'Papel higiênico macio, 4 rolos' },

                        // Higiene
                        { name: 'Shampoo 400ml', category: 'Higiene', brand: 'Pantene', unit: 'un', averagePrice: 15.90, barcode: '7891234567900', description: 'Shampoo para cabelos normais, 400ml' },
                        { name: 'Sabonete', category: 'Higiene', brand: 'Dove', unit: 'un', averagePrice: 3.50, barcode: '7891234567901', description: 'Sabonete hidratante, 90g' },
                        { name: 'Creme Dental 90g', category: 'Higiene', brand: 'Colgate', unit: 'un', averagePrice: 4.80, barcode: '7891234567902', description: 'Creme dental total 12, 90g' },
                        { name: 'Desodorante Aerosol', category: 'Higiene', brand: 'Rexona', unit: 'un', averagePrice: 8.90, barcode: '7891234567903', description: 'Desodorante antitranspirante, 150ml' },
                        { name: 'Escova de Dentes', category: 'Higiene', brand: 'Oral-B', unit: 'un', averagePrice: 6.50, barcode: '7891234567904', description: 'Escova de dentes macia' },

                        // Bebidas
                        { name: 'Refrigerante 2L', category: 'Bebidas', brand: 'Coca-Cola', unit: 'un', averagePrice: 6.90, barcode: '7891234567905', description: 'Refrigerante cola, 2L' },
                        { name: 'Suco de Laranja 1L', category: 'Bebidas', brand: 'Del Valle', unit: 'un', averagePrice: 4.50, barcode: '7891234567906', description: 'Suco de laranja natural, 1L' },
                        { name: 'Água Mineral 500ml', category: 'Bebidas', brand: 'Crystal', unit: 'un', averagePrice: 2.20, barcode: '7891234567907', description: 'Água mineral sem gás, 500ml' },
                        { name: 'Café Solúvel 200g', category: 'Bebidas', brand: 'Nescafé', unit: 'un', averagePrice: 12.80, barcode: '7891234567908', description: 'Café solúvel clássico, 200g' },
                        { name: 'Leite 1L', category: 'Bebidas', brand: 'Parmalat', unit: 'un', averagePrice: 4.90, barcode: '7891234567909', description: 'Leite UHT integral, 1L' },

                        // Padaria
                        { name: 'Pão Francês', category: 'Padaria', brand: 'Padaria Local', unit: 'kg', averagePrice: 8.90, barcode: '7891234567910', description: 'Pão francês fresco' },
                        { name: 'Bolo de Chocolate', category: 'Padaria', brand: 'Padaria Local', unit: 'un', averagePrice: 18.50, barcode: '7891234567911', description: 'Bolo de chocolate caseiro' },
                        { name: 'Biscoito Recheado', category: 'Padaria', brand: 'Bauducco', unit: 'un', averagePrice: 3.20, barcode: '7891234567912', description: 'Biscoito recheado de chocolate' },
                        { name: 'Torrada', category: 'Padaria', brand: 'Wickbold', unit: 'un', averagePrice: 4.80, barcode: '7891234567913', description: 'Torrada integral, 400g' },
                        { name: 'Rosquinha', category: 'Padaria', brand: 'Padaria Local', unit: 'un', averagePrice: 1.50, barcode: '7891234567914', description: 'Rosquinha açucarada' }
                    ];

                    for (const item of items) {
                        await this.itemsDb.create({
                            id: uuidv4(),
                            ...item,
                            active: true
                        });
                    }

                    console.log('✅ Catálogo inicial criado com 25 itens em 5 categorias');
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
                const itemCount = await this.itemsDb.count();
                const categoryCount = await this.categoriesDb.count();
                res.json({
                    service: this.serviceName,
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    version: '1.0.0',
                    database: {
                        type: 'JSON-NoSQL',
                        itemCount: itemCount,
                        categoryCount: categoryCount
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
                service: 'Item Service',
                version: '1.0.0',
                description: 'Microsserviço para catálogo de itens/produtos do sistema de listas de compras',
                database: 'JSON-NoSQL',
                endpoints: [
                    'GET /items',
                    'GET /items/:id',
                    'POST /items',
                    'PUT /items/:id',
                    'GET /categories',
                    'GET /search'
                ]
            });
        });

        // Items routes
        this.app.get('/items', this.getItems.bind(this));
        this.app.get('/items/:id', this.getItem.bind(this));
        this.app.post('/items', this.createItem.bind(this));
        this.app.put('/items/:id', this.updateItem.bind(this));
        
        // Categories route
        this.app.get('/categories', this.getCategories.bind(this));
        
        // Search route
        this.app.get('/search', this.searchItems.bind(this));
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
            console.error('Item Service Error:', error);
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
                description: 'Microsserviço de catálogo de itens/produtos',
                endpoints: ['/items/*', '/categories', '/search']
            });
            console.log(`✅ ${this.serviceName} registrado no Service Registry`);
        }, 2000);
    }

    // Get items with filters
    async getItems(req, res) {
        try {
            const { category, limit = 50, offset = 0, active } = req.query;
            
            let query = {};
            
            if (category) {
                query.category = category;
            }
            
            if (active !== undefined) {
                query.active = active === 'true';
            }

            const items = await this.itemsDb.find(query);
            
            // Aplicar paginação
            const startIndex = parseInt(offset);
            const endIndex = startIndex + parseInt(limit);
            const paginatedItems = items.slice(startIndex, endIndex);

            res.json({
                success: true,
                data: paginatedItems,
                pagination: {
                    total: items.length,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: endIndex < items.length
                }
            });
        } catch (error) {
            console.error('Erro ao buscar itens:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Get item by ID
    async getItem(req, res) {
        try {
            const { id } = req.params;
            const item = await this.itemsDb.findById(id);
            
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Item não encontrado'
                });
            }

            res.json({
                success: true,
                data: item
            });
        } catch (error) {
            console.error('Erro ao buscar item:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Create item (admin only - for demo purposes, we'll allow it without auth)
    async createItem(req, res) {
        try {
            const { name, category, brand, unit, averagePrice, barcode, description } = req.body;

            if (!name || !category || !unit || averagePrice === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Campos obrigatórios: name, category, unit, averagePrice'
                });
            }

            // Verificar se já existe item com mesmo nome
            const existingItem = await this.itemsDb.findOne({ name: name.toLowerCase() });
            if (existingItem) {
                return res.status(409).json({
                    success: false,
                    message: 'Item com este nome já existe'
                });
            }

            const item = await this.itemsDb.create({
                id: uuidv4(),
                name: name.toLowerCase(),
                category: category.toLowerCase(),
                brand: brand || '',
                unit: unit.toLowerCase(),
                averagePrice: parseFloat(averagePrice),
                barcode: barcode || '',
                description: description || '',
                active: true
            });

            res.status(201).json({
                success: true,
                message: 'Item criado com sucesso',
                data: item
            });
        } catch (error) {
            console.error('Erro ao criar item:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Update item
    async updateItem(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const existingItem = await this.itemsDb.findById(id);
            if (!existingItem) {
                return res.status(404).json({
                    success: false,
                    message: 'Item não encontrado'
                });
            }

            // Não permitir atualização de ID
            if (updateData.id) {
                delete updateData.id;
            }

            const updatedItem = await this.itemsDb.update(id, updateData);

            res.json({
                success: true,
                message: 'Item atualizado com sucesso',
                data: updatedItem
            });
        } catch (error) {
            console.error('Erro ao atualizar item:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Get categories
    async getCategories(req, res) {
        try {
            const categories = await this.categoriesDb.find();
            
            res.json({
                success: true,
                data: categories
            });
        } catch (error) {
            console.error('Erro ao buscar categorias:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Search items
    async searchItems(req, res) {
        try {
            const { q, category, limit = 20 } = req.query;
            
            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetro de busca obrigatório'
                });
            }

            let query = {};
            if (category) {
                query.category = category.toLowerCase();
            }

            // Buscar itens ativos
            query.active = true;

            const items = await this.itemsDb.search(q, ['name', 'description', 'brand']);
            const filteredItems = items.filter(item => {
                if (category && item.category !== category.toLowerCase()) {
                    return false;
                }
                return item.active === true;
            });

            const limitedItems = filteredItems.slice(0, parseInt(limit));

            res.json({
                success: true,
                data: limitedItems,
                pagination: {
                    total: filteredItems.length,
                    limit: parseInt(limit),
                    returned: limitedItems.length
                }
            });
        } catch (error) {
            console.error('Erro na busca:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`🚀 Item Service rodando na porta ${this.port}`);
            console.log(`📊 Health check: http://localhost:${this.port}/health`);
            console.log(`📋 Documentação: http://localhost:${this.port}/`);
        });
    }
}

// Inicializar serviço
const itemService = new ItemService();
itemService.start();

module.exports = ItemService;

