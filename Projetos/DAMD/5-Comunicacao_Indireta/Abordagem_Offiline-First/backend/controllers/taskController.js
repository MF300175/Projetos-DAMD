const Task = require('../models/Task');

/**
 * GET /api/tasks
 * Busca todas as tarefas
 */
async function getAllTasks(req, res, next) {
  try {
    const since = req.query.since ? parseInt(req.query.since) : null;
    const tasks = await Task.findAll(since);
    const formattedTasks = tasks.map(Task.toApiFormat);

    res.json({
      data: formattedTasks,
      count: formattedTasks.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/tasks/sync
 * Endpoint otimizado para sincronização (pull)
 */
async function syncTasks(req, res, next) {
  try {
    const since = req.query.since ? parseInt(req.query.since) : 0;
    const clientId = req.query.client_id || null;

    let tasks;
    if (clientId) {
      // Filtrar por cliente específico (opcional)
      const allTasks = await Task.findUpdatedSince(since);
      tasks = allTasks.filter((t) => t.client_id === clientId);
    } else {
      tasks = await Task.findUpdatedSince(since);
    }

    const formattedTasks = tasks.map(Task.toApiFormat);

    res.json({
      data: formattedTasks,
      count: formattedTasks.length,
      last_sync: Math.floor(Date.now() / 1000),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/tasks/:id
 * Busca uma tarefa específica
 */
async function getTaskById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tarefa não encontrada',
      });
    }

    res.json({
      data: Task.toApiFormat(task),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/tasks
 * Cria uma nova tarefa (com upsert baseado em client_id)
 */
async function createTask(req, res, next) {
  try {
    // Converter formato da API para formato do banco
    const apiData = req.body;
    const taskData = Task.fromApiFormat(apiData);

    // Verificar se já existe pelo client_id
    const existing = await Task.findByClientId(taskData.client_id);

    if (existing) {
      // Atualizar existente (upsert)
      try {
        const updated = await Task.update(existing.id, taskData);
        return res.json({
          data: Task.toApiFormat(updated),
          message: 'Tarefa atualizada (upsert)',
        });
      } catch (error) {
        if (error.message.includes('CONFLICT')) {
          // Conflito LWW: servidor tem versão mais recente
          return res.status(409).json({
            error: 'Conflict',
            message: 'Server version is newer',
            data: Task.toApiFormat(existing),
          });
        }
        throw error;
      }
    }

    // Criar nova tarefa
    const task = await Task.create(taskData);

    res.status(201).json({
      data: Task.toApiFormat(task),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/tasks/:id
 * Atualiza uma tarefa existente (com LWW)
 */
async function updateTask(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    
    // Converter formato da API para formato do banco
    const apiData = req.body;
    const taskData = Task.fromApiFormat(apiData);

    // Verificar se tarefa existe
    const existing = await Task.findById(id);
    if (!existing) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tarefa não encontrada',
      });
    }

    // Tentar atualizar (LWW será aplicado no modelo)
    try {
      const updated = await Task.update(id, taskData);
      res.json({
        data: Task.toApiFormat(updated),
      });
    } catch (error) {
      if (error.message.includes('CONFLICT')) {
        // Conflito LWW: servidor tem versão mais recente
        return res.status(409).json({
          error: 'Conflict',
          message: 'Server version is newer',
          data: Task.toApiFormat(existing),
        });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/tasks/:id
 * Deleta uma tarefa
 */
async function deleteTask(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const deleted = await Task.delete(id);

    if (!deleted) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tarefa não encontrada',
      });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllTasks,
  syncTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};

