import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Lista de Compras',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const MyHomePage(title: '🛒 Lista de Compras'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  final List<String> _itens = [];
  final TextEditingController _controller = TextEditingController();

  void _adicionarItem() {
    final texto = _controller.text.trim();
    if (texto.isNotEmpty && !_itens.contains(texto)) {
      setState(() {
        _itens.add(texto);
        _controller.clear();
      });
    }
  }

  void _removerItem(int index) {
    setState(() {
      _itens.removeAt(index);
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(widget.title),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: const InputDecoration(
                      hintText: 'Digite um item...',
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: (_) => _adicionarItem(),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _adicionarItem,
                  child: const Text('Adicionar'),
                ),
              ],
            ),
          ),
          Expanded(
            child: _itens.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.shopping_cart, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text(
                          'Lista vazia',
                          style: TextStyle(fontSize: 20, color: Colors.grey),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    itemCount: _itens.length,
                    itemBuilder: (context, index) {
                      return ListTile(
                        leading: const Icon(Icons.check_circle_outline),
                        title: Text(_itens[index]),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red),
                          onPressed: () => _removerItem(index),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _adicionarItem,
        tooltip: 'Adicionar Item',
        child: const Icon(Icons.add),
      ),
    );
  }
}