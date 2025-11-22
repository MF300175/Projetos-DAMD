import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Lista de Compras - Mensageria',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const ListaComprasPage(),
    );
  }
}

class ListaComprasPage extends StatefulWidget {
  const ListaComprasPage({super.key});

  @override
  State<ListaComprasPage> createState() => _ListaComprasPageState();
}

class _ListaComprasPageState extends State<ListaComprasPage> {
  // IMPORTANTE: Altere para o IP do seu computador na rede Wi-Fi
  final String baseUrl = "http://192.168.2.102:3000"; // Substitua pelo IP do seu computador
  final String authToken = "demo-token";

  List<dynamic> _listas = [];
  bool _carregando = false;
  String _mensagem = "";

  @override
  void initState() {
    super.initState();
    _carregarListas();
  }

  Future<void> _carregarListas() async {
    setState(() {
      _carregando = true;
      _mensagem = "";
    });

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/lists'),
        headers: {'Authorization': 'Bearer $authToken'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _listas = data['data'] ?? [];
          _mensagem = "✅ ${_listas.length} listas carregadas";
        });
      } else {
        setState(() {
          _mensagem = "❌ Erro ao carregar: ${response.statusCode}";
        });
      }
    } catch (e) {
      setState(() {
        _mensagem = "❌ Erro de conexão: $e";
      });
    } finally {
      setState(() {
        _carregando = false;
      });
    }
  }

  Future<void> _fazerCheckout(String listId) async {
    setState(() {
      _carregando = true;
      _mensagem = "🔄 Processando checkout...";
    });

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/lists/$listId/checkout'),
        headers: {'Authorization': 'Bearer $authToken'},
      );

      if (response.statusCode == 202) {
        setState(() {
          _mensagem = "✅ Checkout iniciado! (202 Accepted) - Mensageria ativada!";
        });
        // Recarregar listas para atualizar status
        await Future.delayed(const Duration(seconds: 1));
        _carregarListas();
      } else {
        setState(() {
          _mensagem = "❌ Erro no checkout: ${response.statusCode}";
        });
      }
    } catch (e) {
      setState(() {
        _mensagem = "❌ Erro: $e";
      });
    } finally {
      setState(() {
        _carregando = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: const Text('🛒 Lista de Compras - Mensageria'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _carregando ? null : _carregarListas,
            tooltip: 'Recarregar',
          ),
        ],
      ),
      body: Column(
        children: [
          if (_mensagem.isNotEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              color: _mensagem.contains('✅')
                  ? Colors.green.shade100
                  : Colors.red.shade100,
              child: Text(
                _mensagem,
                style: const TextStyle(fontSize: 14),
                textAlign: TextAlign.center,
              ),
            ),
          Expanded(
            child: _carregando && _listas.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : _listas.isEmpty
                    ? const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.shopping_cart, size: 64, color: Colors.grey),
                            SizedBox(height: 16),
                            Text(
                              'Nenhuma lista encontrada',
                              style: TextStyle(fontSize: 18, color: Colors.grey),
                            ),
                            SizedBox(height: 8),
                            Text(
                              'Execute o teste-mensageria.js para criar dados',
                              style: TextStyle(fontSize: 14, color: Colors.grey),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        itemCount: _listas.length,
                        itemBuilder: (context, index) {
                          final lista = _listas[index];
                          final status = lista['status'] ?? 'unknown';
                          final isCompleted = status == 'completed';

                          return Card(
                            margin: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            child: ListTile(
                              leading: Icon(
                                isCompleted
                                    ? Icons.check_circle
                                    : Icons.shopping_cart,
                                color: isCompleted ? Colors.green : Colors.blue,
                              ),
                              title: Text(lista['name'] ?? 'Sem nome'),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Status: $status'),
                                  if (lista['summary'] != null)
                                    Text(
                                      'Total: R\$ ${lista['summary']['estimatedTotal']?.toStringAsFixed(2) ?? '0.00'}',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.bold),
                                    ),
                                ],
                              ),
                              trailing: !isCompleted
                                  ? ElevatedButton(
                                      onPressed: _carregando
                                          ? null
                                          : () => _fazerCheckout(lista['id']),
                                      child: const Text('Checkout'),
                                    )
                                  : const Chip(
                                      label: Text('Concluída'),
                                      backgroundColor: Colors.green,
                                    ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _carregando ? null : _carregarListas,
        tooltip: 'Recarregar Listas',
        child: const Icon(Icons.refresh),
      ),
    );
  }
}
