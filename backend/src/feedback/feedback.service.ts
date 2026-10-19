import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { FeedbackStatus, FeedbackSummary } from '@foodcompare/shared-types';
import { ModelNames } from '../database/model-names';
import { Feedback } from '../database/schemas/feedback.schema';
import { Restaurant, RestaurantDocument } from '../database/schemas/restaurant.schema';
import { FoodItem, FoodItemDocument } from '../database/schemas/food-item.schema';
import { User, UserDocument } from '../database/schemas/user.schema';
import { CreateFeedbackDto, FeedbackQueryDto } from './dto/feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(ModelNames.Feedback) private readonly feedbackModel: Model<Feedback>,
    @InjectModel(ModelNames.Restaurant) private readonly restaurantModel: Model<Restaurant>,
    @InjectModel(ModelNames.FoodItem) private readonly foodItemModel: Model<FoodItem>,
    @InjectModel(ModelNames.User) private readonly userModel: Model<User>,
  ) {}

  async create(userId: string, dto: CreateFeedbackDto): Promise<FeedbackSummary> {
    if (dto.restaurantId) {
      const exists = await this.restaurantModel.exists({ _id: dto.restaurantId }).exec();
      if (!exists) throw new NotFoundException('Restaurant not found');
    }
    if (dto.foodItemId) {
      const exists = await this.foodItemModel.exists({ _id: dto.foodItemId }).exec();
      if (!exists) throw new NotFoundException('Food item not found');
    }

    const created = await this.feedbackModel.create({
      userId: new Types.ObjectId(userId),
      category: dto.category,
      rating: dto.rating ?? null,
      message: dto.message.trim(),
      restaurantId: dto.restaurantId ? new Types.ObjectId(dto.restaurantId) : null,
      foodItemId: dto.foodItemId ? new Types.ObjectId(dto.foodItemId) : null,
    });

    const [summary] = await this.hydrate([created]);
    return summary;
  }

  async listMine(userId: string): Promise<FeedbackSummary[]> {
    const items = await this.feedbackModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
    return this.hydrate(items);
  }

  async list(query: FeedbackQueryDto): Promise<FeedbackSummary[]> {
    const filter: FilterQuery<Feedback> = {};
    if (query.status) filter.status = query.status;
    if (query.category) filter.category = query.category;

    const items = await this.feedbackModel.find(filter).sort({ createdAt: -1 }).limit(200).exec();
    return this.hydrate(items);
  }

  async updateStatus(id: string, status: FeedbackStatus): Promise<FeedbackSummary> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Feedback not found');
    const updated = await this.feedbackModel
      .findOneAndUpdate({ _id: id }, { $set: { status } }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Feedback not found');
    const [summary] = await this.hydrate([updated]);
    return summary;
  }

  private async hydrate(items: Feedback[]): Promise<FeedbackSummary[]> {
    const restaurantIds = items
      .filter((item) => item.restaurantId)
      .map((item) => item.restaurantId as Types.ObjectId);
    const foodIds = items
      .filter((item) => item.foodItemId)
      .map((item) => item.foodItemId as Types.ObjectId);
    const userIds = items.map((item) => item.userId);

    const [restaurants, foods, users] = await Promise.all([
      restaurantIds.length
        ? this.restaurantModel.find({ _id: { $in: restaurantIds } }).exec()
        : Promise.resolve([] as RestaurantDocument[]),
      foodIds.length
        ? this.foodItemModel.find({ _id: { $in: foodIds } }).exec()
        : Promise.resolve([] as FoodItemDocument[]),
      userIds.length
        ? this.userModel.find({ _id: { $in: userIds } }).exec()
        : Promise.resolve([] as UserDocument[]),
    ]);

    const restaurantMap = new Map(
      restaurants.map((restaurant) => [String(restaurant._id), restaurant.displayName]),
    );
    const foodMap = new Map(foods.map((food) => [String(food._id), food.displayName]));
    const userMap = new Map(users.map((user) => [String(user._id), user.name]));

    return items.map((item) => {
      const doc = item as unknown as {
        _id: unknown;
        createdAt?: Date;
        updatedAt?: Date;
      };
      return {
        id: String(doc._id),
        userId: String(item.userId),
        userName: userMap.get(String(item.userId)) ?? null,
        category: item.category,
        rating: item.rating ?? null,
        message: item.message,
        restaurantId: item.restaurantId ? String(item.restaurantId) : null,
        foodItemId: item.foodItemId ? String(item.foodItemId) : null,
        restaurantName: item.restaurantId
          ? (restaurantMap.get(String(item.restaurantId)) ?? null)
          : null,
        foodItemName: item.foodItemId ? (foodMap.get(String(item.foodItemId)) ?? null) : null,
        status: item.status,
        createdAt: (doc.createdAt ?? new Date()).toISOString(),
        updatedAt: (doc.updatedAt ?? doc.createdAt ?? new Date()).toISOString(),
      };
    });
  }
}
