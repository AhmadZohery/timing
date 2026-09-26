# Multi-stage production build for Coolify / Docker
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies with clean cache
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production Node.js Server & Static Host (Zero npm dependencies in runtime)
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=80
ENV DATA_DIR=/app/data

# Copy built frontend assets, production dependencies, and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY server ./server

# Persistent storage volume directory for Coolify
RUN mkdir -p /app/data && chmod 777 /app/data
VOLUME ["/app/data"]

EXPOSE 80

CMD ["node", "server/index.mjs"]
