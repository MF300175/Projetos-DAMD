import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';

void main() {
  runApp(const ListaComprasApp());
}

class ListaComprasApp extends StatelessWidget {
  const ListaComprasApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ListaCompras - Teste Mensageria',
      theme: ThemeData(
        primarySwatch: Colors.blue,
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
  // ⚠️ IMPORTANTE: ALTERE ESTE IP PARA O IP DO SEU COMPUTADOR
  final String baseUrl = 'http://192.168.15.53:3000'; // IP do computador

  List<dynamic> listas = [];
  bool isLoading = false;
  String connectivityStatus = 'Verificando...';
  final Connectivity _connectivity = Connectivity();

  @override
  void initState() {
    super.initState();
    _initConnectivity();
    _loadListas();
  }

  Future<void> _initConnectivity() async {
    final result = await _connectivity.checkConnectivity();
    _updateConnectionStatus(result);
  }

  void _updateConnectionStatus(ConnectivityResult result) {
    setState(() {
      switch (result) {
        case ConnectivityResult.wifi:
          connectivityStatus = '📶 Conectado via WiFi';
          break;
        case ConnectivityResult.mobile:
          connectivityStatus = '📱 Conectado via Dados Móveis';
          break;
        case ConnectivityResult.none:
          connectivityStatus = '❌ Sem conexão';
          break;
        default:
          connectivityStatus = '❓ Status desconhecido';
          break;
      }
    });
  }

  Future<void> _loadListas() async {
    setState(() => isLoading = true);

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/lists'),
        headers: {'Authorization': 'Bearer demo-token'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          listas = data['data'] ?? [];
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ Carregadas ${listas.length} listas'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        _showError('Erro ao carregar listas: ${response.statusCode}');
      }
    } catch (e) {
      _showError('Erro de conexão: $e');
    } finally {
      setState(() => isLoading = false);
    }
  }

  Future<void> _fazerCheckout(String listId, String listName) async {
    setState(() => isLoading = true);

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/lists/$listId/checkout'),
        headers: {'Authorization': 'Bearer demo-token'},
      );

      if (response.statusCode == 202) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('🎉 Checkout de "$listName" iniciado! Mensageria ativada!'),
            backgroundColor: Colors.blue,
            duration: const Duration(seconds: 4),
          ),
        );

        // Recarregar listas após checkout
        await _loadListas();
      } else {
        _showError('Erro no checkout: ${response.statusCode}');
      }
    } catch (e) {
      _showError('Erro no checkout: $e');
    } finally {
      setState(() => isLoading = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('🛒 ListaCompras - Teste Mensageria'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadListas,
            tooltip: 'Recarregar',
          ),
        ],
      ),
      body: Column(
        children: [
          // Status de conectividade
          Container(
            padding: const EdgeInsets.all(12),
            color: connectivityStatus.contains('Conectado') ? Colors.green[100] : Colors.red[100],
            child: Row(
              children: [
                const Icon(Icons.wifi, size: 20),
                const SizedBox(width: 8),
                Text(
                  connectivityStatus,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),

          // Informações do teste
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.blue[50],
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '🎯 TESTE DE MENSAGERIA - DAMD',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 8),
                Text(
                  '• Toque em "FINALIZAR COMPRA" para testar o checkout assíncrono',
                  style: TextStyle(fontSize: 14),
                ),
                Text(
                  '• Verifique os logs no computador para confirmar processamento',
                  style: TextStyle(fontSize: 14),
                ),
                Text(
                  '• Status deve mudar para "completed" após processamento',
                  style: TextStyle(fontSize: 14),
                ),
              ],
            ),
          ),

          // Lista de compras
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : listas.isEmpty
                    ? const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.shopping_cart_outlined, size: 64, color: Colors.grey),
                            SizedBox(height: 16),
                            Text(
                              'Nenhuma lista encontrada',
                              style: TextStyle(fontSize: 18, color: Colors.grey),
                            ),
                            Text(
                              'Verifique se o backend está rodando',
                              style: TextStyle(fontSize: 14, color: Colors.grey),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: listas.length,
                        itemBuilder: (context, index) {
                          final lista = listas[index];
                          final status = lista['status'] ?? 'active';
                          final isCompleted = status == 'completed';

                          return Card(
                            elevation: 4,
                            margin: const EdgeInsets.only(bottom: 12),
                            color: isCompleted ? Colors.green[50] : Colors.white,
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Icon(
                                        isCompleted ? Icons.check_circle : Icons.shopping_cart,
                                        color: isCompleted ? Colors.green : Colors.blue,
                                        size: 28,
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              lista['name'] ?? 'Lista sem nome',
                                              style: const TextStyle(
                                                fontSize: 18,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                            Text(
                                              'Status: ${status.toUpperCase()}',
                                              style: TextStyle(
                                                color: isCompleted ? Colors.green : Colors.orange,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),

                                  if (lista['summary'] != null) ...[
                                    const SizedBox(height: 12),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                                      children: [
                                        _buildStat('Total', '${lista['summary']['totalItems'] ?? 0}'),
                                        _buildStat('Comprados', '${lista['summary']['purchasedItems'] ?? 0}'),
                                        _buildStat('Valor', 'R\$ ${(lista['summary']['estimatedTotal'] ?? 0).toStringAsFixed(2)}'),
                                      ],
                                    ),
                                  ],

                                  const SizedBox(height: 16),

                                  if (!isCompleted)
                                    SizedBox(
                                      width: double.infinity,
                                      child: ElevatedButton.icon(
                                        onPressed: isLoading ? null : () => _fazerCheckout(
                                          lista['id'],
                                          lista['name'] ?? 'Lista',
                                        ),
                                        icon: const Icon(Icons.shopping_bag),
                                        label: const Text('FINALIZAR COMPRA'),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: Colors.blue,
                                          foregroundColor: Colors.white,
                                          padding: const EdgeInsets.symmetric(vertical: 12),
                                        ),
                                      ),
                                    )
                                  else
                                    Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.symmetric(vertical: 12),
                                      decoration: BoxDecoration(
                                        color: Colors.green[100],
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.check_circle, color: Colors.green),
                                          SizedBox(width: 8),
                                          Text(
                                            'COMPRA FINALIZADA',
                                            style: TextStyle(
                                              color: Colors.green,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildStat(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.blue,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.grey,
          ),
        ),
      ],
    );
  }
}
