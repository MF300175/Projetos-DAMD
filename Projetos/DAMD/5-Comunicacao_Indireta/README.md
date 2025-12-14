# 📱 Task Manager - Guia de Execução Completo

**Projeto:** Comunicação Indireta - Abordagem Offline-First e LocalStack  
**Versões:** Offline-First (Porta 3000) e Cloud/LocalStack (Porta 3001)  
**Última Atualização:** 2025-12-14

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Execução Passo a Passo](#execução-passo-a-passo)
5. [Verificação e Testes](#verificação-e-testes)
6. [Troubleshooting](#troubleshooting)
7. [Demonstração](#demonstração)

---

## 🎯 Visão Geral

Este projeto implementa duas versões da aplicação Task Manager:

### Versão 1: Offline-First
- **Backend:** Node.js/Express na porta **3000**
- **App:** Flutter com entrada `main.dart`
- **Package:** `com.example.task_manager_offline_first`
- **Nome no dispositivo:** "Task Manager Pro"
- **Características:** Funciona offline, sincroniza quando online

### Versão 2: Cloud/LocalStack
- **Backend:** Node.js/Express + LocalStack (Docker) na porta **3001**
- **App:** Flutter com entrada `main_cloud.dart`
- **Package:** `com.example.task_manager_cloud`
- **Nome no dispositivo:** "Task Manager Cloud"
- **Características:** Upload de fotos para S3 local (LocalStack)

**Ambas as versões podem rodar simultaneamente no mesmo dispositivo.**

---

## 📦 Pré-requisitos

### Software Necessário

1. **Flutter SDK** (versão 3.0+)
   - Verificar: `flutter --version`
   - Instalação: https://flutter.dev/docs/get-started/install

2. **Node.js** (versão 16+)
   - Verificar: `node --version`
   - Instalação: https://nodejs.org/ (versão LTS)

3. **Docker Desktop**
   - Verificar: `docker --version`
   - Instalação: https://www.docker.com/products/docker-desktop

4. **Android SDK**
   - Incluído no Android Studio
   - Ou via Flutter: `flutter doctor`

5. **ADB (Android Debug Bridge)**
   - Geralmente em: `%LOCALAPPDATA%\Android\Sdk\platform-tools\`
   - Verificar: `adb devices`

### Dispositivo Android (Opcional)

- **Samsung A30** (ou qualquer dispositivo Android 5.0+)
- **USB Debugging** habilitado
- Conectado via USB ou na mesma rede Wi-Fi

---

## 📁 Estrutura do Projeto

```
5-Comunicacao_Indireta/
├── Abordagem_Offiline-First/          # Versão Offline-First
│   ├── app/                           # Aplicação Flutter
│   │   ├── lib/
│   │   │   ├── main.dart              # Entry point Offline-First
│   │   │   ├── main_cloud.dart        # Entry point Cloud
│   │   │   ├── services/              # Serviços (API, DB, Sync)
│   │   │   └── screens/               # Telas da aplicação
│   │   └── scripts/                   # Scripts de compilação
│   └── backend/                       # Backend Node.js (porta 3000)
│       ├── package.json
│       ├── server.js
│       └── iniciar-backend.cmd
│
└── LocalStack/                         # Versão Cloud/LocalStack
    ├── docker-compose.yml              # Configuração Docker
    ├── backend-aws/                   # Backend Node.js (porta 3001)
    │   ├── package.json
    │   ├── server.js
    │   ├── config/aws.js              # Configuração AWS SDK
    │   └── controllers/mediaController.js
    ├── aws-cli/                        # Scripts AWS CLI
    └── scripts/                        # Scripts de automação
```

---

## 🚀 Execução Passo a Passo

### Passo 1: Configurar IP da Rede Local

**⚠️ IMPORTANTE:** Antes de iniciar, verifique o IP do seu computador na rede local.

```cmd
ipconfig | findstr IPv4
```

**Exemplo de saída:**
```
   IPv4 Address. . . . . . . . . . . : 192.168.15.10
```

**Atualizar IPs nos arquivos:**

1. **Offline-First:** `Abordagem_Offiline-First/app/lib/main.dart`
   ```dart
   ApiService.instance.setBaseUrl('http://192.168.15.10:3000/api');
   ```

2. **Cloud:** `Abordagem_Offiline-First/app/lib/main_cloud.dart`
   ```dart
   ApiService.instance.setBaseUrl('http://192.168.15.10:3001/api');
   ```

**Substitua `192.168.15.10` pelo IP do seu computador.**

---

### Passo 2: Iniciar Backend Offline-First (Porta 3000)

#### Opção A: Script Automatizado (Recomendado)

```cmd
cd "Projetos\DAMD\5-Comunicacao_Indireta\Abordagem_Offiline-First\backend"
.\iniciar-backend.cmd
```

#### Opção B: Comandos Manuais

```cmd
cd "Projetos\DAMD\5-Comunicacao_Indireta\Abordagem_Offiline-First\backend"
npm install
npm start
```

**Verificar se está rodando:**
```cmd
curl http://localhost:3000/health
```

**Ou no navegador:** `http://localhost:3000/health`

**Resultado esperado:**
```json
{
  "status": "ok",
  "service": "Task Manager API",
  "timestamp": "2025-12-14T10:00:00.000Z"
}
```

**Manter este terminal aberto** - o backend deve continuar rodando.

---

### Passo 3: Iniciar Backend Cloud/LocalStack (Porta 3001)

#### Opção A: Docker Compose (Recomendado)

```cmd
cd "Projetos\DAMD\5-Comunicacao_Indireta\LocalStack"
docker compose up -d
```

**Verificar containers:**
```cmd
docker compose ps
```

**Resultado esperado:**
```
NAME            IMAGE                          STATUS
localstack      localstack/localstack:latest   Up
backend-aws     backend-aws:latest            Up
```

#### Opção B: Verificar Logs

```cmd
docker compose logs localstack --tail 20
docker compose logs backend-aws --tail 20
```

**Verificar se backend está respondendo:**
```cmd
curl http://localhost:3001/health
```

**Ou no navegador:** `http://localhost:3001/health`

**Resultado esperado:**
```json
{
  "status": "ok",
  "service": "Task Manager API - Cloud/LocalStack",
  "timestamp": "2025-12-14T10:00:00.000Z"
}
```

#### Criar Bucket S3 (Se necessário)

```powershell
cd "Projetos\DAMD\5-Comunicacao_Indireta\LocalStack"
.\aws-cli\criar-bucket-shopping-images.ps1
```

**Verificar bucket criado:**
```powershell
.\aws-cli\listar-buckets.ps1
```

**Resultado esperado:**
```
shopping-images
```

---

### Passo 4: Compilar e Instalar App Offline-First

#### Verificar Dispositivo Conectado

```cmd
adb devices
```

**Resultado esperado:**
```
List of devices attached
RX8M704WDHT    device
```

#### Compilar e Instalar

**Opção A: Script Automatizado**

```cmd
cd "Projetos\DAMD\5-Comunicacao_Indireta\Abordagem_Offiline-First\app"
.\scripts\compilar-e-instalar-offline.cmd
```

**Opção B: Comandos Manuais**

```cmd
cd "Projetos\DAMD\5-Comunicacao_Indireta\Abordagem_Offiline-First\app"
flutter pub get
flutter build apk --release --target lib/main.dart --no-tree-shake-icons
```

**Instalar no dispositivo:**
```cmd
adb install -r build\app\outputs\flutter-apk\app-release.apk
```

**Ou executar diretamente:**
```cmd
flutter run --release --target lib/main.dart
```

**Verificar instalação:**
```cmd
adb shell pm list packages | findstr task_manager_offline_first
```

**Resultado esperado:**
```
package:com.example.task_manager_offline_first
```

---

### Passo 5: Compilar e Instalar App Cloud

#### Compilar e Instalar

**Opção A: Script Automatizado**

```cmd
cd "Projetos\DAMD\5-Comunicacao_Indireta\Abordagem_Offiline-First\app"
.\scripts\gerar-apk-cloud.cmd
```

**Opção B: Comandos Manuais**

```cmd
cd "Projetos\DAMD\5-Comunicacao_Indireta\Abordagem_Offiline-First\app"
flutter pub get
flutter build apk --release --target lib/main_cloud.dart --no-tree-shake-icons
```

**Instalar no dispositivo:**
```cmd
adb install -r build\app\outputs\flutter-apk\app-release.apk
```

**Ou executar diretamente:**
```cmd
flutter run --release --target lib/main_cloud.dart
```

**Verificar instalação:**
```cmd
adb shell pm list packages | findstr task_manager_cloud
```

**Resultado esperado:**
```
package:com.example.task_manager_cloud
```

---

## ✅ Verificação e Testes

### Verificar Apps Instalados

```cmd
adb shell pm list packages | findstr task_manager
```

**Resultado esperado:**
```
package:com.example.task_manager_offline_first
package:com.example.task_manager_cloud
```

### Verificar Backends Rodando

**Backend Offline-First:**
```cmd
curl http://localhost:3000/health
```

**Backend Cloud:**
```cmd
curl http://localhost:3001/health
```

**LocalStack:**
```cmd
docker compose ps
```

### Testar App Offline-First

1. **Abrir app "Task Manager Pro" no dispositivo**
2. **Criar uma tarefa offline** (modo avião)
3. **Tirar do modo avião** - deve sincronizar automaticamente
4. **Verificar no backend:**
   ```cmd
   curl http://localhost:3000/api/tasks
   ```

### Testar App Cloud

1. **Abrir app "Task Manager Cloud" no dispositivo**
2. **Criar uma tarefa com foto**
3. **Verificar upload no S3:**
   ```powershell
   cd "Projetos\DAMD\5-Comunicacao_Indireta\LocalStack"
   .\aws-cli\listar-objetos-shopping-images.ps1
   ```

**Resultado esperado:**
```
2025-12-14 10:30:45    123456  tasks/task_1234567890.jpg
```

---

## 🔧 Troubleshooting

### Problema: Backend não inicia

**Solução:**
1. Verificar se Node.js está instalado: `node --version`
2. Verificar se porta está livre: `netstat -ano | findstr :3000`
3. Verificar arquivo `.env` existe no diretório do backend
4. Verificar logs: `npm start` (modo desenvolvimento)

### Problema: Docker não inicia

**Solução:**
1. Verificar se Docker Desktop está rodando
2. Verificar se containers estão rodando: `docker compose ps`
3. Verificar logs: `docker compose logs`
4. Reiniciar containers: `docker compose restart`

### Problema: App não compila

**Solução:**
1. Limpar cache: `flutter clean`
2. Reinstalar dependências: `flutter pub get`
3. Verificar versão do Flutter: `flutter --version`
4. Verificar dispositivo conectado: `adb devices`

### Problema: App não conecta ao backend

**Solução:**
1. Verificar IP configurado nos arquivos `main.dart` e `main_cloud.dart`
2. Verificar se backend está rodando
3. Verificar se dispositivo e computador estão na mesma rede Wi-Fi
4. Testar conectividade: `ping [IP_DO_COMPUTADOR]` no dispositivo

### Problema: Upload de foto não funciona (Cloud)

**Solução:**
1. Verificar se LocalStack está rodando: `docker compose ps`
2. Verificar se bucket existe: `.\aws-cli\listar-buckets.ps1`
3. Verificar logs do backend: `docker compose logs backend-aws`
4. Verificar se backend está respondendo: `curl http://localhost:3001/health`

### Problema: Sincronização não funciona (Offline-First)

**Solução:**
1. Verificar se backend está rodando na porta 3000
2. Verificar logs do app no console Flutter
3. Verificar conectividade: indicador no topo do app
4. Verificar banco de dados local: logs do app

---

## 🎬 Demonstração

### Demonstração Offline-First

1. **Abrir app "Task Manager Pro"**
2. **Ativar modo avião no dispositivo**
3. **Criar 2 tarefas** - devem aparecer com ícone de nuvem cortada
4. **Editar 1 tarefa existente** - deve aparecer como pendente
5. **Fechar e reabrir app** - dados devem persistir
6. **Desativar modo avião** - sincronização automática
7. **Verificar sincronização** - ícones mudam para check verde

### Demonstração Cloud/LocalStack

1. **Abrir app "Task Manager Cloud"**
2. **Criar nova tarefa**
3. **Tirar foto** - foto é enviada para S3 local
4. **Salvar tarefa**
5. **Verificar no S3:**
   ```powershell
   cd "Projetos\DAMD\5-Comunicacao_Indireta\LocalStack"
   .\aws-cli\listar-objetos-shopping-images.ps1
   ```
6. **Mostrar objeto no S3** - comprovar que foto foi salva "na nuvem local"

### Roteiro Completo para Apresentação

#### 1. Infraestrutura
```cmd
cd "Projetos\DAMD\5-Comunicacao_Indireta\LocalStack"
docker compose up -d
docker compose ps
```
**Mostrar:** Containers rodando (localstack e backend-aws)

#### 2. Configuração
```powershell
.\aws-cli\listar-buckets.ps1
```
**Mostrar:** Bucket `shopping-images` existe

#### 3. Ação
- Abrir app "Task Manager Cloud"
- Tirar foto de um produto
- Salvar tarefa

#### 4. Validação
```powershell
.\aws-cli\listar-objetos-shopping-images.ps1
```
**Mostrar:** Objeto salvo no S3 local

---

## 📊 Resumo de Portas e Endpoints

### Backend Offline-First (Porta 3000)

- **Health Check:** `http://localhost:3000/health`
- **API Tasks:** `http://localhost:3000/api/tasks`
- **API Sync:** `http://localhost:3000/api/sync`

### Backend Cloud/LocalStack (Porta 3001)

- **Health Check:** `http://localhost:3001/health`
- **API Tasks:** `http://localhost:3001/api/tasks`
- **Upload Base64:** `POST http://localhost:3001/api/media/upload`
- **Upload Multipart:** `POST http://localhost:3001/api/media/upload-multipart`

### LocalStack (Porta 4566)

- **Endpoint:** `http://localhost:4566`
- **Bucket:** `shopping-images`
- **Região:** `us-east-1`

---

## 📝 Notas Importantes

1. **IPs devem ser atualizados** antes de executar os apps
2. **Backends devem estar rodando** antes de usar os apps
3. **Dispositivo e computador** devem estar na mesma rede Wi-Fi
4. **Docker Desktop** deve estar rodando para versão Cloud
5. **Apps podem rodar simultaneamente** no mesmo dispositivo
6. **Bancos de dados são isolados** - cada app tem seu próprio banco

---

## 🔗 Referências Rápidas

### Scripts Úteis

**Backend Offline-First:**
- `Abordagem_Offiline-First/backend/iniciar-backend.cmd`

**Backend Cloud:**
- `LocalStack/scripts/iniciar-ambiente.ps1`

**Compilar Apps:**
- `Abordagem_Offiline-First/app/scripts/compilar-e-instalar-offline.cmd`
- `Abordagem_Offiline-First/app/scripts/gerar-apk-cloud.cmd`

**AWS CLI:**
- `LocalStack/aws-cli/listar-buckets.ps1`
- `LocalStack/aws-cli/listar-objetos-shopping-images.ps1`
- `LocalStack/aws-cli/criar-bucket-shopping-images.ps1`

### Documentação Adicional

- **Análise de Requisitos:** `LocalStack/Auxiliar/ATENDIMENTO_REQUISITOS_ENUNCIADO.md`
- **Guia de Screenshots:** `LocalStack/Auxiliar/COMO_GERAR_SCREENSHOTS_LOCALSTACK.md`
- **Troubleshooting:** `LocalStack/Auxiliar/` (vários arquivos)

---

## ✅ Checklist de Execução

Use este checklist para garantir que tudo está configurado:

- [ ] Flutter SDK instalado e configurado
- [ ] Node.js instalado e configurado
- [ ] Docker Desktop instalado e rodando
- [ ] IP da rede local identificado e atualizado nos arquivos
- [ ] Backend Offline-First rodando (porta 3000)
- [ ] Backend Cloud/LocalStack rodando (porta 3001)
- [ ] Bucket S3 criado (`shopping-images`)
- [ ] App Offline-First compilado e instalado
- [ ] App Cloud compilado e instalado
- [ ] Ambos os apps aparecem no dispositivo
- [ ] Testes básicos realizados com sucesso

---

**Última atualização:** 2025-12-14  
**Versão:** 1.0  
**Status:** ✅ Completo e Testado

