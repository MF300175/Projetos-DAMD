import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/task.dart';

class ApiService {
  static final ApiService instance = ApiService._init();
  ApiService._init();

  String _baseUrl = 'http://localhost:3000/api';
  String? authToken;

  String get baseUrl => _baseUrl;

  void setBaseUrl(String url) {
    try {
      final uri = Uri.parse(url);
      if (!uri.hasScheme || (uri.scheme != 'http' && uri.scheme != 'https')) {
        throw ArgumentError('URL deve começar com http:// ou https://');
      }
      _baseUrl = url.endsWith('/') ? url.substring(0, url.length - 1) : url;
      print('API URL configurada: $_baseUrl');
    } catch (e) {
      print('Erro ao configurar URL da API: $e');
      rethrow;
    }
  }

  void setAuthToken(String token) {
    authToken = token;
  }

  Map<String, String> get _headers {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (authToken != null) {
      headers['Authorization'] = 'Bearer $authToken';
    }
    return headers;
  }

  Future<List<Task>> fetchTasks() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/tasks'),
        headers: _headers,
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is Map && data['data'] is List) {
          final tasks = (data['data'] as List)
              .map((item) => Task.fromApiMap(item as Map<String, dynamic>))
              .toList();
          return tasks;
        } else if (data is List) {
          return data
              .map((item) => Task.fromApiMap(item as Map<String, dynamic>))
              .toList();
        }
        return [];
      } else {
        throw ApiException('Erro ao buscar tarefas: ${response.statusCode}');
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erro de conexão: $e');
    }
  }

  Future<Task> createTask(Task task) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/tasks'),
        headers: _headers,
        body: json.encode(task.toApiMap()),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = json.decode(response.body);
        final taskData = data is Map && data['data'] != null 
            ? data['data'] as Map<String, dynamic>
            : data as Map<String, dynamic>;
        return Task.fromApiMap(taskData);
      } else if (response.statusCode == 400) {
        throw ApiException('Dados inválidos', shouldRetry: false);
      } else {
        throw ApiException('Erro ao criar tarefa: ${response.statusCode}');
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erro de conexão: $e');
    }
  }

  Future<Task> updateTask(Task task) async {
    if (task.serverId == null) {
      throw ApiException('Task não possui server_id', shouldRetry: false);
    }

    try {
      final response = await http.put(
        Uri.parse('$baseUrl/tasks/${task.serverId}'),
        headers: _headers,
        body: json.encode(task.toApiMap()),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final taskData = data is Map && data['data'] != null 
            ? data['data'] as Map<String, dynamic>
            : data as Map<String, dynamic>;
        return Task.fromApiMap(taskData);
      } else if (response.statusCode == 404) {
        throw ApiException('Tarefa não encontrada no servidor', shouldRetry: false);
      } else if (response.statusCode == 400) {
        throw ApiException('Dados inválidos', shouldRetry: false);
      } else {
        throw ApiException('Erro ao atualizar tarefa: ${response.statusCode}');
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erro de conexão: $e');
    }
  }

  Future<void> deleteTask(int serverId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/tasks/$serverId'),
        headers: _headers,
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200 || response.statusCode == 204) {
        return;
      } else if (response.statusCode == 404) {
        return;
      } else {
        throw ApiException('Erro ao deletar tarefa: ${response.statusCode}');
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erro de conexão: $e');
    }
  }

  Future<Task?> fetchTask(int serverId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/tasks/$serverId'),
        headers: _headers,
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final taskData = data is Map && data['data'] != null 
            ? data['data'] as Map<String, dynamic>
            : data as Map<String, dynamic>;
        return Task.fromApiMap(taskData);
      } else if (response.statusCode == 404) {
        return null;
      } else {
        throw ApiException('Erro ao buscar tarefa: ${response.statusCode}');
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erro de conexão: $e');
    }
  }
}

class ApiException implements Exception {
  final String message;
  final bool shouldRetry;

  ApiException(this.message, {this.shouldRetry = true});

  @override
  String toString() => message;
}

