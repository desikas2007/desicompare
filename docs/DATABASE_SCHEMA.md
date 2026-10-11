# Database Schema

MongoDB via Mongoose 8. Every schema is defined in `backend/src/database/schemas/` and
registered under a stable name in `backend/src/database/model-names.ts`.

## Global conventions

- Collections use `_id` (ObjectId). A global transform in `database.module.ts` maps `_id` → `id`
  and drops `__v` on serialization, so the API never leaks Mongo internals.
- Timestamps (`createdAt`, `updatedAt`) are enabled where useful.
- Normalized text fields (`normalizedName`, `normalizedEmail`) are stored lowercase/trimmed so
  unique indexes and lookups are case-insensitive.

## Models

| Model | Collection | Purpose |
| --- | --- | --- |
| `User` | users | Accounts, roles, password hash, verification |
| `RefreshSession` | refreshsessions | Hashed refresh tokens (sha256) for rotation/revocation |
| `Address` | addresses | User delivery addresses |
| `Favorite` | favorites | User → favorite dish links |
| `Provider` | providers | Delivery providers (swiggy/zomato/eatsure) + config |
| `Restaurant` | restaurants | Canonical restaurants |
| `ProviderRestaurant` | providerrestaurants | Provider-specific restaurant listings |
| `FoodItem` | fooditems | Canonical dishes |
| `ProviderMenuItem` | providermenuitems | Provider-specific dish listing + price |
| `PriceQuote` | pricequotes | Stored quote per comparison session |
| `Comparison` | comparisons | A comparison request + ranked results |
| `Offer` | offers | Coupons/discounts |
| `Cart` | carts | Anonymous or user cart |
| `Order` | orders | Placed orders |

### Key fields

**User** — `email`, `normalizedEmail` (unique), `passwordHash`, `name`, `phone?`, `role`
(`user` \| `admin`), `emailVerified`, `status`, timestamps.

**RefreshSession** — `userId`, `tokenHash` (unique), `userAgent?`, `ip?`, `expiresAt`,
`revokedAt?`. Rotated on every refresh; the old record is revoked.

**Provider** — `slug` (unique, e.g. `swiggy`), `name`, `enabled`, `integrationMode`
(`demo` \| `live` \| `unconfigured`), `capabilities[]` (e.g. `create_order`), `feeModel`.

**Restaurant / FoodItem** — canonical catalog with `name`, `normalizedName`, `cuisine`/`category`,
`dietTypes[]`, `rating`, `imageUrl`.

**ProviderRestaurant / ProviderMenuItem** — join provider ↔ canonical entity, holding the
provider's own id plus provider-specific price/availability. Indexed by `(providerId, ...)`.

**PriceQuote** — one provider's normalized breakdown for a comparison:
`providerId`, `comparisonId`, `itemPrice`, `deliveryFee`, `platformFee`, `packagingFee`, `tax`,
`discount`, `estimatedTotal`, `estimatedDeliveryMinutes`, `available`, `sourceType`, `matchConfidence`.

**Comparison** — `userId?`, `query`, `normalizedQuery`, `location?`, `quantity`,
`results[]` (provider ids + totals), `bestProviderId`, `maxSavings`, `createdAt`.

**Cart** — `userId?`, `cartId` (anonymous key, unique when present),
`providerId`/`restaurantId` (one per cart), `items[]` (`foodItemId`, `providerMenuItemId`,
`name`, `quantity`, `unitPrice`).

**Order** — `userId`, `internalReference`, `idempotencyKey` (unique per user),
`providerId`, `restaurantId`, `items[]`, `breakdown`, `internalStatus`, `confirmationStatus`,
`providerOrderReference?`, `providerStatus?`, `officialOrderUrl?`, timestamps.

> `(userId, idempotencyKey)` is a **unique compound index** that makes order creation idempotent.

The `internalStatus` and `confirmationStatus` fields are deliberately separate: an order may be
`redirected` internally while its confirmation status remains `not_confirmed`. FoodCompare never
marks externally-completed orders as confirmed.

## Indexes (examples)

- `User.normalizedEmail` — unique.
- `RefreshSession.tokenHash` — unique; `expiresAt` — TTL-ish cleanup by query.
- `Provider.slug` — unique.
- `FoodItem.normalizedName` — for matching.
- `ProviderMenuItem (providerId, foodItemId)` — lookup.
- `Order (userId, idempotencyKey)` — unique compound.
- `Comparison (userId, createdAt)` — history pagination.

## Seeding

`npm run seed` runs `backend/src/database/seed.ts`. It is idempotent (upserts by natural keys)
and creates 3 providers, the canonical catalog, provider listings, offers, and the admin/demo
accounts. The script always runs in demo mode and clearly sets `sourceType: 'demo'` on demo data.
