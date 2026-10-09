import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelNames } from '../database/model-names';
import { RestaurantSchema } from '../database/schemas/restaurant.schema';
import { FoodItemSchema } from '../database/schemas/food-item.schema';
import { ProviderSchema } from '../database/schemas/provider.schema';
import { ProviderRestaurantSchema } from '../database/schemas/provider-restaurant.schema';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsController } from './restaurants.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ModelNames.Restaurant, schema: RestaurantSchema },
      { name: ModelNames.FoodItem, schema: FoodItemSchema },
      { name: ModelNames.Provider, schema: ProviderSchema },
      { name: ModelNames.ProviderRestaurant, schema: ProviderRestaurantSchema },
    ]),
  ],
  controllers: [RestaurantsController],
  providers: [RestaurantsService],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
