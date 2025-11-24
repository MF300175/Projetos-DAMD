# Vídeos de Demonstração

Esta pasta contém os vídeos de demonstração do projeto de Lista de Compras com Mensageria RabbitMQ.

## Estrutura Recomendada

- `DAMD_ListaCompras_MS_v2_Mensageria.mp4` - Demonstração completa do sistema
- `DAMD_ListaCompras_MS_v2_Checkout.mp4` - Demonstração do processo de checkout
- `DAMD_ListaCompras_MS_v2_CloudAMQP.mp4` - Demonstração do CloudAMQP Management UI

## Como Adicionar Vídeos

1. Copie os arquivos de vídeo para esta pasta
2. Execute os comandos Git:
   ```bash
   git add Projetos/Videos/
   git commit -m "Adiciona videos da demonstracao"
   git push
   ```

## Nota

Vídeos podem ser grandes. Considere usar Git LFS (Large File Storage) se os arquivos forem muito grandes:

```bash
git lfs track "*.mp4"
git add .gitattributes
git add Projetos/Videos/*.mp4
git commit -m "Adiciona videos usando Git LFS"
```

