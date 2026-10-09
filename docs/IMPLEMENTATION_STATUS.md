# Implementation Status

> Last verified against a full clean pipeline:
> `npm install` → `build:shared` → `build:api` → `build:web` → `lint` → `typecheck` →
> `test` (API 7 suites / 32 tests) → `test:web` (1 suite / 11 tests). All green.

## Legend

- ✅ Done and verified
- 🚧 Present but with a known gap
- ⬜ Planned / not started

## Backend (`backend`)

| Area | Status | Notes |
| --- | --- | --- |
| Config + env validation | ✅ | Production refuses placeholder secrets |
| Mongo bootstrap + `_id→id` transform | ✅ | |
| Schemas & indexes | ✅ | 14 models; `(userId, idempotencyKey)` unique |
| Seed script | ✅ | Idempotent; providers, catalog, accounts |
| Auth (register/login/refresh/logout) | ✅ | Rotation + revocation, HttpOnly cookie |
| Forgot / reset password | ✅ | API complete; token returned/logged when no SMTP |
| Email verification | 🚧 | Flag exists (`REQUIRE_EMAIL_VERIFICATION`); no e2e coverage for the email path |
| Users (profile, addresses, favorites) | ✅ | |
| Provider adapter registry + demo adapter | ✅ | Deterministic, labelled `sourceType: 'demo'` |
| Search (unified, filtered, sorted) | ✅ | |
| Restaurants + menus | ✅ | |
| Food items + categories | ✅ | |
| Comparisons engine + matching + history | ✅ | Confidence scoring; unit-tested |
| Offers | ✅ | Verified/unverified labelling |
| Cart (anonymous + user) | ✅ | Single provider/restaurant; auth-switches seamlessly |
| Checkout quote | ✅ | |
| Orders (idempotent) | ✅ | Redirect semantics honoured (never faked confirmations) |
| Admin (stats, providers, offers) | ✅ | |
| Health + readiness | ✅ | |
| E2E (MongoDB-backed) | 🚧 | Written (`backend/test`), needs a running MongoDB to execute |

## Frontend (`frontend`)

| Area | Status | Notes |
| --- | --- | --- |
| Design system / tokens + CSS Modules | ✅ | |
| Auth pages (login / register) | ✅ | |
| Forgot / reset password UI | ⬜ | API ready; no UI wired yet |
| Home | ✅ | |
| Search + filters + sort | ✅ | |
| Compare + comparison results | ✅ | Ranking, savings, demo labels |
| Restaurants list + detail menu | ✅ | |
| Offers | ✅ | |
| Cart (anonymous / user) | ✅ | Via `x-cart-id`; no login-merge yet |
| Checkout | ✅ | |
| Orders list + detail | ✅ | |
| Profile (account, addresses) | ✅ | |
| Favorites | 🚧 | List/remove in profile 🚧 add-from-card button not yet wired |
| Admin console | ✅ | Stats + provider management |
| React Query caching & optimistic cart | ✅ | |
| Tests (unit) | ✅ | Pure utils only |

## In progress / deferred

- **Anonymous-cart merge on login** — the backend keeps anonymous and user carts separate; a
  client-side migrate step is planned.
- **Playwright browser E2E** — architecture documented; wiring deferred until a stable demo backend
  (or `docker compose` stack) is running so flakiness is avoided in CI.
- **Favorite "add" affordance on dish cards** — the API and profile list/remove exist; the card
  button is the remaining piece.
- **Password-reset UI** — API + email template exist; a `/auth/reset` flow should be added.
- **Live provider adapters** — integration layer ready; implementing real Swiggy/Zomato/Eatsure
  APIs requires authorized credentials and is out of scope for the demo (`demo` mode is the default).
- **Offer verification automation** — manual status management via admin is in place; automated
  coupon validation would extend it.

## Verification commands (from repo root)

```bash
npm run build:shared && npm run build:api && npm run build:web
npm run lint
npm run typecheck
npm run test        # API: 7 suites, 32 tests
npm run test:web    # web: 1 suite, 11 tests
```