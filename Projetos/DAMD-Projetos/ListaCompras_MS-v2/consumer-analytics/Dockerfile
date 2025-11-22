FROM node:20-alpine
WORKDIR /app
COPY consumer-analytics/package*.json ./
RUN npm install
COPY consumer-analytics/ ./
CMD ["npm", "start"]
