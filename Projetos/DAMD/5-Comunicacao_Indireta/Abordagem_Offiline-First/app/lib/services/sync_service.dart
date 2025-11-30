import 'dart:async';
import 'dart:convert';
import '../models/task.dart';
import 'database_service.dart';
import 'api_service.dart';
import 'connectivity_service.dart';

class SyncService {
  static final SyncService instance = SyncService._init();
  SyncService._init();

  bool _isSyncing = false;
  StreamSubscription<ConnectivityStatus>? _connectivitySubscription;

  bool get isSyncing => _isSyncing;

  bool _checkConnectivity() {
    if (!ConnectivityService.instance.isOnline) {
      ConnectivityService.instance.forceOffline();
      return false;
    }
    return true;
  }

  Future<void> initialize() async {
    await DatabaseService.instance.resetProcessingOperations();

    _connectivitySubscription?.cancel();
    _connectivitySubscription = ConnectivityService.instance.statusStream.listen(
      (status) async {
        if (status == ConnectivityStatus.online) {
          await _handleOnlineTransition();
        } else if (status == ConnectivityStatus.offline) {
          ConnectivityService.instance.forceOffline();
        }
      },
    );

    if (ConnectivityService.instance.isOnline) {
      await _handleOnlineTransition();
    }
  }

  Future<void> _handleOnlineTransition() async {
    if (!ConnectivityService.instance.isOnline) {
      ConnectivityService.instance.forceOffline();
      return;
    }

    final pendingOps = await DatabaseService.instance.getPendingSyncOperations();
    
    if (pendingOps.isNotEmpty) {
      await syncPendingOperations();
    } else {
      ConnectivityService.instance.updateStatusWithPending(false);
    }
  }

  Future<void> syncPendingOperations() async {
    if (_isSyncing) {
      print('Sincronização já em andamento');
      return;
    }

    if (!_checkConnectivity()) {
      print('Sem conectividade, não é possível sincronizar');
      return;
    }

    final pendingOps = await DatabaseService.instance.getPendingSyncOperations();
    if (pendingOps.isEmpty) {
      ConnectivityService.instance.updateStatusWithPending(false);
      return;
    }

    _isSyncing = true;
    ConnectivityService.instance.updateStatusWithPending(true);
    
    print('========================================');
    print('INICIANDO SINCRONIZAÇÃO');
    print('========================================');
    print('${pendingOps.length} operação(ões) pendente(s) encontrada(s)');
    print('Processando operações...');

    try {
      if (!_checkConnectivity()) {
        return;
      }

      await syncFromServer();
      
      if (!_checkConnectivity()) {
        return;
      }

      int successCount = 0;
      int errorCount = 0;
      
      for (final op in pendingOps) {
        if (!_checkConnectivity()) {
          print('Conectividade perdida durante sincronização');
          break;
        }

        try {
          await _processOperation(op);
          successCount++;
        } catch (e) {
          errorCount++;
          print('Erro ao processar operação ${op['id']}: $e');
        }
      }

      if (!_checkConnectivity()) {
        return;
      }

      final remainingOps = await DatabaseService.instance.getPendingSyncOperations();
      final hasSyncablePending = remainingOps.isNotEmpty;
      
      ConnectivityService.instance.updateStatusWithPending(hasSyncablePending);
      
      if (!hasSyncablePending) {
        final allPending = await DatabaseService.instance.getAllPendingSyncOperations();
        if (allPending.isNotEmpty) {
          print('Há ${allPending.length} operação(ões) que falharam após 3 tentativas');
          print('Essas operações não serão mais sincronizadas automaticamente');
        }
        print('Sincronização concluída com sucesso');
      }

      print('========================================');
      print('RESUMO DA SINCRONIZAÇÃO');
      print('========================================');
      print('Sucesso: $successCount');
      if (errorCount > 0) {
        print('Erros: $errorCount');
      }
      if (remainingOps.isNotEmpty) {
        print('Pendentes: ${remainingOps.length}');
      }
      print('========================================');

    } catch (e) {
      print('Erro durante sincronização: $e');
      _checkConnectivity();
    } finally {
      _isSyncing = false;
      if (ConnectivityService.instance.isOnline) {
        final remainingOps = await DatabaseService.instance.getPendingSyncOperations();
        ConnectivityService.instance.updateStatusWithPending(remainingOps.isNotEmpty);
      } else {
        ConnectivityService.instance.forceOffline();
      }
      print('Sincronização finalizada');
      print('');
    }
  }

