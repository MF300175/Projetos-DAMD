# ListaCompras MS - v2 (Com Mensageria)

**Sistema de Lista de Compras com Comunicação Assíncrona RabbitMQ**

## Descrição

Esta é a versão 2 do sistema de microsserviços, evoluindo a arquitetura para incluir comunicação assíncrona através do RabbitMQ. O checkout agora é processado de forma assíncrona, permitindo melhor escalabilidade e resiliência.

## Arquitetura

```
API Gateway (3000)
    ↕️ HTTP
Microsserviços (Node.js)
    ↕️ Eventos
RabbitMQ (Message Broker)
    ↕️ Processamento
Consumer Notificação
Consumer Analytics
```

## Principais Melhorias

### Comunicação Assíncrona
- Checkout HTTP → `POST /lists/:id/checkout`
- Retorno 202 Accepted (processamento assíncrono)
- Publicação no RabbitMQ com routing key `list.checkout.completed`

### Consumers Independentes
- Consumer-Notification: Envio de comprovantes por email
- Consumer-Analytics: Processamento de estatísticas de vendas

### Escalabilidade
- Desacoplamento entre producer e consumers
- Processamento em background sem bloquear API
- Alta disponibilidade dos serviços

## Estrutura do Projeto

```
ListaCompras_MS-v2/
├── docker-compose.yml          # Orquestração com RabbitMQ
├── consumer-notification/      # Consumer de notificações
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── consumer-analytics/         # Consumer de analytics
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── services/                   # Microsserviços
│   ├── user-service/
│   ├── item-service/
│   └── list-service/              # MODIFICADO: + checkout assíncrono
├── api-gateway/
└── README.md
```

## Tecnologias Utilizadas

- Node.js - Runtime JavaScript
- RabbitMQ - Message Broker AMQP
- Docker Compose - Orquestração de containers
- Express.js - Framework web
- AMQP Library - Cliente RabbitMQ

## Como Executar

### Opção 1: Docker Compose (Recomendado)

```bash
# Construir e executar todos os serviços
docker-compose up --build

# Ou em background
docker-compose up -d --build
```

### Opção 2: Execução Manual

```bash
# 1. Configurar RabbitMQ (CloudAMQP ou local)
# Configurar variável de ambiente RABBITMQ_URL

# 2. Instalar dependências
npm install  # Em cada pasta: services/*, api-gateway, consumer-*

# 3. Executar microsserviços
npm start  # Em cada pasta: services/*, api-gateway

# 4. Executar consumers
cd consumer-notification && npm start
cd consumer-analytics && npm start
```

**Script PowerShell para iniciar serviços:**
```powershell
.\iniciar-servicos.ps1
```

## Configuração do RabbitMQ

### Opção 1: CloudAMQP (Recomendado)

1. Criar conta no CloudAMQP (plano gratuito disponível)
2. Criar uma instância
3. Copiar a URL AMQP
4. Configurar variável de ambiente:
```powershell
$env:RABBITMQ_URL = "amqp://usuario:senha@host/vhost"
```

### Opção 2: Docker Local

```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=admin \
  rabbitmq:3-management
```

## Acessos

- API Gateway: http://localhost:3000
- RabbitMQ Management: http://localhost:15672 (admin/admin)
- User Service: http://localhost:3001
- List Service: http://localhost:3002
- Item Service: http://localhost:3003

## API Endpoints

### List Service (Modificado)
```http
POST /lists/:id/checkout  # Checkout assíncrono
GET  /lists/:id/summary   # Resumo da lista
```

### Outros Services
```http
GET    /users
POST   /users
GET    /items
POST   /items
GET    /lists
POST   /lists
```

## Fluxo de Checkout (Mensageria)

```mermaid
sequenceDiagram
    participant Client
    participant ListService
    participant RabbitMQ
    participant Notification
    participant Analytics

    Client->>ListService: POST /lists/:id/checkout
    ListService->>ListService: Atualizar status → completed
    ListService->>RabbitMQ: Publicar list.checkout.completed
    RabbitMQ-->>Notification: Consumir mensagem
    RabbitMQ-->>Analytics: Consumir mensagem
    ListService-->>Client: 202 Accepted
    Notification->>Notification: Enviar comprovante
    Analytics->>Analytics: Processar estatísticas
```

## Consumer Notification

**Responsabilidades:**
- Receber eventos `list.checkout.#`
- Simular envio de comprovantes por email
- Log detalhado das notificações
- Confirmação de processamento

## Consumer Analytics

**Responsabilidades:**
- Receber eventos `list.checkout.#`
- Calcular estatísticas de vendas
- Acompanhar receita total
- Métricas em tempo real

## Como Testar

### 1. Verificar Serviços

```bash
# Verificar saúde dos serviços
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

### 2. Executar Checkout

```bash
# Via List Service (direto)
curl -X POST http://localhost:3002/lists/{listId}/checkout \
  -H "Authorization: Bearer demo-token"

# Resposta esperada: 202 Accepted
```

### 3. Verificar Logs

Os logs dos consumers aparecerão nos terminais onde estão rodando:
- Consumer Notification: Logará mensagem de comprovante
- Consumer Analytics: Logará processamento e métricas

### 4. Verificar RabbitMQ Management

Acesse http://localhost:15672 e verifique:
- Exchange `shopping_events` criado
- Mensagens sendo publicadas
- Filas dos consumers recebendo mensagens

## Comparação v1 vs v2

| Aspecto | v1 (Síncrono) | v2 (Mensageria) |
|---------|---------------|-----------------|
| Comunicação | HTTP síncrono | HTTP + RabbitMQ |
| Checkout | Imediato | 202 Accepted + background |
| Escalabilidade | Limitada | Alta |
| Resiliência | Baixa | Alta |
| Consumers | - | Notificação + Analytics |

## Requisitos Atendidos

### Requisito 1: Producer (List Service)
- Publica mensagem no Exchange `shopping_events`
- Routing key: `list.checkout.completed`
- Retorna 202 Accepted imediatamente

### Requisito 2: Consumer A (Notification Service)
- Worker separado em `consumer-notification/`
- Escuta routing key `list.checkout.#`
- Loga mensagem no console: "Enviando comprovante da lista [ID] para o usuário [USER_ID]"

### Requisito 3: Consumer B (Analytics Service)
- Worker separado em `consumer-analytics/`
- Escuta routing key `list.checkout.#`
- Calcula total gasto e estatísticas

## Suporte

**Mauricio Fernandes Leite**
- Matrícula: 697964
- Email: mauricio.fernandes@pucminas.br

---

**PUC Minas - DAMD**
**Sistema de Lista de Compras v2 - Com Mensageria RabbitMQ**
