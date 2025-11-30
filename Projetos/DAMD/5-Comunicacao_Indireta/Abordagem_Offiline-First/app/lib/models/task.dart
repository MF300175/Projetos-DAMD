import 'package:uuid/uuid.dart';

class Task {
  final String id;
  final int? serverId; // ID retornado pelo servidor após sincronização
  final String title;
  final String description;
  final bool completed;
  final String priority;
  final DateTime createdAt;
  final DateTime updatedAt; // Timestamp da última atualização (Unix timestamp)
  final DateTime? dueDate;
  final String? categoryId;
  final DateTime? reminderDateTime;
  final String? photoPath;
  final DateTime? completedAt;
  final String? completedBy;
  final double? latitude;
  final double? longitude;
  final String? locationName;
  // Campos de sincronização
  final int? syncedAt; // Timestamp da última sincronização bem-sucedida (Unix timestamp)
  final String syncStatus; // 'synced', 'pending', 'error'
  final int version; // Número de versão para controle de conflitos

  Task({
    String? id,
    this.serverId,
    required this.title,
    this.description = '',
    this.completed = false,
    this.priority = 'medium',
    DateTime? createdAt,
    DateTime? updatedAt,
    this.dueDate,
    this.categoryId,
    this.reminderDateTime,
    this.photoPath,
    this.completedAt,
    this.completedBy,
    this.latitude,
    this.longitude,
    this.locationName,
    this.syncedAt,
    String? syncStatus,
    int? version,
  })  : id = id ?? const Uuid().v4(),
        createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now(),
        syncStatus = syncStatus ?? 'pending',
        version = version ?? 1;

  bool get hasPhoto => photoPath != null && photoPath!.isNotEmpty;
  bool get hasLocation => latitude != null && longitude != null;
  bool get wasCompletedByShake => completedBy == 'shake';
  bool get isSynced => syncStatus == 'synced';
  bool get isPendingSync => syncStatus == 'pending';
  bool get hasSyncError => syncStatus == 'error';
  
