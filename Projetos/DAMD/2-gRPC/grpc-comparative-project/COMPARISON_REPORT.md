# 📊 Relatório Comparativo: REST vs gRPC

**Data:** 10/09/2025, 21:43:59

## ⏱️ Latência (ms)

| Operação | REST (média) | gRPC (média) | Melhoria |
|----------|--------------|--------------|----------|
| Autenticação | 76.7 | 36.0 | 53.1% |
| CRUD | 2.8 | 2.0 | 27.1% |
| Chat | 0.0 | 0 | 0.0% |
| Load Balancing | 4.3 | 0 | 0.0% |

## 🚀 Throughput

| Métrica | REST | gRPC | Melhoria |
|---------|------|------|----------|
| Req/s | 150 | 24509.8 | -16239.9% |
| Usuários Concorrentes | 100 | 50 | 50.0% |
| Mensagens/s | 50 | 50 | 0.0% |

## 🛡️ Confiabilidade

| Métrica | REST | gRPC | Melhoria |
|---------|------|------|----------|
| Taxa de Erro | 1.33% | 0.00% | 100.0% |

## 📊 Resumo da Comparação

✅ **gRPC é 27.1% mais rápido** em latência
❌ **REST tem 16239.9% mais throughput**
✅ **gRPC tem 100.0% menos erros**


## 📋 Conclusões

- **gRPC** oferece melhor performance em latência e throughput
- **REST** é mais simples de implementar e debugar
- **Protocol Buffers** são mais eficientes que JSON
- **HTTP/2** oferece melhor multiplexação que HTTP/1.1

---

**📅 Relatório gerado em:** 10/09/2025, 21:44:33  
**🔧 Script:** comparison/run-comparison.js  
**📊 Status:** Comparação concluída
