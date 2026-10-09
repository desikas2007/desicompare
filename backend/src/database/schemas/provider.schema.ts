import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IntegrationMode, ProviderCapability } from '@foodcompare/shared-types';

export type ProviderDocument = HydratedDocument<Provider>;

@Schema({ timestamps: true, collection: 'providers' })
export class Provider {
  @Prop({ required: true, trim: true, maxlength: 80 })
  name!: string;

  @Prop({ required: true, trim: true, lowercase: true, unique: true, maxlength: 80 })
  slug!: string;

  @Prop({ type: String, trim: true, default: null })
  logoUrl?: string | null;

  @Prop({ default: false })
  enabled!: boolean;

  @Prop({ type: String, enum: Object.values(IntegrationMode), default: IntegrationMode.Demo })
  integrationMode!: IntegrationMode;

  @Prop({ type: [String], default: [] })
  capabilities!: ProviderCapability[];

  @Prop({ type: String, trim: true, default: null })
  officialWebsite?: string | null;

  @Prop({ type: Date, default: null })
  lastSuccessfulSync?: Date | null;

  @Prop({ type: String, trim: true, default: null, maxlength: 500 })
  statusNote?: string | null;
}

export const ProviderSchema = SchemaFactory.createForClass(Provider);
ProviderSchema.index({ enabled: 1, slug: 1 });
