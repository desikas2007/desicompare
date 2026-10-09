/**
 * FoodCompare seed script.
 *
 * Creates clearly-labelled DEMONSTRATION data (providers, restaurants, food
 * items, provider menu mappings and offers) plus an admin and a demo account.
 * Idempotent: safe to run repeatedly — records are upserted by natural keys.
 *
 * It does NOT represent live provider pricing. Providermenu prices here are
 * illustrative and only used when PROVIDER_INTEGRATION_MODE=demo.
 *
 * Usage: npm run seed            (development)
 *        npm run seed:prod       (compiled, after build)
 */
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

import { ModelNames } from './model-names';
import { normalizeName } from '../common/utils/normalize';
import { ProviderSchema } from './schemas/provider.schema';
import { RestaurantSchema } from './schemas/restaurant.schema';
import { FoodItemSchema } from './schemas/food-item.schema';
import { ProviderRestaurantSchema } from './schemas/provider-restaurant.schema';
import { ProviderMenuItemSchema } from './schemas/provider-menu-item.schema';
import { OfferSchema } from './schemas/offer.schema';
import { UserSchema } from './schemas/user.schema';

interface ProviderSeed {
  name: string;
  slug: string;
  integrationMode: 'demo' | 'unconfigured';
  officialWebsite: string;
  capabilities: string[];
  statusNote: string;
}

interface RestaurantSeed {
  key: string;
  name: string;
  cuisine: string[];
  rating: number;
  serviceArea: string;
  address: string;
  providers: string[];
}

interface DishSeed {
  restaurant: string;
  name: string;
  category: string;
  dietaryType: 'veg' | 'non_veg' | 'vegan' | 'unknown';
  portionSize: string;
  price: number;
  description: string;
}

const PROVIDERS: ProviderSeed[] = [
  {
    name: 'Swiggy',
    slug: 'swiggy',
    integrationMode: 'demo',
    officialWebsite: 'https://www.swiggy.com',
    capabilities: ['search_food', 'search_restaurants', 'get_quote', 'get_offers'],
    statusNote: 'Demonstration data only. Live integration requires an authorized partnership.',
  },
  {
    name: 'Zomato',
    slug: 'zomato',
    integrationMode: 'demo',
    officialWebsite: 'https://www.zomato.com',
    capabilities: ['search_food', 'search_restaurants', 'get_quote', 'get_offers'],
    statusNote: 'Demonstration data only. Live integration requires an authorized partnership.',
  },
  {
    name: 'EatSure',
    slug: 'eatsure',
    integrationMode: 'demo',
    officialWebsite: 'https://www.eatsure.com',
    capabilities: ['search_food', 'search_restaurants', 'get_quote', 'get_offers'],
    statusNote: 'Demonstration data only. Live integration requires an authorized partnership.',
  },
];

