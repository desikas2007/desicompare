import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types, HydratedDocument } from 'mongoose';

export type RefreshSessionDocument = HydratedDocument<RefreshSession>;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'refresh_sessions' })
export class RefreshSession {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, unique: true, trim: true })
  tokenHash!: string;

  @Prop({ type: Date, required: true })
  expiresAt!: Date;

  @Prop({ type: Date, default: null })
  revokedAt?: Date | null;

  @Prop({ type: String, trim: true, default: null })
  replacedBy?: string | null;

  @Prop({ type: String, trim: true, default: null, maxlength: 300 })
  userAgent?: string | null;
}

export const RefreshSessionSchema = SchemaFactory.createForClass(RefreshSession);
RefreshSessionSchema.index({ userId: 1, createdAt: -1 });
RefreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
