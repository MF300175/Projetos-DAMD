FROM node:20-alpine
WORKDIR /app
# Copiar dependências compartilhadas primeiro
COPY lista-compras-microservices/shared ./lista-compras-microservices/shared
# Copiar arquivos do serviço
COPY services/user-service/package*.json ./
RUN npm install
COPY services/user-service/ ./
CMD ["npm", "start"]
