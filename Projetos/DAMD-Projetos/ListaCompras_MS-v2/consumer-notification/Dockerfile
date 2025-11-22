FROM node:20-alpine
WORKDIR /app
COPY consumer-notification/package*.json ./
RUN npm install
COPY consumer-notification/ ./
CMD ["npm", "start"]
