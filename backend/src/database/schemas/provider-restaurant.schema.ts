import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types, HydratedDocument } from 'mongoose';

export type ProviderRestaurantDocument = HydratedDocument<ProviderRestaurant>;

@Schema({ timestamps: true, collection: 'provider_restaurants' })
export class ProviderRestaurant {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Provider', required: true, index: true })
  providerId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 120 })
  providerRestaurantId!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Restaurant', required: true, index: true })
  restaurantId!: Types.ObjectId;

  @Prop({ type: String, trim: true, default: null })
  officialUrl?: string | null;

  @Prop({ type: String, trim: true, default: null, maxlength: 200 })
  location?: string | null;

  @Prop({ default: true })
  availability!: boolean;

  @Prop({ type: Date, default: null })
  lastUpdatedAt?: Date | null;
}

export const ProviderRestaurantSchema = SchemaFactory.createForClass(ProviderRestaurant);
ProviderRestaurantSchema.index({ providerId: 1, providerRestaurantId: 1 }, { unique: true });
ProviderRestaurantSchema.index({ restaurantId: 1, providerId: 1 });
