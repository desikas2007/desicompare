# Architecture

## Overview

```
┌────────────────────┐       HTTPS/JSON       ┌────────────────────────┐
│  frontend          │  ───────────────────▶  │  backend               │
│  Next.js 14        │   /api/v1/*            │  NestJS 10             │
│  React Query       │  ◀───────────────────  │  Guards · Validation   │
│  CSS Modules       │   {success,data,meta}  │  Comparison engine     │
└────────────────────┘                        └───────────┬────────────┘
                                                         │ Mongoose
                                                         ▼
                                              ┌────────────────────────┐
                                              │  MongoDB               │
                                              └────────────────────────┘
                                                         ▲
                                                         │ demo data
                                              ┌────────────────────────┐
                                              │  ProviderAdapter layer │
                                              └────────────────────────┘
```

## Monorepo layout

```
desicompare/
├── package.json              # npm workspaces + orchestration scripts
├── Dockerfile                # API image
├── docker-compose.yml        # mongo + backend + frontend
├── .env.example
├── packages/
│   └── shared-types/         # contracts consumed by both apps
└── backend/                  # NestJS backend
    ├── src/
    │   ├── common/       # guards, interceptors, filters, decorators, utils
    │   ├── config/       # configuration + env validation
    │   ├── database/     # schemas, model names, seed
    │   ├── auth/         # registration, login, tokens, passwords
    │   ├── users/        # profile, addresses, favorites
    │   ├── providers/    # adapter registry + demo adapter
    │   ├── restaurants/  # restaurant list + detail (menu)
    │   ├── food-items/   # dishes + categories
    │   ├── search/       # unified search
    │   ├── comparisons/  # matching + comparison engine
    │   ├── offers/       # coupons
    │   ├── cart/         # cart management
    │   ├── checkout/     # order quote (fees)
    │   ├── orders/       # order creation/history
    │   ├── admin/        # stats + provider management
    │   └── health/       # liveness/readiness
    └── test/             # e2e specs
└── frontend/                  # Next.js frontend
    └── src/
        ├── app/          # routes (App Router)
        ├── components/   # layout, ui, food, comparison, search, providers
        ├── hooks/        # useCart, useDebounce
        ├── lib/          # api-client, format, validation, cart-id
        ├── services/     # typed API wrappers
        └── types/        # re-exports + view models
```

## Backend design

### Request pipeline

Every request passes through, in order:

1. **correlation-id middleware** — attaches/propagates an `x-correlation-id`.
2. **helmet + CORS** — security headers and the configured frontend origin.
3. **ThrottlerGuard** — rate limiting.
4. **JwtAuthGuard** — enforces authentication unless `@Public()`.
5. **RolesGuard** — enforces `@Roles('admin')` where declared.
6. **ValidationPipe** — DTO validation with `errorHttpStatusCode: 422`.
7. **Controller → Service** — business logic.
8. **ResponseEnvelopeInterceptor** — wraps success as `{ success, data, meta? }`.
9. **AllExceptionsFilter** — converts any error into `{ success:false, error:{code,message,details} }`.

### Cross-cutting concerns

- `common/interceptors/response-envelope.interceptor.ts` detects `Paginated<T>` and moves its
  `items` to `data` while promoting `meta` to the envelope.
- `common/filters/all-exceptions.filter.ts` maps HTTP exceptions, Mongoose cast/duplicate-key
  errors, and validation errors to stable machine-readable codes (`VALIDATION_ERROR`,
  `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`, `CONFLICT`, `INTERNAL_ERROR`, ...).
- `common/utils/money.ts` centralises price math (rounding to 2 decimals via `decimal.js`).

### Module boundaries

Each feature is a self-contained NestJS module wired in `app.module.ts`. Databases are exposed
through `MongooseModule.forFeature` inside the owning module; shared models are exported (for
example, `CartModule` exports its Mongoose feature so `CheckoutModule` can reuse it).

## Frontend design

- **App Router** with route-level code splitting. Pages are small client components that read
  URL params and delegate to view components.
- **React Query** manages all server state (queries, mutations, cache invalidation). The cart is
  a single `['cart']` cache entry updated optimistically by mutations.
- **Auth** is an in-memory access token + HttpOnly refresh cookie. `AuthProvider` restores the
  session on mount by calling `/auth/refresh`; `api-client` transparently refreshes once on a
  `401` and retries.
- **Styling** uses CSS Modules over a token-based design system (`globals.css` defines colors,
  spacing, radii, shadows).
- **Forms** use `react-hook-form` + `zod` resolvers, mirroring the backend DTO rules.

## Provider abstraction

The comparison engine never talks to a provider directly. It resolves a `ProviderAdapter` from
`ProviderRegistryService` by slug. The `DemoProviderAdapter` implements the interface against
seeded MongoDB data; `UnconfiguredProviderAdapter` honestly reports unavailability. See
[PROVIDER_INTEGRATION.md](PROVIDER_INTEGRATION.md).

## Data flow: a comparison

1. Client `POST /comparisons` with `{ query, location?, quantity?, providers? }`.
2. `MatchingService` normalizes the query and finds candidate dishes.
3. For each enabled provider, the engine calls `adapter.getQuote(...)` in parallel.
4. Quotes are normalized into `PriceBreakdown`s, ranked by `estimatedTotal`, and the best price
   and savings are computed.
5. The result is persisted (comparison + price quotes) and returned as a `ComparisonResult`.