const RESTAURANTS: RestaurantSeed[] = [
  {
    key: 'paradise',
    name: 'Paradise Biryani',
    cuisine: ['Biryani', 'Hyderabadi', 'North Indian'],
    rating: 4.3,
    serviceArea: 'Koramangala, Bengaluru',
    address: '80 Feet Road, Koramangala 4th Block, Bengaluru',
    providers: ['swiggy', 'zomato', 'eatsure'],
  },
  {
    key: 'dominos',
    name: "Domino's Pizza",
    cuisine: ['Pizza', 'Italian', 'Fast Food'],
    rating: 4.1,
    serviceArea: 'Indiranagar, Bengaluru',
    address: '100 Feet Road, Indiranagar, Bengaluru',
    providers: ['swiggy', 'zomato'],
  },
  {
    key: 'saravana',
    name: 'Saravana Bhavan',
    cuisine: ['South Indian', 'Vegetarian'],
    rating: 4.4,
    serviceArea: 'Jayanagar, Bengaluru',
    address: '11th Main Road, Jayanagar 4th Block, Bengaluru',
    providers: ['swiggy', 'zomato', 'eatsure'],
  },
  {
    key: 'wowmomo',
    name: 'Wow! Momo',
    cuisine: ['Chinese', 'Momos', 'Tibetan'],
    rating: 3.9,
    serviceArea: 'HSR Layout, Bengaluru',
    address: '27th Main, HSR Layout Sector 2, Bengaluru',
    providers: ['swiggy', 'zomato'],
  },
  {
    key: 'behrouz',
    name: 'Behrouz Biryani',
    cuisine: ['Biryani', 'Mughlai'],
    rating: 4.2,
    serviceArea: 'Whitefield, Bengaluru',
    address: 'ITPL Main Road, Whitefield, Bengaluru',
    providers: ['swiggy', 'zomato'],
  },
  {
    key: 'truffles',
    name: 'Truffles',
    cuisine: ['Burgers', 'American', 'Continental'],
    rating: 4.5,
    serviceArea: 'St. Marks Road, Bengaluru',
    address: 'St. Marks Road, Bengaluru',
    providers: ['swiggy', 'zomato', 'eatsure'],
  },
];

