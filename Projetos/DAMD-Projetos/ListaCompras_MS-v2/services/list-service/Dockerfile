FROM node:20-alpine
WORKDIR /app
# Copiar dependências compartilhadas primeiro
COPY lista-compras-microservices/shared ./lista-compras-microservices/shared
# Copiar arquivos do serviço
COPY services/list-service/package*.json ./
RUN npm install
COPY services/list-service/ ./
CMD ["npm", "start"]
