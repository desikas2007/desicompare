import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelNames } from '../database/model-names';
import { CartSchema } from '../database/schemas/cart.schema';
import { FoodItemSchema } from '../database/schemas/food-item.schema';
import { ProviderMenuItemSchema } from '../database/schemas/provider-menu-item.schema';
import { ProviderSchema } from '../database/schemas/provider.schema';
import { RestaurantSchema } from '../database/schemas/restaurant.schema';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ModelNames.Cart, schema: CartSchema },
      { name: ModelNames.FoodItem, schema: FoodItemSchema },
      { name: ModelNames.ProviderMenuItem, schema: ProviderMenuItemSchema },
      { name: ModelNames.Provider, schema: ProviderSchema },
      { name: ModelNames.Restaurant, schema: RestaurantSchema },
    ]),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService, MongooseModule],
})
export class CartModule {}
