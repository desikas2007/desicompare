import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelNames } from '../database/model-names';
import { OfferSchema } from '../database/schemas/offer.schema';
import { ProviderSchema } from '../database/schemas/provider.schema';
import { RestaurantSchema } from '../database/schemas/restaurant.schema';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ModelNames.Offer, schema: OfferSchema },
      { name: ModelNames.Provider, schema: ProviderSchema },
      { name: ModelNames.Restaurant, schema: RestaurantSchema },
    ]),
  ],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
