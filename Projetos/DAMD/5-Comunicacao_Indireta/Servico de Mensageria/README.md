# 🛒 DAMD - Desenvolvimento de Aplicações Móveis e Distribuídas

**Portfólio Completo do Curso - PUC Minas**

## 👤 **Informações do Projeto**

* **Nome do Aluno:** Mauricio Fernandes Leite
* **Matrícula:** 697964
* **Professor:** Cristiano Neto
* **Disciplina:** Desenvolvimento de Aplicações Móveis e Distribuídas

---

## 📋 **Visão Geral**

Este repositório contém o portfólio completo do curso DAMD, abrangendo:

- **Backend**: Sistema de lista de compras com arquitetura de microsserviços
- **Mensageria**: Implementação RabbitMQ para processamento assíncrono
- **Mobile**: Aplicativos Flutter com e sem capacidades offline-first

---

## 📁 **Estrutura do Projeto**

### **Backend - Sistema de Lista de Compras**
- [**ListaCompras_MS-v1**](./ListaCompras_MS-v1/) - Sistema síncrono original (15 pontos)
- [**ListaCompras_MS-v2**](./ListaCompras_MS-v2/) - Sistema com mensageria RabbitMQ (15 pontos)

### **Frontend Mobile**
- [**ListaCompras_Flutter**](./ListaCompras_Flutter/) - App básico para lista de compras
- [**AppFlutter**](./AppFlutter/) - App Flutter avançado com câmera e sensores
- [**ListaCompras_Flutter-OfflineFirst**](./ListaCompras_Flutter-OfflineFirst/) - App offline-first (25 pontos)

### **Documentação e Especificações**
- Documentação técnica disponível localmente em `auxiliares/` (não versionada)

---

## 🚀 **Quick Start**

### **Opção 1: Setup Completo**
```bash
# Clonar repositório
git clone https://github.com/MF300175/Projetos-DAMD.git
cd Projetos-DAMD/Projetos

# Instalar dependências
npm run setup:all

# Rodar sistema completo
npm run start:v2  # Backend com mensageria
```

### **Opção 2: Projetos Individuais**
Cada pasta tem seu próprio README com instruções específicas.

---

## 📊 **Comparação de Implementações**

| Aspecto | v1 (Síncrono) | v2 (Mensageria) |
|---------|---------------|-----------------|
| **Comunicação** | HTTP síncrono | HTTP + RabbitMQ |
| **Processamento** | Imediato | Assíncrono |
| **Escalabilidade** | Limitada | Alta |
| **Resiliência** | Baixa | Alta |

---

## 🎯 **Projetos Implementados**

### **✅ Concluídos**
- [x] **ListaCompras_MS-v1** - Sistema de microsserviços síncrono (15 pontos)
- [x] **ListaCompras_MS-v2** - Sistema com mensageria RabbitMQ (15 pontos)
- [x] **ListaCompras_Flutter** - App mobile básico
- [x] **AppFlutter** - App Flutter avançado
- [x] **Projetos-DAMD** - Repositório organizado e estruturado

### **🔄 Em Andamento**
- [ ] **ListaCompras_Flutter-OfflineFirst** - Implementar offline-first (25 pontos)

### **📋 Próximos Passos**
- [ ] **Migração projetos restantes** - ListaCompras_Flutter e AppFlutter
- [ ] **Integração completa** - Backend + Mobile + Offline-First

---

## 🏗️ **Arquitetura Geral**

```
📱 Mobile Apps (Flutter)
    ↕️ HTTP REST
🏗️ Backend Microsserviços (Node.js)
    ↕️ Eventos
🐰 RabbitMQ (Mensageria)
    ↕️ Processamento
📧 Notifications + 📊 Analytics
```

---

## 📈 **Pontuação Total**

| Projeto | Pontos | Status |
|---------|--------|--------|
| **ListaCompras_MS-v1** | 15 | ✅ Concluído |
| **ListaCompras_MS-v2** | 15 | ✅ Concluído |
| **Offline-First Flutter** | 25 | 🔄 Provisionado |
| **Total Potencial** | **55** | - |

**Pontuação Atual: 30 pontos** (Backend completo)

---

## 🛠️ **Tecnologias Utilizadas**

- **Backend**: Node.js, Express, Microserviços
- **Mensageria**: RabbitMQ, AMQP
- **Mobile**: Flutter, Dart
- **Banco**: JSON files, SQLite (offline)
- **Infra**: Docker, Docker Compose

---

## 📚 **Documentação**

Documentação técnica disponível localmente em `auxiliares/` (não versionada).

---

## 🎯 **Objetivos de Aprendizado**

- ✅ Arquitetura de Microsserviços
- 🔄 Comunicação Assíncrona com Message Brokers
- ✅ Desenvolvimento Mobile Cross-Platform
- 🔄 Padrões Offline-First
- ✅ Integração Full-Stack

---

## 📞 **Contato**

**Mauricio Fernandes Leite**
- Email: mauricio.fernandes@pucminas.br
- GitHub: [@MF300175](https://github.com/MF300175)

---

**PUC Minas - Engenharia de Software** 🏛️