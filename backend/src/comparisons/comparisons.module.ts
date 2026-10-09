import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelNames } from '../database/model-names';
import { FoodItemSchema } from '../database/schemas/food-item.schema';
import { RestaurantSchema } from '../database/schemas/restaurant.schema';
import { ProviderSchema } from '../database/schemas/provider.schema';
import { ProviderMenuItemSchema } from '../database/schemas/provider-menu-item.schema';
import { ProviderRestaurantSchema } from '../database/schemas/provider-restaurant.schema';
import { ComparisonSchema } from '../database/schemas/comparison.schema';
import { PriceQuoteSchema } from '../database/schemas/price-quote.schema';
import { ProvidersModule } from '../providers/providers.module';
import { ComparisonsService } from './comparisons.service';
import { ComparisonsController } from './comparisons.controller';
import { MatchingService } from './matching.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ModelNames.FoodItem, schema: FoodItemSchema },
      { name: ModelNames.Restaurant, schema: RestaurantSchema },
      { name: ModelNames.Provider, schema: ProviderSchema },
      { name: ModelNames.ProviderMenuItem, schema: ProviderMenuItemSchema },
      { name: ModelNames.ProviderRestaurant, schema: ProviderRestaurantSchema },
      { name: ModelNames.Comparison, schema: ComparisonSchema },
      { name: ModelNames.PriceQuote, schema: PriceQuoteSchema },
    ]),
    ProvidersModule,
  ],
  controllers: [ComparisonsController],
  providers: [ComparisonsService, MatchingService],
  exports: [ComparisonsService, MatchingService],
})
export class ComparisonsModule {}
