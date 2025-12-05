FROM node:18-alpine AS build
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --production
COPY --from=build /app/dist ./dist
COPY server.js .
RUN mkdir -p /app/data /app/data/backup
EXPOSE 5464
CMD ["node", "server.js"]