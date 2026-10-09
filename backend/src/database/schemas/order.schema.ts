import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types, HydratedDocument } from 'mongoose';
import { InternalOrderStatus, OrderConfirmationStatus } from '@foodcompare/shared-types';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
export class OrderItem {
  @Prop({ required: true })
  foodItemId!: string;

  @Prop({ type: String, default: null })
  providerMenuItemId?: string | null;

  @Prop({ required: true, trim: true, maxlength: 200 })
  name!: string;

  @Prop({ trim: true, default: '', maxlength: 80 })
  portionSize!: string;

  @Prop({ type: Number, required: true, min: 0 })
  unitPrice!: number;

  @Prop({ type: Number, required: true, min: 1 })
  quantity!: number;

  @Prop({ default: true })
  available!: boolean;
}

@Schema({ _id: false })
export class OrderPriceBreakdown {
  @Prop({ type: Number, default: 0 }) itemSubtotal!: number;
  @Prop({ type: Number, default: 0 }) itemDiscount!: number;
  @Prop({ type: Number, default: 0 }) deliveryFee!: number;
  @Prop({ type: Number, default: 0 }) platformFee!: number;
  @Prop({ type: Number, default: 0 }) packagingFee!: number;
  @Prop({ type: Number, default: 0 }) tax!: number;
  @Prop({ type: Number, default: 0 }) otherFees!: number;
  @Prop({ type: Number, default: 0 }) couponDiscount!: number;
  @Prop({ type: Number, default: 0 }) estimatedTotal!: number;
  @Prop({ default: 'INR' }) currency!: string;
}

@Schema({ timestamps: true, collection: 'orders' })
export class Order {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, unique: true, trim: true, maxlength: 40 })
  internalReference!: string;

  @Prop({ required: true, trim: true, maxlength: 120, index: true })
  idempotencyKey!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Provider', required: true })
  providerId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Restaurant', default: null })
  restaurantId?: Types.ObjectId | null;

  @Prop({ type: String, trim: true, default: null, maxlength: 200 })
  restaurantName?: string | null;

  @Prop({ type: [OrderItem], default: [] })
  items!: OrderItem[];

  @Prop({ type: OrderPriceBreakdown, required: true })
  priceBreakdown!: OrderPriceBreakdown;

  @Prop({
    type: String,
    enum: Object.values(InternalOrderStatus),
    default: InternalOrderStatus.Draft,
  })
  internalStatus!: InternalOrderStatus;

  @Prop({ type: String, trim: true, default: null, maxlength: 160 })
  providerOrderReference?: string | null;

  @Prop({ type: String, trim: true, default: null, maxlength: 80 })
  providerStatus?: string | null;

  @Prop({
    type: String,
    enum: Object.values(OrderConfirmationStatus),
    default: OrderConfirmationStatus.NotConfirmed,
  })
  orderConfirmationStatus!: OrderConfirmationStatus;

  @Prop({ type: String, trim: true, default: null })
  officialOrderUrl?: string | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Address', default: null })
  addressId?: Types.ObjectId | null;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
