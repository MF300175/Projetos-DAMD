# DAMD - Desenvolvimento de Aplicacoes Moveis e Distribuidas

**Portfolio Completo do Curso - PUC Minas**

## Informacoes do Projeto

* **Nome do Aluno:** Mauricio Fernandes Leite
* **Matricula:** 697964
* **Professor:** Cristiano Neto

## Visao Geral

Este repositorio contem o portfolio completo do curso DAMD, incluindo projetos de backend com microsservicos, aplicacoes mobile Flutter e implementacoes de mensageria.

## Estrutura do Projeto

### Backend - Microsservicos

- **ListaCompras_MS-v1** - Sistema sincrono original
  - API Gateway (porta 3000)
  - User Service (porta 3001)
  - Item Service (porta 3002)
  - List Service (porta 3003)
  - Comunicacao HTTP sincrona entre servicos

- **ListaCompras_MS-v2** - Sistema com mensageria RabbitMQ
  - API Gateway (porta 3000)
  - User Service (porta 3001)
  - Item Service (porta 3002)
  - List Service (porta 3003)
  - Consumer Notification - processa eventos de checkout
  - Consumer Analytics - calcula estatisticas
  - Comunicacao assincrona via RabbitMQ
  - Docker Compose para orquestracao

### Frontend Mobile - Flutter

- **ListaCompras_Flutter** - App basico
  - Aplicacao Flutter para gerenciamento de listas de compras
  - Integracao com backend via API REST
  - Interface simples e funcional

- **AppFlutter** - App avancado
  - Aplicacao Flutter completa com recursos avancados
  - Gerenciamento de tarefas
  - Suporte multiplataforma (Android, iOS, Web)
  - Releases versionadas (v25.11.09, v25.11.16)

- **ListaCompras_Flutter-OfflineFirst** - App com suporte offline
  - Persistencia local com SQLite
  - Sincronizacao automatica quando online
  - Deteccao de conectividade
  - Resolucao de conflitos (Last-Write-Wins)

### Projetos de Teste

- **test_app** - Aplicacao Flutter de teste
- **teste_funcional** - Testes funcionais Flutter

### Documentacao e Recursos

- **docs/** - Documentacao adicional
  - Offline-First.md - Especificacao do projeto offline-first

- **Videos/** - Videos demonstrativos
  - DAMD_AppFlutter_TaskManager_Atual_20250211_143022.mp4
  - DAMD_AppFlutter_TaskManager_v25.11.16.mp4
  - DAMD_ListaCompras_MS_v1_Microsservicos_O_Mundo_Oculto.mp4
  - DAMD_ListaCompras_MS_v1_Servicos_Separados.mp4
  - DAMD_ListaCompras_MS_v1_Todos_Servicos.mp4

## Estrutura da Pasta Projetos

A pasta Projetos contem:

### DAMD-Projetos/
- **AppFlutter/** - Aplicacao Flutter avancada
- **ListaCompras_Flutter/** - App basico de listas de compras
- **ListaCompras_Flutter-OfflineFirst/** - App com suporte offline
- **ListaCompras_MS-v1/** - Microsservicos sincronos
- **ListaCompras_MS-v2/** - Microsservicos com mensageria
- **test_app/** - Projeto de teste Flutter
- **teste_funcional/** - Testes funcionais
- **docs/** - Documentacao
- **Videos/** - Videos demonstrativos
- **package.json** - Configuracao Node.js raiz

### mensageria_01/
- **ListaCompras_MS-v2/** - Implementacao de mensageria
  - Consumer Notification
  - Consumer Analytics
  - Scripts de teste
  - Docker Compose
- **ListaCompras_Flutter-OfflineFirst/** - App offline-first
- **lib/** - Codigo Dart
- **test/** - Testes
- **LDAMD-RabbitMQ.pdf** - Documentacao RabbitMQ

### Videos/
- Videos de demonstracao dos projetos

## Quick Start

### Backend - ListaCompras_MS-v1

```bash
cd ListaCompras_MS-v1
npm install
npm start
```

### Backend - ListaCompras_MS-v2

```bash
cd ListaCompras_MS-v2
npm install
# Configurar RABBITMQ_URL no .env ou variaveis de ambiente
npm start
```

### Frontend Flutter

```bash
cd AppFlutter
# ou
cd ListaCompras_Flutter

flutter pub get
flutter run
```

## Tecnologias Utilizadas

### Backend
- Node.js
- Express.js
- RabbitMQ (MS-v2)
- Docker (MS-v2)

### Frontend
- Flutter
- Dart
- SQLite (OfflineFirst)
- HTTP Client

## Projetos e Pontuacao

- **ListaCompras_MS-v1** - 15 pontos (Microsservicos sincronos)
- **Mensageria RabbitMQ** - 15 pontos (Comunicacao assincrona)
- **Offline-First** - 25 pontos (Aplicacao mobile offline)

**Total: 55 pontos**

## PUC Minas - Engenharia de Software

Este portfolio foi desenvolvido como parte do curso de Desenvolvimento de Aplicacoes Moveis e Distribuidas (DAMD) da PUC Minas.

