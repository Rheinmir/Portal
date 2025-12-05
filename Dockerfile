# --- Build Frontend ---
FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# --- Runtime ---
FROM node:18-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --production

COPY --from=build /app/dist ./dist
COPY server.js ./server.js

# DB folder (bind-mounted by docker-compose)
RUN mkdir -p /app/data

EXPOSE 5464
CMD ["node", "server.js"]
