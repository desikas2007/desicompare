import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types, HydratedDocument } from 'mongoose';
import { DiscountType } from '@foodcompare/shared-types';

export type OfferDocument = HydratedDocument<Offer>;

@Schema({ timestamps: true, collection: 'offers' })
export class Offer {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Provider', required: true, index: true })
  providerId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Restaurant', default: null, index: true })
  restaurantId?: Types.ObjectId | null;

  @Prop({ type: String, trim: true, uppercase: true, default: null, maxlength: 40 })
  code?: string | null;

  @Prop({ required: true, trim: true, maxlength: 300 })
  description!: string;

  @Prop({ type: String, enum: Object.values(DiscountType), required: true })
  discountType!: DiscountType;

  @Prop({ type: Number, required: true, min: 0 })
  discountValue!: number;

  @Prop({ type: Number, default: null, min: 0 })
  minimumOrderValue?: number | null;

  @Prop({ type: Number, default: null, min: 0 })
  maximumDiscount?: number | null;

  @Prop({ type: Date, default: null })
  startsAt?: Date | null;

  @Prop({ type: Date, default: null })
  expiresAt?: Date | null;

  @Prop({ type: String, trim: true, default: null, maxlength: 1000 })
  terms?: string | null;

  @Prop({
    type: String,
    enum: ['verified', 'unverified', 'demo', 'expired'],
    default: 'unverified',
  })
  verificationStatus!: 'verified' | 'unverified' | 'demo' | 'expired';
}

export const OfferSchema = SchemaFactory.createForClass(Offer);
OfferSchema.index({ verificationStatus: 1, expiresAt: -1 });
OfferSchema.index({ providerId: 1, restaurantId: 1 });
