/**
 * =============================================================================
 * ROTAS DE TAREFAS
 * =============================================================================
 * 
 * Este arquivo implementa as rotas CRUD de tarefas para o servidor REST,
 * equivalentes aos métodos de tarefas do gRPC.
 * 
 * ROTAS IMPLEMENTADAS:
 * - GET /api/tasks - Listar tarefas
 * - POST /api/tasks - Criar tarefa
 * - GET /api/tasks/:id - Obter tarefa específica
 * - PUT /api/tasks/:id - Atualizar tarefa
 * - DELETE /api/tasks/:id - Deletar tarefa
 * - GET /api/tasks/stats/summary - Estatísticas de tarefas
 * 
 * EQUIVALÊNCIA COM gRPC:
 * - gRPC: CreateTask, GetTask, UpdateTask, DeleteTask, ListTasks, GetTaskStats
 * - REST: POST, GET, PUT, DELETE, GET com filtros, GET /stats
 * =============================================================================
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler, ValidationError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');
const Joi = require('joi');

const router = express.Router();

// Simulação de banco de dados em memória (equivalente ao gRPC)
const tasks = new Map();

// Criar algumas tarefas de teste
const createTestTasks = () => {
    const testTasks = [
        {
            id: 'task1',
            title: 'Estudar gRPC',
            description: 'Aprender conceitos de gRPC e Protocol Buffers',
            completed: false,
            priority: 'high',
            userId: 'user1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'task2',
            title: 'Implementar REST API',
            description: 'Criar API REST para comparação',
            completed: true,
            priority: 'medium',
            userId: 'user1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];

    testTasks.forEach(task => {
        tasks.set(task.id, task);
    });

    console.log('📋 Tarefas de teste criadas:', testTasks.length);
};

// Inicializar tarefas de teste
createTestTasks();

// Schemas de validação
const createTaskSchema = Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(1000).optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium')
});

const updateTaskSchema = Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    description: Joi.string().max(1000).optional(),
    completed: Joi.boolean().optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional()
});

/**
 * GET /api/tasks
 * Listar tarefas do usuário com filtros e paginação
 * Equivalente ao método GetTasks() do gRPC
 */
router.get('/', asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { 
        page = 1, 
        limit = 10, 
        completed, 
        priority, 
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    // Filtrar tarefas do usuário
    let userTasks = Array.from(tasks.values()).filter(task => task.userId === userId);

    // Aplicar filtros
    if (completed !== undefined) {
        const isCompleted = completed === 'true';
        userTasks = userTasks.filter(task => task.completed === isCompleted);
    }

    if (priority) {
        userTasks = userTasks.filter(task => task.priority === priority);
    }

    if (search) {
        const searchLower = search.toLowerCase();
        userTasks = userTasks.filter(task => 
            task.title.toLowerCase().includes(searchLower) ||
            task.description.toLowerCase().includes(searchLower)
        );
    }

    // Ordenar
    userTasks.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
            aValue = new Date(aValue);
            bValue = new Date(bValue);
        }

        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    // Paginação
    const total = userTasks.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTasks = userTasks.slice(startIndex, endIndex);

    console.log(`📋 Listando tarefas para usuário ${userId}: ${paginatedTasks.length}/${total}`);

    res.json({
        success: true,
        data: paginatedTasks,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
}));

/**
 * POST /api/tasks
 * Criar nova tarefa
 * Equivalente ao método CreateTask() do gRPC
 */
router.post('/', asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { title, description = '', priority = 'medium' } = req.body;

    // Validar dados
    const { error } = createTaskSchema.validate({ title, description, priority });
    if (error) {
        throw new ValidationError(error.details[0].message);
    }

    // Criar nova tarefa
    const taskId = uuidv4();
    const newTask = {
        id: taskId,
        title,
        description,
        completed: false,
        priority,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    tasks.set(taskId, newTask);

    console.log('✅ Nova tarefa criada:', taskId, 'por usuário:', userId);

    res.status(201).json({
        success: true,
        message: 'Tarefa criada com sucesso',
        data: newTask
    });
}));

