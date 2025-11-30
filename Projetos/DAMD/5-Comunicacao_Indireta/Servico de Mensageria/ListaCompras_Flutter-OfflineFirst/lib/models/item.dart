class Item {
  final String? id;
  final String name;
  final String? category;
  final double? price;
  final bool isCompleted;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String? syncStatus; // 'pending', 'syncing', 'synced', 'failed'

  Item({
    this.id,
    required this.name,
    this.category,
    this.price,
    this.isCompleted = false,
    this.createdAt,
    this.updatedAt,
    this.syncStatus = 'pending',
  });

  // Construtor para criar Item a partir de JSON (API)
  factory Item.fromJson(Map<String, dynamic> json) {
    return Item(
      id: json['id']?.toString(),
      name: json['name'] ?? '',
      category: json['category'],
      price: json['price']?.toDouble(),
      isCompleted: json['isCompleted'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : null,
      syncStatus: 'synced', // Itens da API já estão sincronizados
    );
  }

  // Converter Item para JSON (para API ou SQLite)
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'category': category,
      'price': price,
      'isCompleted': isCompleted,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'syncStatus': syncStatus,
    };
  }

  // Criar cópia do Item com modificações
  Item copyWith({
    String? id,
    String? name,
    String? category,
    double? price,
    bool? isCompleted,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? syncStatus,
  }) {
    return Item(
      id: id ?? this.id,
      name: name ?? this.name,
      category: category ?? this.category,
      price: price ?? this.price,
      isCompleted: isCompleted ?? this.isCompleted,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      syncStatus: syncStatus ?? this.syncStatus,
    );
  }

  // Para SQLite - converter para Map
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'category': category,
      'price': price,
      'isCompleted': isCompleted ? 1 : 0,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'syncStatus': syncStatus,
    };
  }

  // Para SQLite - criar Item a partir de Map
  factory Item.fromMap(Map<String, dynamic> map) {
    return Item(
      id: map['id']?.toString(),
      name: map['name'] ?? '',
      category: map['category'],
      price: map['price']?.toDouble(),
      isCompleted: map['isCompleted'] == 1,
      createdAt: map['createdAt'] != null
          ? DateTime.parse(map['createdAt'])
          : null,
      updatedAt: map['updatedAt'] != null
          ? DateTime.parse(map['updatedAt'])
          : null,
      syncStatus: map['syncStatus'] ?? 'pending',
    );
  }

  @override
  String toString() {
    return 'Item(id: $id, name: $name, syncStatus: $syncStatus)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Item && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}
