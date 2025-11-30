# Task Manager Pro - Offline-First

Aplicação mobile Flutter com funcionalidade offline-first completa, permitindo operação total sem internet e sincronização automática quando a conexão retornar.

## Sobre o Projeto

Este projeto implementa uma aplicação de gerenciamento de tarefas com arquitetura offline-first, garantindo que:
- Funciona completamente offline
- Dados são salvos localmente (SQLite)
- Sincronização automática quando conectado
- Resolução de conflitos (Last-Write-Wins)
- Indicadores visuais de status

## Estrutura do Projeto

```
Abordagem_Offiline-First/
├── app/                    # Aplicação Flutter (cliente mobile)
├── backend/                # Servidor backend (Node.js/Express)
├── scripts/                # Scripts auxiliares
└── build/                  # Arquivos de build (gitignored)
```

## Requisitos Técnicos e Implementação

### 1. Persistência Local (SQLite)

**Requisito:** Implementar database_service.dart para salvar tarefas localmente antes de tentar enviar à API.

**Implementação:**
- DatabaseService implementado utilizando sqflite
- Tabela tasks criada com todos os campos obrigatórios:
  - id (TEXT PRIMARY KEY) - ID único local/UUID
  - server_id (INTEGER) - ID retornado pelo servidor após sincronização
  - title, description, completed, priority
  - createdAt, updated_at (Unix timestamp)
  - synced_at (timestamp da última sincronização)
  - sync_status (synced, pending, error)
  - version (controle de versão para conflitos)
- CRUD completo implementado (Create, Read, Update, Delete)
- Sistema de migrações de banco de dados (versão atual: 6)
- Tratamento de erros de escrita e leitura

**Localização:** app/lib/services/database_service.dart

### 2. Detector de Conectividade

**Requisito:** Utilizar connectivity_plus para alternar visualmente entre Modo Online (verde) e Modo Offline (vermelho/laranja).

**Implementação:**
- Pacote connectivity_plus instalado e configurado (versão 6.0.5)
- ConnectivityService implementado para monitorar mudanças de conectividade
- Indicador visual (ConnectivityIndicator) exibido no topo da tela
- Três estados visuais:
  - Verde: Online e sincronizado
  - Laranja: Online mas com itens pendentes de sincronização
  - Vermelho: Offline
- Atualização automática quando a conectividade muda
- Integração com SyncService para iniciar sincronização automaticamente

**Localização:** 
- app/lib/services/connectivity_service.dart
- app/lib/widgets/connectivity_indicator.dart

### 3. Fila de Sincronização

**Requisito:** Implementar tabela sync_queue no SQLite. Toda ação de CREATE/UPDATE/DELETE feita offline deve gerar um registro nesta fila.

**Implementação:**
- Tabela sync_queue criada com estrutura completa:
  - id, operation (CREATE/UPDATE/DELETE), entity_type, entity_id
  - server_id, payload (JSON), created_at
  - retry_count, last_error, status (pending/processing/completed/failed)
- Operações são adicionadas automaticamente à fila quando executadas offline
- Processamento automático quando conectividade é restaurada
- Sistema de retry com backoff exponencial (1s, 2s, 4s)
- Máximo de 3 tentativas por operação
- Remoção automática da fila após sincronização bem-sucedida
- Histórico de erros mantido no campo last_error

**Fluxo de sincronização:**
1. Detecta restauração de conectividade via ConnectivityService
2. Busca operações com status 'pending' ordenadas por created_at
3. Processa uma por vez em ordem cronológica
4. Atualiza status conforme resultado (processing, completed, failed)
5. Atualiza synced_at e sync_status na tabela tasks

**Localização:**
- Tabela: app/lib/services/database_service.dart
- Processamento: app/lib/services/sync_service.dart

### 4. Resolução de Conflitos (Last-Write-Wins)

**Requisito:** Implementar lógica Last-Write-Wins. Se o servidor tiver versão mais recente que a local, a local é sobrescrita. Se a local for mais recente (editada offline), ela sobe para o servidor.

**Implementação:**
- Método _resolveConflict implementado em SyncService
- Compara timestamps (updated_at) para determinar qual versão é mais recente
- Se updated_at_local > updated_at_server: envia versão local para servidor
- Se updated_at_server > updated_at_local: atualiza dados locais com versão do servidor
- Em caso de empate, prioriza versão do servidor
- Atualiza campo version após resolução de conflito
- Logs informativos mostrando qual versão prevaleceu

**Cenários suportados:**
- Edição offline seguida de edição no servidor: versão mais recente prevalece
- Edição simultânea: timestamp determina vencedor
- Conflito durante sincronização: resolvido automaticamente

**Localização:** app/lib/services/sync_service.dart (método _resolveConflict)

## Roteiro de Demonstração

### 1. Prova de Vida Offline

**Requisito:** Colocar celular em Modo Avião. Criar 2 itens e editar 1 item existente. Mostrar que os itens aparecem na lista local com ícone de pendente/nuvem cortada.

**Implementação:**
- App funciona completamente offline
- Criação e edição de tarefas funcionam sem conexão
- Tarefas aparecem imediatamente na lista local
- Indicador visual mostra ícone de nuvem cortada (cloud_off) para tarefas pendentes
- Indicador de conectividade mostra status Offline (vermelho)
- Dados são salvos localmente no SQLite

