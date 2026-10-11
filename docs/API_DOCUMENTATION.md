# API Documentation

- **Base URL:** `http://localhost:4000/api/v1`
- **Swagger UI:** `http://localhost:4000/api/docs`
- **Content type:** `application/json`

## Response envelope

Successful responses:

```json
{ "success": true, "data": { }, "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } }
```

`meta` is present only for paginated endpoints. Errors:

```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "details": { } } }
```

Error codes: `VALIDATION_ERROR` (422), `UNAUTHORIZED` (401), `FORBIDDEN` (403),
`NOT_FOUND` (404), `CONFLICT` (409), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500).

## Authentication

Send the access token as `Authorization: Bearer <token>`. The refresh token is also issued as an
HttpOnly cookie (`fc_refresh`). See [AUTHENTICATION.md](AUTHENTICATION.md).

## Anonymous cart

Send `x-cart-id: <uuid>` on cart/checkout/order requests to use an anonymous cart. Authenticated
requests ignore it and use the user's cart. See [AUTHENTICATION.md](AUTHENTICATION.md#anonymous-carts).

---

## Endpoints

### Health — `/health`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | Public | Liveness probe |
| GET | `/health/database` | Public | MongoDB connectivity/readiness |

### Auth — `/auth`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Create an account, returns session |
| POST | `/auth/login` | Public | Email + password login |
| POST | `/auth/refresh` | Refresh cookie/body | Rotate the refresh token, return a new session |
| POST | `/auth/logout` | Bearer | Revoke the current refresh session |
| POST | `/auth/forgot-password` | Public | Request a password-reset email |
| POST | `/auth/reset-password` | Public | Reset the password with a token |
| GET | `/auth/me` | Bearer | Current authenticated user |

### Users — `/users/me`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/users/me` | Bearer | Profile |
| PATCH | `/users/me` | Bearer | Update profile |
| GET | `/users/me/addresses` | Bearer | List addresses |
| POST | `/users/me/addresses` | Bearer | Add address |
| PATCH | `/users/me/addresses/:id` | Bearer | Update address |
| DELETE | `/users/me/addresses/:id` | Bearer | Delete address |
| GET | `/users/me/favorites` | Bearer | List favorite dishes |
| POST | `/users/me/favorites` | Bearer | Add favorite |
| DELETE | `/users/me/favorites/:id` | Bearer | Remove favorite |

### Search — `/search`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/search` | Public | Unified dish/restaurant search with filters |

Query params: `q`, `type`, `category`, `cuisine`, `provider`, `dietType`, `minPrice`,
`maxPrice`, `sort` (`relevance` \| `price_asc` \| `price_desc` \| `rating` \| `popularity`),
`page`, `limit`.

### Restaurants — `/restaurants`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/restaurants` | Public | Paginated restaurant list |
| GET | `/restaurants/:id` | Public | Restaurant detail with menu |

### Food items — `/food-items`, `/categories`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/food-items` | Public | Paginated dishes |
| GET | `/food-items/:id` | Public | Dish detail with provider prices |
| GET | `/food-items/categories` | Public | Dish categories |
| GET | `/categories` | Public | Categories (alias listing) |

### Comparisons — `/comparisons`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/comparisons` | Public (OptionalJwt) | Compare a dish across providers |
| GET | `/comparisons/history` | Bearer | The user's comparison history |
| GET | `/comparisons/:id` | Public | Retrieve a stored comparison |

Body: `{ "query": "paneer butter masala", "location"?: {...}, "quantity"?: 1, "providers"?: ["swiggy"] }`.

### Providers — `/providers`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/providers` | Public | Enabled providers with integration status |
| GET | `/providers/:id/status` | Public | Provider health/status |

### Offers — `/offers`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/offers` | Public | Paginated offers |
| GET | `/offers/:id` | Public | Offer detail |

### Cart — `/cart`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/cart` | OptionalJwt / `x-cart-id` | Get current cart |
| POST | `/cart/items` | OptionalJwt / `x-cart-id` | Add an item |
| PATCH | `/cart/items/:id` | OptionalJwt / `x-cart-id` | Update quantity |
| DELETE | `/cart/items/:id` | OptionalJwt / `x-cart-id` | Remove an item |
| DELETE | `/cart` | OptionalJwt / `x-cart-id` | Clear the cart |

A cart is bound to one provider/restaurant; adding from a different one returns `409 CONFLICT`.

### Checkout — `/checkout`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/checkout/quote` | OptionalJwt / `x-cart-id` | Fee breakdown for the current cart |

### Orders — `/orders`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/orders` | Bearer | Create an order (idempotent) |
| GET | `/orders` | Bearer | Order history |
| GET | `/orders/:id` | Bearer | Order detail |

`POST /orders` requires `idempotencyKey`. Duplicate submission with the same key returns the
existing order instead of creating another.

### Admin — `/admin`

Admin role required.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/admin/stats` | Platform statistics |
| GET | `/admin/providers` | All providers with config |
| PATCH | `/admin/providers/:id` | Enable/disable a provider |
| PATCH | `/admin/offers/:id/status` | Change an offer's status |

---

## Pagination

List endpoints accept `page` (default 1) and `limit` (default 20, capped). The envelope's `meta`
contains `page`, `limit`, `total`, and `totalPages`.
