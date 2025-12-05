# ===========================
# 1) BUILD FRONTEND (Vite)
# ===========================
FROM node:18-slim AS build

# Tối ưu tốc độ cài đặt
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

# Cài dependencies FE + BE chung
RUN npm install

COPY . .

# Build frontend ra thư mục dist/
RUN npm run build

# ===========================
# 2) RUNTIME (Back-end + dist)
# ===========================
FROM node:18-slim

WORKDIR /app

ENV NODE_ENV=production

# Cài dependency runtime cho sharp (rất quan trọng)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Chỉ cài deps production → nhanh
RUN npm install --omit=dev

# Copy frontend build
COPY --from=build /app/dist ./dist

# Copy backend
COPY server.js ./server.js

# Ensure data folders exist
RUN mkdir -p /app/data /app/data/backup

EXPOSE 5464

CMD ["node", "server.js"]