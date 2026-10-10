# FoodCompare

> Your favorite food. The best price. One place.

FoodCompare is a **provider-agnostic food delivery price comparison platform**. Search for a
dish once and see its true delivered cost — item price, delivery fee, platform fee, packaging,
taxes, and discounts — across every supported provider, ranked by the final total.

This is a full-stack monorepo:

| Package | Tech | Description |
| --- | --- | --- |
| `packages/shared-types` | TypeScript | Shared contracts used by both apps |
| `backend/` | NestJS 10 + Mongoose 8 | REST API, auth, comparison engine, ordering |
| `frontend/` | Next.js 14 (App Router) + React 18 | Customer & admin web app |

> **Honesty first:** no live marketplace price is ever fabricated. Providers run in
> `demo` (deterministic, clearly labelled sample data), `live` (when you configure an
> authorized integration), or `unconfigured` mode, and the UI labels demo quotes explicitly.

---

## Public site vs. protected app

The web app is split into three route groups:

| Group | Routes | Access |
| --- | --- | --- |
| `(marketing)` | `/`, `/about`, `/contact`, `/privacy`, `/terms` | Public, minimal landing experience |
| `(auth)` | `/login`, `/register`, `/forgot-password`, `/reset-password` | Public, animated typography + secure forms |
| `(app)` | `/dashboard`, `/search`, `/restaurants`, `/compare`, `/offers`, `/cart`, `/checkout`, `/orders`, `/profile`, `/admin` | Requires authentication |

The public homepage intentionally shows **only** a hero, a short "how it works" section and a
footer — no dashboard, private data, or internal tools. Every feature page lives behind the
protected `(app)` shell (sidebar + top bar + mobile drawer) and is additionally enforced on the
backend for every API call.

## Features

- **Price comparison** — one query → quotes from every enabled provider, ranked by delivered total, with a potential-savings summary.
- **Dish matching** — normalized-name matching with `exact` / `approximate` / `uncertain` confidence.
- **Search & filters** — keyword, category, cuisine, provider, dietary type, price range, and sorting.
- **Restaurants & menus** — browse restaurants and their menus, grouped by category.
- **Cart & checkout** — anonymous (via `x-cart-id`) or authenticated carts, live fee breakdown at checkout.
- **Orders** — idempotent order creation; external providers are recorded as *unconfirmed* redirects (never faked as confirmed).
- **Offers** — coupons and discounts with verification status labels.
- **Accounts** — registration, login, refresh-token rotation, profile, addresses, favorites.
- **Admin** — platform stats and provider integration status management.
- **Safety rails** — rate limiting, helmet, strict validation (422), structured error envelopes and request correlation IDs.

---

## Quick start

```bash
# 1. Install dependencies (npm workspaces)
npm install

# 2. Configure environment
#    Copy the example and adjust values (MongoDB URI, secrets, ...)
cp .env.example .env

# 3. Build shared types (required before running the apps)
npm run build:shared

# 4. Seed demo data + accounts (requires a reachable MongoDB)
npm run seed

# 5. Run both apps (API :4000, web :3000)
npm run dev
```

- Web app: http://localhost:3000
- API: http://localhost:4000/api/v1
- Swagger docs: http://localhost:4000/api/docs

### Seeded accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@foodcompare.local` | `Admin@12345` |
| Demo user | `demo@foodcompare.local` | `Demo@12345` |

(Override via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_DEMO_EMAIL` / `SEED_DEMO_PASSWORD`.)

---

## Common scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Run API + web concurrently |
| `npm run build` | Build shared types, API, and web |
| `npm run build:shared` | Build the shared types package |
| `npm run seed` | Seed demo data and accounts |
| `npm run lint` | Lint both apps |
| `npm run typecheck` | Typecheck both apps |
| `npm run test` | Run API unit tests |
| `npm run test:web` | Run web unit tests |
| `npm run test:e2e` | Run API e2e tests (needs MongoDB) |

`npm run build:shared` **must** run before starting or building either app, because both consume
the package via its compiled `dist/` output.

---

## Documentation

- [Setup guide](docs/SETUP_GUIDE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API documentation](docs/API_DOCUMENTATION.md)
- [Database schema](docs/DATABASE_SCHEMA.md)
- [Authentication](docs/AUTHENTICATION.md)
- [Provider integration](docs/PROVIDER_INTEGRATION.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Testing](docs/TESTING.md)
- [Security](docs/SECURITY.md)
- [User guide](docs/USER_GUIDE.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Implementation status](docs/IMPLEMENTATION_STATUS.md)

---

## Docker

```bash
docker compose up --build
```

This starts MongoDB, the API (`:4000`), and the web app (`:3000`). See
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production considerations.

---

## License

MIT