  Future<void> _processOperation(Map<String, dynamic> op) async {
    final queueId = op['id'] as int;
    final operation = op['operation'] as String;
    final entityId = op['entity_id'] as String;
    final retryCount = op['retry_count'] as int;

    if (retryCount >= 3) {
      print('Operação $queueId excedeu número máximo de tentativas (3)');
      print('Marcando como falha e removendo da fila de sincronização');
      await DatabaseService.instance.updateSyncQueueStatus(
        queueId: queueId,
        status: 'failed',
        lastError: 'Número máximo de tentativas excedido',
      );
      return;
    }

    await DatabaseService.instance.updateSyncQueueStatus(
      queueId: queueId,
      status: 'processing',
    );

    print('Processando: $operation (ID: $queueId, Task: ${entityId.substring(0, 8)}...)');

    try {
      switch (operation) {
        case 'CREATE':
          print('Criando tarefa no servidor...');
          await _processCreate(queueId, entityId);
          break;
        case 'UPDATE':
          print('Atualizando tarefa no servidor...');
          await _processUpdate(queueId, entityId);
          break;
        case 'DELETE':
          print('Deletando tarefa no servidor...');
          await _processDelete(queueId, entityId, op['server_id'] as int?);
          break;
        default:
          throw Exception('Operação desconhecida: $operation');
      }

      await DatabaseService.instance.removeFromSyncQueue(queueId);
      print('Operação $queueId ($operation) sincronizada com sucesso');

    } catch (e) {
      print('Erro ao processar operação $queueId: $e');
      
      await DatabaseService.instance.incrementSyncQueueRetry(queueId);
      
      if (retryCount < 2) {
        final delay = Duration(seconds: 1 << retryCount);
        print('Reagendando operação $queueId após ${delay.inSeconds}s (tentativa ${retryCount + 1}/3)');
        
        await DatabaseService.instance.updateSyncQueueStatus(
          queueId: queueId,
          status: 'pending',
          lastError: e.toString(),
        );
        
        await Future.delayed(delay);
      } else {
        print('Operação $queueId falhou após 3 tentativas. Marcando como falha.');
        await DatabaseService.instance.updateSyncQueueStatus(
          queueId: queueId,
          status: 'failed',
          lastError: e.toString(),
        );
      }
    }
  }

  Future<void> _processCreate(int queueId, String entityId) async {
    final task = await DatabaseService.instance.read(entityId);
    if (task == null) {
      throw Exception('Task não encontrada localmente: $entityId');
    }

    print('Enviando: "${task.title}"');

    final serverTask = await ApiService.instance.createTask(task);

    print('Recebido do servidor: ID=${serverTask.serverId}, versão=${serverTask.version}');

    await _updateLocalTaskFromServer(entityId, serverTask);
  }

  Future<void> _processUpdate(int queueId, String entityId) async {
    final task = await DatabaseService.instance.read(entityId);
    if (task == null) {
      throw Exception('Task não encontrada localmente: $entityId');
    }

    if (task.serverId == null) {
      await _processCreate(queueId, entityId);
      return;
    }

    try {
      final serverTask = await ApiService.instance.fetchTask(task.serverId!);
      
      if (serverTask != null) {
        final resolvedTask = _resolveConflict(task, serverTask);
        final updatedTask = await ApiService.instance.updateTask(resolvedTask);
        await _updateLocalTaskFromServer(entityId, updatedTask);
      } else {
        await _processCreate(queueId, entityId);
      }
    } catch (e) {
      if (e is ApiException && e.message.contains('404')) {
        await _processCreate(queueId, entityId);
      } else {
        rethrow;
      }
    }
  }

  Future<void> _processDelete(int queueId, String entityId, int? serverId) async {
    if (serverId == null) {
      print('Task nunca foi sincronizada, removendo apenas localmente');
      return;
    }

    print('Deletando task ID=$serverId no servidor...');
    await ApiService.instance.deleteTask(serverId);
    print('Task $serverId deletada no servidor');
  }

