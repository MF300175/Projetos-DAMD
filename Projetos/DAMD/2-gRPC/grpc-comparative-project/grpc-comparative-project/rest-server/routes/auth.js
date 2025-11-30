/**
 * =============================================================================
 * ROTAS DE AUTENTICAÇÃO
 * =============================================================================
 * 
 * Este arquivo implementa as rotas de autenticação para o servidor REST,
 * equivalentes aos métodos de autenticação do gRPC.
 * 
 * ROTAS IMPLEMENTADAS:
 * - POST /api/auth/register - Registro de usuário
 * - POST /api/auth/login - Login de usuário
 * - POST /api/auth/validate - Validação de token
 * 
 * EQUIVALÊNCIA COM gRPC:
 * - gRPC: Login() e ValidateToken()
 * - REST: /api/auth/login e /api/auth/validate
 * =============================================================================
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { generateToken, validateRequest } = require('../middleware/auth');
const { asyncHandler, ValidationError, UnauthorizedError, ConflictError } = require('../middleware/errorHandler');
const Joi = require('joi');

const router = express.Router();

// Simulação de banco de dados em memória (equivalente ao gRPC)
const users = new Map();

// Criar usuário de teste (equivalente ao gRPC)
const createTestUser = () => {
    const testUser = {
        id: 'user1',
        email: 'teste@exemplo.com',
        password: bcrypt.hashSync('123456', 10),
        username: 'testuser',
        firstName: 'Usuário',
        lastName: 'Teste',
        createdAt: new Date().toISOString()
    };
    users.set(testUser.email, testUser);
    console.log('👤 Usuário de teste criado:', testUser.email);
};

// Inicializar usuário de teste
createTestUser();

// Schemas de validação
const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    username: Joi.string().alphanum().min(3).max(30).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const validateSchema = Joi.object({
    token: Joi.string().required()
});

/**
 * POST /api/auth/register
 * Registro de novo usuário
 * Equivalente ao registro implícito no gRPC
 */
router.post('/register', validateRequest(registerSchema), asyncHandler(async (req, res) => {
    const { email, password, username, firstName, lastName } = req.body;

    // Verificar se usuário já existe
    if (users.has(email)) {
        throw new ConflictError('Usuário já existe com este email');
    }

    // Verificar se username já existe
    for (const user of users.values()) {
        if (user.username === username) {
            throw new ConflictError('Username já está em uso');
        }
    }

    // Criar novo usuário
    const userId = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const newUser = {
        id: userId,
        email,
        password: hashedPassword,
        username,
        firstName,
        lastName,
        createdAt: new Date().toISOString()
    };

    users.set(email, newUser);

    // Gerar token JWT
    const token = generateToken(userId, email);

    console.log('✅ Novo usuário registrado:', email);

    res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: {
            user: {
                id: newUser.id,
                email: newUser.email,
                username: newUser.username,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                createdAt: newUser.createdAt
            },
            token
        }
    });
}));

/**
 * POST /api/auth/login
 * Login de usuário existente
 * Equivalente ao método Login() do gRPC
 */
router.post('/login', validateRequest(loginSchema), asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Buscar usuário
    const user = users.get(email);
    if (!user) {
        throw new UnauthorizedError('Credenciais inválidas');
    }

    // Verificar senha
    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
        throw new UnauthorizedError('Credenciais inválidas');
    }

    // Gerar token JWT
    const token = generateToken(user.id, user.email);

    console.log('✅ Login realizado:', email);

    res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                createdAt: user.createdAt
            },
            token
        }
    });
}));

/**
 * POST /api/auth/validate
 * Validação de token JWT
 * Equivalente ao método ValidateToken() do gRPC
 */
router.post('/validate', validateRequest(validateSchema), asyncHandler(async (req, res) => {
    const { token } = req.body;

    try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'grpc-comparative-secret-key';
        
        // Verificar token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Buscar usuário
        const user = Array.from(users.values()).find(u => u.id === decoded.userId);
        if (!user) {
            throw new UnauthorizedError('Usuário não encontrado');
        }

        console.log('✅ Token validado para:', user.email);

        res.json({
            success: true,
            message: 'Token válido',
            data: {
                valid: true,
                userId: user.id,
                email: user.email,
                username: user.username
            }
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new UnauthorizedError('Token expirado');
        } else if (error.name === 'JsonWebTokenError') {
            throw new UnauthorizedError('Token inválido');
        } else {
            throw new UnauthorizedError('Erro na validação do token');
        }
    }
}));

/**
 * GET /api/auth/profile
 * Obter perfil do usuário autenticado
 * Funcionalidade adicional do REST
 */
router.get('/profile', require('../middleware/auth').authenticateToken, asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    
    // Buscar usuário
    const user = Array.from(users.values()).find(u => u.id === userId);
    if (!user) {
        throw new UnauthorizedError('Usuário não encontrado');
    }

    res.json({
        success: true,
        data: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            createdAt: user.createdAt
        }
    });
}));

/**
 * GET /api/auth/stats
 * Estatísticas de autenticação
 * Funcionalidade adicional para comparação
 */
router.get('/stats', asyncHandler(async (req, res) => {
    const totalUsers = users.size;
    const testUser = users.get('teste@exemplo.com');
    
    res.json({
        success: true,
        data: {
            totalUsers,
            hasTestUser: !!testUser,
            testUserEmail: testUser ? testUser.email : null,
            timestamp: new Date().toISOString()
        }
    });
}));

module.exports = router;
