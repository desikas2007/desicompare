import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelNames } from '../database/model-names';
import { ProviderSchema } from '../database/schemas/provider.schema';
import { ProviderMenuItemSchema } from '../database/schemas/provider-menu-item.schema';
import { FoodItemSchema } from '../database/schemas/food-item.schema';
import { RestaurantSchema } from '../database/schemas/restaurant.schema';
import { ProviderRestaurantSchema } from '../database/schemas/provider-restaurant.schema';
import { ProviderRegistryService } from './provider-registry.service';
import { ProvidersController } from './providers.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ModelNames.Provider, schema: ProviderSchema },
      { name: ModelNames.ProviderMenuItem, schema: ProviderMenuItemSchema },
      { name: ModelNames.FoodItem, schema: FoodItemSchema },
      { name: ModelNames.Restaurant, schema: RestaurantSchema },
      { name: ModelNames.ProviderRestaurant, schema: ProviderRestaurantSchema },
    ]),
  ],
  controllers: [ProvidersController],
  providers: [ProviderRegistryService],
  exports: [ProviderRegistryService, MongooseModule],
})
export class ProvidersModule {}
