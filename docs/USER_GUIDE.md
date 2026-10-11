# User Guide

FoodCompare helps you find **the best delivered price** for the dish you're craving across
multiple food-delivery providers.

## Sign in / create an account

- **Register:** name, email, password (min 8 chars with uppercase, lowercase, digit). After
  registering you're signed in automatically.
- **Demo accounts** (from `npm run seed`):
  - Admin: `admin@foodcompare.local` / `Admin@12345`
  - User: `demo@foodcompare.local` / `Demo@12345`

## Find the best price

1. Use the **search bar** on the home page (`/search`) — type a dish such as `paneer tikka`.
2. Refine with filters: category, cuisine, provider, diet type, price range, sort order.
3. Open a dish card and click **Compare prices** to run a comparison across all enabled
   providers, or hit **Compare** from `/compare`.

The comparison screen shows each provider's full breakdown — item price, delivery fee, platform
fee, packaging fee, tax, and discounts — ranked by **delivered total**, plus the best price and
potential savings. Provider integration status and demo-vs-live data are labelled explicitly.

## Restaurants & menus

- `/restaurants` lets you browse restaurants and filter by cuisine.
- A restaurant's detail page shows its full menu grouped by category, with per-provider prices
  and **Add to cart** buttons per provider listing.

## Cart & checkout

- Carts are provider- and restaurant-bound: mixing restaurants or providers conflicts (409).
- Anonymous carts work via a generated `cart-id`; after signing in, your requests use the
  account's cart (anonymous carts are currently kept separate).
- `/cart` lets you adjust quantities or clear the cart.
- `/checkout` shows a live fee quote (`/checkout/quote`) before you place the order.

## Orders

- An order requires a saved address, an optional note, evidence of the quote, and an
  `idempotencyKey`. Submitting the same key twice never creates a duplicate order.
- Because deliveries are completed outside FoodCompare, orders show an **internal status**
  (pending/redirected/submitted) and a **confirmation status** (not_confirmed/pending/confirmed).
  When the provider doesn't support in-app ordering, your order is recorded as a *redirect* with
  a note telling you to finish it on the provider app — this is never misrepresented as done.

## Offers

- `/offers` lists coupons and discounts. Offers can be *verified*, *pending verification*, or
  *unverified*; unverified terms are called out so you can judge before relying on them.

## Profile & favorites

- `/profile` edits your name/phone, manages delivery addresses, and lists your favorite dishes.
- Favorite a dish from its card; favorites appear under `/profile`.

## Admin console

Admin users get **Admin** navigation (`/admin`) with platform stats and provider management —
enabling/disabling providers and adjusting offer status. The API routes are guarded to the
`admin` role.