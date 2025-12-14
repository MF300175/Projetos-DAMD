## Backend-AWS (Versão Cloud/LocalStack)

Backend Node.js/Express adaptado da aplicação Offline-First, configurado para
integrar com o LocalStack (S3) para upload de imagens.

- Baseado em: `../Abordagem_Offiline-First/backend`
- Porta padrão: `3001`
- Banco padrão: `database-cloud.db`

### Como rodar localmente (sem Docker)

```bash
cd backend-aws
npm install
npm run dev
```

O servidor subirá em `http://localhost:3001`.

### Endpoints de Upload

#### 1. POST /api/media/upload (Base64)

Recebe imagem em Base64 via JSON.

**Request:**
```json
POST /api/media/upload
Content-Type: application/json

{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "fileName": "foto.jpg",
  "contentType": "image/jpeg",
  "taskId": "123"
}
```

**Response:**
```json
{
  "message": "Imagem enviada com sucesso para o S3 (LocalStack).",
  "bucket": "shopping-images",
  "key": "tasks/foto.jpg",
  "location": "s3://shopping-images/tasks/foto.jpg",
  "taskId": "123"
}
```

#### 2. POST /api/media/upload-multipart (Multipart)

Recebe imagem via Multipart/form-data.

**Request:**
```
POST /api/media/upload-multipart
Content-Type: multipart/form-data

Form Data:
- image: [arquivo de imagem]
- taskId: "123" (opcional)
```

**Exemplo com cURL:**
```bash
curl -X POST http://localhost:3001/api/media/upload-multipart \
  -F "image=@/caminho/para/imagem.jpg" \
  -F "taskId=123"
```

**Exemplo com Postman:**
- Method: POST
- URL: `http://localhost:3001/api/media/upload-multipart`
- Body: form-data
- Key: `image` (tipo: File)
- Key: `taskId` (tipo: Text, opcional)

**Response:**
```json
{
  "message": "Imagem enviada com sucesso para o S3 (LocalStack) via Multipart.",
  "bucket": "shopping-images",
  "key": "tasks/imagem.jpg",
  "location": "s3://shopping-images/tasks/imagem.jpg",
  "taskId": "123",
  "size": 245678,
  "contentType": "image/jpeg"
}
```

### Limites

- Tamanho máximo: 5MB
- Formatos aceitos: Apenas imagens (image/*)
- Campo multipart: `image`
