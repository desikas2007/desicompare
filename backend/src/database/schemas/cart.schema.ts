import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types, HydratedDocument } from 'mongoose';

export type CartDocument = HydratedDocument<Cart>;

@Schema({ _id: true })
export class CartItem {
  _id?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'FoodItem', required: true })
  foodItemId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProviderMenuItem', default: null })
  providerMenuItemId?: Types.ObjectId | null;

  @Prop({ required: true, trim: true, maxlength: 200 })
  name!: string;

  @Prop({ trim: true, default: '', maxlength: 80 })
  portionSize!: string;

  @Prop({ type: Number, required: true, min: 0 })
  unitPrice!: number;

  @Prop({ type: Number, required: true, min: 1, max: 50 })
  quantity!: number;

  @Prop({ default: true })
  available!: boolean;
}

@Schema({ timestamps: true, collection: 'carts' })
export class Cart {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null, index: true })
  userId?: Types.ObjectId | null;

  @Prop({ type: String, trim: true, default: null, maxlength: 64, index: true })
  anonymousId?: string | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Provider', default: null })
  providerId?: Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Restaurant', default: null })
  restaurantId?: Types.ObjectId | null;

  @Prop({ type: [CartItem], default: [] })
  items!: CartItem[];

  @Prop({ default: 'INR' })
  currency!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'PriceQuote', default: null })
  quoteReference?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  quoteExpiresAt?: Date | null;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
