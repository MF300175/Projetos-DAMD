const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { validateCreateTask, validateUpdateTask } = require('../middleware/validation');

/**
 * GET /api/tasks
 * Busca todas as tarefas
 * Query params: ?since=timestamp (opcional)
 */
router.get('/', taskController.getAllTasks);

/**
 * GET /api/tasks/sync
 * Endpoint otimizado para sincronização
 * Query params: ?since=timestamp&client_id=uuid (opcional)
 */
router.get('/sync', taskController.syncTasks);

/**
 * GET /api/tasks/:id
 * Busca uma tarefa específica pelo ID do servidor
 */
router.get('/:id', taskController.getTaskById);

/**
 * POST /api/tasks
 * Cria uma nova tarefa (com upsert baseado em client_id)
 */
router.post('/', validateCreateTask, taskController.createTask);

/**
 * PUT /api/tasks/:id
 * Atualiza uma tarefa existente (com LWW)
 */
router.put('/:id', validateUpdateTask, taskController.updateTask);

/**
 * DELETE /api/tasks/:id
 * Deleta uma tarefa
 */
router.delete('/:id', taskController.deleteTask);

module.exports = router;