const DISHES: DishSeed[] = [
  {
    restaurant: 'paradise',
    name: 'Chicken Biryani (Half)',
    category: 'Biryani',
    dietaryType: 'non_veg',
    portionSize: 'Half (serves 1)',
    price: 249,
    description: 'Fragrant basmati rice layered with spiced chicken.',
  },
  {
    restaurant: 'paradise',
    name: 'Chicken Biryani (Full)',
    category: 'Biryani',
    dietaryType: 'non_veg',
    portionSize: 'Full (serves 2)',
    price: 349,
    description: 'Signature Hyderabadi chicken biryani, full portion.',
  },
  {
    restaurant: 'paradise',
    name: 'Mutton Biryani (Full)',
    category: 'Biryani',
    dietaryType: 'non_veg',
    portionSize: 'Full (serves 2)',
    price: 429,
    description: 'Slow-cooked mutton biryani with saffron.',
  },
  {
    restaurant: 'paradise',
    name: 'Veg Biryani (Full)',
    category: 'Biryani',
    dietaryType: 'veg',
    portionSize: 'Full (serves 2)',
    price: 299,
    description: 'Vegetable dum biryani with fresh herbs.',
  },
  {
    restaurant: 'dominos',
    name: 'Margherita Pizza (Regular)',
    category: 'Pizza',
    dietaryType: 'veg',
    portionSize: 'Regular 7"',
    price: 219,
    description: 'Classic cheese and tomato pizza.',
  },
  {
    restaurant: 'dominos',
    name: 'Margherita Pizza (Medium)',
    category: 'Pizza',
    dietaryType: 'veg',
    portionSize: 'Medium 10"',
    price: 399,
    description: 'Classic cheese and tomato pizza, medium.',
  },
  {
    restaurant: 'dominos',
    name: 'Farmhouse Pizza (Medium)',
    category: 'Pizza',
    dietaryType: 'veg',
    portionSize: 'Medium 10"',
    price: 449,
    description: 'Onion, capsicum, tomato and mushroom.',
  },
  {
    restaurant: 'dominos',
    name: 'Pepper Barbecue Chicken Pizza (Medium)',
    category: 'Pizza',
    dietaryType: 'non_veg',
    portionSize: 'Medium 10"',
    price: 489,
    description: 'Barbecue chicken with pepper and cheese.',
  },
  {
    restaurant: 'saravana',
    name: 'Masala Dosa',
    category: 'South Indian',
    dietaryType: 'veg',
    portionSize: '1 plate',
    price: 129,
    description: 'Crisp dosa with spiced potato filling.',
  },
  {
    restaurant: 'saravana',
    name: 'Ghee Roast Dosa',
    category: 'South Indian',
    dietaryType: 'veg',
    portionSize: '1 plate',
    price: 179,
    description: 'Dosa roasted in ghee, served with chutney.',
  },
  {
    restaurant: 'saravana',
    name: 'South Indian Thali',
    category: 'South Indian Meals',
    dietaryType: 'veg',
    portionSize: '1 thali',
    price: 249,
    description: 'Complete south Indian meal with rice and curries.',
  },
  {
    restaurant: 'saravana',
    name: 'Filter Coffee',
    category: 'Beverages',
    dietaryType: 'veg',
    portionSize: '150 ml',
    price: 49,
    description: 'Traditional south Indian filter coffee.',
  },
  {
    restaurant: 'wowmomo',
    name: 'Steamed Chicken Momos',
    category: 'Momos',
    dietaryType: 'non_veg',
    portionSize: '6 pcs',
    price: 149,
    description: 'Steamed dumplings with minced chicken.',
  },
  {
    restaurant: 'wowmomo',
    name: 'Pan Fried Veg Momos',
    category: 'Momos',
    dietaryType: 'veg',
    portionSize: '6 pcs',
    price: 139,
    description: 'Pan-fried dumplings with vegetable filling.',
  },
  {
    restaurant: 'wowmomo',
    name: 'Hakka Noodles',
    category: 'Noodles',
    dietaryType: 'veg',
    portionSize: '1 bowl',
    price: 189,
    description: 'Stir-fried hakka noodles with vegetables.',
  },
  {
    restaurant: 'wowmomo',
    name: 'Chicken Fried Rice',
    category: 'Fried Rice',
    dietaryType: 'non_veg',
    portionSize: '1 bowl',
    price: 209,
    description: 'Wok-tossed fried rice with chicken.',
  },
  {
    restaurant: 'behrouz',
    name: 'Chicken Biryani (1 kg)',
    category: 'Biryani',
    dietaryType: 'non_veg',
    portionSize: '1 kg',
    price: 549,
    description: 'Royal chicken biryani, serves a family.',
  },
  {
    restaurant: 'behrouz',
    name: 'Mutton Biryani (1 kg)',
    category: 'Biryani',
    dietaryType: 'non_veg',
    portionSize: '1 kg',
    price: 649,
    description: 'Royal mutton biryani, serves a family.',
  },
  {
    restaurant: 'truffles',
    name: 'Classic Cheeseburger',
    category: 'Burgers',
    dietaryType: 'non_veg',
    portionSize: '1 pc',
    price: 249,
    description: 'Beef-style patty with cheese and house sauce.',
  },
  {
    restaurant: 'truffles',
    name: 'Veg Burger',
    category: 'Burgers',
    dietaryType: 'veg',
    portionSize: '1 pc',
    price: 199,
    description: 'Crunchy vegetable patty burger.',
  },
  {
    restaurant: 'truffles',
    name: 'Peri Peri Chicken Burger',
    category: 'Burgers',
    dietaryType: 'non_veg',
    portionSize: '1 pc',
    price: 279,
    description: 'Grilled chicken with peri peri spice.',
  },
  {
    restaurant: 'truffles',
    name: 'Chocolate Brownie',
    category: 'Desserts',
    dietaryType: 'veg',
    portionSize: '1 pc',
    price: 149,
    description: 'Warm fudgy chocolate brownie.',
  },
  {
    restaurant: 'truffles',
    name: 'Cold Coffee',
    category: 'Beverages',
    dietaryType: 'veg',
    portionSize: '300 ml',
    price: 159,
    description: 'Chilled blended coffee with ice cream.',
  },
];

const PRICE_FACTORS: Record<string, number> = { swiggy: 1.0, zomato: 1.04, eatsure: 0.96 };

