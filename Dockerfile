# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Copy manifests first to leverage Docker layer caching for dependencies.
COPY package.json package-lock.json ./
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN npm ci

# Copy sources and build the shared package + the API.
COPY packages/shared-types packages/shared-types
COPY backend backend
RUN npm run build:shared && npm run build -w @foodcompare/api

# ---------- Runtime stage ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package.json package.json
COPY --from=builder /app/packages/shared-types packages/shared-types
COPY --from=builder /app/backend/package.json backend/package.json
COPY --from=builder /app/backend/dist backend/dist

WORKDIR /app/backend
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
