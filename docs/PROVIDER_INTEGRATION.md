# Provider Integration

## Abstraction

The comparison engine never calls a marketplace directly. It resolves a **`ProviderAdapter`** by
slug from `ProviderRegistryService`. The interface (`backend/src/providers/provider-adapter.interface.ts`)
defines:

```
getQuote          → normalized price breakdown for a dish
getOrderQuote     → checkout-level fee breakdown
searchFood        → list of matching dishes at a provider
searchRestaurants → provider's restaurant listing
checkAvailability → provider health / availability
createOrder       → direct (in-app) order placement
```

Every returned quote carries `sourceType: 'demo' | 'live'` so the UI can label honesty —
a demo value is **never** presented as a real price.

## Integration modes

| Mode | Meaning |
| --- | --- |
| `demo` | Deterministic, seeded sample data with a labelled fee model (`DEMO_FEE_MODEL`). Requires no credentials. This is the default. |
| `live` | The provider is marked live and a real `ProviderAdapter` implementation is expected (authorized APIs/config in `Provider.config`). |
| `unconfigured` | Honest "not available" — adapters that know a slug but have no credentials or that the operator disabled. |

`PROVIDER_INTEGRATION_MODE` (default `demo`) selects the adapter set at boot. When a provider is
enabled but has no usable adapter, `UnconfiguredProviderAdapter` returns an unavailable quote
(`{ available: false, ... }`) instead of fabricated pricing.

## Demo fee model

The demo adapter derives a deterministic `estimatedTotal` from the seeded provider menu item:

```
itemPrice        = provider menu list price
deliveryFee      = base  + rupees per km (distance from seed restaurant location ≢ real-world price)
platformFee      = small flat fee
packagingFee     = per quantity
tax              = taxable subtotal × tax rate
discount         = from coupons in the comparison
estimatedTotal   = itemPrice + fees + tax − discount
```

All money is rounded to 2 decimals via `common/utils/money.ts`. Demo delivery times are
deterministic per restaurant/provider. The demo data is created by `npm run seed` and tagged
`sourceType: 'demo'`.

## Adding a real provider

1. Create `backend/src/providers/live/<slug>.adapter.ts` implementing `ProviderAdapter`.
2. Register it in the provider registry alongside the demo adapter, keyed by slug.
3. Store credentials/config on the `Provider` document (`config` object) and rotate them via the
   admin panel rather than committing secrets.
4. Set `PROVIDER_INTEGRATION_MODE=live` and mark the provider `enabled`.
5. Keep `checkAvailability` honest — the `/providers/:id/status` endpoint and comparison flow
   consult it and degrade gracefully when the provider is down.

## Ordering rules

- An order is placed through the adapter only when `capabilities` contains `create_order`.
- Providers without that capability get `internalStatus=redirected` and
  `confirmationStatus=not_confirmed`, with a customer-facing note explaining the order must be
  completed on the provider app. FoodCompare never fabricates a confirmation.
- `getOrderQuote` is used to lock the fee breakdown before order creation.

## Capability matrix (seeded providers)

The seeded providers advertise: `search_food`, `search_restaurants`, `get_quote`, `get_offers`.
None advertise `create_order` in the demo data, so every demo order is recorded as a *redirect*
and the customer is directed to complete it on the provider app. When you integrate a real
provider that supports in-app ordering, add `create_order` to its `capabilities` and implement
`createOrder`.