async function run(): Promise<void> {
  const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/foodcompare';
  console.log(`[seed] Connecting to MongoDB...`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

  const ProviderModel = mongoose.model(ModelNames.Provider, ProviderSchema);
  const RestaurantModel = mongoose.model(ModelNames.Restaurant, RestaurantSchema);
  const FoodItemModel = mongoose.model(ModelNames.FoodItem, FoodItemSchema);
  const ProviderRestaurantModel = mongoose.model(
    ModelNames.ProviderRestaurant,
    ProviderRestaurantSchema,
  );
  const ProviderMenuItemModel = mongoose.model(ModelNames.ProviderMenuItem, ProviderMenuItemSchema);
  const OfferModel = mongoose.model(ModelNames.Offer, OfferSchema);
  const UserModel = mongoose.model(ModelNames.User, UserSchema);

  // 1. Providers
  const providerBySlug = new Map<string, mongoose.Types.ObjectId>();
  for (const p of PROVIDERS) {
    const doc = await ProviderModel.findOneAndUpdate(
      { slug: p.slug },
      {
        $set: {
          name: p.name,
          slug: p.slug,
          enabled: true,
          integrationMode: p.integrationMode,
          capabilities: p.capabilities,
          officialWebsite: p.officialWebsite,
          statusNote: p.statusNote,
          lastSuccessfulSync: new Date(),
        },
      },
      { upsert: true, new: true },
    );
    providerBySlug.set(p.slug, doc._id as mongoose.Types.ObjectId);
  }
  console.log(`[seed] Providers: ${providerBySlug.size}`);

  // 2. Restaurants
  const restaurantByKey = new Map<string, RestaurantSeed & { _id: mongoose.Types.ObjectId }>();
  for (const r of RESTAURANTS) {
    const doc = await RestaurantModel.findOneAndUpdate(
      { normalizedName: normalizeName(r.name) },
      {
        $set: {
          displayName: r.name,
          normalizedName: normalizeName(r.name),
          cuisine: r.cuisine,
          rating: r.rating,
          serviceArea: r.serviceArea,
          address: r.address,
          isActive: true,
        },
      },
      { upsert: true, new: true },
    );
    restaurantByKey.set(r.key, { ...r, _id: doc._id as mongoose.Types.ObjectId });
  }
  console.log(`[seed] Restaurants: ${restaurantByKey.size}`);

  // 3. Food items
  let foodCount = 0;
  for (const d of DISHES) {
    const restaurant = restaurantByKey.get(d.restaurant);
    if (!restaurant) continue;
    await FoodItemModel.findOneAndUpdate(
      { restaurantId: restaurant._id, normalizedName: normalizeName(d.name) },
      {
        $set: {
          restaurantId: restaurant._id,
          displayName: d.name,
          normalizedName: normalizeName(d.name),
          description: d.description,
          category: d.category,
          dietaryType: d.dietaryType,
          portionSize: d.portionSize,
          variants: [{ name: d.portionSize, portionSize: d.portionSize, price: d.price }],
          isActive: true,
        },
      },
      { upsert: true, new: true },
    );
    foodCount += 1;
  }
  console.log(`[seed] Food items: ${foodCount}`);

  // 4. Provider restaurants + menu items
  let linkCount = 0;
  let menuCount = 0;
  for (const d of DISHES) {
    const restaurant = restaurantByKey.get(d.restaurant);
    if (!restaurant) continue;
    const food = await FoodItemModel.findOne({
      restaurantId: restaurant._id,
      normalizedName: normalizeName(d.name),
    });
    if (!food) continue;

    for (const slug of restaurant.providers) {
      const providerId = providerBySlug.get(slug)!;
      const providerRestaurantId = `pr-${slug}-${restaurant.key}`;
      await ProviderRestaurantModel.findOneAndUpdate(
        { providerId, providerRestaurantId },
        {
          $set: {
            providerId,
            providerRestaurantId,
            restaurantId: restaurant._id,
            officialUrl: `https://www.${slug}.com`,
            location: restaurant.serviceArea,
            availability: true,
            lastUpdatedAt: new Date(),
          },
        },
        { upsert: true, new: true },
      );
      linkCount += 1;

      const factor = PRICE_FACTORS[slug] ?? 1;
      const menuPrice = Math.round(d.price * factor);
      const providerItemId = `pi-${slug}-${restaurant.key}-${normalizeName(d.name).replace(/\s+/g, '-')}`;
      await ProviderMenuItemModel.findOneAndUpdate(
        { providerId, providerItemId },
        {
          $set: {
            providerId,
            providerRestaurantId,
            providerItemId,
            normalizedFoodId: food._id,
            displayName: d.name,
            variant: d.portionSize,
            menuPrice,
            currency: 'INR',
            availability: true,
            sourceType: 'demo',
            lastUpdatedAt: new Date(),
          },
        },
        { upsert: true, new: true },
      );
      menuCount += 1;
    }
  }
  console.log(`[seed] Provider-restaurant links: ${linkCount}, menu items: ${menuCount}`);

  // 5. Offers (demonstration only)
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
  const offers = [
    {
      slug: 'swiggy',
      code: 'WELCOME10',
      description: '10% off up to ₹75 on orders above ₹300',
      discountType: 'percentage',
      discountValue: 10,
      minimumOrderValue: 300,
      maximumDiscount: 75,
    },
    {
      slug: 'zomato',
      code: 'ZOMATO50',
      description: 'Flat ₹50 off on orders above ₹400',
      discountType: 'flat',
      discountValue: 50,
      minimumOrderValue: 400,
      maximumDiscount: 50,
    },
    {
      slug: 'eatsure',
      code: 'EAT15',
      description: '15% off up to ₹100 on orders above ₹250',
      discountType: 'percentage',
      discountValue: 15,
      minimumOrderValue: 250,
      maximumDiscount: 100,
    },
  ];
  for (const o of offers) {
    const providerId = providerBySlug.get(o.slug)!;
    await OfferModel.findOneAndUpdate(
      { providerId, code: o.code },
      {
        $set: {
          providerId,
          code: o.code,
          description: o.description,
          discountType: o.discountType,
          discountValue: o.discountValue,
          minimumOrderValue: o.minimumOrderValue,
          maximumDiscount: o.maximumDiscount,
          startsAt: now,
          expiresAt: in30,
          terms: 'Demonstration offer for development only. Not a live provider promotion.',
          verificationStatus: 'demo',
        },
      },
      { upsert: true, new: true },
    );
  }
  console.log(`[seed] Offers: ${offers.length}`);

  // 6. Accounts
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@foodcompare.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345';
  const adminHash = await bcrypt.hash(adminPassword, 12);
  await UserModel.findOneAndUpdate(
    { normalizedEmail: normalizeName(adminEmail) },
    {
      $set: {
        name: 'FoodCompare Admin',
        email: adminEmail,
        normalizedEmail: normalizeName(adminEmail),
        passwordHash: adminHash,
        role: 'admin',
        status: 'active',
        emailVerified: true,
      },
    },
    { upsert: true, new: true },
  );

  const demoEmail = process.env.SEED_DEMO_EMAIL ?? 'demo@foodcompare.local';
  const demoPassword = process.env.SEED_DEMO_PASSWORD ?? 'Demo@12345';
  const demoHash = await bcrypt.hash(demoPassword, 12);
  await UserModel.findOneAndUpdate(
    { normalizedEmail: normalizeName(demoEmail) },
    {
      $set: {
        name: 'Demo User',
        email: demoEmail,
        normalizedEmail: normalizeName(demoEmail),
        passwordHash: demoHash,
        role: 'user',
        status: 'active',
        emailVerified: true,
      },
    },
    { upsert: true, new: true },
  );

  console.log(`[seed] Accounts ready. Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`[seed] Demo user: ${demoEmail} / ${demoPassword}`);
  console.log('[seed] Completed successfully.');

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('[seed] Failed:', error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
