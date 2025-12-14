require('dotenv').config();
const express = require('express');
const cors = require('cors');
const tasksRoutes = require('./routes/tasks');
const mediaRoutes = require('./routes/media');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Permitir CORS para desenvolvimento
app.use(express.json({ limit: '5mb' })); // Parser JSON - limite aumentado para suportar imagens Base64
app.use(express.urlencoded({ extended: true, limit: '5mb' })); // Parser URL-encoded

// Logging de requisições (simples)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Math.floor(Date.now() / 1000),
    database: 'connected',
    service: 'Task Manager API - Cloud/LocalStack',
    version: '1.0.0',
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    service: 'Task Manager API - Cloud/LocalStack',
    version: '1.0.0',
    description: 'Backend API para sincronização offline-first com upload de imagens em S3 (LocalStack)',
    endpoints: {
      health: 'GET /health',
      tasks: {
        list: 'GET /api/tasks',
        sync: 'GET /api/tasks/sync?since=timestamp',
        get: 'GET /api/tasks/:id',
        create: 'POST /api/tasks',
        update: 'PUT /api/tasks/:id',
        delete: 'DELETE /api/tasks/:id',
      },
      media: {
        upload: 'POST /api/media/upload'
      }
    },
  });
});

// Rotas da API
app.use('/api/tasks', tasksRoutes);
app.use('/api/media', mediaRoutes);

// Tratamento de erros (deve ser o último middleware)
app.use(errorHandler);

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('Servidor Task Manager API - Cloud/LocalStack');
  console.log('========================================');
  console.log(`Rodando em: http://0.0.0.0:${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`API (tasks): http://localhost:${PORT}/api/tasks`);
  console.log('========================================');
  console.log('Servidor iniciado com sucesso!');
  console.log('========================================');
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('Erro não capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promise rejeitada não tratada:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado.');
    process.exit(0);
  });
});

module.exports = app;


