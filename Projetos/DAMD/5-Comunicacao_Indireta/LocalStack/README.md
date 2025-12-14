## LocalStack - Versão Cloud (Opção B – S3)

Este diretório contém a infraestrutura e o backend da **versão Cloud/LocalStack**
da aplicação de Comunicação Indireta, que armazena fotos em um bucket S3
simulado pelo LocalStack.

- Backend Cloud: `backend-aws/`
- Scripts Docker/infra: este diretório
- Scripts AWS CLI: `aws-cli/`
- Scripts de automação: `scripts/`
- Documentação auxiliar e evidências: `Auxiliar/`

Para detalhes completos do plano de implementação, consulte
`Auxiliar/PLANO_IMPLEMENTACAO_LOCALSTACK.md`.

### Execução em paralelo com versão Offline-First

- Versão Offline-First:
  - Backend: porta `3000` (fora do Docker).
  - App: entrada padrão `main.dart` apontando para `http://<IP>:3000/api`.
- Versão Cloud/LocalStack:
  - Backend-aws: porta `3001` (Docker Compose).
  - App: entrada `main_cloud.dart` apontando para `http://<IP>:3001/api`.

### Endpoints de Upload

O backend oferece dois endpoints para upload de imagens:

1. **POST /api/media/upload** - Base64 (JSON)
   - Recebe imagem codificada em Base64 via JSON
   - Usado pelo app mobile

2. **POST /api/media/upload-multipart** - Multipart (form-data)
   - Recebe arquivo de imagem via multipart/form-data
   - Campo: `image` (arquivo)
   - Campo opcional: `taskId` (texto)
   - Limite: 5MB

Para testar o endpoint multipart, consulte `Auxiliar/TESTE_ENDPOINT_MULTIPART.md`.


