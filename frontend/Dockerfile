# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Public env vars must be available at build time for Next.js.
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json package-lock.json ./
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN npm ci

COPY packages/shared-types packages/shared-types
COPY frontend frontend
RUN npm run build:shared && npm run build -w @foodcompare/web

# ---------- Runtime stage ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package.json package.json
COPY --from=builder /app/packages/shared-types packages/shared-types
COPY --from=builder /app/frontend frontend

WORKDIR /app/frontend
EXPOSE 3000

CMD ["npm", "run", "start"]
