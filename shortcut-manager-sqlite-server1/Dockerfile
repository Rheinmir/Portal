FROM node:18-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential git && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-slim
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends libvips && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY server.js .
RUN mkdir -p /app/data /app/data/backup
EXPOSE 5464
CMD ["node", "server.js"]