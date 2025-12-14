import 'package:flutter/material.dart';
import 'screens/task_list_screen.dart';
import 'services/theme_service.dart';
import 'services/notification_service.dart';
import 'services/camera_service.dart';
import 'services/location_service.dart';
import 'services/connectivity_service.dart';
import 'services/sync_service.dart';
import 'services/api_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Versão Cloud/LocalStack: backend-aws na porta 3001
  // ⚠️ IMPORTANTE: Atualizar IP para o IP do seu computador na rede local
  ApiService.instance.setBaseUrl('http://192.168.15.10:3001/api');

  await NotificationService.initialize();
  await CameraService.instance.initialize();
  await LocationService.instance.initialize();
  await ConnectivityService.instance.initialize();
  await SyncService.instance.initialize();

  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  ThemeMode _themeMode = ThemeMode.system;

  @override
  void initState() {
    super.initState();
    _loadThemeMode();
  }

  Future<void> _loadThemeMode() async {
    final themeMode = await ThemeService.loadThemeMode();
    setState(() {
      _themeMode = themeMode;
    });
  }

  void _changeThemeMode(ThemeMode mode) {
    setState(() {
      _themeMode = mode;
    });
    ThemeService.saveThemeMode(mode);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Task Manager Cloud',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blue,
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.all(Radius.circular(8)),
          ),
          filled: true,
          fillColor: Color(0xFFF5F5F5),
        ),
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blue,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
        inputDecorationTheme: InputDecorationTheme(
          border: const OutlineInputBorder(
            borderRadius: BorderRadius.all(Radius.circular(8)),
          ),
          filled: true,
          fillColor: Colors.grey.shade800,
        ),
      ),
      themeMode: _themeMode,
      home: TaskListScreen(
        onChangeThemeMode: _changeThemeMode,
        currentThemeMode: _themeMode,
      ),
    );
  }
}
