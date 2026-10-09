import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { DietaryType, FoodItemSummary, RestaurantSummary } from '@foodcompare/shared-types';
import { ModelNames } from '../database/model-names';
import { RestaurantDocument, Restaurant } from '../database/schemas/restaurant.schema';
import { FoodItemDocument, FoodItem } from '../database/schemas/food-item.schema';
import { ProviderRestaurant } from '../database/schemas/provider-restaurant.schema';
import { Provider } from '../database/schemas/provider.schema';
import { normalizeName } from '../common/utils/normalize';
import { paginate, Paginated } from '../common/dto/pagination.dto';
import { RestaurantQueryDto } from './dto/restaurant-query.dto';

export interface RestaurantDetail extends RestaurantSummary {
  menu: FoodItemSummary[];
  providers: Array<{ id: string; name: string; slug: string; officialUrl: string | null }>;
}

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectModel(ModelNames.Restaurant) private readonly restaurantModel: Model<Restaurant>,
    @InjectModel(ModelNames.FoodItem) private readonly foodItemModel: Model<FoodItem>,
    @InjectModel(ModelNames.ProviderRestaurant)
    private readonly providerRestaurantModel: Model<ProviderRestaurant>,
    @InjectModel(ModelNames.Provider) private readonly providerModel: Model<Provider>,
  ) {}

  toSummary(doc: RestaurantDocument | (Restaurant & { _id: unknown })): RestaurantSummary {
    const any = doc as unknown as { _id: unknown };
    return {
      id: String(any._id),
      displayName: doc.displayName,
      normalizedName: doc.normalizedName,
      cuisine: doc.cuisine ?? [],
      imageUrl: doc.imageUrl ?? null,
      address: doc.address ?? null,
      serviceArea: doc.serviceArea ?? null,
      rating: doc.rating ?? null,
      isActive: doc.isActive,
    };
  }

  toFoodSummary(doc: FoodItemDocument | (FoodItem & { _id: unknown })): FoodItemSummary {
    const any = doc as unknown as { _id: unknown };
    return {
      id: String(any._id),
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
    };
  }

  async list(query: RestaurantQueryDto): Promise<Paginated<RestaurantSummary>> {
    const filter: FilterQuery<Restaurant> = { isActive: true };
    if (query.q) {
      const regex = new RegExp(normalizeName(query.q), 'i');
      filter.$or = [{ normalizedName: regex }, { cuisine: regex }];
    }
    if (query.cuisine) {
      filter.cuisine = new RegExp(normalizeName(query.cuisine), 'i');
    }

    const [docs, total] = await Promise.all([
      this.restaurantModel
        .find(filter)
        .sort({ rating: -1, displayName: 1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .exec(),
      this.restaurantModel.countDocuments(filter).exec(),
    ]);
    return paginate(
      docs.map((d) => this.toSummary(d)),
      total,
      query.page,
      query.limit,
    );
  }

  async getById(id: string): Promise<RestaurantDetail> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Restaurant not found');
    const restaurant = await this.restaurantModel.findById(id).exec();
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const [menu, links] = await Promise.all([
      this.foodItemModel.find({ restaurantId: restaurant._id, isActive: true }).exec(),
      this.providerRestaurantModel.find({ restaurantId: restaurant._id }).exec(),
    ]);

    const providerIds = links.map((l) => l.providerId);
    const providers = providerIds.length
      ? await this.providerModel.find({ _id: { $in: providerIds }, enabled: true }).exec()
      : [];

    const summaries = providers.map((p) => ({
      id: String(p._id),
      name: p.name,
      slug: p.slug,
      officialUrl: links.find((l) => String(l.providerId) === String(p._id))?.officialUrl ?? null,
    }));

    return {
      ...this.toSummary(restaurant),
      menu: menu.map((m) => this.toFoodSummary(m)),
      providers: summaries,
    };
  }
}
