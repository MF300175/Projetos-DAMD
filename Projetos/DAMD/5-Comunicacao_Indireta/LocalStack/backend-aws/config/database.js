const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Caminho do banco de dados
const dbPath = process.env.DB_PATH || path.join(__dirname, '../database-cloud.db');

// Criar diretório se não existir
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Conectar ao banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados (Cloud):', err);
    process.exit(1);
  }
  console.log('Conectado ao banco de dados SQLite (Cloud)');
});

// Habilitar foreign keys
db.run('PRAGMA foreign_keys = ON');

/**
 * Inicializa o banco de dados criando as tabelas necessárias
 */
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    console.log('Inicializando banco de dados (Cloud)...');

    // Criar tabela tasks
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          description TEXT,
          completed INTEGER NOT NULL DEFAULT 0,
          priority TEXT NOT NULL DEFAULT 'medium',
          created_at TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          synced_at INTEGER,
          version INTEGER NOT NULL DEFAULT 1,
          due_date TEXT,
          category_id TEXT,
          reminder_date_time TEXT,
          photo_path TEXT,
          completed_at TEXT,
          completed_by TEXT,
          latitude REAL,
          longitude REAL,
          location_name TEXT
        )
      `, (err) => {
        if (err) {
          console.error('Erro ao criar tabela tasks (Cloud):', err);
          reject(err);
          return;
        }

        // Criar índices para melhor performance
        db.run(`
          CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);
        `);
        
        db.run(`
          CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
        `);
        
        db.run(`
          CREATE INDEX IF NOT EXISTS idx_tasks_synced_at ON tasks(synced_at);
        `, (err) => {
          if (err) {
            console.error('Erro ao criar índices (Cloud):', err);
            reject(err);
            return;
          }
          console.log('Banco de dados (Cloud) inicializado com sucesso!');
          resolve();
        });
      });
    });
  });
}

// Inicializar ao carregar o módulo
initializeDatabase().catch((err) => {
  console.error('Erro ao inicializar banco de dados (Cloud):', err);
  process.exit(1);
});

module.exports = db;


