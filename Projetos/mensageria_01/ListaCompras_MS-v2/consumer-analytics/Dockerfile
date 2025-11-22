FROM node:18-alpine

WORKDIR /app

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Expor porta (opcional, para health checks)
EXPOSE 3005

# Comando para executar
CMD ["npm", "start"]
