import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RestaurantDocument = HydratedDocument<Restaurant>;

@Schema({ timestamps: true, collection: 'restaurants' })
export class Restaurant {
  @Prop({ required: true, trim: true, maxlength: 200 })
  normalizedName!: string;

  @Prop({ required: true, trim: true, maxlength: 200 })
  displayName!: string;

  @Prop({ type: [String], default: [] })
  cuisine!: string[];

  @Prop({ type: String, trim: true, default: null })
  imageUrl?: string | null;

  @Prop({ type: String, trim: true, default: null, maxlength: 300 })
  address?: string | null;

  @Prop({ type: String, trim: true, default: null, maxlength: 120 })
  serviceArea?: string | null;

  @Prop({ type: Number, default: null, min: 0, max: 5 })
  rating?: number | null;

  @Prop({ default: true })
  isActive!: boolean;
}

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);
RestaurantSchema.index({ normalizedName: 1 });
RestaurantSchema.index({ displayName: 'text', cuisine: 'text' });
RestaurantSchema.index({ isActive: 1, cuisine: 1 });
