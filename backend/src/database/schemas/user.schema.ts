import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { AccountStatus, UserRole } from '@foodcompare/shared-types';

export type UserDocument = HydratedDocument<User> & { _id: unknown };

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ required: true, lowercase: true, trim: true, maxlength: 254 })
  email!: string;

  @Prop({ required: true, trim: true, maxlength: 254 })
  normalizedEmail!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ type: String, trim: true, maxlength: 20, default: null })
  mobile?: string | null;

  @Prop({ default: false })
  emailVerified!: boolean;

  @Prop({ type: String, enum: Object.values(UserRole), default: UserRole.User })
  role!: UserRole;

  @Prop({ type: String, enum: Object.values(AccountStatus), default: AccountStatus.Active })
  status!: AccountStatus;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ normalizedEmail: 1 }, { unique: true });
UserSchema.index({ role: 1, status: 1 });
