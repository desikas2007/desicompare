import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types, HydratedDocument } from 'mongoose';
import { FeedbackCategory, FeedbackStatus } from '@foodcompare/shared-types';

export type FeedbackDocument = HydratedDocument<Feedback>;

@Schema({ timestamps: true, collection: 'feedback' })
export class Feedback {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(FeedbackCategory), required: true, index: true })
  category!: FeedbackCategory;

  @Prop({ type: Number, min: 1, max: 5, default: null })
  rating?: number | null;

  @Prop({ type: String, required: true, trim: true, minlength: 10, maxlength: 2000 })
  message!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Restaurant', default: null, index: true })
  restaurantId?: Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'FoodItem', default: null, index: true })
  foodItemId?: Types.ObjectId | null;

  @Prop({
    type: String,
    enum: Object.values(FeedbackStatus),
    default: FeedbackStatus.New,
    index: true,
  })
  status!: FeedbackStatus;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
FeedbackSchema.index({ userId: 1, createdAt: -1 });