  // Converter DateTime para Unix timestamp (segundos)
  int get updatedAtTimestamp => updatedAt.millisecondsSinceEpoch ~/ 1000;

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'server_id': serverId,
      'title': title,
      'description': description,
      'completed': completed ? 1 : 0,
      'priority': priority,
      'createdAt': createdAt.toIso8601String(),
      'updated_at': updatedAtTimestamp,
      'dueDate': dueDate?.toIso8601String(),
      'categoryId': categoryId,
      'reminderDateTime': reminderDateTime?.toIso8601String(),
      'photoPath': photoPath,
      'completedAt': completedAt?.toIso8601String(),
      'completedBy': completedBy,
      'latitude': latitude,
      'longitude': longitude,
      'locationName': locationName,
      'synced_at': syncedAt,
      'sync_status': syncStatus,
      'version': version,
    };
  }
  
  // Mapa para API (sem campos internos)
  Map<String, dynamic> toApiMap() {
    return {
      'id': serverId ?? id,
      'title': title,
      'description': description,
      'is_completed': completed,
      'priority': priority,
      'created_at': createdAt.millisecondsSinceEpoch ~/ 1000,
      'updated_at': updatedAtTimestamp,
      'due_date': dueDate?.millisecondsSinceEpoch != null 
          ? dueDate!.millisecondsSinceEpoch ~/ 1000 
          : null,
      'category_id': categoryId,
      'reminder_date_time': reminderDateTime?.millisecondsSinceEpoch != null
          ? reminderDateTime!.millisecondsSinceEpoch ~/ 1000
          : null,
      'version': version,
    };
  }

  factory Task.fromMap(Map<String, dynamic> map) {
    // Converter Unix timestamp para DateTime
    DateTime? parseTimestamp(int? timestamp) {
      if (timestamp == null) return null;
      return DateTime.fromMillisecondsSinceEpoch(timestamp * 1000);
    }
    
    final updatedAt = map['updated_at'] != null
        ? parseTimestamp(map['updated_at'] as int)
        : (map['createdAt'] != null 
            ? DateTime.parse(map['createdAt']) 
            : DateTime.now());
    
    return Task(
      id: map['id'] as String,
      serverId: map['server_id'] as int?,
      title: map['title'] as String,
      description: map['description'] ?? '',
      completed: map['completed'] == 1,
      priority: map['priority'] ?? 'medium',
      createdAt: map['createdAt'] != null 
          ? DateTime.parse(map['createdAt']) 
          : DateTime.now(),
      updatedAt: updatedAt,
      dueDate: map['dueDate'] != null ? DateTime.parse(map['dueDate']) : null,
      categoryId: map['categoryId'] as String?,
      reminderDateTime: map['reminderDateTime'] != null
          ? DateTime.parse(map['reminderDateTime'])
          : null,
      photoPath: map['photoPath'] as String?,
      completedAt: map['completedAt'] != null
          ? DateTime.parse(map['completedAt'])
          : null,
      completedBy: map['completedBy'] as String?,
      latitude: map['latitude'] != null ? (map['latitude'] as num).toDouble() : null,
      longitude: map['longitude'] != null ? (map['longitude'] as num).toDouble() : null,
      locationName: map['locationName'] as String?,
      syncedAt: map['synced_at'] as int?,
      syncStatus: map['sync_status'] as String? ?? 'pending',
      version: map['version'] as int? ?? 1,
    );
  }
  
  // Factory para criar Task a partir de resposta da API
  factory Task.fromApiMap(Map<String, dynamic> map) {
    DateTime? parseTimestamp(int? timestamp) {
      if (timestamp == null) return null;
      return DateTime.fromMillisecondsSinceEpoch(timestamp * 1000);
    }
    
    final createdAt = parseTimestamp(map['created_at'] as int?) ?? DateTime.now();
    final updatedAt = parseTimestamp(map['updated_at'] as int?) ?? createdAt;
    
    return Task(
      id: map['id']?.toString() ?? const Uuid().v4(),
      serverId: map['id'] as int?,
      title: map['title'] as String,
      description: map['description'] ?? '',
      completed: map['is_completed'] == true || map['is_completed'] == 1,
      priority: map['priority'] ?? 'medium',
      createdAt: createdAt,
      updatedAt: updatedAt,
      dueDate: parseTimestamp(map['due_date'] as int?),
      categoryId: map['category_id']?.toString(),
      reminderDateTime: parseTimestamp(map['reminder_date_time'] as int?),
      syncStatus: 'synced',
      syncedAt: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      version: map['version'] as int? ?? 1,
    );
  }

  Task copyWith({
    int? serverId,
    String? title,
    String? description,
    bool? completed,
    String? priority,
    DateTime? updatedAt,
    DateTime? dueDate,
    String? categoryId,
    DateTime? reminderDateTime,
    String? photoPath,
    DateTime? completedAt,
    String? completedBy,
    double? latitude,
    double? longitude,
    String? locationName,
    int? syncedAt,
    String? syncStatus,
    int? version,
  }) {
    return Task(
      id: id,
      serverId: serverId ?? this.serverId,
      title: title ?? this.title,
      description: description ?? this.description,
      completed: completed ?? this.completed,
      priority: priority ?? this.priority,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      dueDate: dueDate ?? this.dueDate,
      categoryId: categoryId ?? this.categoryId,
      reminderDateTime: reminderDateTime ?? this.reminderDateTime,
      photoPath: photoPath ?? this.photoPath,
      completedAt: completedAt ?? this.completedAt,
      completedBy: completedBy ?? this.completedBy,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      locationName: locationName ?? this.locationName,
      syncedAt: syncedAt ?? this.syncedAt,
      syncStatus: syncStatus ?? this.syncStatus,
      version: version ?? this.version,
    );
  }
}

