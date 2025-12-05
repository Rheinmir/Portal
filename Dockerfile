FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --production
COPY --from=build /app/dist ./dist
COPY server.js .
RUN mkdir -p /app/data
EXPOSE 5464
CMD ["node", "server.js"]