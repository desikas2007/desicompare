# Security

## The threat model covers

- **Token theft / XSS** — refresh token lives only in an `HttpOnly`, `SameSite=Lax`, path-scoped
  cookie (`fc_refresh`); the access token is short-lived (`15m` default) and kept in memory on the
  web client. Refresh-token rotation means a stolen token is single-use.
- **Token replay** — each refresh session stores a sha256 hash; using an already-rotated token
  fails and forces a full re-login.
- **Brute force / abuse** — global rate limiting (`ThrottlerGuard`, `RATE_LIMIT_*`), plus
  bcrypt cost factor 12 for passwords.
- **Injection & malformed payloads** — global `ValidationPipe` with `whitelist` stripping unknown
  properties; DTOs are explicit. Mongoose queries go through the app's own services (no raw
  user-supplied operators reach the DB).
- **Secrets in code** — no keys committed; `.env.example` documents placeholders and the API
  refuses to boot in production with default secrets.

## Controls by layer

| Layer | Control |
| --- | --- |
| Transport | helmet security headers, CORS pinned to `FRONTEND_URL`, `Secure` cookies in production |
| API | JWT verification on every request unless `@Public()`; `RolesGuard` for admin endpoints |
| Validation | Zod-style DTOs validated via `class-validator` at 422 |
| Persistence | `normalizedEmail` unique index (case-insensitive), bcrypt password hashes, no PII logging |
| Rate limiting | sliding throttle across the API |
| Dependencies | pure-JS crypto (`bcryptjs`) to avoid native-build supply-chain surprises |

## Password rules

Enforced in `password.service.ts`: minimum length, character-class requirements, no reuse of the
current password on reset, and equality checks against common weak passwords.

## Cookies

Refresh cookie attributes: `HttpOnly`, `SameSite=Lax`, `Path=/api/v1/auth` (scope-limited),
`Secure` in production, signed with `COOKIE_SECRET`. MaxAge matches `REFRESH_TOKEN_TTL`.

## Error handling & logging

A single `AllExceptionsFilter` produces `{ success:false, error:{code,message,details} }` —
details are generic in production to avoid leaking internals (`INTERNAL_ERROR` for unexpected
failures, full stack only at `LOG_LEVEL=debug`). A server-assigned `x-correlation-id` is echoed in
responses to trace failures end-to-end.

## Production checklist (security)

- [ ] Replace all placeholder secrets; length ≥ 32 chars, unique per secret.
- [ ] Force HTTPS; ensure `Secure` cookies are honored by your proxy.
- [ ] Restrict CORS `FRONTEND_URL` to your actual origin.
- [ ] If `ALLOW_REGISTRATION=false`, manage accounts server-side.
- [ ] Rotate Mongo credentials and use a network-isolated deployment.
- [ ] Keep `LOG_LEVEL=info` and collect logs centrally.
- [ ] Regularly `npm audit` dependencies.