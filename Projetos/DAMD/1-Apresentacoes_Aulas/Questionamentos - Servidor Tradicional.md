# 🏗️ DOCUMENTO 2: QUESTÕES ARQUITETURAIS

**Laboratório de Desenvolvimento de Aplicações Móveis e Distribuídas**  
**Curso de Engenharia de Software - PUC Minas**

---

## 🎯 **QUESTÕES PARA RESPONDER**

### **1. ESCALABILIDADE: Como esta arquitetura se comportaria com 1000 usuários simultâneos?**

#### **🔴 COMPORTAMENTO ATUAL (CRÍTICO)**

**Limitações Identificadas:**

1. **Banco de Dados SQLite**
   - ❌ **Concorrência Limitada**: SQLite suporta apenas 1 escrita simultânea
   - ❌ **Locking**: Operações de escrita bloqueiam leituras
   - ❌ **Performance Degradada**: Tempo de resposta aumenta exponencialmente
   - ❌ **Deadlocks**: Probabilidade alta com múltiplas transações

2. **Servidor Único**
   - ❌ **CPU Bottleneck**: Processamento sequencial de requisições
   - ❌ **Memória Limitada**: ~512MB heap por instância Node.js
   - ❌ **I/O Blocking**: Operações síncronas bloqueiam thread principal

3. **Cache Local**
   - ❌ **Não Compartilhado**: Cada instância tem cache isolado
   - ❌ **Memória Duplicada**: Dados replicados em múltiplas instâncias
   - ❌ **Inconsistência**: Cache não sincronizado entre instâncias

#### **📊 PROJEÇÃO DE PERFORMANCE**

```javascript
// Cenário: 1000 usuários simultâneos
const projecao = {
    usuariosSimultaneos: 1000,
    requisicoesPorUsuario: 10,
    totalRequisicoes: 10000,
    
    // Performance Atual (SQLite + Servidor Único)
    latenciaMedia: "2-5 segundos",
    taxaSucesso: "60-70%",
    timeoutRate: "30-40%",
    memoriaUtilizada: "1.5-2GB",
    cpuUtilizacao: "95-100%",
    
    // Pontos de Falha
    pontosFalha: [
        "Banco de dados saturado",
        "Servidor sobrecarregado",
        "Timeout de conexões",
        "Erro 503 Service Unavailable"
    ]
};
```

#### **✅ SOLUÇÕES PARA ESCALABILIDADE**

1. **Migração para PostgreSQL/MySQL**
   ```javascript
   // Configuração de pool de conexões
   const pool = new Pool({
       host: 'localhost',
       database: 'tasks_db',
       user: 'user',
       password: 'password',
       max: 20, // Máximo de conexões
       idleTimeoutMillis: 30000,
       connectionTimeoutMillis: 2000,
   });
   ```

2. **Load Balancer + Múltiplas Instâncias**
   ```javascript
   // Nginx configuration
   upstream task_api {
       server 127.0.0.1:3000;
       server 127.0.0.1:3001;
       server 127.0.0.1:3002;
       server 127.0.0.1:3003;
   }
   ```

3. **Cache Distribuído (Redis)**
   ```javascript
   const redis = require('redis');
   const client = redis.createClient({
       host: 'redis-server',
       port: 6379
   });
   ```

---

### **2. DISPONIBILIDADE: Quais são os pontos de falha identificados?**

#### **🔴 PONTOS DE FALHA CRÍTICOS**

1. **Single Point of Failure (SPOF)**
   ```javascript
   // Cenário de falha
   const spof = {
       servidor: "Se o servidor cair, toda aplicação para",
       banco: "Se SQLite corromper, todos os dados são perdidos",
       rede: "Se rede falhar, aplicação fica inacessível",
       disco: "Se disco falhar, dados são perdidos"
   };
   ```

2. **Falta de Redundância**
   - ❌ **Servidor Único**: Sem backup de instância
   - ❌ **Banco Único**: Sem replicação
   - ❌ **Cache Local**: Perdido se servidor reiniciar
   - ❌ **Logs Locais**: Perdidos em falha de disco

3. **Falta de Monitoramento**
   ```javascript
   // Health check básico atual
   app.get('/health', async (req, res) => {
       // Apenas verifica se servidor está rodando
       // Não detecta problemas de performance
       // Não alerta sobre falhas
   });
   ```

#### **✅ SOLUÇÕES PARA DISPONIBILIDADE**

