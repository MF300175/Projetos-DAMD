# 📱 ListaCompras Flutter - Offline-First

**Implementação Offline-First - 25 Pontos**

## 📝 Especificação

Sistema de lista de compras com capacidades offline-first, permitindo operação completa sem internet e sincronização automática quando a conectividade retorna.

## 🎯 Requisitos Técnicos

### ✅ Implementados
- [ ] **Persistência Local (SQLite)** - Salvar dados localmente
- [ ] **Detector de Conectividade** - Status online/offline visual
- [ ] **Fila de Sincronização** - Operações pendentes offline
- [ ] **Resolução LWW** - Last-Write-Wins para conflitos

### 🔧 Dependências Necessárias
```yaml
dependencies:
  sqflite: ^2.3.0
  connectivity_plus: ^4.0.1
  path_provider: ^2.1.1
  http: ^1.1.0
  provider: ^6.0.5
```

## 🏗️ Arquitetura

```
📱 UI Layer
    ↕️ Provider (State Management)
🔄 Sync Service (Conectividade + Fila)
    ↕️ API Service (HTTP)
💾 Database Service (SQLite)
    ↕️ Sync Queue
```

## 📋 Funcionalidades

### Offline Operations
- ✅ Criar/editar/deletar listas e itens
- ✅ Persistência automática no SQLite
- ✅ Indicadores visuais de status
- ✅ Fila de sincronização automática

### Online Sync
- 🔄 Detecção automática de conectividade
- 🔄 Sincronização em background
- 🔄 Resolução de conflitos LWW
- 🔄 Feedback visual de progresso

## 🎬 Demonstração (Roteiro Obrigatório)

### 1. Prova de Vida Offline
- [ ] Modo Avião ativado
- [ ] Criar 2 itens → ícones de pendente
- [ ] Editar 1 item → mudança local visível

### 2. Persistência
- [ ] Kill app → reabrir → dados mantidos
- [ ] Funcionamento offline completo

### 3. Sincronização
- [ ] Desativar Modo Avião
- [ ] Detecção automática de rede
- [ ] Sincronização automática
- [ ] Ícones mudam para sincronizado

### 4. Resolução de Conflitos
- [ ] Editar item no servidor (Postman)
- [ ] Editar mesmo item no app offline
- [ ] Reconectar → LWW resolve
- [ ] Mostrar versão que prevaleceu

## 🗂️ Estrutura do Projeto

```
lib/
├── models/
│   ├── item.dart
│   └── sync_item.dart
├── services/
│   ├── database_service.dart    # SQLite + CRUD local
│   ├── api_service.dart         # Comunicação HTTP
│   ├── connectivity_service.dart # Status de rede
│   └── sync_service.dart        # Lógica de sincronização
├── widgets/
│   ├── connectivity_indicator.dart
│   ├── sync_status_icon.dart
│   └── offline_badge.dart
├── screens/
│   ├── item_list_screen.dart
│   └── item_form_screen.dart
└── main.dart
```

## 🔄 Fluxo de Sincronização

```
1. Operação Offline
   ↓
2. Salva no SQLite
   ↓
3. Adiciona à sync_queue
   ↓
4. Conectividade detectada
   ↓
5. Processa fila de sync
   ↓
6. Resolve conflitos (LWW)
   ↓
7. Atualiza UI
```

## 📊 Status de Implementação

| Componente | Status | Prioridade |
|------------|--------|------------|
| SQLite Setup | 🔄 Em andamento | Alta |
| UI Indicators | 📋 Planejado | Alta |
| Sync Queue | 📋 Planejado | Alta |
| LWW Resolution | 📋 Planejado | Média |
| Testing | 📋 Planejado | Alta |

## 🎯 Critérios de Avaliação (25 pontos)

- **Persistência SQLite** (6 pontos)
- **Detector Conectividade** (4 pontos)
- **Fila Sincronização** (6 pontos)
- **Resolução LWW** (5 pontos)
- **Integração Backend** (4 pontos)

## 🚀 Próximos Passos

1. [ ] Migrar ListaCompras_Flutter base
2. [ ] Implementar SQLite schema
3. [ ] Adicionar detector conectividade
4. [ ] Criar sync queue
5. [ ] Implementar LWW
6. [ ] Testes e validação
7. [ ] Demonstração completa

---

**Projeto: Offline-First Flutter App** 📱⚡
