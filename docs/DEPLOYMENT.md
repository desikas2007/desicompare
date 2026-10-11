# Deployment

## Docker (recommended)

The repository ships a root `Dockerfile` (API), `frontend/Dockerfile` (Next.js), and
`docker-compose.yml` (MongoDB + API + web).

```bash
docker compose up --build
```

| Service | Port |
| --- | --- |
| MongoDB | 27017 |
| API | 4000 |
| Web | 3000 |

`NEXT_PUBLIC_API_URL` is baked into the web bundle at build time (via the `build.args` key in
`docker-compose.yml`) and must match the URL clients use, e.g. the public domain behind your
reverse proxy.

## Manual production deployment

### 1. Build

```bash
npm ci
npm run build:shared
npm run build:api     # → backend/dist
npm run build:web     # → frontend/.next
```

Set `NEXT_PUBLIC_API_URL` for the web build (`frontend/.env.production` or at process level).

### 2. Run the API

```bash
cd backend
NODE_ENV=production node dist/main.js
```

### 3. Run the web app

```bash
cd frontend
npm run start          # Next.js production server on :3000
```

Optionally configure a reverse proxy (Caddy/NGINX) in front of both, terminating TLS and routing:

- `https://app.example.com/*` → web (`:3000`)
- `https://app.example.com/api/v1/*` → API (`:4000`)

## Production checklist

- [ ] Strong secrets: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` (≥32 chars each). The API **refuses to boot** in production with the placeholders.
- [ ] `FRONTEND_URL` matches the real frontend origin for CORS.
- [ ] HTTPS everywhere; the refresh cookie is `Secure`.
- [ ] MongoDB: Atlas or a replicated local deployment with backups; set `MONGODB_URI` accordingly.
- [ ] `PROVIDER_INTEGRATION_MODE=demo` unless a real integration is configured (see [PROVIDER_INTEGRATION.md](PROVIDER_INTEGRATION.md)).
- [ ] SMTP settings for password reset/verification emails; without them, reset tokens are only logged.
- [ ] Scale hints: the API is stateless (aside from Mongo) — run multiple replicas behind a load balancer; use sticky-free cookie consistency by pinning `COOKIE_SECRET`. Rotate Mongo credentials.
- [ ] Set `LOG_LEVEL=info` (or lower in dev) and route logs to a central collector.

## Environment variables

Full reference and defaults: see [SETUP_GUIDE.md](SETUP_GUIDE.md#2-configure-environment). Env
files are gitignored and need to be created per target environment.