FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server ./server
RUN mkdir -p /data
EXPOSE 8080
CMD ["node", "server/index.js"]
