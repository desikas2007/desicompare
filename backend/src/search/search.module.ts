import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelNames } from '../database/model-names';
import { FoodItemSchema } from '../database/schemas/food-item.schema';
import { RestaurantSchema } from '../database/schemas/restaurant.schema';
import { ProviderSchema } from '../database/schemas/provider.schema';
import { ProviderRestaurantSchema } from '../database/schemas/provider-restaurant.schema';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ModelNames.FoodItem, schema: FoodItemSchema },
      { name: ModelNames.Restaurant, schema: RestaurantSchema },
      { name: ModelNames.Provider, schema: ProviderSchema },
      { name: ModelNames.ProviderRestaurant, schema: ProviderRestaurantSchema },
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
