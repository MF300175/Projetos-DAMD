const db = require('../config/database');
const { promisify } = require('util');

// Promisificar métodos do sqlite3
const dbAll = promisify(db.all.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbRun = promisify(db.run.bind(db));

class Task {
  /**
   * Busca todas as tarefas
   * @param {number} since - Unix timestamp opcional para filtrar por atualizações recentes
   * @returns {Promise<Array>} Lista de tarefas
   */
  static async findAll(since = null) {
    let query = 'SELECT * FROM tasks';
    const params = [];

    if (since) {
      query += ' WHERE updated_at > ?';
      params.push(since);
    }

    query += ' ORDER BY updated_at DESC';

    return await dbAll(query, params);
  }

  /**
   * Busca uma tarefa por ID do servidor
   * @param {number} id - ID do servidor
   * @returns {Promise<Object|null>} Tarefa ou null se não encontrada
   */
  static async findById(id) {
    return await dbGet('SELECT * FROM tasks WHERE id = ?', [id]);
  }

  /**
   * Busca uma tarefa por client_id (UUID do cliente)
   * @param {string} clientId - UUID do cliente
   * @returns {Promise<Object|null>} Tarefa ou null se não encontrada
   */
  static async findByClientId(clientId) {
    return await dbGet('SELECT * FROM tasks WHERE client_id = ?', [clientId]);
  }

  /**
   * Cria uma nova tarefa
   * @param {Object} taskData - Dados da tarefa
   * @returns {Promise<Object>} Tarefa criada com ID do servidor
   */
  static async create(taskData) {
    const {
      client_id,
      title,
      description = '',
      completed = false,
      priority = 'medium',
      created_at,
      updated_at,
      due_date = null,
      category_id = null,
      reminder_date_time = null,
      photo_path = null,
      completed_at = null,
      completed_by = null,
      latitude = null,
      longitude = null,
      location_name = null,
    } = taskData;

    const query = `
      INSERT INTO tasks (
        client_id, title, description, completed, priority,
        created_at, updated_at, synced_at, version,
        due_date, category_id, reminder_date_time,
        photo_path, completed_at, completed_by,
        latitude, longitude, location_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const now = Math.floor(Date.now() / 1000);
    const result = await dbRun(
      query,
      [
        client_id,
        title,
        description,
        completed ? 1 : 0,
        priority,
        created_at || new Date().toISOString(),
        updated_at || now,
        now, // synced_at
        1,   // version inicial
        due_date,
        category_id,
        reminder_date_time,
        photo_path,
        completed_at,
        completed_by,
        latitude,
        longitude,
        location_name
      ]
    );

    return await this.findById(result.lastID);
  }

  /**
   * Atualiza uma tarefa existente
   * @param {number} id - ID do servidor
   * @param {Object} taskData - Dados para atualizar
   * @returns {Promise<Object|null>} Tarefa atualizada ou null se não encontrada
   */
  static async update(id, taskData) {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    // Aplicar LWW: verificar se updated_at do request é mais recente
    if (taskData.updated_at && taskData.updated_at < existing.updated_at) {
      // Versão do servidor é mais recente, retornar erro de conflito
      throw new Error('CONFLICT: Server version is newer');
    }

    const {
      title,
      description,
      completed,
      priority,
      updated_at,
      due_date,
      category_id,
      reminder_date_time,
      photo_path,
      completed_at,
      completed_by,
      latitude,
      longitude,
      location_name,
    } = taskData;

    const query = `
      UPDATE tasks SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        completed = COALESCE(?, completed),
        priority = COALESCE(?, priority),
        updated_at = COALESCE(?, updated_at),
        synced_at = ?,
        version = version + 1,
        due_date = ?,
        category_id = ?,
        reminder_date_time = ?,
        photo_path = ?,
        completed_at = ?,
        completed_by = ?,
        latitude = ?,
        longitude = ?,
        location_name = ?
      WHERE id = ?
    `;

    const now = Math.floor(Date.now() / 1000);
    await dbRun(
      query,
      [
        title,
        description,
        completed !== undefined ? (completed ? 1 : 0) : null,
        priority,
        updated_at || now,
        now, // synced_at
        due_date,
        category_id,
        reminder_date_time,
        photo_path,
        completed_at,
        completed_by,
        latitude,
        longitude,
        location_name,
        id
      ]
    );

    return await this.findById(id);
  }

  /**
   * Upsert: cria ou atualiza uma tarefa baseado no client_id
   * @param {Object} taskData - Dados da tarefa
   * @returns {Promise<Object>} Tarefa criada ou atualizada
   */
  static async upsert(taskData) {
    const existing = await this.findByClientId(taskData.client_id);

    if (existing) {
      // Atualizar existente
      return await this.update(existing.id, taskData);
    } else {
      // Criar novo
      return await this.create(taskData);
    }
  }

  /**
   * Deleta uma tarefa
   * @param {number} id - ID do servidor
   * @returns {Promise<boolean>} true se deletada, false se não encontrada
   */
  static async delete(id) {
    const result = await dbRun('DELETE FROM tasks WHERE id = ?', [id]);
    return result.changes > 0;
  }

  /**
   * Busca tarefas atualizadas desde um timestamp (para sincronização)
   * @param {number} since - Unix timestamp
   * @returns {Promise<Array>} Lista de tarefas atualizadas
   */
  static async findUpdatedSince(since) {
    return await dbAll(
      'SELECT * FROM tasks WHERE updated_at > ? ORDER BY updated_at ASC',
      [since]
    );
  }

  /**
   * Converte tarefa do banco para formato da API (compatível com Flutter)
   * @param {Object} task - Tarefa do banco
   * @returns {Object} Tarefa formatada para API
   */
  static toApiFormat(task) {
    // Converter created_at de ISO string para Unix timestamp se necessário
    let createdAt = task.created_at;
    if (typeof createdAt === 'string' && createdAt.includes('T')) {
      // É ISO string, converter para Unix timestamp
      createdAt = Math.floor(new Date(createdAt).getTime() / 1000);
    }

    // Converter outros timestamps
    const convertTimestamp = (ts) => {
      if (!ts) return null;
      if (typeof ts === 'string' && ts.includes('T')) {
        return Math.floor(new Date(ts).getTime() / 1000);
      }
      if (typeof ts === 'number') {
        return ts;
      }
      return null;
    };

    return {
      id: task.id, // ID do servidor (int) - Flutter usa isso como serverId
      client_id: task.client_id, // ID local do cliente (UUID string)
      server_id: task.id, // ID do servidor (para compatibilidade)
      title: task.title,
      description: task.description || '',
      is_completed: task.completed === 1, // Flutter espera is_completed
      completed: task.completed === 1, // Também incluir completed para compatibilidade
      priority: task.priority,
      created_at: createdAt, // Unix timestamp (int)
      updated_at: task.updated_at, // Unix timestamp (int)
      version: task.version,
      due_date: convertTimestamp(task.due_date),
      category_id: task.category_id,
      reminder_date_time: convertTimestamp(task.reminder_date_time),
      photo_path: task.photo_path,
      completed_at: convertTimestamp(task.completed_at),
      completed_by: task.completed_by,
      latitude: task.latitude,
      longitude: task.longitude,
      location_name: task.location_name,
    };
  }

  /**
   * Converte dados da API para formato do banco
   * @param {Object} apiData - Dados da API
   * @returns {Object} Dados formatados para banco
   */
  static fromApiFormat(apiData) {
    // Converter Unix timestamps para ISO strings se necessário
    const convertTimestamp = (ts) => {
      if (!ts) return null;
      if (typeof ts === 'number') {
        return new Date(ts * 1000).toISOString();
      }
      if (typeof ts === 'string' && ts.includes('T')) {
        return ts; // Já é ISO string
      }
      return null;
    };

    // Flutter envia: id como string (client_id), server_id como int (se existir)
    const clientId = apiData.id || apiData.client_id; // ID local do cliente (UUID string)
    
    return {
      client_id: clientId, // ID local do cliente (UUID)
      title: apiData.title,
      description: apiData.description || '',
      completed: apiData.is_completed !== undefined ? apiData.is_completed : (apiData.completed || false),
      priority: apiData.priority || 'medium',
      created_at: convertTimestamp(apiData.created_at),
      updated_at: apiData.updated_at || Math.floor(Date.now() / 1000),
      due_date: apiData.due_date ? convertTimestamp(apiData.due_date) : null,
      category_id: apiData.category_id,
      reminder_date_time: apiData.reminder_date_time ? convertTimestamp(apiData.reminder_date_time) : null,
      photo_path: apiData.photo_path,
      completed_at: apiData.completed_at ? convertTimestamp(apiData.completed_at) : null,
      completed_by: apiData.completed_by,
      latitude: apiData.latitude,
      longitude: apiData.longitude,
      location_name: apiData.location_name,
    };
  }
}

module.exports = Task;