  Task _resolveConflict(Task localTask, Task serverTask) {
    final localTimestamp = localTask.updatedAtTimestamp;
    final serverTimestamp = serverTask.updatedAtTimestamp;

    if (localTimestamp > serverTimestamp) {
      print('Conflito resolvido: versão local é mais recente (LWW)');
      return localTask.copyWith(version: localTask.version + 1);
    } else {
      if (serverTimestamp > localTimestamp) {
        print('Conflito resolvido: versão do servidor é mais recente (LWW)');
      } else {
        print('Conflito resolvido: empate, priorizando servidor (LWW)');
      }
      return _createTaskFromServer(localTask.id, serverTask, incrementVersion: true);
    }
  }

  Task _createTaskFromServer(String localId, Task serverTask, {bool incrementVersion = false}) {
    return Task(
      id: localId,
      serverId: serverTask.serverId,
      title: serverTask.title,
      description: serverTask.description,
      completed: serverTask.completed,
      priority: serverTask.priority,
      createdAt: serverTask.createdAt,
      updatedAt: serverTask.updatedAt,
      dueDate: serverTask.dueDate,
      categoryId: serverTask.categoryId,
      reminderDateTime: serverTask.reminderDateTime,
      photoPath: serverTask.photoPath,
      completedAt: serverTask.completedAt,
      completedBy: serverTask.completedBy,
      latitude: serverTask.latitude,
      longitude: serverTask.longitude,
      locationName: serverTask.locationName,
      syncedAt: serverTask.syncedAt,
      syncStatus: serverTask.syncStatus,
      version: incrementVersion ? (serverTask.version + 1) : serverTask.version,
    );
  }

  Future<void> _updateLocalTaskFromServer(String entityId, Task serverTask) async {
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    await DatabaseService.instance.updateTaskSyncStatus(
      taskId: entityId,
      syncStatus: 'synced',
      syncedAt: now,
      serverId: serverTask.serverId,
      version: serverTask.version,
    );

    final localTask = _createTaskFromServer(entityId, serverTask);
    await DatabaseService.instance.updateTaskWithoutSync(localTask);
  }

  Future<void> syncFromServer() async {
    if (!ConnectivityService.instance.isOnline) {
      return;
    }

    try {
      print('Sincronizando tarefas do servidor...');
      final serverTasks = await ApiService.instance.fetchTasks();
      
      final localTasks = await DatabaseService.instance.readAll();
      
      for (final serverTask in serverTasks) {
        if (serverTask.serverId == null) continue;
        
        Task? localTask;
        try {
          localTask = localTasks.firstWhere(
            (t) => t.serverId == serverTask.serverId,
          );
        } catch (e) {
          final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
          final newTask = _createTaskFromServer(serverTask.id, serverTask);
          final syncedTask = newTask.copyWith(
            syncedAt: now,
            syncStatus: 'synced',
          );
          await DatabaseService.instance.insertTaskWithoutSync(syncedTask);
          continue;
        }

        final resolvedTask = _resolveConflict(localTask, serverTask);
        final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
        final taskToUpdate = resolvedTask.copyWith(
          syncedAt: now,
          syncStatus: 'synced',
        );
        await DatabaseService.instance.updateTaskWithoutSync(taskToUpdate);
      }
      
      print('Sincronização do servidor concluída');
    } catch (e) {
      print('Erro ao sincronizar do servidor: $e');
    }
  }

  Future<void> addToSyncQueue({
    required String operation,
    required String entityId,
    required Map<String, dynamic> payload,
    int? serverId,
  }) async {
    await DatabaseService.instance.addToSyncQueue(
      operation: operation,
      entityType: 'task',
      entityId: entityId,
      payload: payload,
      serverId: serverId,
    );

    if (ConnectivityService.instance.isOnline) {
      syncPendingOperations();
    }
  }

  Future<void> forceSync() async {
    if (_isSyncing) {
      print('Sincronização já em andamento, aguardando...');
      while (_isSyncing) {
        await Future.delayed(const Duration(milliseconds: 500));
      }
      return;
    }

    if (!ConnectivityService.instance.isOnline) {
      throw Exception('Sem conectividade para sincronizar');
    }

    await syncPendingOperations();
    
    if (ConnectivityService.instance.isOnline) {
      final remainingOps = await DatabaseService.instance.getPendingSyncOperations();
      ConnectivityService.instance.updateStatusWithPending(remainingOps.isNotEmpty);
    }
  }

  void dispose() {
    _connectivitySubscription?.cancel();
  }
}

