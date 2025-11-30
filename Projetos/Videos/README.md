# Vídeos de Demonstração - Projetos DAMD

Esta pasta contém os vídeos de demonstração de todos os projetos desenvolvidos na disciplina DAMD (Desenvolvimento de Aplicações Móveis e Distribuídas).

---

## Índice de Vídeos

### 1. AppFlutter - Task Manager

Aplicativo Flutter completo de gerenciamento de tarefas com funcionalidades avançadas.

| Arquivo | Descrição | Data |
|---------|-----------|------|
| `AppFlutter_30112.mp4` | Versão inicial do Task Manager | 30/11/2024 |
| `DAMD_AppFlutter_TaskManager_v25.11.16.mp4` | Versão do Task Manager | 25/11/2024 |
| `DAMD_AppFlutter_TaskManager_Atual_20250211_143022.mp4` | Versão atual do Task Manager | 11/02/2025 |

**Funcionalidades Demonstradas:**
- Criação, edição e exclusão de tarefas
- Sistema de prioridades
- Data de vencimento
- Categorias
- Notificações
- Integração com câmera
- Localização
- Sensores (shake para completar)
- Persistência local (SQLite)
- Tema claro/escuro

**Localização do Projeto:** `Projetos/DAMD/4-Flutter_Mobile/AppFlutter/`

---

### 2. Lista de Compras - Microsserviços

Sistema de listas de compras baseado em arquitetura de microsserviços.

| Arquivo | Descrição |
|---------|-----------|
| `DAMD_ListaCompras_MS_v1_Microsservicos_O_Mundo_Oculto.mp4` | Demonstração completa da arquitetura de microsserviços |
| `DAMD_ListaCompras_MS_v1_Servicos_Separados.mp4` | Demonstração dos serviços separados |
| `DAMD_ListaCompras_MS_v1_Todos_Servicos.mp4` | Demonstração com todos os serviços integrados |

**Funcionalidades Demonstradas:**
- Arquitetura de microsserviços
- User Service (autenticação JWT)
- Item Service (catálogo de produtos)
- List Service (gerenciamento de listas)
- API Gateway (roteamento e agregação)
- Service Discovery
- Circuit Breaker
- Health Checks
- Resiliência do sistema

**Localização do Projeto:** `Projetos/DAMD/3-Microservico/ListaCompras_MS/`

---

### 3. Offline-First - Task Manager

Aplicativo Flutter com funcionalidade offline-first e sincronização automática.

| Arquivo | Descrição |
|---------|-----------|
| `OffLine First.mp4` | Demonstração completa da funcionalidade offline-first |

**Funcionalidades Demonstradas:**
- Operação completa offline
- Criação, edição e exclusão offline
- Persistência local (SQLite)
- Sincronização automática ao voltar online
- Resolução de conflitos (Last-Write-Wins)
- Fila de sincronização
- Retry com backoff exponencial
- Status de conectividade (Offline/Online/Sincronizando)
- Sincronização manual
- Integração com backend Node.js/Express

**Localização do Projeto:** `Projetos/DAMD/5-Comunicacao_Indireta/Abordagem_Offiline-First/`

**Cenários Demonstrados:**
1. Modo avião: criar tarefas offline
2. Persistência: fechar e reabrir app
3. Sincronização: desativar modo avião e sincronizar
4. Conflitos: demonstrar resolução LWW
5. Status visual: mostrar indicadores de conectividade

---

### 4. RabbitMQ - Mensageria

Sistema de mensageria assíncrona usando RabbitMQ para processamento de checkout.

| Arquivo | Descrição |
|---------|-----------|
| `RabbitMQ_demo_01.mp4` | Demonstração 1 do sistema RabbitMQ |
| `RabbitMQ_demo_02.mp4` | Demonstração 2 do sistema RabbitMQ |

**Funcionalidades Demonstradas:**
- Arquitetura assíncrona
- RabbitMQ como message broker
- Processamento de checkout assíncrono
- Filas e exchanges
- Consumers e producers
- RabbitMQ Management UI
- Logs de processamento
- Resiliência e retry

**Localização do Projeto:** `Projetos/DAMD/5-Comunicacao_Indireta/Servico de Mensageria/`

**Cenários Demonstrados:**
1. Criar lista de compras
2. Adicionar itens à lista
3. Executar checkout (202 Accepted)
4. Mostrar RabbitMQ Management UI
5. Mostrar logs dos consumers processando

---

## Estrutura de Nomenclatura

Os vídeos seguem o padrão de nomenclatura:
- `DAMD_[Projeto]_[Versão]_[Descrição].mp4`
- `[Projeto]_[Data].mp4`

---

## Como Adicionar Novos Vídeos

1. **Gravar o vídeo** seguindo o padrão de nomenclatura
2. **Nomear o arquivo** seguindo o padrão de nomenclatura
3. **Copiar para esta pasta**: `Videos/`
4. **Atualizar este README** com informações do novo vídeo
5. **Commitar no Git**:
   ```bash
   git add Videos/
   git commit -m "Adiciona video: [descrição]"
   git push
   ```

---

## Git LFS (Large File Storage)

Vídeos podem ser grandes. Se os arquivos forem muito grandes (>100MB), considere usar Git LFS:

```bash
# Instalar Git LFS (se ainda não instalado)
git lfs install

# Configurar tracking para arquivos MP4
git lfs track "*.mp4"

# Adicionar arquivo de configuração
git add .gitattributes

# Adicionar vídeos
git add Videos/*.mp4

# Commitar
git commit -m "Adiciona videos usando Git LFS"
git push
```

**Nota:** Certifique-se de que o repositório remoto suporta Git LFS antes de fazer push.

---

## Documentação Relacionada

Documentação relacionada disponível localmente em `auxiliares/` (não versionada).

---

## Status dos Vídeos

| Projeto | Vídeos Gravados | Status |
|---------|-----------------|--------|
| AppFlutter | 3 | ✅ Completo |
| Lista de Compras MS | 3 | ✅ Completo |
| Offline-First | 1 | ✅ Completo |
| RabbitMQ | 2 | ✅ Completo |
| gRPC | 0 | ⏳ Pendente |
| ListaCompras_Flutter | 0 | ⏳ Pendente |

**Total de vídeos:** 9

---

**Última atualização:** 28/11/2025