1. **Arquitetura de Alta Disponibilidade**
   ```javascript
   // Múltiplas instâncias com failover
   const haConfig = {
       instancias: 3,
       loadBalancer: "Nginx/HAProxy",
       database: "PostgreSQL com replicação",
       cache: "Redis Cluster",
       monitoring: "Prometheus + Grafana"
   };
   ```

2. **Backup e Recuperação**
   ```javascript
   // Estratégia de backup
   const backupStrategy = {
       database: "Backup automático a cada hora",
       logs: "Centralização em ELK Stack",
       config: "Versionamento em Git",
       disaster: "Recovery time < 15 minutos"
   };
   ```

---

### **3. PERFORMANCE: Onde estão os possíveis gargalos do sistema?**

#### **🔴 GARGALOS IDENTIFICADOS**

1. **Banco de Dados (Principal Gargalo)**
   ```javascript
   // Problemas de performance
   const dbBottlenecks = {
       queries: "Sem índices otimizados",
       connections: "Sem pool de conexões",
       transactions: "Transações longas",
       locking: "SQLite locking mechanism",
       queries: "N+1 query problem"
   };
   ```

2. **Processamento Síncrono**
   ```javascript
   // Operações bloqueantes
   const syncOperations = [
       "Hash de senhas (bcrypt)",
       "Validação de dados (Joi)",
       "Logs de arquivo (fs.writeFileSync)",
       "Cache operations (síncronas)"
   ];
   ```

3. **Memória e Garbage Collection**
   ```javascript
   // Problemas de memória
   const memoryIssues = {
       cache: "Cache sem limite de tamanho",
       logs: "Logs acumulando em memória",
       objects: "Objetos não liberados",
       gc: "Garbage collection frequente"
   };
   ```

#### **✅ OTIMIZAÇÕES DE PERFORMANCE**

1. **Otimização de Banco de Dados**
   ```sql
   -- Índices otimizados
   CREATE INDEX idx_tasks_userid ON tasks(userId);
   CREATE INDEX idx_tasks_created ON tasks(createdAt);
   CREATE INDEX idx_tasks_priority ON tasks(priority);
   CREATE INDEX idx_tasks_completed ON tasks(completed);
   
   -- Query otimizada
   SELECT * FROM tasks 
   WHERE userId = ? AND completed = 0 
   ORDER BY priority DESC, createdAt DESC 
   LIMIT 10;
   ```

2. **Processamento Assíncrono**
   ```javascript
   // Operações assíncronas
   const asyncOperations = {
       passwordHash: "Usar bcrypt com salt rounds otimizado",
       validation: "Validação em background",
       logging: "Logs assíncronos com buffer",
       cache: "Cache operations não-bloqueantes"
   };
   ```

3. **Otimização de Memória**
   ```javascript
   // Configurações de memória
   const memoryConfig = {
       cache: "LRU cache com limite de tamanho",
       logs: "Rotação de logs",
       objects: "Object pooling para objetos frequentes",
       gc: "Configuração de garbage collection"
   };
   ```

---

### **4. MANUTENÇÃO: Como seria o processo de atualização em produção?**

#### **🔴 PROCESSO ATUAL (MANUAL E ARRISCADO)**

1. **Deploy Manual**
   ```bash
   # Processo atual (problemático)
   git pull origin main
   npm install
   pm2 restart server
   # Sem rollback automático
   # Sem testes em produção
   # Sem monitoramento de deploy
   ```

2. **Riscos Identificados**
   ```javascript
   const deploymentRisks = {
       downtime: "Servidor para durante deploy",
       dataLoss: "Sem backup antes do deploy",
       rollback: "Sem processo de rollback",
       testing: "Sem testes em ambiente similar",
       monitoring: "Sem alertas de falha"
   };
   ```

#### **✅ PROCESSO DE DEPLOY RECOMENDADO**

