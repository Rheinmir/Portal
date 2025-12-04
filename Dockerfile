
# Build Frontend
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Run Server
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=build /app/dist ./dist
COPY server.js .
# Cần copy các file khác nếu server phụ thuộc, ở đây server.js đơn giản

EXPOSE 5464
CMD ["node", "server.js"]
