import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types, HydratedDocument } from 'mongoose';
import { SourceType } from '@foodcompare/shared-types';

export type ProviderMenuItemDocument = HydratedDocument<ProviderMenuItem>;

@Schema({ timestamps: true, collection: 'provider_menu_items' })
export class ProviderMenuItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Provider', required: true, index: true })
  providerId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 120 })
  providerRestaurantId!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  providerItemId!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'FoodItem', required: true, index: true })
  normalizedFoodId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  displayName!: string;

  @Prop({ type: String, trim: true, default: null, maxlength: 80 })
  variant?: string | null;

  @Prop({ required: true, type: Number, min: 0 })
  menuPrice!: number;

  @Prop({ default: 'INR', uppercase: true, trim: true, maxlength: 3 })
  currency!: string;

  @Prop({ default: true })
  availability!: boolean;

  @Prop({ type: String, enum: Object.values(SourceType), default: SourceType.Demo })
  sourceType!: SourceType;

  @Prop({ type: Date, default: null })
  lastUpdatedAt?: Date | null;
}

export const ProviderMenuItemSchema = SchemaFactory.createForClass(ProviderMenuItem);
ProviderMenuItemSchema.index({ providerId: 1, providerItemId: 1 }, { unique: true });
ProviderMenuItemSchema.index({ normalizedFoodId: 1, providerId: 1 });
