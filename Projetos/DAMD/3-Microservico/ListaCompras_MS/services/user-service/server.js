// services/user-service/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Importar banco NoSQL e service registry
const JsonDatabase = require('../../lista-compras-microservices/shared/JsonDatabase');
const serviceRegistry = require('../../lista-compras-microservices/shared/serviceRegistry');

class UserService {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3001;
        this.serviceName = 'user-service';
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
        this.usersDb = new JsonDatabase(dbPath, 'users');
        console.log('User Service: Banco NoSQL inicializado');
    }

    async seedInitialData() {
        // Aguardar inicialização e criar usuário admin se não existir
        setTimeout(async () => {
            try {
                const existingUsers = await this.usersDb.find();
                
                if (existingUsers.length === 0) {
                    const adminPassword = await bcrypt.hash('admin123', 12);
                    
                    await this.usersDb.create({
                        id: uuidv4(),
                        email: 'admin@listacompras.com',
                        username: 'admin',
                        password: adminPassword,
                        firstName: 'Administrador',
                        lastName: 'Sistema',
                        preferences: {
                            defaultStore: 'Supermercado Central',
                            currency: 'BRL'
                        },
                        role: 'admin',
                        status: 'active'
                    });

                    console.log('Usuário administrador criado (admin@listacompras.com / admin123)');
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
                const userCount = await this.usersDb.count();
                res.json({
                    service: this.serviceName,
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    version: '1.0.0',
                    database: {
                        type: 'JSON-NoSQL',
                        userCount: userCount
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
                service: 'User Service',
                version: '1.0.0',
                description: 'Microsserviço para gerenciamento de usuários do sistema de listas de compras',
                database: 'JSON-NoSQL',
                endpoints: [
                    'POST /auth/register',
                    'POST /auth/login', 
                    'POST /auth/validate',
                    'GET /users',
                    'GET /users/:id',
                    'PUT /users/:id',
                    'GET /search'
                ]
            });
        });

        // Auth routes
        this.app.post('/auth/register', this.register.bind(this));
        this.app.post('/auth/login', this.login.bind(this));
        this.app.post('/auth/validate', this.validateToken.bind(this));

        // User routes (protected)
        this.app.get('/users', this.authMiddleware.bind(this), this.getUsers.bind(this));
        this.app.get('/users/:id', this.authMiddleware.bind(this), this.getUser.bind(this));
        this.app.put('/users/:id', this.authMiddleware.bind(this), this.updateUser.bind(this));
        
        // Search route
        this.app.get('/search', this.authMiddleware.bind(this), this.searchUsers.bind(this));
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
            console.error('User Service Error:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do serviço',
                service: this.serviceName
            });
        });
    }

    registerService() {
        // Registrar serviço no registry
        setTimeout(() => {
            serviceRegistry.register(this.serviceName, {
                name: this.serviceName,
                url: this.serviceUrl,
                version: '1.0.0',
                description: 'Microsserviço de gerenciamento de usuários',
                endpoints: ['/auth/*', '/users/*', '/search']
            });
            console.log(`✅ ${this.serviceName} registrado no Service Registry`);
        }, 2000);
    }

    // Auth middleware
    authMiddleware(req, res, next) {
        const authHeader = req.header('Authorization');
        
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token obrigatório'
            });
        }

        const token = authHeader.replace('Bearer ', '');
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'user-service-secret-key-puc-minas');
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
    }

    // Register user
    async register(req, res) {
        try {
            const { email, username, password, firstName, lastName, preferences } = req.body;

            // Validações obrigatórias
            if (!email || !username || !password || !firstName || !lastName) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos os campos obrigatórios devem ser fornecidos'
                });
            }

            // Verificar se email já existe
            const existingEmail = await this.usersDb.findOne({ email: email.toLowerCase() });
            if (existingEmail) {
                return res.status(409).json({
                    success: false,
                    message: 'Email já está em uso'
                });
            }

            // Verificar se username já existe
            const existingUsername = await this.usersDb.findOne({ username: username.toLowerCase() });
            if (existingUsername) {
                return res.status(409).json({
                    success: false,
                    message: 'Username já está em uso'
                });
            }

            // Hash da senha
            const hashedPassword = await bcrypt.hash(password, 12);

            // Criar usuário
            const user = await this.usersDb.create({
                id: uuidv4(),
                email: email.toLowerCase(),
                username: username.toLowerCase(),
                password: hashedPassword,
                firstName,
                lastName,
                preferences: preferences || {
                    defaultStore: '',
                    currency: 'BRL'
                },
                role: 'user',
                status: 'active'
            });

            const { password: _, ...userWithoutPassword } = user;

            res.status(201).json({
                success: true,
                message: 'Usuário registrado com sucesso',
                data: userWithoutPassword
            });
        } catch (error) {
            console.error('Erro no registro:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Login user
    async login(req, res) {
        try {
            const { identifier, password } = req.body;

            if (!identifier || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Identificador e senha obrigatórios'
                });
            }

            const user = await this.usersDb.findOne({
                $or: [
                    { email: identifier.toLowerCase() },
                    { username: identifier.toLowerCase() }
                ]
            });

            if (!user || !await bcrypt.compare(password, user.password)) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciais inválidas'
                });
            }

            // Verificar se usuário está ativo
            if (user.status !== 'active') {
                return res.status(403).json({
                    success: false,
                    message: 'Conta desativada'
                });
            }

            // Atualizar dados de login
            await this.usersDb.update(user.id, {
                'metadata.lastLogin': new Date().toISOString(),
                'metadata.loginCount': (user.metadata?.loginCount || 0) + 1
            });

            const { password: _, ...userWithoutPassword } = user;
            
            const token = jwt.sign(
                { 
                    id: user.id, 
                    email: user.email, 
                    username: user.username,
                    role: user.role 
                },
                process.env.JWT_SECRET || 'user-service-secret-key-puc-minas',
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                message: 'Login realizado com sucesso',
                data: { user: userWithoutPassword, token }
            });
        } catch (error) {
            console.error('Erro no login:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Validate token
    async validateToken(req, res) {
        try {
            const { token } = req.body;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token obrigatório'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'user-service-secret-key-puc-minas');
            
            // Buscar usuário atualizado
            const user = await this.usersDb.findById(decoded.id);
            if (!user || user.status !== 'active') {
                return res.status(401).json({
                    success: false,
                    message: 'Usuário não encontrado ou inativo'
                });
            }

            const { password: _, ...userWithoutPassword } = user;

            res.json({
                success: true,
                message: 'Token válido',
                data: userWithoutPassword
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
    }

    // Get users (admin only)
    async getUsers(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            const users = await this.usersDb.find();
            const usersWithoutPasswords = users.map(user => {
                const { password: _, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });

            res.json({
                success: true,
                data: usersWithoutPasswords
            });
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Get user by ID
    async getUser(req, res) {
        try {
            const { id } = req.params;
            
            // Usuários só podem ver seus próprios dados (exceto admin)
            if (req.user.id !== id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            const user = await this.usersDb.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuário não encontrado'
                });
            }

            const { password: _, ...userWithoutPassword } = user;

            res.json({
                success: true,
                data: userWithoutPassword
            });
        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Update user
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            // Usuários só podem atualizar seus próprios dados (exceto admin)
            if (req.user.id !== id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            // Verificar se usuário existe
            const existingUser = await this.usersDb.findById(id);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuário não encontrado'
                });
            }

            // Não permitir atualização de senha por esta rota
            if (updateData.password) {
                delete updateData.password;
            }

            // Não permitir mudança de role (exceto admin)
            if (updateData.role && req.user.role !== 'admin') {
                delete updateData.role;
            }

            const updatedUser = await this.usersDb.update(id, updateData);
            const { password: _, ...userWithoutPassword } = updatedUser;

            res.json({
                success: true,
                message: 'Usuário atualizado com sucesso',
                data: userWithoutPassword
            });
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Search users
    async searchUsers(req, res) {
        try {
            const { q } = req.query;
            
            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetro de busca obrigatório'
                });
            }

            const users = await this.usersDb.search(q, ['firstName', 'lastName', 'email', 'username']);
            const usersWithoutPasswords = users.map(user => {
                const { password: _, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });

            res.json({
                success: true,
                data: usersWithoutPasswords
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
            console.log(`🚀 User Service rodando na porta ${this.port}`);
            console.log(`📊 Health check: http://localhost:${this.port}/health`);
            console.log(`📋 Documentação: http://localhost:${this.port}/`);
        });
    }
}

// Inicializar serviço
const userService = new UserService();
userService.start();

module.exports = UserService;

