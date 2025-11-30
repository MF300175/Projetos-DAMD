# 📱 Task Manager Pro - Aplicação Flutter

Aplicação mobile Flutter com funcionalidade offline-first completa.

## 🚀 Início Rápido

### Pré-requisitos
- Flutter SDK instalado
- Android Studio ou VS Code
- Dispositivo Android ou emulador

### Instalação

```bash
# Instalar dependências
flutter pub get

# Executar no dispositivo
flutter run
```

### Compilar APK

```bash
# Debug
flutter build apk --debug

# Release
flutter build apk --release
```

## 📁 Estrutura

```
app/
├── lib/
│   ├── main.dart           # Ponto de entrada
│   ├── models/             # Modelos de dados
│   ├── services/           # Serviços (API, DB, Sync)
│   ├── screens/            # Telas da aplicação
│   └── widgets/            # Componentes reutilizáveis
├── android/                # Configurações Android
└── pubspec.yaml            # Dependências
```

## 🔧 Configuração

### Configurar URL da API

Edite `lib/main.dart`:

```dart
ApiService.instance.setBaseUrl('http://192.168.15.53:3000/api');
```

Substitua pelo IP do seu servidor.

## 📚 Documentação

Documentação completa disponível localmente em `auxiliares/` (não versionada).

## 🎯 Funcionalidades

- ✅ Operação completa offline
- ✅ Sincronização automática
- ✅ Resolução de conflitos (LWW)
- ✅ Indicador de conectividade
- ✅ Persistência local (SQLite)

