import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelNames } from '../database/model-names';
import { UserSchema } from '../database/schemas/user.schema';
import { RestaurantSchema } from '../database/schemas/restaurant.schema';
import { FoodItemSchema } from '../database/schemas/food-item.schema';
import { ProviderMenuItemSchema } from '../database/schemas/provider-menu-item.schema';
import { OfferSchema } from '../database/schemas/offer.schema';
import { OrderSchema } from '../database/schemas/order.schema';
import { ComparisonSchema } from '../database/schemas/comparison.schema';
import { PriceQuoteSchema } from '../database/schemas/price-quote.schema';
import { ProvidersModule } from '../providers/providers.module';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    ProvidersModule,
    MongooseModule.forFeature([
      { name: ModelNames.User, schema: UserSchema },
      { name: ModelNames.Restaurant, schema: RestaurantSchema },
      { name: ModelNames.FoodItem, schema: FoodItemSchema },
      { name: ModelNames.ProviderMenuItem, schema: ProviderMenuItemSchema },
      { name: ModelNames.Offer, schema: OfferSchema },
      { name: ModelNames.Order, schema: OrderSchema },
      { name: ModelNames.Comparison, schema: ComparisonSchema },
      { name: ModelNames.PriceQuote, schema: PriceQuoteSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
