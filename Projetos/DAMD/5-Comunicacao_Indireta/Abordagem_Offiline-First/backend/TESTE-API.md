# 🧪 Guia de Teste da API

## 📋 Pré-requisitos

1. Servidor rodando: `npm start`
2. Ferramenta para testar: curl, Postman, ou Insomnia

---

## ✅ Testes Básicos

### 1. Health Check

```bash
curl http://localhost:3000/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": 1704067200,
  "database": "connected",
  "service": "Task Manager API",
  "version": "1.0.0"
}
```

---

### 2. Criar Tarefa (POST)

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-uuid-123",
    "title": "Tarefa de Teste",
    "description": "Descrição da tarefa",
    "is_completed": false,
    "priority": "medium",
    "created_at": 1704067200,
    "updated_at": 1704067200,
    "version": 1
  }'
```

**Resposta esperada:**
```json
{
  "data": {
    "id": 1,
    "client_id": "test-uuid-123",
    "server_id": 1,
    "title": "Tarefa de Teste",
    "description": "Descrição da tarefa",
    "is_completed": false,
    "priority": "medium",
    "created_at": 1704067200,
    "updated_at": 1704067200,
    "version": 1
  }
}
```

---

### 3. Listar Tarefas (GET)

```bash
curl http://localhost:3000/api/tasks
```

**Resposta esperada:**
```json
{
  "data": [
    {
      "id": 1,
      "client_id": "test-uuid-123",
      "title": "Tarefa de Teste",
      ...
    }
  ],
  "count": 1
}
```

---

### 4. Buscar Tarefa Específica (GET)

```bash
curl http://localhost:3000/api/tasks/1
```

**Resposta esperada:**
```json
{
  "data": {
    "id": 1,
    "client_id": "test-uuid-123",
    "title": "Tarefa de Teste",
    ...
  }
}
```

---

### 5. Atualizar Tarefa (PUT)

```bash
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-uuid-123",
    "title": "Tarefa Atualizada",
    "is_completed": true,
    "updated_at": 1704067300,
    "version": 2
  }'
```

**Resposta esperada:**
```json
{
  "data": {
    "id": 1,
    "title": "Tarefa Atualizada",
    "is_completed": true,
    "updated_at": 1704067300,
    "version": 3
  }
}
```

---

### 6. Sincronização (GET /sync)

```bash
curl "http://localhost:3000/api/tasks/sync?since=1704067200"
```

**Resposta esperada:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Tarefa Atualizada",
      ...
    }
  ],
  "count": 1,
  "last_sync": 1704067400
}
```

---

### 7. Deletar Tarefa (DELETE)

```bash
curl -X DELETE http://localhost:3000/api/tasks/1
```

**Resposta esperada:**
- Status: `204 No Content`
- Sem corpo de resposta

---

## 🔄 Teste de Sincronização (LWW)

### Cenário: Conflito de Versão

1. **Criar tarefa no servidor:**
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "id": "conflict-test",
    "title": "Tarefa Original",
    "updated_at": 1704067200,
    "version": 1
  }'
```

2. **Tentar atualizar com timestamp mais antigo:**
```bash
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{
    "id": "conflict-test",
    "title": "Tentativa de Atualização",
    "updated_at": 1704067100,
    "version": 2
  }'
```

**Resposta esperada (409 Conflict):**
```json
{
  "error": "Conflict",
  "message": "Server version is newer",
  "data": {
    "id": 1,
    "title": "Tarefa Original",
    "updated_at": 1704067200,
    ...
  }
}
```

---

## 📊 Teste de Upsert (POST com client_id existente)

1. **Criar tarefa:**
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "id": "upsert-test",
    "title": "Tarefa Original",
    "updated_at": 1704067200
  }'
```

2. **Criar novamente com mesmo client_id:**
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "id": "upsert-test",
    "title": "Tarefa Atualizada",
    "updated_at": 1704067300
  }'
```

**Resposta esperada:**
```json
{
  "data": {
    "id": 1,
    "client_id": "upsert-test",
    "title": "Tarefa Atualizada",
    ...
  },
  "message": "Tarefa atualizada (upsert)"
}
```

---

## 🐛 Testes de Erro

### Tarefa Não Encontrada (404)

```bash
curl http://localhost:3000/api/tasks/999
```

**Resposta esperada:**
```json
{
  "error": "Not Found",
  "message": "Tarefa não encontrada"
}
```

### Dados Inválidos (400)

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": ""
  }'
```

**Resposta esperada:**
```json
{
  "error": "Validation Error",
  "message": "Dados inválidos",
  "details": [
    "title é obrigatório",
    "client_id é obrigatório"
  ]
}
```

---

## 📝 Notas

- Todos os timestamps são Unix timestamps (segundos desde 1970)
- `id` no POST/PUT é o `client_id` (UUID do cliente)
- `id` na resposta é o `server_id` (ID do servidor)
- LWW compara `updated_at` para resolver conflitos

---

## ✅ Checklist de Testes

- [ ] Health check funciona
- [ ] Criar tarefa funciona
- [ ] Listar tarefas funciona
- [ ] Buscar tarefa específica funciona
- [ ] Atualizar tarefa funciona
- [ ] Deletar tarefa funciona
- [ ] Sincronização funciona
- [ ] LWW resolve conflitos corretamente
- [ ] Upsert funciona no POST
- [ ] Validação de dados funciona
- [ ] Erros retornam status codes corretos

