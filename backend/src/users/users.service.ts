import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  AccountStatus,
  AddressSummary,
  FavoriteSummary,
  UserProfile,
  UserRole,
} from '@foodcompare/shared-types';
import { ModelNames } from '../database/model-names';
import { UserDocument, User } from '../database/schemas/user.schema';
import { AddressDocument, Address } from '../database/schemas/address.schema';
import { Favorite } from '../database/schemas/favorite.schema';
import { RestaurantDocument, Restaurant } from '../database/schemas/restaurant.schema';
import { FoodItemDocument, FoodItem } from '../database/schemas/food-item.schema';
import { normalizeName } from '../common/utils/normalize';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/address.dto';

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  mobile?: string | null;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(ModelNames.User) private readonly userModel: Model<User>,
    @InjectModel(ModelNames.Address) private readonly addressModel: Model<Address>,
    @InjectModel(ModelNames.Favorite) private readonly favoriteModel: Model<Favorite>,
    @InjectModel(ModelNames.Restaurant) private readonly restaurantModel: Model<Restaurant>,
    @InjectModel(ModelNames.FoodItem) private readonly foodItemModel: Model<FoodItem>,
  ) {}

  toProfile(user: UserDocument | (User & { _id: unknown })): UserProfile {
    const anyUser = user as unknown as { _id: unknown };
    return {
      id: String(anyUser._id),
      name: user.name,
      email: user.email,
      mobile: user.mobile ?? null,
      emailVerified: user.emailVerified,
      role: user.role,
      status: user.status,
      createdAt:
        (user as unknown as { createdAt?: Date }).createdAt?.toISOString() ??
        new Date().toISOString(),
    };
  }

  async create(input: CreateUserInput): Promise<UserDocument> {
    const normalizedEmail = normalizeName(input.email);
    try {
      return await this.userModel.create({
        name: input.name,
        email: input.email,
        normalizedEmail,
        passwordHash: input.passwordHash,
        mobile: input.mobile ?? null,
        role: input.role ?? UserRole.User,
        status: AccountStatus.Active,
        emailVerified: false,
      });
    } catch (error) {
      if (this.isDuplicateKey(error)) {
        throw new ConflictException('An account with this email already exists');
      }
      throw error;
    }
  }

  async findByEmail(email: string, withPassword = false): Promise<UserDocument | null> {
    const normalizedEmail = normalizeName(email);
    const query = this.userModel.findOne({ normalizedEmail });
    if (withPassword) query.select('+passwordHash');
    return query.exec();
  }

  async findById(id: string, withPassword = false): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const query = this.userModel.findById(id);
    if (withPassword) query.select('+passwordHash');
    return query.exec();
  }

  async findByIdOrFail(id: string): Promise<UserDocument> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { $set: { passwordHash } }).exec();
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfile> {
    const user = await this.findByIdOrFail(userId);
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.mobile !== undefined) user.mobile = dto.mobile;
    await user.save();
    return this.toProfile(user);
  }

  /* ----------------------------- Addresses ---------------------------- */

  async listAddresses(userId: string): Promise<AddressSummary[]> {
    const docs = await this.addressModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ isDefault: -1, createdAt: -1 })
      .exec();
    return docs.map((doc) => this.toAddress(doc));
  }

  async createAddress(userId: string, dto: CreateAddressDto): Promise<AddressSummary> {
    if (dto.isDefault) {
      await this.addressModel
        .updateMany({ userId: new Types.ObjectId(userId) }, { $set: { isDefault: false } })
        .exec();
    }
    const created = await this.addressModel.create({
      ...dto,
      userId: new Types.ObjectId(userId),
    });
    return this.toAddress(created);
  }

  async updateAddress(
    userId: string,
    addressId: string,
    dto: Partial<CreateAddressDto>,
  ): Promise<AddressSummary> {
    if (!Types.ObjectId.isValid(addressId)) throw new NotFoundException('Address not found');
    if (dto.isDefault) {
      await this.addressModel
        .updateMany({ userId: new Types.ObjectId(userId) }, { $set: { isDefault: false } })
        .exec();
    }
    const updated = await this.addressModel
      .findOneAndUpdate(
        { _id: addressId, userId: new Types.ObjectId(userId) },
        { $set: dto },
        { new: true },
      )
      .exec();
    if (!updated) throw new NotFoundException('Address not found');
    return this.toAddress(updated);
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    if (!Types.ObjectId.isValid(addressId)) throw new NotFoundException('Address not found');
    const result = await this.addressModel
      .findOneAndDelete({ _id: addressId, userId: new Types.ObjectId(userId) })
      .exec();
    if (!result) throw new NotFoundException('Address not found');
  }

  private toAddress(doc: AddressDocument | (Address & { _id: unknown })): AddressSummary {
    const anyDoc = doc as unknown as { _id: unknown };
    return {
      id: String(anyDoc._id),
      label: doc.label,
      recipientName: doc.recipientName,
      phone: doc.phone,
      addressLine1: doc.addressLine1,
      addressLine2: doc.addressLine2 ?? null,
      city: doc.city,
      state: doc.state,
      postalCode: doc.postalCode,
      latitude: doc.latitude ?? null,
      longitude: doc.longitude ?? null,
      isDefault: doc.isDefault,
    };
  }

  /* ----------------------------- Favorites ---------------------------- */

  async listFavorites(userId: string): Promise<FavoriteSummary[]> {
    const favorites = await this.favoriteModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();

    const restaurantIds = favorites
      .filter((f) => f.restaurantId)
      .map((f) => f.restaurantId as Types.ObjectId);
    const foodIds = favorites
      .filter((f) => f.foodItemId)
      .map((f) => f.foodItemId as Types.ObjectId);

    const [restaurants, foods] = await Promise.all([
      restaurantIds.length
        ? this.restaurantModel.find({ _id: { $in: restaurantIds } }).exec()
        : Promise.resolve([] as RestaurantDocument[]),
      foodIds.length
        ? this.foodItemModel.find({ _id: { $in: foodIds } }).exec()
        : Promise.resolve([] as FoodItemDocument[]),
    ]);

    const restaurantMap = new Map(restaurants.map((r) => [String(r._id), r.displayName]));
    const foodMap = new Map(foods.map((f) => [String(f._id), f.displayName]));

    return favorites.map((fav) => {
      const anyFav = fav as unknown as { _id: unknown; createdAt?: Date };
      return {
        id: String(anyFav._id),
        restaurantId: fav.restaurantId ? String(fav.restaurantId) : null,
        foodItemId: fav.foodItemId ? String(fav.foodItemId) : null,
        restaurantName: fav.restaurantId
          ? (restaurantMap.get(String(fav.restaurantId)) ?? null)
          : null,
        foodItemName: fav.foodItemId ? (foodMap.get(String(fav.foodItemId)) ?? null) : null,
        createdAt: (anyFav.createdAt ?? new Date()).toISOString(),
      };
    });
  }

  async addFavorite(
    userId: string,
    input: { restaurantId?: string; foodItemId?: string },
  ): Promise<FavoriteSummary> {
    if (!input.restaurantId && !input.foodItemId) {
      throw new BadRequestException('Provide a restaurantId or foodItemId');
    }
    if (input.restaurantId && input.foodItemId) {
      throw new BadRequestException('Provide only one of restaurantId or foodItemId');
    }

    const filter: FilterQuery<Favorite> = { userId: new Types.ObjectId(userId) };
    if (input.restaurantId) {
      if (!Types.ObjectId.isValid(input.restaurantId))
        throw new BadRequestException('Invalid restaurantId');
      const exists = await this.restaurantModel.exists({ _id: input.restaurantId }).exec();
      if (!exists) throw new NotFoundException('Restaurant not found');
      filter.restaurantId = new Types.ObjectId(input.restaurantId);
    }
    if (input.foodItemId) {
      if (!Types.ObjectId.isValid(input.foodItemId))
        throw new BadRequestException('Invalid foodItemId');
      const exists = await this.foodItemModel.exists({ _id: input.foodItemId }).exec();
      if (!exists) throw new NotFoundException('Food item not found');
      filter.foodItemId = new Types.ObjectId(input.foodItemId);
    }

    try {
      await this.favoriteModel.create(filter);
    } catch (error) {
      if (!this.isDuplicateKey(error)) throw error;
    }
    const list = await this.listFavorites(userId);
    return list[0];
  }

  async removeFavorite(userId: string, favoriteId: string): Promise<void> {
    if (!Types.ObjectId.isValid(favoriteId)) throw new NotFoundException('Favorite not found');
    const result = await this.favoriteModel
      .findOneAndDelete({ _id: favoriteId, userId: new Types.ObjectId(userId) })
      .exec();
    if (!result) throw new NotFoundException('Favorite not found');
  }

  private isDuplicateKey(error: unknown): boolean {
    return (
      typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000
    );
  }
}
