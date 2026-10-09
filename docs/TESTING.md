# Testing

## What runs where

| Kind | Command | Environment | Notes |
| --- | --- | --- | --- |
| API unit | `npm run test -w @foodcompare/api` | Jest (node env) | Pure-logic suites — no DB needed |
| API e2e | `npm run test:e2e -w @foodcompare/api` | Jest (`test/jest-e2e.json`) | Requires a running MongoDB |
| Web unit | `npm run test -w @foodcompare/web` | Jest (node env) | Pure utilities only |
| Lint | `npm run lint` | ESLint | Zero-warning policy (`--max-warnings 0`) |
| Types | `npm run typecheck` | `tsc --noEmit` | Both apps |

From the root you can also run everything in one go:

```bash
npm run lint && npm run typecheck && npm run test && npm run test:web
```

## API unit tests

Located co-located as `*.spec.ts`:

- `src/auth/password.service.spec.ts` — hashing/verify/strength policies
- `src/auth/token.service.spec.ts` — JWT + refresh token parsing
- `src/auth/auth.dto.spec.ts` — registration/login DTO validation rules
- `src/common/utils/money.spec.ts` — money rounding/arithmetic
- `src/common/utils/normalize.spec.ts` — text normalization (accents, case, trim)
- `src/comparisons/comparisons.service.spec.ts` — comparison engine with a mocked adapter

Current status: **32 tests passing** across 7 suites.

## API e2e tests

`test/app.e2e-spec.ts` spins up the full Nest application against **MongoDB**
(`MONGODB_URI`, default `mongodb://127.0.0.1:27017/foodcompare_e2e`) and smoke-tests health/auth
flows. Run them after starting a local MongoDB:

```bash
docker run -d -p 27017:27017 --name foodcompare-mongo mongo:7
npm run test:e2e
```

## Web unit tests

`frontend/src/lib/format.test.ts` covers the money/formatting utilities. Kept framework-free
(node env) so they run fast without a browser.

## What is intentionally not tested

- Live provider adapters (they are integrations; verified against real APIs upstream — see
  [PROVIDER_INTEGRATION.md](PROVIDER_INTEGRATION.md)).
- Browser E2E (Playwright) — the flows are documented but require the full stack + MongoDB to be
  running; wiring is deferred as noted in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).

## Writing tests

- Follow existing `describe/it` conventions with explicit titles.
- For services needing Mongoose, inject a mocked model/adapter (see
  `comparisons.service.spec.ts`).
- Money assertions should use `toEqual` on floats rounded to 2 decimals via `money.utils`.