import { IntegrationMode, QuoteStatus, SourceType } from '@foodcompare/shared-types';
import { ComparisonsService } from './comparisons.service';
import { MatchingService } from './matching.service';
import { NormalizedQuote, ProviderAdapter } from '../providers/provider-adapter.interface';

function chain<T>(result: T): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  const passthrough = () => obj;
  obj.lean = passthrough;
  obj.select = passthrough;
  obj.sort = passthrough;
  obj.skip = passthrough;
  obj.limit = passthrough;
  obj.exec = () => Promise.resolve(result);
  return obj;
}

function quoteFor(total: number, expiresAt?: Date): NormalizedQuote {
  return {
    providerRestaurantId: 'pr',
    providerItemId: 'pi',
    foodName: 'Chicken Biryani',
    restaurantName: 'Paradise Biryani',
    portionSize: 'Full',
    quantity: 1,
    menuPrice: total,
    itemSubtotal: total,
    itemDiscount: 0,
    deliveryFee: 0,
    platformFee: 0,
    packagingFee: 0,
    tax: 0,
    otherFees: 0,
    couponDiscount: 0,
    estimatedTotal: total,
    currency: 'INR',
    available: true,
    quoteStatus: QuoteStatus.Complete,
    sourceType: SourceType.Demo,
    estimatedDeliveryMinutes: 30,
    expiresAt: expiresAt ?? new Date(Date.now() + 600000),
    notes: [],
  };
}

function adapter(slug: string, quote: NormalizedQuote | Error): ProviderAdapter {
  return {
    context: {
      providerId: slug,
      providerSlug: slug,
      providerName: slug,
      integrationMode: IntegrationMode.Demo,
    },
    capabilities: ['get_quote', 'search_food'],
    searchFood: async () => [],
    searchRestaurants: async () => [],
    getQuote: async () => {
      if (quote instanceof Error) throw quote;
      return quote;
    },
    getOrderQuote: async () => {
      if (quote instanceof Error) throw quote;
      return quote;
    },
    checkAvailability: async () => true,
    createOrder: async () => ({ supported: false, message: 'no' }),
  } as ProviderAdapter;
}

const foodItem = {
  _id: 'food1',
  restaurantId: 'rest1',
  displayName: 'Chicken Biryani',
  normalizedName: 'chicken biryani',
  category: 'Biryani',
  portionSize: 'Full',
  restaurantName: 'Paradise Biryani',
};

function buildService(adapters: Record<string, ProviderAdapter>) {
  const providers = Object.keys(adapters).map((slug, i) => ({
    _id: `p${i + 1}`,
    name: slug,
    slug,
    integrationMode: IntegrationMode.Demo,
    enabled: true,
  }));

  const foodItemModel = {
    find: () => chain([foodItem]),
    findById: () => chain(foodItem),
  };
  const restaurantModel = { findById: () => chain({ displayName: 'Paradise Biryani' }) };
  const providerMenuItemModel = {
    find: () => chain([{ providerRestaurantId: 'pr', providerItemId: 'pi' }]),
  };
  const providerRestaurantModel = {
    find: () =>
      chain(providers.map((p) => ({ providerId: p._id, officialUrl: `https://${p.slug}.com` }))),
  };
  const providerModel = { find: () => chain(providers) };
  const comparisonModel = {
    create: (doc: Record<string, unknown>) => Promise.resolve({ ...doc, _id: 'cmp1' }),
  };
  const priceQuoteModel = { create: () => Promise.resolve({}) };

  const registry = {
    getAdapterBySlug: async (slug: string) => adapters[slug],
  };

  const logger = { log: () => undefined, warn: () => undefined, error: () => undefined };

  return new ComparisonsService(
    foodItemModel as never,
    restaurantModel as never,
    providerMenuItemModel as never,
    providerRestaurantModel as never,
    providerModel as never,
    comparisonModel as never,
    priceQuoteModel as never,
    new MatchingService(),
    registry as never,
    logger as never,
  );
}

describe('ComparisonsService', () => {
  it('ranks providers and highlights the cheapest eligible total', async () => {
    const service = buildService({
      swiggy: adapter('swiggy', quoteFor(400)),
      zomato: adapter('zomato', quoteFor(360)),
    });
    const result = await service.compare({ query: 'chicken biryani', quantity: 1 });
    expect(result.bestQuote?.providerSlug).toBe('zomato');
    expect(result.bestQuote?.breakdown.estimatedTotal).toBe(360);
    expect(result.potentialSavings).toBe(40);
    expect(result.isDemoData).toBe(true);
  });

  it('isolates a failing provider so other results still return', async () => {
    const service = buildService({
      swiggy: adapter('swiggy', quoteFor(400)),
      zomato: adapter('zomato', new Error('provider down')),
    });
    const result = await service.compare({ query: 'chicken biryani', quantity: 1 });
    expect(result.quotes).toHaveLength(1);
    expect(result.bestQuote?.providerSlug).toBe('swiggy');
    expect(result.bestQuote?.breakdown.estimatedTotal).toBe(400);
  });

  it('never labels an expired quote as the best price', async () => {
    const expired = quoteFor(100, new Date(Date.now() - 60_000));
    const service = buildService({
      swiggy: adapter('swiggy', expired),
      zomato: adapter('zomato', quoteFor(300)),
    });
    const result = await service.compare({ query: 'chicken biryani', quantity: 1 });
    expect(result.bestQuote?.providerSlug).toBe('zomato');
    const expiredQuote = result.quotes.find((q) => q.providerSlug === 'swiggy');
    expect(expiredQuote?.quoteStatus).toBe(QuoteStatus.Expired);
  });
});
