import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types, HydratedDocument } from 'mongoose';

export type AddressDocument = HydratedDocument<Address>;

@Schema({ timestamps: true, collection: 'addresses' })
export class Address {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 40 })
  label!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  recipientName!: string;

  @Prop({ required: true, trim: true, maxlength: 20 })
  phone!: string;

  @Prop({ required: true, trim: true, maxlength: 200 })
  addressLine1!: string;

  @Prop({ type: String, trim: true, maxlength: 200, default: null })
  addressLine2?: string | null;

  @Prop({ required: true, trim: true, maxlength: 80 })
  city!: string;

  @Prop({ required: true, trim: true, maxlength: 80 })
  state!: string;

  @Prop({ required: true, trim: true, maxlength: 12 })
  postalCode!: string;

  @Prop({ type: Number, default: null })
  latitude?: number | null;

  @Prop({ type: Number, default: null })
  longitude?: number | null;

  @Prop({ default: false })
  isDefault!: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
AddressSchema.index({ userId: 1, isDefault: -1, createdAt: -1 });
