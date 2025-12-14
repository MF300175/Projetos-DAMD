/**
 * Middleware para tratamento centralizado de erros
 */
function errorHandler(err, req, res, next) {
  console.error('Erro (Cloud):', err);

  // Erro de conflito (LWW)
  if (err.message && err.message.includes('CONFLICT')) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Server version is newer than client version',
      data: err.serverData || null,
    });
  }

  // Erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
    });
  }

  // Erro genérico
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
}

module.exports = errorHandler;


