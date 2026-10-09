import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types, HydratedDocument } from 'mongoose';
import { DietaryType } from '@foodcompare/shared-types';

export type FoodItemDocument = HydratedDocument<FoodItem>;

@Schema({ _id: false })
export class FoodVariant {
  @Prop({ required: true, trim: true, maxlength: 80 })
  name!: string;

  @Prop({ required: true, trim: true, maxlength: 80 })
  portionSize!: string;

  @Prop({ type: Number, default: null })
  price?: number | null;
}

@Schema({ timestamps: true, collection: 'food_items' })
export class FoodItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Restaurant', required: true, index: true })
  restaurantId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  normalizedName!: string;

  @Prop({ required: true, trim: true, maxlength: 200 })
  displayName!: string;

  @Prop({ type: String, trim: true, default: null, maxlength: 1000 })
  description?: string | null;

  @Prop({ required: true, trim: true, maxlength: 80, index: true })
  category!: string;

  @Prop({ type: String, trim: true, default: null })
  imageUrl?: string | null;

  @Prop({ type: String, enum: Object.values(DietaryType), default: DietaryType.Unknown })
  dietaryType!: DietaryType;

  @Prop({ required: true, trim: true, maxlength: 80 })
  portionSize!: string;

  @Prop({ type: [FoodVariant], default: [] })
  variants!: FoodVariant[];

  @Prop({ default: true })
  isActive!: boolean;
}

export const FoodItemSchema = SchemaFactory.createForClass(FoodItem);
FoodItemSchema.index({ restaurantId: 1, normalizedName: 1 });
FoodItemSchema.index({ displayName: 'text', description: 'text', category: 'text' });
FoodItemSchema.index({ category: 1, dietaryType: 1, isActive: 1 });