/**
 * GET /api/tasks/:id
 * Obter tarefa específica
 * Equivalente ao método GetTask() do gRPC
 */
router.get('/:id', asyncHandler(async (req, res) => {
    const taskId = req.params.id;
    const userId = req.user.userId;

    const task = tasks.get(taskId);
    if (!task) {
        throw new NotFoundError('Tarefa não encontrada');
    }

    // Verificar se a tarefa pertence ao usuário
    if (task.userId !== userId) {
        throw new ForbiddenError('Você não tem permissão para acessar esta tarefa');
    }

    console.log('📋 Tarefa obtida:', taskId, 'por usuário:', userId);

    res.json({
        success: true,
        data: task
    });
}));

/**
 * PUT /api/tasks/:id
 * Atualizar tarefa existente
 * Equivalente ao método UpdateTask() do gRPC
 */
router.put('/:id', asyncHandler(async (req, res) => {
    const taskId = req.params.id;
    const userId = req.user.userId;
    const updates = req.body;

    const task = tasks.get(taskId);
    if (!task) {
        throw new NotFoundError('Tarefa não encontrada');
    }

    // Verificar se a tarefa pertence ao usuário
    if (task.userId !== userId) {
        throw new ForbiddenError('Você não tem permissão para atualizar esta tarefa');
    }

    // Validar dados de atualização
    const { error } = updateTaskSchema.validate(updates);
    if (error) {
        throw new ValidationError(error.details[0].message);
    }

    // Aplicar atualizações
    const updatedTask = {
        ...task,
        ...updates,
        updatedAt: new Date().toISOString()
    };

    tasks.set(taskId, updatedTask);

    console.log('🔄 Tarefa atualizada:', taskId, 'por usuário:', userId);

    res.json({
        success: true,
        message: 'Tarefa atualizada com sucesso',
        data: updatedTask
    });
}));

/**
 * DELETE /api/tasks/:id
 * Deletar tarefa
 * Equivalente ao método DeleteTask() do gRPC
 */
router.delete('/:id', asyncHandler(async (req, res) => {
    const taskId = req.params.id;
    const userId = req.user.userId;

    const task = tasks.get(taskId);
    if (!task) {
        throw new NotFoundError('Tarefa não encontrada');
    }

    // Verificar se a tarefa pertence ao usuário
    if (task.userId !== userId) {
        throw new ForbiddenError('Você não tem permissão para deletar esta tarefa');
    }

    tasks.delete(taskId);

    console.log('🗑️ Tarefa deletada:', taskId, 'por usuário:', userId);

    res.json({
        success: true,
        message: 'Tarefa deletada com sucesso'
    });
}));

/**
 * GET /api/tasks/stats/summary
 * Obter estatísticas das tarefas do usuário
 * Equivalente ao método GetTaskStats() do gRPC
 */
router.get('/stats/summary', asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    // Filtrar tarefas do usuário
    const userTasks = Array.from(tasks.values()).filter(task => task.userId === userId);

    // Calcular estatísticas
    const total = userTasks.length;
    const completed = userTasks.filter(task => task.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    // Estatísticas por prioridade
    const byPriority = {
        low: userTasks.filter(task => task.priority === 'low').length,
        medium: userTasks.filter(task => task.priority === 'medium').length,
        high: userTasks.filter(task => task.priority === 'high').length,
        urgent: userTasks.filter(task => task.priority === 'urgent').length
    };

    const stats = {
        total,
        completed,
        pending,
        completionRate: parseFloat(completionRate.toFixed(2)),
        byPriority
    };

    console.log('📊 Estatísticas obtidas para usuário:', userId, stats);

    res.json({
        success: true,
        data: stats
    });
}));

module.exports = router;
