import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { FoodItemSummary } from '@foodcompare/shared-types';
import { ModelNames } from '../database/model-names';
import { FoodItem } from '../database/schemas/food-item.schema';
import { RestaurantDocument, Restaurant } from '../database/schemas/restaurant.schema';
import { normalizeName } from '../common/utils/normalize';
import { paginate, Paginated } from '../common/dto/pagination.dto';
import { FoodItemQueryDto } from './dto/food-item-query.dto';
import { RestaurantsService } from '../restaurants/restaurants.service';

export interface FoodItemDetail extends FoodItemSummary {
  restaurant: { id: string; displayName: string; cuisine: string[] } | null;
}

@Injectable()
export class FoodItemsService {
  constructor(
    @InjectModel(ModelNames.FoodItem) private readonly foodItemModel: Model<FoodItem>,
    @InjectModel(ModelNames.Restaurant) private readonly restaurantModel: Model<Restaurant>,
    private readonly restaurants: RestaurantsService,
  ) {}

  async list(query: FoodItemQueryDto): Promise<Paginated<FoodItemSummary>> {
    const filter: FilterQuery<FoodItem> = { isActive: true };
    if (query.q) {
      const regex = new RegExp(normalizeName(query.q), 'i');
      filter.$or = [{ normalizedName: regex }, { category: regex }];
    }
    if (query.category) filter.category = new RegExp(normalizeName(query.category), 'i');
    if (query.dietaryType) filter.dietaryType = query.dietaryType;
    if (query.mealType) filter.mealTypes = query.mealType;
    if (query.restaurantId) filter.restaurantId = new Types.ObjectId(query.restaurantId);

    const [docs, total] = await Promise.all([
      this.foodItemModel
        .find(filter)
        .sort({ displayName: 1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .exec(),
      this.foodItemModel.countDocuments(filter).exec(),
    ]);
    return paginate(
      docs.map((d) => this.restaurants.toFoodSummary(d)),
      total,
      query.page,
      query.limit,
    );
  }

  async getById(id: string): Promise<FoodItemDetail> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Food item not found');
    const doc = await this.foodItemModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Food item not found');
    const restaurant: RestaurantDocument | null = await this.restaurantModel
      .findById(doc.restaurantId)
      .exec();
    return {
      ...this.restaurants.toFoodSummary(doc),
      restaurant: restaurant
        ? {
            id: String(restaurant._id),
            displayName: restaurant.displayName,
            cuisine: restaurant.cuisine ?? [],
          }
        : null,
    };
  }

  async listCategories(): Promise<Array<{ name: string; count: number }>> {
    const result = await this.foodItemModel.aggregate<{ _id: string; count: number }>([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]);
    return result.map((r) => ({ name: r._id, count: r.count }));
  }
}
