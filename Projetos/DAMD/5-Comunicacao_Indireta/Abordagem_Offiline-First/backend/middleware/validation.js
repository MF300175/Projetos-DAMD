/**
 * Validação de dados de entrada
 */

/**
 * Valida dados de uma tarefa
 * @param {Object} taskData - Dados da tarefa
 * @returns {Object} { valid: boolean, errors: Array }
 */
function validateTask(taskData) {
  const errors = [];

  // Validar campos obrigatórios
  if (!taskData.title || taskData.title.trim() === '') {
    errors.push('title é obrigatório');
  }

  if (!taskData.client_id || taskData.client_id.trim() === '') {
    errors.push('client_id é obrigatório');
  }

  // Validar tipos
  if (taskData.completed !== undefined && typeof taskData.completed !== 'boolean') {
    errors.push('completed deve ser boolean');
  }

  if (taskData.priority && !['low', 'medium', 'high'].includes(taskData.priority)) {
    errors.push('priority deve ser: low, medium ou high');
  }

  // Validar timestamps
  if (taskData.updated_at !== undefined) {
    if (typeof taskData.updated_at !== 'number' || taskData.updated_at < 0) {
      errors.push('updated_at deve ser um Unix timestamp válido');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Middleware de validação para POST /api/tasks
 */
function validateCreateTask(req, res, next) {
  const validation = validateTask(req.body);

  if (!validation.valid) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Dados inválidos',
      details: validation.errors,
    });
  }

  next();
}

/**
 * Middleware de validação para PUT /api/tasks/:id
 */
function validateUpdateTask(req, res, next) {
  const validation = validateTask(req.body);

  if (!validation.valid) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Dados inválidos',
      details: validation.errors,
    });
  }

  next();
}

module.exports = {
  validateTask,
  validateCreateTask,
  validateUpdateTask,
};

