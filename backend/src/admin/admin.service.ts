import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ModelNames } from '../database/model-names';
import { User } from '../database/schemas/user.schema';
import { Restaurant } from '../database/schemas/restaurant.schema';
import { FoodItem } from '../database/schemas/food-item.schema';
import { ProviderMenuItem } from '../database/schemas/provider-menu-item.schema';
import { Offer } from '../database/schemas/offer.schema';
import { Order } from '../database/schemas/order.schema';
import { Comparison } from '../database/schemas/comparison.schema';
import { PriceQuote } from '../database/schemas/price-quote.schema';
import { ProviderRegistryService, ProviderStatus } from '../providers/provider-registry.service';

export interface AdminStats {
  counts: {
    users: number;
    restaurants: number;
    foodItems: number;
    providerMenuItems: number;
    offers: number;
    orders: number;
    comparisons: number;
    activePriceQuotes: number;
  };
  providers: ProviderStatus[];
  recentProviderFailures: number;
  staleQuotes: number;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(ModelNames.User) private readonly userModel: Model<User>,
    @InjectModel(ModelNames.Restaurant) private readonly restaurantModel: Model<Restaurant>,
    @InjectModel(ModelNames.FoodItem) private readonly foodItemModel: Model<FoodItem>,
    @InjectModel(ModelNames.ProviderMenuItem)
    private readonly providerMenuItemModel: Model<ProviderMenuItem>,
    @InjectModel(ModelNames.Offer) private readonly offerModel: Model<Offer>,
    @InjectModel(ModelNames.Order) private readonly orderModel: Model<Order>,
    @InjectModel(ModelNames.Comparison) private readonly comparisonModel: Model<Comparison>,
    @InjectModel(ModelNames.PriceQuote) private readonly priceQuoteModel: Model<PriceQuote>,
    private readonly registry: ProviderRegistryService,
  ) {}

  async stats(): Promise<AdminStats> {
    const [
      users,
      restaurants,
      foodItems,
      providerMenuItems,
      offers,
      orders,
      comparisons,
      activeQuotes,
      staleQuotes,
    ] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.restaurantModel.countDocuments().exec(),
      this.foodItemModel.countDocuments().exec(),
      this.providerMenuItemModel.countDocuments().exec(),
      this.offerModel.countDocuments().exec(),
      this.orderModel.countDocuments().exec(),
      this.comparisonModel.countDocuments().exec(),
      this.priceQuoteModel.countDocuments({ quoteStatus: { $ne: 'expired' } }).exec(),
      this.priceQuoteModel.countDocuments({ expiresAt: { $lt: new Date() } }).exec(),
    ]);

    const summaries = await this.registry.listProviders();
    const providerStatuses: ProviderStatus[] = [];
    for (const provider of summaries) {
      providerStatuses.push(await this.registry.getStatus(provider.id));
    }

    const recentFailures = await this.comparisonModel
      .countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 3600 * 1000) },
        'providerResults.error': { $exists: true, $ne: null },
      })
      .exec();

    return {
      counts: {
        users,
        restaurants,
        foodItems,
        providerMenuItems,
        offers,
        orders,
        comparisons,
        activePriceQuotes: activeQuotes,
      },
      providers: providerStatuses,
      recentProviderFailures: recentFailures,
      staleQuotes,
    };
  }

  async updateOfferStatus(
    offerId: string,
    status: string,
  ): Promise<{ id: string; verificationStatus: string }> {
    if (!Types.ObjectId.isValid(offerId)) throw new NotFoundException('Offer not found');
    const offer = await this.offerModel.findById(offerId).exec();
    if (!offer) throw new NotFoundException('Offer not found');
    offer.verificationStatus = status as never;
    await offer.save();
    return { id: offerId, verificationStatus: status };
  }
}
