FROM node:20-alpine
WORKDIR /app
# Copiar dependências compartilhadas primeiro
COPY lista-compras-microservices/shared ./lista-compras-microservices/shared
# Copiar arquivos do gateway
COPY api-gateway/package*.json ./
RUN npm install
COPY api-gateway/ ./
CMD ["npm", "start"]
