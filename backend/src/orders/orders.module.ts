import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelNames } from '../database/model-names';
import { OrderSchema } from '../database/schemas/order.schema';
import { ProviderSchema } from '../database/schemas/provider.schema';
import { ProviderRestaurantSchema } from '../database/schemas/provider-restaurant.schema';
import { CartModule } from '../cart/cart.module';
import { CheckoutModule } from '../checkout/checkout.module';
import { ProvidersModule } from '../providers/providers.module';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [
    CartModule,
    CheckoutModule,
    ProvidersModule,
    MongooseModule.forFeature([
      { name: ModelNames.Order, schema: OrderSchema },
      { name: ModelNames.Provider, schema: ProviderSchema },
      { name: ModelNames.ProviderRestaurant, schema: ProviderRestaurantSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
