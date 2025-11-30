/**
 * =============================================================================
 * MIDDLEWARE DE TRATAMENTO DE ERROS
 * =============================================================================
 * 
 * Este arquivo implementa o middleware de tratamento de erros para o servidor REST,
 * equivalente ao error handling do gRPC.
 * 
 * FUNCIONALIDADES:
 * - Captura e tratamento de erros
 * - Mapeamento de códigos de erro
 * - Logs estruturados
 * - Respostas padronizadas
 * 
 * EQUIVALÊNCIA COM gRPC:
 * - gRPC: TaskServiceImpl.wrapWithErrorHandling()
 * - REST: errorHandler middleware
 * =============================================================================
 */

/**
 * Middleware principal de tratamento de erros
 * Equivalente ao wrapWithErrorHandling() do gRPC
 */
const errorHandler = (err, req, res, next) => {
    console.error('❌ Erro capturado:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Determinar código de status HTTP baseado no tipo de erro
    let statusCode = 500;
    let errorMessage = 'Erro interno do servidor';
    let errorCode = 'INTERNAL_ERROR';

    // Mapear tipos de erro para códigos HTTP (equivalente ao gRPC)
    if (err.name === 'ValidationError') {
        statusCode = 400;
        errorMessage = 'Dados inválidos';
        errorCode = 'INVALID_ARGUMENT';
    } else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        errorMessage = 'Não autorizado';
        errorCode = 'UNAUTHENTICATED';
    } else if (err.name === 'ForbiddenError') {
        statusCode = 403;
        errorMessage = 'Acesso negado';
        errorCode = 'PERMISSION_DENIED';
    } else if (err.name === 'NotFoundError') {
        statusCode = 404;
        errorMessage = 'Recurso não encontrado';
        errorCode = 'NOT_FOUND';
    } else if (err.name === 'ConflictError') {
        statusCode = 409;
        errorMessage = 'Conflito de recursos';
        errorCode = 'ALREADY_EXISTS';
    } else if (err.name === 'RateLimitError') {
        statusCode = 429;
        errorMessage = 'Muitas requisições';
        errorCode = 'RESOURCE_EXHAUSTED';
    } else if (err.message.includes('não encontrado')) {
        statusCode = 404;
        errorMessage = err.message;
        errorCode = 'NOT_FOUND';
    } else if (err.message.includes('inválido')) {
        statusCode = 400;
        errorMessage = err.message;
        errorCode = 'INVALID_ARGUMENT';
    } else if (err.message.includes('Token')) {
        statusCode = 401;
        errorMessage = err.message;
        errorCode = 'UNAUTHENTICATED';
    }

    // Resposta padronizada (equivalente ao formato gRPC)
    const errorResponse = {
        success: false,
        error: errorMessage,
        code: errorCode,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    };

    // Adicionar detalhes do erro em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
        errorResponse.details = err;
    }

    res.status(statusCode).json(errorResponse);
};

/**
 * Middleware para capturar erros 404 (rota não encontrada)
 */
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Rota não encontrada: ${req.method} ${req.path}`);
    error.name = 'NotFoundError';
    next(error);
};

/**
 * Wrapper para funções assíncronas (evita try/catch em cada rota)
 * Equivalente ao wrapWithErrorHandling() do gRPC
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Classe de erros customizados (equivalente aos erros gRPC)
 */
class AppError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message) {
        super(message, 400, 'INVALID_ARGUMENT');
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Não autorizado') {
        super(message, 401, 'UNAUTHENTICATED');
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Acesso negado') {
        super(message, 403, 'PERMISSION_DENIED');
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Recurso não encontrado') {
        super(message, 404, 'NOT_FOUND');
    }
}

class ConflictError extends AppError {
    constructor(message = 'Conflito de recursos') {
        super(message, 409, 'ALREADY_EXISTS');
    }
}

class RateLimitError extends AppError {
    constructor(message = 'Muitas requisições') {
        super(message, 429, 'RESOURCE_EXHAUSTED');
    }
}

/**
 * Middleware para logging de requisições com tratamento de erro
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            timestamp: new Date().toISOString()
        };

        if (res.statusCode >= 400) {
            console.error('❌ Requisição com erro:', logData);
        } else {
            console.log('✅ Requisição:', logData);
        }
    });

    next();
};

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    AppError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    requestLogger
};
