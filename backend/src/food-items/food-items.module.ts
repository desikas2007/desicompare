import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelNames } from '../database/model-names';
import { FoodItemSchema } from '../database/schemas/food-item.schema';
import { RestaurantSchema } from '../database/schemas/restaurant.schema';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { FoodItemsService } from './food-items.service';
import { FoodItemsController } from './food-items.controller';
import { CategoriesController } from './categories.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ModelNames.FoodItem, schema: FoodItemSchema },
      { name: ModelNames.Restaurant, schema: RestaurantSchema },
    ]),
    RestaurantsModule,
  ],
  controllers: [FoodItemsController, CategoriesController],
  providers: [FoodItemsService],
  exports: [FoodItemsService],
})
export class FoodItemsModule {}