### 2. Persistência

**Requisito:** Fechar app completamente (kill process) e abrir novamente (ainda offline). Os dados devem estar lá.

**Implementação:**
- Dados persistidos em banco SQLite local
- Banco de dados mantém dados entre sessões
- Ao reabrir app, dados são carregados automaticamente do banco local
- Funciona independente de conectividade
- Migrações de banco garantem compatibilidade entre versões

### 3. Sincronização

**Requisito:** Tirar do Modo Avião. O app deve detectar a rede, enviar os dados automaticamente e mudar o ícone para check/sincronizado.

**Implementação:**
- ConnectivityService detecta restauração de conectividade automaticamente
- SyncService inicia sincronização assim que conexão é detectada
- Dados são enviados para servidor em ordem cronológica
- Ícone muda de nuvem cortada para check (cloud_done) após sincronização
- Indicador de conectividade muda de vermelho para laranja (sincronizando) e depois verde (sincronizado)
- Logs detalhados mostram processo completo de sincronização
- Resumo final exibe quantidade de operações sincronizadas com sucesso

### 4. Prova de Conflito

**Requisito:** Simular edição no servidor (via Postman) e uma no app simultaneamente, mostrando qual versão prevaleceu.

**Implementação:**
- LWW (Last-Write-Wins) implementado e funcional
- Compara timestamps (updated_at) para determinar versão mais recente
- Versão mais recente prevalece automaticamente
- Logs mostram resolução de conflito indicando qual versão foi escolhida
- Pode ser testado editando tarefa no servidor e no app offline simultaneamente
- Após sincronização, versão com timestamp mais recente é mantida

## Funcionalidades Implementadas

### Cliente Flutter

- Persistência local completa com SQLite
- Detecção de conectividade em tempo real
- Fila de sincronização com retry automático
- Resolução de conflitos (LWW)
- Indicadores visuais de status
- Operação offline completa
- Sincronização bidirecional (pull e push)
- Logs detalhados para monitoramento

### Servidor Backend

- API RESTful completa (Node.js/Express)
- Banco de dados SQLite
- Endpoints de sincronização otimizados
- Resolução de conflitos no servidor
- Validação de dados
- Tratamento de erros centralizado

## Tecnologias Utilizadas

### Cliente
- Flutter - Framework mobile
- SQLite (sqflite) - Banco de dados local
- HTTP - Comunicação com API
- Connectivity Plus - Detecção de conectividade

### Backend
- Node.js + Express - Servidor
- SQLite (sqlite3) - Banco de dados
- REST API - Endpoints

## Início Rápido

### 1. Configurar Aplicação Flutter

```bash
cd app
flutter pub get
flutter run
```

### 2. Configurar Servidor Backend

```bash
cd backend
npm install
npm start
```

### 3. Configurar URL da API

Edite app/lib/main.dart e configure o IP do servidor:

```dart
ApiService.instance.setBaseUrl('http://192.168.15.53:3000/api');
```

Substitua pelo IP do seu computador na rede local.

## Documentação

Documentação completa disponível localmente na pasta `auxiliares/` do projeto principal.

## Status do Projeto

| Componente | Status | Observação |
|------------|--------|------------|
| Cliente Flutter | Completo | Funcionando offline |
| Servidor Backend | Completo | API RESTful funcional |
| Documentação | Completa | Disponível localmente em auxiliares/ |
| Testes | Parcial | Testes manuais realizados |

## Verificação de Requisitos

Todos os requisitos técnicos foram atendidos:

- Persistência Local (SQLite): 6/6 pontos - Completo
- Detector de Conectividade: 3/3 pontos - Completo
- Fila de Sincronização: 8/8 pontos - Completo
- Resolução de Conflitos (LWW): 8/8 pontos - Completo

Total: 25/25 pontos

Roteiro de demonstração: 4/4 etapas atendidas

Para detalhes completos da verificação, consulte a documentação local em `auxiliares/`.

## Requisitos

### Para Desenvolvimento
- Flutter SDK
- Node.js (para backend)
- Android Studio ou VS Code
- Dispositivo Android ou emulador

### Para Execução
- Android 5.0+ (API 21+)
- Permissões: Internet, Storage, Camera, Location

## Scripts Úteis

### Instalar no Dispositivo
```powershell
.\scripts\instalar.ps1
```

### Compilar APK
```bash
cd app
flutter build apk --debug
```

## Troubleshooting

### Problemas Comuns

**Erro de conexão:**
- Verificar se servidor está rodando
- Verificar IP e porta configurados
- Verificar se dispositivo e servidor estão na mesma rede

**Sincronização não funciona:**
- Verificar logs no console do Flutter
- Verificar se servidor está acessível
- Verificar configuração de IP no main.dart

**Erro de compilação:**
- Executar flutter clean e flutter pub get
- Verificar versão do Flutter SDK

Consulte a documentação local em `auxiliares/` para mais soluções.

## Licença

Projeto acadêmico - PUC Minas

## Suporte

Para dúvidas, consulte a documentação local disponível em `auxiliares/` no diretório raiz do projeto.
