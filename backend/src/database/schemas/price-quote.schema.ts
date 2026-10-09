import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types, HydratedDocument } from 'mongoose';
import { QuoteStatus, SourceType } from '@foodcompare/shared-types';

export type PriceQuoteDocument = HydratedDocument<PriceQuote>;

@Schema({ timestamps: true, collection: 'price_quotes' })
export class PriceQuote {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Provider', required: true, index: true })
  providerId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 120 })
  providerRestaurantId!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  providerItemId!: string;

  @Prop({ trim: true, default: 'default', maxlength: 120, index: true })
  locationReference!: string;

  @Prop({ type: Number, required: true, min: 0 })
  itemSubtotal!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  itemDiscount!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  deliveryFee!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  platformFee!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  packagingFee!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  tax!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  otherFees!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  couponDiscount!: number;

  @Prop({ type: Number, required: true, min: 0 })
  estimatedTotal!: number;

  @Prop({ default: 'INR', uppercase: true, trim: true, maxlength: 3 })
  currency!: string;

  @Prop({ type: String, enum: Object.values(QuoteStatus), default: QuoteStatus.Complete })
  quoteStatus!: QuoteStatus;

  @Prop({ type: String, enum: Object.values(SourceType), default: SourceType.Demo })
  sourceType!: SourceType;

  @Prop({ type: Number, default: null })
  estimatedDeliveryMinutes?: number | null;

  @Prop({ type: Date, required: true })
  sourceTimestamp!: Date;

  @Prop({ type: Date, default: null })
  expiresAt?: Date | null;
}

export const PriceQuoteSchema = SchemaFactory.createForClass(PriceQuote);
PriceQuoteSchema.index({ providerId: 1, providerItemId: 1, locationReference: 1 });
PriceQuoteSchema.index({ expiresAt: 1 });
