import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, PipelineStage, Types } from 'mongoose';
import { DietaryType, FoodItemSummary, RestaurantSummary } from '@foodcompare/shared-types';
import { ModelNames } from '../database/model-names';
import { FoodItem } from '../database/schemas/food-item.schema';
import { Restaurant } from '../database/schemas/restaurant.schema';
import { Provider } from '../database/schemas/provider.schema';
import { ProviderRestaurant } from '../database/schemas/provider-restaurant.schema';
import { normalizeName } from '../common/utils/normalize';
import { paginate, Paginated } from '../common/dto/pagination.dto';
import { SearchQueryDto } from './dto/search-query.dto';

export interface SearchFoodItem extends FoodItemSummary {
  minPrice: number | null;
  providerCount: number;
}

export interface SearchResult {
  foodItems: Paginated<SearchFoodItem>;
  restaurants: RestaurantSummary[];
  categories: string[];
  suggestions: string[];
}

interface FoodAggDoc {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  displayName: string;
  normalizedName: string;
  description?: string | null;
  category: string;
  imageUrl?: string | null;
  dietaryType: string;
  portionSize: string;
  variants?: Array<{ name: string; portionSize: string; price?: number | null }>;
  isActive: boolean;
  minPrice: number | null;
  providerCount: number;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(ModelNames.FoodItem) private readonly foodItemModel: Model<FoodItem>,
    @InjectModel(ModelNames.Restaurant) private readonly restaurantModel: Model<Restaurant>,
    @InjectModel(ModelNames.Provider) private readonly providerModel: Model<Provider>,
    @InjectModel(ModelNames.ProviderRestaurant)
    private readonly providerRestaurantModel: Model<ProviderRestaurant>,
  ) {}

  async search(query: SearchQueryDto): Promise<SearchResult> {
    const providerDoc = query.provider
      ? await this.providerModel.findOne({ slug: query.provider }).exec()
      : null;

    const [foodItems, restaurants, categories] = await Promise.all([
      this.searchFoodItems(query, providerDoc?._id ? String(providerDoc._id) : undefined),
      this.searchRestaurants(query, providerDoc?._id ? String(providerDoc._id) : undefined),
      this.suggestCategories(query.q),
    ]);

    const suggestions = this.buildSuggestions(query.q, restaurants, foodItems.items);

    return { foodItems, restaurants, categories, suggestions };
  }

  private async searchFoodItems(
    query: SearchQueryDto,
    providerId?: string,
  ): Promise<Paginated<SearchFoodItem>> {
    const match: FilterQuery<FoodItem> = { isActive: true };
    if (query.q) {
      const normalized = normalizeName(query.q);
      const words = normalized.split(' ').filter((w) => w.length > 1);
      const regex = new RegExp(words.join('|') || normalized, 'i');
      match.$or = [{ normalizedName: regex }, { category: regex }];
    }
    if (query.category) match.category = new RegExp(normalizeName(query.category), 'i');
    if (query.dietaryType) match.dietaryType = query.dietaryType;

    const menuMatch = providerId
      ? { providerId: new Types.ObjectId(providerId) }
      : { availability: true };

    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $lookup: {
          from: 'provider_menu_items',
          let: { foodId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$normalizedFoodId', '$$foodId'] } } },
            { $match: menuMatch },
            { $project: { menuPrice: 1 } },
          ],
          as: 'menuItems',
        },
      },
      {
        $addFields: {
          minPrice: { $min: '$menuItems.menuPrice' },
          providerCount: { $size: '$menuItems' },
        },
      },
      { $project: { menuItems: 0 } },
    ];

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const priceMatch: Record<string, number> = {};
      if (query.minPrice !== undefined) priceMatch.$gte = query.minPrice;
      if (query.maxPrice !== undefined) priceMatch.$lte = query.maxPrice;
      pipeline.push({ $match: { minPrice: priceMatch } });
    }

    pipeline.push({ $sort: this.foodSort(query.sort) });
    pipeline.push({
      $facet: {
        items: [{ $skip: (query.page - 1) * query.limit }, { $limit: query.limit }],
        total: [{ $count: 'count' }],
      },
    });

    const [facet] = await this.foodItemModel.aggregate<{
      items: FoodAggDoc[];
      total: Array<{ count: number }>;
    }>(pipeline);

    const total = facet?.total?.[0]?.count ?? 0;
    const items = (facet?.items ?? []).map((doc) => this.toSearchFood(doc));
    return paginate(items, total, query.page, query.limit);
  }

  private async searchRestaurants(
    query: SearchQueryDto,
    providerId?: string,
  ): Promise<RestaurantSummary[]> {
    const filter: FilterQuery<Restaurant> = { isActive: true };
    if (query.q) {
      const normalized = normalizeName(query.q);
      filter.$or = [
        { normalizedName: new RegExp(normalized, 'i') },
        { cuisine: new RegExp(normalized, 'i') },
      ];
    }
    if (query.cuisine) filter.cuisine = new RegExp(normalizeName(query.cuisine), 'i');
    if (query.minRating !== undefined) filter.rating = { $gte: query.minRating };
    if (query.maxDeliveryMinutes !== undefined) {
      // Delivery-time filtering is applied at comparison time; skip here.
    }

    if (providerId) {
      const links = await this.providerRestaurantModel
        .find({ providerId: new Types.ObjectId(providerId), availability: true })
        .select('restaurantId')
        .lean()
        .exec();
      filter._id = { $in: links.map((l) => l.restaurantId) };
    }

    const docs = await this.restaurantModel
      .find(filter)
      .sort({ rating: -1, displayName: 1 })
      .limit(12)
      .lean()
      .exec();

    return docs.map((doc) => ({
      id: String(doc._id),
      displayName: doc.displayName,
      normalizedName: doc.normalizedName,
      cuisine: doc.cuisine ?? [],
      imageUrl: doc.imageUrl ?? null,
      address: doc.address ?? null,
      serviceArea: doc.serviceArea ?? null,
      rating: doc.rating ?? null,
      isActive: doc.isActive,
    }));
  }

  private async suggestCategories(q?: string): Promise<string[]> {
    const filter = q
      ? { category: new RegExp(normalizeName(q), 'i'), isActive: true }
      : { isActive: true };
    const categories = await this.foodItemModel.distinct('category', filter).exec();
    return categories.slice(0, 12);
  }

  private buildSuggestions(
    q: string | undefined,
    restaurants: RestaurantSummary[],
    foods: SearchFoodItem[],
  ): string[] {
    const set = new Set<string>();
    if (q && q.trim().length > 0) set.add(q.trim());
    restaurants.slice(0, 5).forEach((r) => set.add(r.displayName));
    foods.slice(0, 5).forEach((f) => set.add(f.displayName));
    return [...set].slice(0, 8);
  }

  private foodSort(sort: string): Record<string, 1 | -1> {
    switch (sort) {
      case 'price_asc':
        return { minPrice: 1, displayName: 1 };
      case 'price_desc':
        return { minPrice: -1, displayName: 1 };
      case 'rating_desc':
      case 'delivery_asc':
      case 'relevance':
      default:
        return { providerCount: -1, displayName: 1 };
    }
  }

  private toSearchFood(doc: FoodAggDoc): SearchFoodItem {
    return {
      id: String(doc._id),
      restaurantId: String(doc.restaurantId),
      displayName: doc.displayName,
      normalizedName: doc.normalizedName,
      description: doc.description ?? null,
      category: doc.category,
      imageUrl: doc.imageUrl ?? null,
      dietaryType: doc.dietaryType as DietaryType,
      portionSize: doc.portionSize,
      variants: (doc.variants ?? []).map((v) => ({
        name: v.name,
        portionSize: v.portionSize,
        price: v.price ?? null,
      })),
      isActive: doc.isActive,
      minPrice: doc.minPrice ?? null,
      providerCount: doc.providerCount ?? 0,
    };
  }
}