1. **CI/CD Pipeline**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to Production
   on:
     push:
       branches: [main]
   
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Run tests
           run: npm test
   
     deploy:
       needs: test
       runs-on: ubuntu-latest
       steps:
         - name: Deploy to staging
           run: ./deploy-staging.sh
         - name: Run integration tests
           run: npm run test:integration
         - name: Deploy to production
           run: ./deploy-production.sh
   ```

2. **Blue-Green Deployment**
   ```javascript
   // Estratégia de deploy
   const deploymentStrategy = {
       blue: "Versão atual em produção",
       green: "Nova versão em staging",
       switch: "Load balancer muda tráfego",
       rollback: "Rápido retorno se problemas"
   };
   ```

3. **Monitoramento de Deploy**
   ```javascript
   // Métricas de deploy
   const deployMetrics = {
       health: "Health checks a cada 30s",
       performance: "Latência e throughput",
       errors: "Taxa de erro < 1%",
       rollback: "Rollback automático se falha"
   };
   ```

---

### **5. EVOLUÇÃO: Que mudanças seriam necessárias para suportar múltiplas regiões?**

#### **🔴 LIMITAÇÕES ATUAIS PARA MULTI-REGIONAL**

1. **Arquitetura Centralizada**
   ```javascript
   const currentLimitations = {
       database: "SQLite local - não distribuído",
       cache: "Cache local - não compartilhado",
       sessions: "JWT local - sem sincronização",
       logs: "Logs locais - sem centralização"
   };
   ```

2. **Latência de Rede**
   ```javascript
   // Problemas de latência
   const latencyIssues = {
       usEast: "Latência 50ms",
       usWest: "Latência 150ms", 
       europe: "Latência 200ms",
       asia: "Latência 300ms"
   };
   ```

#### **✅ ARQUITETURA MULTI-REGIONAL**

1. **Banco de Dados Distribuído**
   ```javascript
   // Estratégia de replicação
   const dbStrategy = {
       primary: "Região principal (us-east-1)",
       replicas: "Read replicas em cada região",
       sync: "Replicação assíncrona",
       consistency: "Eventual consistency"
   };
   ```

2. **Cache Distribuído**
   ```javascript
   // Redis Cluster multi-regional
   const cacheStrategy = {
       primary: "Redis Cluster em região principal",
       replicas: "Redis replicas em cada região",
       sync: "Replicação em tempo real",
       failover: "Failover automático"
   };
   ```

3. **CDN e Edge Computing**
   ```javascript
   // Distribuição de conteúdo
   const cdnStrategy = {
       static: "Assets servidos via CDN",
       api: "API Gateway em cada região",
       cache: "Cache em edge locations",
       routing: "Route 53 para roteamento inteligente"
   };
   ```

4. **Monitoramento Global**
   ```javascript
   // Observabilidade multi-regional
   const monitoringStrategy = {
       metrics: "CloudWatch em cada região",
       logs: "Centralização via CloudWatch Logs",
       tracing: "X-Ray para tracing distribuído",
       alerting: "Alertas por região"
   };
   ```

---

## 📊 **RESUMO DE RECOMENDAÇÕES**

### **🟢 PRIORIDADE ALTA (Implementar Imediatamente)**

1. **Migração para PostgreSQL**
   - Pool de conexões
   - Índices otimizados
   - Backup automático

2. **Load Balancer**
   - Nginx/HAProxy
   - Health checks
   - Failover automático

3. **Cache Distribuído**
   - Redis Cluster
   - Cache compartilhado
   - Invalidação automática

### **🟡 PRIORIDADE MÉDIA (Implementar em 3-6 meses)**

1. **CI/CD Pipeline**
   - Testes automatizados
   - Deploy automatizado
   - Rollback automático

2. **Monitoramento**
   - Prometheus + Grafana
   - Alertas proativos
   - Dashboards de performance

3. **Logs Centralizados**
   - ELK Stack
   - Log aggregation
   - Análise de logs

### **🔵 PRIORIDADE BAIXA (Implementar em 6-12 meses)**

1. **Arquitetura Multi-Regional**
   - Replicação de banco
   - CDN global
   - Edge computing

2. **Microserviços**
   - Decomposição de serviços
   - API Gateway
   - Service mesh

3. **Auto-scaling**
   - Kubernetes
   - HPA (Horizontal Pod Autoscaler)
   - VPA (Vertical Pod Autoscaler)

---

## 🎯 **CONCLUSÃO**

A arquitetura atual é adequada para desenvolvimento e testes, mas **não está pronta para produção** com 1000 usuários simultâneos. As principais limitações são:

1. **SQLite** - Principal gargalo de performance
2. **Servidor único** - Single point of failure
3. **Cache local** - Não compartilhado
4. **Falta de monitoramento** - Sem visibilidade de problemas

**Recomendação**: Implementar as soluções de prioridade alta antes de colocar em produção com carga real.
