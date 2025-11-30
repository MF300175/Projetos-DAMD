const grpc = require('@grpc/grpc-js');

/**
 * Interceptador de Autenticação gRPC
 * 
 * Implementa autenticação simples usando apenas Node.js nativo
 * (sem bibliotecas externas de JWT, conforme escopo do professor)
 */
class AuthInterceptor {
    /**
     * Criar token simples (simulação de JWT)
     * Em produção, usar biblioteca JWT real
     */
    static createSimpleToken(userId) {
        // Simulação simples de token usando base64
        const tokenData = {
            userId: userId,
            timestamp: Date.now(),
            expires: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
        };
        
        return Buffer.from(JSON.stringify(tokenData)).toString('base64');
    }

    /**
     * Validar token simples
     */
    static validateSimpleToken(token) {
        try {
            const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
            
            // Verificar se token não expirou
            if (Date.now() > decoded.expires) {
                throw new Error('Token expirado');
            }
            
            return decoded;
        } catch (error) {
            throw new Error('Token inválido');
        }
    }

    /**
     * Interceptador para validação de token em chamadas gRPC
     */
    static validateToken(call, callback, next) {
        const token = call.request.token;
        
        if (!token) {
            const error = new Error('Token de autenticação obrigatório');
            error.code = grpc.status.UNAUTHENTICATED;
            return callback(error);
        }

        try {
            const decoded = this.validateSimpleToken(token);
            call.user = decoded;
            
            if (next) {
                return next(call, callback);
            }
        } catch (error) {
            const grpcError = new Error('Token inválido');
            grpcError.code = grpc.status.UNAUTHENTICATED;
            return callback(grpcError);
        }
    }

    /**
     * Criar interceptador para metadados gRPC
     */
    static createAuthInterceptor() {
        return (options, nextCall) => {
            return new grpc.InterceptingCall(nextCall(options), {
                start: function(metadata, listener, next) {
                    // Interceptar metadados se necessário
                    // Adicionar token aos metadados se disponível
                    next(metadata, listener);
                }
            });
        };
    }
}

module.exports = AuthInterceptor;
