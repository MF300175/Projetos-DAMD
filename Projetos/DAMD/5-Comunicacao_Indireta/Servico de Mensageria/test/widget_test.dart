import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:lista_compras_simples/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MyApp());

    // Verify that our app renders.
    expect(find.text('🛒 Lista de Compras'), findsOneWidget);
  });
}