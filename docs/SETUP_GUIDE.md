# Setup Guide

## Prerequisites

| Tool | Version |
| --- | --- |
| Node.js | >= 18.18 (20 LTS recommended) |
| npm | >= 9 (workspaces) |
| MongoDB | 6 or 7 (local or Atlas) |

No native build tools are required — the project deliberately uses pure-JS dependencies
(`bcryptjs` instead of `bcrypt`, `decimal.js` for money).

## 1. Install

```bash
npm install
```

npm installs all workspace packages (`packages/*`, `backend`, `frontend`) and hoists shared dependencies.

## 2. Configure environment

Copy the example file and edit it:

```bash
cp .env.example .env
```

Key variables:

| Variable | Purpose | Example |
| --- | --- | --- |
| `NODE_ENV` | Runtime mode | `development` |
| `PORT` | API port | `4000` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |
| `API_GLOBAL_PREFIX` | Route prefix | `api/v1` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/foodcompare` |
| `JWT_ACCESS_SECRET` | Access-token signing secret (≥32 chars) | `...` |
| `JWT_REFRESH_SECRET` | Refresh-token signing secret (≥32 chars) | `...` |
| `COOKIE_SECRET` | Cookie signing secret (≥32 chars) | `...` |
| `ACCESS_TOKEN_TTL` | Access-token lifetime | `15m` |
| `REFRESH_TOKEN_TTL` | Refresh-token lifetime | `30d` |
| `AUTH_COOKIE_NAME` | Refresh cookie name | `fc_refresh` |
| `ALLOW_REGISTRATION` | Allow public sign-ups | `true` |
| `REQUIRE_EMAIL_VERIFICATION` | Enforce email verification | `false` |
| `PROVIDER_INTEGRATION_MODE` | `demo` or `live` | `demo` |
| `RATE_LIMIT_TTL` / `RATE_LIMIT_LIMIT` | Rate limit window / max requests | `60` / `120` |
| `LOG_LEVEL` | Log verbosity | `info` |

Environment variables are validated on boot (`backend/src/config/env.validation.ts`). In
production, missing or weak secrets cause the API to refuse to start.

The web app reads a single public variable:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

Set it in `frontend/.env.local` for local development. If unset it defaults to
`http://localhost:4000/api/v1`.

## 3. Build shared types

```bash
npm run build:shared
```

Both apps import `@foodcompare/shared-types` from its compiled `dist/`. Re-run this whenever the
shared contracts change.

## 4. Start MongoDB

Any of these work:

```bash
# Local install
mongod --dbpath ./data

# or Docker
docker run -d -p 27017:27017 --name foodcompare-mongo mongo:7
```

## 5. Seed demo data

```bash
npm run seed
```

The seed script is idempotent: it upserts 3 providers (`swiggy`, `zomato`, `eatsure`),
restaurants, dishes, provider-menu listings, offers, and the admin/demo accounts. It prints the
account credentials when done.

## 6. Run

```bash
npm run dev
```

Opens the API on `:4000` and the web app on `:3000`. Or run them separately with
`npm run dev:api` and `npm run dev:web`.

## Verify everything

```bash
npm run lint
npm run typecheck
npm run test        # API unit tests
npm run test:web    # web unit tests
```

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md). The most common issue is forgetting
`npm run build:shared` before starting an app, which surfaces as "module not found:
@foodcompare/shared-types".
