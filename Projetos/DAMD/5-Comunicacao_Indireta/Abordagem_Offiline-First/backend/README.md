# 🖥️ Backend - Task Manager API

Servidor backend Node.js/Express para sincronização da aplicação Task Manager Offline-First.

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 16+ instalado
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor
npm start

# Ou em modo desenvolvimento (com auto-reload)
npm run dev
```

### Configuração

Edite o arquivo `.env` para configurar:
- `PORT` - Porta do servidor (padrão: 3000)
- `DB_PATH` - Caminho do banco de dados SQLite

## 📁 Estrutura

```
backend/
├── server.js              # Servidor principal
├── package.json           # Dependências
├── .env                   # Variáveis de ambiente
├── config/
│   └── database.js        # Configuração do banco de dados
├── models/
│   └── Task.js           # Modelo de dados Task
├── routes/
│   └── tasks.js          # Rotas da API
├── controllers/
│   └── taskController.js # Lógica de negócio
├── middleware/
│   ├── errorHandler.js   # Tratamento de erros
│   └── validation.js    # Validação de dados
└── README.md             # Este arquivo
```

## 🔌 Endpoints da API

### Health Check
- `GET /health` - Status do servidor

### Tarefas
- `GET /api/tasks` - Lista todas as tarefas
- `GET /api/tasks/sync?since=timestamp` - Sincronização otimizada
- `GET /api/tasks/:id` - Busca tarefa específica
- `POST /api/tasks` - Cria tarefa (com upsert)
- `PUT /api/tasks/:id` - Atualiza tarefa (com LWW)
- `DELETE /api/tasks/:id` - Deleta tarefa

## 🔄 Funcionalidades

### Sincronização Bidirecional
- ✅ Pull: Cliente busca mudanças do servidor
- ✅ Push: Cliente envia mudanças para servidor

### Resolução de Conflitos (LWW)
- ✅ Compara timestamps (`updated_at`)
- ✅ Versão mais recente prevalece
- ✅ Retorna 409 Conflict se servidor for mais recente

### Upsert no POST
- ✅ Se `client_id` existe, atualiza
- ✅ Se não existe, cria nova tarefa

## 🧪 Testar API

### Com curl:
```bash
# Health check
curl http://localhost:3000/health

# Listar tarefas
curl http://localhost:3000/api/tasks

# Criar tarefa
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"client_id":"test-123","title":"Nova tarefa","updated_at":1704067200}'
```

### Com Postman/Insomnia:
Importe os endpoints e teste manualmente.

## 📊 Banco de Dados

O servidor usa SQLite para persistência:
- Banco criado automaticamente em `database.db`
- Tabela `tasks` criada automaticamente
- Índices para performance

## 🔧 Desenvolvimento

```bash
# Modo desenvolvimento (com nodemon)
npm run dev

# Ver logs
# Os logs aparecem no console
```

## 📝 Notas

- Servidor escuta em `0.0.0.0` para aceitar conexões da rede local
- CORS habilitado para desenvolvimento
- Validação de dados implementada
- Tratamento de erros centralizado

## 🐛 Troubleshooting

### Porta já em uso
```bash
# Verificar porta
netstat -ano | findstr :3000

# Ou mudar porta no .env
PORT=3001
```

### Erro de banco de dados
- Verificar permissões de escrita
- Verificar caminho em `DB_PATH`

## 📚 Documentação Completa

Documentação disponível localmente em `auxiliares/` (não versionada).

---

**Status:** ✅ Implementado e pronto para uso
