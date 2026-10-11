# Authentication

## Session model

FoodCompare uses a **two-token session**:

| Token | Storage | Lifetime | Purpose |
| --- | --- | --- | --- |
| Access token (JWT) | In-memory (client) or `Authorization: Bearer` | `ACCESS_TOKEN_TTL` (default 15m) | Authorizes API calls |
| Refresh token (opaque) | HttpOnly cookie `fc_refresh` + hashed in DB | `REFRESH_TOKEN_TTL` (default 30d) | Acquires new access tokens |

The refresh token is also returned in the response body so a non-browser client can store it
itself. On the browser, only `localStorage`/memory holds the access token; the refresh token is
never readable by JavaScript (`HttpOnly`), mitigating XSS token theft.

## Flow

1. **Register / Login** → API returns `{ accessToken, refreshToken, user }`; the refresh token is
   also set as the `fc_refresh` HttpOnly cookie (`SameSite=Lax`, `Secure` in production).
2. **API calls** → the client sends `Authorization: Bearer <accessToken>`. The guard verifies the
   JWT signature/expiry.
3. **Access token expiry** → the web client's `api-client` catches `401`, calls `/auth/refresh`
   once (using the cookie), retries the original request, and rotates the token.
4. **Refresh rotation** → every `/auth/refresh` creates a new session record (sha256 hash of the
   token), revokes the previous one, and issues a fresh access + refresh pair. Replaying an old,
   revoked refresh token fails → full re-login.

## Password storage & resets

- Passwords are hashed with **bcrypt** (`bcryptjs`, pure JS, cost factor 12).
- `POST /auth/forgot-password` issues a short-lived signed reset token and emails a link (SMTP
  config in `.env`). When `EMAIL_HOST` is empty, the reset token is returned/logged for local
  development instead of a real email.
- `POST /auth/reset-password` accepts `{ token, newPassword }`; the token is single-use.

## Roles

`USER` (default) and `ADMIN`. The `RolesGuard` enforces `@Roles('admin')` on `/admin/*`. Admin
accounts are granted at registration time by environment/config, or promoted in the seed data.

## Anonymous carts

Auth is optional for cart/checkout flows:

- Authenticated ⇒ the user's cart is used; the `x-cart-id` header is ignored.
- Anonymous ⇒ the server uses `x-cart-id: <uuid>` as the cart key and returns it from
  `GET /cart` (via the `X-Cart-Id` response header and body) so the client can persist it.
- The backend does **not** auto-merge an anonymous cart into the user's cart on login; this
  migration is left to the client (currently not wired in the web app — see
  [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)).

## Configuration

| Environment variable | Default | Meaning |
| --- | --- | --- |
| `JWT_ACCESS_SECRET` | `change-me-…` (rejected in production) | Access-token signing secret |
| `JWT_REFRESH_SECRET` | `change-me-…` (rejected in production) | Refresh-token signing secret |
| `COOKIE_SECRET` | `change-me-…` (rejected in production) | Cookie signing secret |
| `ACCESS_TOKEN_TTL` | `15m` | Access token lifetime |
| `REFRESH_TOKEN_TTL` | `30d` | Refresh token lifetime |
| `AUTH_COOKIE_NAME` | `fc_refresh` | Refresh cookie name |
| `ALLOW_REGISTRATION` | `true` | Allow public registration |
| `REQUIRE_EMAIL_VERIFICATION` | `false` | Require verified email before login |