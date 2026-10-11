# Troubleshooting

## API

### `Cannot find module '@foodcompare/shared-types'`
The shared package isn't built. Run `npm run build:shared` (needed after every change to
`packages/shared-types/src`).

### API starts then exits with a config error
Env validation failed — look at the printed message. Common causes in production: placeholder
`change-me-*` secrets, missing `MONGODB_URI`.

### `ERROR [Mongoose] ... topology was destroyed` / connection refused
MongoDB isn't running or `MONGODB_URI` is wrong. Start MongoDB (or Atlas), then retry:
```bash
docker run -d -p 27017:27017 --name foodcompare-mongo mongo:7
npm run seed
```

### `ECONNREFUSED` from the web app to the API
- Web is calling `NEXT_PUBLIC_API_URL` — check `frontend/.env.local`.
- The API must be reachable at the URL's origin/port, and the CORS origin must match
  `FRONTEND_URL` in the API `.env`.

## Auth

### Login says the password is wrong on a demo account
Run `npm run seed` again — it recreates/updates the accounts and prints fresh credentials.

### Session not restoring / 401 loops
- The refresh cookie `fc_refresh` must be accepted: same site/origin; ensure `Secure` cookies
  aren't being blocked on plain HTTP (they aren't set `Secure` in development).
- After a full logout, clear the stored access token in the browser (`localStorage`).

### Anonymous cart disappears after login
Expected when the user already owns a cart — it wins over the anonymous one. If the user has no
cart, the anonymous cart is adopted.

## Comparisons

### A provider shows "not available"
The provider is disabled, unconfigured, or its `checkAvailability` reports down. Check
`/admin/providers` and `GET /providers/:id/status`. This is intentional — the platform never
fabricates prices from an unavailable integration.

### Inconsistent totals
Demo totals are deterministic by design, but a quote is a point-in-time snapshot. If a dish's
price/availability changed between screenshots, totals can differ; re-run the comparison.

## Build / tooling

### `npm run lint` fails on the backend with `Delete ␍` (prettier/prettier)
A tracked backend file was committed with Windows (CRLF) line endings, which contradicts the
backend's Prettier `endOfLine` rule. Currently this only affects
`backend/src/database/schemas/cart.schema.ts` (59 errors). Fix the repository blob once on a
Linux/macOS checkout or via a renormalization pass, then re-run:

```bash
git add --renormalize .
npm run lint
```

A root `.gitattributes` (`* text=auto` with `eol=lf` for `*.ts`) has been added to prevent
CRLF from being committed again. Fixing the existing file is a formatting-only change and does
not alter schemas or logic.

### `npm install` fails on globs/windows
Use `--no-audit --no-fund` if network sandboxes block the audit/funding calls:
```bash
npm ci --no-audit --no-fund    # or npm install --no-audit --no-fund
```

### Next.js build fails with "Image remote pattern not allowed"
Remote images are restricted via `next.config.js` `images.remotePatterns` (Unsplash/Pexels daily
solid mood photography). Only these hosts are allowed; move any custom image to an allowed host or
add a pattern.

### Jest "ts-jest" confusion
The API consumes `@foodcompare/shared-types` from `dist/`. If a type-only import errors, rebuild
shared types first (`npm run build:shared`).

## Docker

### `docker compose up` — web still returns placeholder API URL
`NEXT_PUBLIC_API_URL` is a build-time value. Rebuild with the right arg:
```bash
docker compose build --build-arg NEXT_PUBLIC_API_URL=https://api.example.com web
```

### Mongo container unhealthy on ARM/M1
Image `mongo:7` may need the arm64 variant — pin a compatible tag (e.g. `mongo:7.0.14`) or use a
managed Atlas cluster.