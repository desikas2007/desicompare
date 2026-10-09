import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelNames } from '../database/model-names';
import { UserSchema } from '../database/schemas/user.schema';
import { AddressSchema } from '../database/schemas/address.schema';
import { FavoriteSchema } from '../database/schemas/favorite.schema';
import { RestaurantSchema } from '../database/schemas/restaurant.schema';
import { FoodItemSchema } from '../database/schemas/food-item.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ModelNames.User, schema: UserSchema },
      { name: ModelNames.Address, schema: AddressSchema },
      { name: ModelNames.Favorite, schema: FavoriteSchema },
      { name: ModelNames.Restaurant, schema: RestaurantSchema },
      { name: ModelNames.FoodItem, schema: FoodItemSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
