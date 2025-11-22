enum SyncOperation {
  create,
  update,
  delete,
}

class SyncItem {
  final String? id;
  final SyncOperation operation;
  final String tableName;
  final String? recordId;
  final Map<String, dynamic> data;
  final DateTime timestamp;
  final String status; // 'pending', 'syncing', 'completed', 'failed'
  final String? errorMessage;

  SyncItem({
    this.id,
    required this.operation,
    required this.tableName,
    this.recordId,
    required this.data,
    DateTime? timestamp,
    this.status = 'pending',
    this.errorMessage,
  }) : timestamp = timestamp ?? DateTime.now();

  // Criar SyncItem para operação CREATE
  factory SyncItem.create(String tableName, Map<String, dynamic> data) {
    return SyncItem(
      operation: SyncOperation.create,
      tableName: tableName,
      data: data,
    );
  }

  // Criar SyncItem para operação UPDATE
  factory SyncItem.update(String tableName, String recordId, Map<String, dynamic> data) {
    return SyncItem(
      operation: SyncOperation.update,
      tableName: tableName,
      recordId: recordId,
      data: data,
    );
  }

  // Criar SyncItem para operação DELETE
  factory SyncItem.delete(String tableName, String recordId) {
    return SyncItem(
      operation: SyncOperation.delete,
      tableName: tableName,
      recordId: recordId,
      data: {},
    );
  }

  // Converter para Map (SQLite)
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'operation': operation.name,
      'tableName': tableName,
      'recordId': recordId,
      'data': data.toString(), // JSON string
      'timestamp': timestamp.toIso8601String(),
      'status': status,
      'errorMessage': errorMessage,
    };
  }

  // Criar SyncItem a partir de Map (SQLite)
  factory SyncItem.fromMap(Map<String, dynamic> map) {
    return SyncItem(
      id: map['id']?.toString(),
      operation: SyncOperation.values.firstWhere(
        (op) => op.name == map['operation'],
        orElse: () => SyncOperation.create,
      ),
      tableName: map['tableName'] ?? '',
      recordId: map['recordId']?.toString(),
      data: _parseDataString(map['data']),
      timestamp: map['timestamp'] != null
          ? DateTime.parse(map['timestamp'])
          : DateTime.now(),
      status: map['status'] ?? 'pending',
      errorMessage: map['errorMessage'],
    );
  }

  // Helper para parse do data string
  static Map<String, dynamic> _parseDataString(String? dataString) {
    if (dataString == null || dataString.isEmpty) return {};
    try {
      // Aqui seria necessário um JSON parser mais robusto
      // Por enquanto, retornamos um map vazio
      return {};
    } catch (e) {
      return {};
    }
  }

  // Criar cópia com modificações
  SyncItem copyWith({
    String? id,
    SyncOperation? operation,
    String? tableName,
    String? recordId,
    Map<String, dynamic>? data,
    DateTime? timestamp,
    String? status,
    String? errorMessage,
  }) {
    return SyncItem(
      id: id ?? this.id,
      operation: operation ?? this.operation,
      tableName: tableName ?? this.tableName,
      recordId: recordId ?? this.recordId,
      data: data ?? this.data,
      timestamp: timestamp ?? this.timestamp,
      status: status ?? this.status,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  // Verificar se está pronto para sync
  bool get isReadyForSync => status == 'pending';

  // Verificar se falhou
  bool get hasFailed => status == 'failed';

  // Verificar se foi concluído
  bool get isCompleted => status == 'completed';

  @override
  String toString() {
    return 'SyncItem(operation: ${operation.name}, table: $tableName, recordId: $recordId, status: $status)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is SyncItem && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}
