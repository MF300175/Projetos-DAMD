/**
 * =============================================================================
 * MIDDLEWARE DE AUTENTICAÇÃO JWT
 * =============================================================================
 * 
 * Este arquivo implementa o middleware de autenticação JWT para o servidor REST,
 * equivalente ao interceptor de autenticação do gRPC.
 * 
 * FUNCIONALIDADES:
 * - Validação de token JWT
 * - Extração de dados do usuário
 * - Tratamento de erros de autenticação
 * - Compatibilidade com gRPC (mesmo formato de token)
 * 
 * EQUIVALÊNCIA COM gRPC:
 * - gRPC: AuthInterceptor.validateToken()
 * - REST: authenticateToken middleware
 * =============================================================================
 */

const jwt = require('jsonwebtoken');

// Chave secreta para JWT (mesma do gRPC para compatibilidade)
const JWT_SECRET = process.env.JWT_SECRET || 'grpc-comparative-secret-key';

/**
 * Middleware de autenticação JWT
 * Equivalente ao AuthInterceptor.validateToken() do gRPC
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Token obrigatório',
            message: 'Token de autenticação não fornecido'
        });
    }

    try {
        // Verificar e decodificar o token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Adicionar dados do usuário à requisição
        req.user = decoded;
        
        // Log da autenticação (equivalente ao gRPC)
        console.log(`🔐 Usuário autenticado: ${decoded.userId}`);
        
        next();
    } catch (error) {
        console.error('❌ Erro de autenticação:', error.message);
        
        let statusCode = 403;
        let errorMessage = 'Token inválido';
        
        if (error.name === 'TokenExpiredError') {
            statusCode = 401;
            errorMessage = 'Token expirado';
        } else if (error.name === 'JsonWebTokenError') {
            statusCode = 403;
            errorMessage = 'Token malformado';
        }
        
        return res.status(statusCode).json({
            success: false,
            error: errorMessage,
            message: 'Falha na autenticação'
        });
    }
};

/**
 * Middleware opcional de autenticação (não falha se não houver token)
 * Útil para rotas que podem funcionar com ou sem autenticação
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            // Ignora erros de token em autenticação opcional
            console.log('⚠️ Token inválido em autenticação opcional:', error.message);
        }
    }
    
    next();
};

/**
 * Gerar token JWT
 * Equivalente ao AuthInterceptor.createSimpleToken() do gRPC
 */
const generateToken = (userId, email) => {
    const payload = {
        userId: userId,
        email: email,
        timestamp: Date.now()
    };
    
    return jwt.sign(payload, JWT_SECRET, { 
        expiresIn: '24h' // 24 horas (equivalente ao gRPC)
    });
};

/**
 * Verificar se o usuário tem permissão para acessar um recurso
 * Equivalente à validação de propriedade do gRPC
 */
const checkResourceOwnership = (req, res, next) => {
    const resourceUserId = req.params.userId || req.body.userId;
    const authenticatedUserId = req.user.userId;
    
    if (resourceUserId && resourceUserId !== authenticatedUserId) {
        return res.status(403).json({
            success: false,
            error: 'Acesso negado',
            message: 'Você não tem permissão para acessar este recurso'
        });
    }
    
    next();
};

/**
 * Middleware para validar dados de entrada
 * Equivalente à validação de dados do gRPC
 */
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Dados inválidos',
                message: error.details[0].message,
                details: error.details
            });
        }
        
        next();
    };
};

module.exports = {
    authenticateToken,
    optionalAuth,
    generateToken,
    checkResourceOwnership,
    validateRequest,
    JWT_SECRET
};
