import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelNames } from '../database/model-names';
import { ProviderSchema } from '../database/schemas/provider.schema';
import { ProviderMenuItemSchema } from '../database/schemas/provider-menu-item.schema';
import { CartModule } from '../cart/cart.module';
import { ProvidersModule } from '../providers/providers.module';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';

@Module({
  imports: [
    CartModule,
    ProvidersModule,
    MongooseModule.forFeature([
      { name: ModelNames.Provider, schema: ProviderSchema },
      { name: ModelNames.ProviderMenuItem, schema: ProviderMenuItemSchema },
    ]),
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
