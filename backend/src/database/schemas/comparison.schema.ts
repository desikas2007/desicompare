import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types, HydratedDocument } from 'mongoose';
import { MatchConfidence } from '@foodcompare/shared-types';

export type ComparisonDocument = HydratedDocument<Comparison>;

@Schema({ _id: false })
export class ComparisonProviderResult {
  @Prop({ required: true })
  providerId!: string;

  @Prop({ required: true })
  providerName!: string;

  @Prop({ required: true })
  providerSlug!: string;

  @Prop({ type: Number, default: null })
  estimatedTotal?: number | null;

  @Prop({ default: 'INR' })
  currency!: string;

  @Prop({ default: false })
  available!: boolean;

  @Prop({ default: 'complete' })
  quoteStatus!: string;

  @Prop({ default: 'demo' })
  sourceType!: string;

  @Prop({ type: Number, default: null })
  estimatedDeliveryMinutes?: number | null;

  @Prop({ type: String, default: null, maxlength: 1000 })
  error?: string | null;
}

@Schema({ timestamps: true, collection: 'comparisons' })
export class Comparison {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null, index: true })
  userId?: Types.ObjectId | null;

  @Prop({ required: true, trim: true, maxlength: 200 })
  searchQuery!: string;

  @Prop({ trim: true, default: 'default', maxlength: 120 })
  locationReference!: string;

  @Prop({ type: Number, default: 1, min: 1 })
  quantity!: number;

  @Prop({
    type: String,
    enum: Object.values(MatchConfidence),
    default: MatchConfidence.Approximate,
  })
  matchConfidence!: MatchConfidence;

  @Prop({ type: Array, default: [] })
  matchedItems!: Record<string, unknown>[];

  @Prop({ type: [ComparisonProviderResult], default: [] })
  providerResults!: ComparisonProviderResult[];

  @Prop({ type: Number, default: null })
  bestPrice?: number | null;

  @Prop({ type: Number, default: 0 })
  potentialSavings!: number;

  @Prop({ default: 'INR' })
  currency!: string;

  @Prop({ default: false })
  isDemoData!: boolean;
}

export const ComparisonSchema = SchemaFactory.createForClass(Comparison);
ComparisonSchema.index({ userId: 1, createdAt: -1 });
ComparisonSchema.index({ searchQuery: 1, createdAt: -1 });
