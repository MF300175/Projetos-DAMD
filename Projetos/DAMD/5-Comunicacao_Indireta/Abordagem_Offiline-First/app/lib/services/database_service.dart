import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../models/task.dart';
import '../models/category.dart';

class DatabaseService {
  static final DatabaseService instance = DatabaseService._init();
  static Database? _database;
  static String? _dbName;

  DatabaseService._init();

  // Determinar nome do banco baseado no package name do app
  // Isso garante que cada versão do app (Offline-First e Cloud) tenha seu próprio banco
  Future<String> _getDbName() async {
    if (_dbName != null) return _dbName!;
    
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      final packageName = packageInfo.packageName;
      
      // Usar nome diferente baseado no package name
      if (packageName == 'com.example.task_manager_cloud') {
        _dbName = 'tasks_cloud.db';
      } else if (packageName == 'com.example.task_manager_offline_first') {
        _dbName = 'tasks_offline.db';
      } else {
        // Fallback: usar package name no nome do banco para evitar conflitos
        final packageSuffix = packageName.split('.').last;
        _dbName = 'tasks_$packageSuffix.db';
      }
    } catch (e) {
      // Fallback se package_info não funcionar
      print('Erro ao obter package info: $e');
      _dbName = 'tasks.db';
    }
    
    return _dbName!;
  }
  
  Future<Database> get database async {
    if (_database != null) return _database!;
    final dbName = await _getDbName();
    _database = await _initDB(dbName);
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 6,
      onCreate: _createDB,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _createDB(Database db, int version) async {
    await db.execute('''
      CREATE TABLE tasks (
        id TEXT PRIMARY KEY,
        server_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        completed INTEGER NOT NULL,
        priority TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        dueDate TEXT,
        categoryId TEXT,
        reminderDateTime TEXT,
        photoPath TEXT,
        completedAt TEXT,
        completedBy TEXT,
        latitude REAL,
        longitude REAL,
        locationName TEXT,
        synced_at INTEGER,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        version INTEGER NOT NULL DEFAULT 1
      )
    ''');

    await db.execute('''
      CREATE TABLE categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color INTEGER NOT NULL,
        icon INTEGER NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        server_id INTEGER,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        retry_count INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        status TEXT NOT NULL DEFAULT 'pending'
      )
    ''');

    await _insertDefaultCategories(db);
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await db.execute('ALTER TABLE tasks ADD COLUMN dueDate TEXT');
    }
    if (oldVersion < 3) {
      await db.execute('ALTER TABLE tasks ADD COLUMN categoryId TEXT');
      await db.execute('''
        CREATE TABLE categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          color INTEGER NOT NULL,
          icon INTEGER NOT NULL
        )
      ''');
      await _insertDefaultCategories(db);
    }
    if (oldVersion < 4) {
      await db.execute('ALTER TABLE tasks ADD COLUMN reminderDateTime TEXT');
    }
    if (oldVersion < 5) {
      await db.execute('ALTER TABLE tasks ADD COLUMN photoPath TEXT');
      await db.execute('ALTER TABLE tasks ADD COLUMN completedAt TEXT');
      await db.execute('ALTER TABLE tasks ADD COLUMN completedBy TEXT');
      await db.execute('ALTER TABLE tasks ADD COLUMN latitude REAL');
      await db.execute('ALTER TABLE tasks ADD COLUMN longitude REAL');
      await db.execute('ALTER TABLE tasks ADD COLUMN locationName TEXT');
    }
    if (oldVersion < 6) {
      await db.execute('ALTER TABLE tasks ADD COLUMN server_id INTEGER');
      await db.execute('ALTER TABLE tasks ADD COLUMN updated_at INTEGER');
      await db.execute('ALTER TABLE tasks ADD COLUMN synced_at INTEGER');
      await db.execute('ALTER TABLE tasks ADD COLUMN sync_status TEXT DEFAULT "pending"');
      await db.execute('ALTER TABLE tasks ADD COLUMN version INTEGER DEFAULT 1');
      
      await db.execute('''
        UPDATE tasks 
        SET updated_at = (strftime('%s', createdAt))
        WHERE updated_at IS NULL
      ''');
      
      await db.execute('''
        CREATE TABLE IF NOT EXISTS sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          operation TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          server_id INTEGER,
          payload TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          retry_count INTEGER NOT NULL DEFAULT 0,
          last_error TEXT,
          status TEXT NOT NULL DEFAULT 'pending'
        )
      ''');
    }
  }

  Future<void> _insertDefaultCategories(DatabaseExecutor db) async {
    final defaultCategories = [
      Category(
        id: 'work',
        name: 'Trabalho',
        color: Colors.blue,
        icon: Icons.business_center,
      ),
      Category(
        id: 'personal',
        name: 'Pessoal',
        color: Colors.green,
        icon: Icons.person,
      ),
      Category(
        id: 'shopping',
        name: 'Compras',
        color: Colors.orange,
        icon: Icons.shopping_cart,
      ),
      Category(
        id: 'health',
        name: 'Saúde',
        color: Colors.red,
        icon: Icons.health_and_safety,
      ),
      Category(
        id: 'education',
        name: 'Educação',
        color: Colors.purple,
        icon: Icons.school,
      ),
    ];

    for (final category in defaultCategories) {
      await db.insert('categories', category.toMap());
    }
  }

  Future<Task> create(Task task) async {
    final taskWithTimestamp = task.copyWith(
      updatedAt: DateTime.now(),
      syncStatus: 'pending',
    );
    
    await insertTaskWithoutSync(taskWithTimestamp);
    
    await addToSyncQueue(
      operation: 'CREATE',
      entityType: 'task',
      entityId: taskWithTimestamp.id,
      payload: taskWithTimestamp.toApiMap(),
      serverId: null,
    );
    
    return taskWithTimestamp;
  }

  Future<void> insertTaskWithoutSync(Task task) async {
    final db = await database;
    await db.insert('tasks', task.toMap());
  }

  Future<Task?> read(String id) async {
    final db = await database;
    final maps = await db.query(
      'tasks',
      where: 'id = ?',
      whereArgs: [id],
    );

    if (maps.isNotEmpty) {
      return Task.fromMap(maps.first);
    }
    return null;
  }

  Future<List<Task>> readAll() async {
    final db = await database;
    const orderBy = 'createdAt DESC';
    final result = await db.query('tasks', orderBy: orderBy);
    return result.map((map) => Task.fromMap(map)).toList();
  }

  Future<int> update(Task task) async {
    final taskWithTimestamp = task.copyWith(
      updatedAt: DateTime.now(),
      syncStatus: task.isSynced ? task.syncStatus : 'pending',
    );
    
    final result = await updateTaskWithoutSync(taskWithTimestamp);
    
    if (!task.isSynced) {
      await addToSyncQueue(
        operation: task.serverId == null ? 'CREATE' : 'UPDATE',
        entityType: 'task',
        entityId: taskWithTimestamp.id,
        payload: taskWithTimestamp.toApiMap(),
        serverId: taskWithTimestamp.serverId,
      );
    }
    
    return result;
  }

  Future<int> updateTaskWithoutSync(Task task) async {
    final db = await database;
    return await db.update(
      'tasks',
      task.toMap(),
      where: 'id = ?',
      whereArgs: [task.id],
    );
  }

  Future<int> delete(String id) async {
    final db = await database;
    final task = await read(id);
    
    final result = await db.delete(
      'tasks',
      where: 'id = ?',
      whereArgs: [id],
    );
    
    if (task != null && task.serverId != null) {
      await addToSyncQueue(
        operation: 'DELETE',
        entityType: 'task',
        entityId: id,
        payload: {'id': task.serverId},
        serverId: task.serverId,
      );
    }
    
    return result;
  }

  Future<void> replaceAllTasks(List<Task> tasks) async {
    final db = await database;
    await db.transaction((txn) async {
      await txn.delete('tasks');
      for (final task in tasks) {
        await txn.insert(
          'tasks',
          task.toMap(),
          conflictAlgorithm: ConflictAlgorithm.replace,
        );
      }
    });
  }

  Future<Category> createCategory(Category category) async {
    final db = await database;
    await db.insert('categories', category.toMap());
    return category;
  }

  Future<Category?> readCategory(String id) async {
    final db = await database;
    final maps = await db.query(
      'categories',
      where: 'id = ?',
      whereArgs: [id],
    );

    if (maps.isNotEmpty) {
      return Category.fromMap(maps.first);
    }
    return null;
  }

  Future<List<Category>> readAllCategories() async {
    final db = await database;
    const orderBy = 'name ASC';
    final result = await db.query('categories', orderBy: orderBy);
    return result.map((map) => Category.fromMap(map)).toList();
  }

  Future<int> updateCategory(Category category) async {
    final db = await database;
    return db.update(
      'categories',
      category.toMap(),
      where: 'id = ?',
      whereArgs: [category.id],
    );
  }

  Future<int> deleteCategory(String id) async {
    final db = await database;
    return await db.delete(
      'categories',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<void> replaceAllCategories(List<Category> categories) async {
    final db = await database;
    await db.transaction((txn) async {
      await txn.delete('categories');
      if (categories.isEmpty) {
        await _insertDefaultCategories(txn);
        return;
      }
      for (final category in categories) {
        await txn.insert(
          'categories',
          category.toMap(),
          conflictAlgorithm: ConflictAlgorithm.replace,
        );
      }
    });
  }

  Future<int> addToSyncQueue({
    required String operation,
    required String entityType,
    required String entityId,
    required Map<String, dynamic> payload,
    int? serverId,
  }) async {
    final db = await database;
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    
    return await db.insert('sync_queue', {
      'operation': operation,
      'entity_type': entityType,
        'entity_id': entityId,
        'server_id': serverId,
        'payload': jsonEncode(payload),
        'created_at': now,
      'retry_count': 0,
      'last_error': null,
      'status': 'pending',
    });
  }

  Future<List<Map<String, dynamic>>> getPendingSyncOperations() async {
    final db = await database;
    final result = await db.query(
      'sync_queue',
      where: 'status = ? AND retry_count < ?',
      whereArgs: ['pending', 3],
      orderBy: 'created_at ASC',
    );
    return result;
  }

  Future<List<Map<String, dynamic>>> getAllPendingSyncOperations() async {
    final db = await database;
    final result = await db.query(
      'sync_queue',
      where: 'status = ?',
      whereArgs: ['pending'],
      orderBy: 'created_at ASC',
    );
    return result;
  }

  Future<void> updateSyncQueueStatus({
    required int queueId,
    required String status,
    String? lastError,
    int? serverId,
    int? retryCount,
  }) async {
    final db = await database;
    final updates = <String, dynamic>{
      'status': status,
    };
    
    if (lastError != null) {
      updates['last_error'] = lastError;
    }
    if (serverId != null) {
      updates['server_id'] = serverId;
    }
    if (retryCount != null) {
      updates['retry_count'] = retryCount;
    }
    
    await db.update(
      'sync_queue',
      updates,
      where: 'id = ?',
      whereArgs: [queueId],
    );
  }

  Future<void> removeFromSyncQueue(int queueId) async {
    final db = await database;
    await db.delete(
      'sync_queue',
      where: 'id = ?',
      whereArgs: [queueId],
    );
  }

  Future<void> incrementSyncQueueRetry(int queueId) async {
    final db = await database;
    final result = await db.query(
      'sync_queue',
      where: 'id = ?',
      whereArgs: [queueId],
    );
    
    if (result.isNotEmpty) {
      final currentRetry = result.first['retry_count'] as int;
      await db.update(
        'sync_queue',
        {'retry_count': currentRetry + 1},
        where: 'id = ?',
        whereArgs: [queueId],
      );
    }
  }

  Future<void> resetProcessingOperations() async {
    final db = await database;
    await db.update(
      'sync_queue',
      {'status': 'pending'},
      where: 'status = ?',
      whereArgs: ['processing'],
    );
  }

  Future<void> updateTaskSyncStatus({
    required String taskId,
    required String syncStatus,
    int? syncedAt,
    int? serverId,
    int? version,
  }) async {
    final db = await database;
    final updates = <String, dynamic>{
      'sync_status': syncStatus,
    };
    
    if (syncedAt != null) {
      updates['synced_at'] = syncedAt;
    }
    if (serverId != null) {
      updates['server_id'] = serverId;
    }
    if (version != null) {
      updates['version'] = version;
    }
    
    await db.update(
      'tasks',
      updates,
      where: 'id = ?',
      whereArgs: [taskId],
    );
  }
}

