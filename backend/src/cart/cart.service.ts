import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart as CartContract, CartItem as CartItemContract } from '@foodcompare/shared-types';
import { ModelNames } from '../database/model-names';
import { CartDocument, Cart } from '../database/schemas/cart.schema';
import { FoodItem } from '../database/schemas/food-item.schema';
import { ProviderMenuItem } from '../database/schemas/provider-menu-item.schema';
import { Provider } from '../database/schemas/provider.schema';
import { Restaurant } from '../database/schemas/restaurant.schema';
import { round2 } from '../common/utils/money';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

export interface CartOwner {
  userId?: string;
  anonymousId?: string;
}

@Injectable()
export class CartService {
  constructor(
    @InjectModel(ModelNames.Cart) private readonly cartModel: Model<Cart>,
    @InjectModel(ModelNames.FoodItem) private readonly foodItemModel: Model<FoodItem>,
    @InjectModel(ModelNames.ProviderMenuItem)
    private readonly providerMenuItemModel: Model<ProviderMenuItem>,
    @InjectModel(ModelNames.Provider) private readonly providerModel: Model<Provider>,
    @InjectModel(ModelNames.Restaurant) private readonly restaurantModel: Model<Restaurant>,
  ) {}

  private ownerFilter(owner: CartOwner): Record<string, unknown> {
    if (owner.userId) return { userId: new Types.ObjectId(owner.userId) };
    if (owner.anonymousId) return { anonymousId: owner.anonymousId };
    throw new BadRequestException('A cart owner (user or cart id) is required');
  }

  private async getOrCreate(owner: CartOwner): Promise<CartDocument> {
    const existing = await this.cartModel.findOne(this.ownerFilter(owner)).exec();
    if (existing) return existing;
    return this.cartModel.create({
      userId: owner.userId ? new Types.ObjectId(owner.userId) : null,
      anonymousId: owner.anonymousId ?? null,
      items: [],
    });
  }

  async getCart(owner: CartOwner): Promise<CartContract> {
    const cart = await this.getOrCreate(owner);
    return this.toContract(cart);
  }

  async addItem(owner: CartOwner, dto: AddCartItemDto): Promise<CartContract> {
    const cart = await this.getOrCreate(owner);

    const foodItem = await this.foodItemModel.findById(dto.foodItemId).exec();
    if (!foodItem) throw new NotFoundException('Food item not found');

    let unitPrice = foodItem.variants?.[0]?.price ?? 0;
    let portionSize = foodItem.portionSize;
    let providerId: Types.ObjectId | null = null;
    const restaurantId: Types.ObjectId = foodItem.restaurantId;
    let providerMenuItemId: Types.ObjectId | null = null;
    let name = foodItem.displayName;

    if (dto.providerMenuItemId) {
      const menuItem = await this.providerMenuItemModel.findById(dto.providerMenuItemId).exec();
      if (!menuItem) throw new NotFoundException('Provider menu item not found');
      if (String(menuItem.normalizedFoodId) !== String(foodItem._id)) {
        throw new BadRequestException('Provider menu item does not match the selected food item');
      }
      // Backend is the source of truth for price; never trust a client amount.
      unitPrice = menuItem.menuPrice;
      portionSize = menuItem.variant ?? portionSize;
      providerId = menuItem.providerId;
      providerMenuItemId = menuItem._id as Types.ObjectId;
      name = menuItem.displayName;
    }

    // Enforce a single provider/restaurant per cart.
    if (cart.items.length > 0) {
      if (cart.restaurantId && String(cart.restaurantId) !== String(restaurantId)) {
        throw new ConflictException(
          'Items from different restaurants cannot be combined in one cart',
        );
      }
      if (cart.providerId && providerId && String(cart.providerId) !== String(providerId)) {
        throw new ConflictException(
          'Items from different providers cannot be combined in one cart',
        );
      }
    }

    const existingItem = cart.items.find(
      (item) =>
        String(item.foodItemId) === String(foodItem._id) &&
        String(item.providerMenuItemId ?? '') === String(providerMenuItemId ?? ''),
    );

    if (existingItem) {
      existingItem.quantity = Math.min(50, existingItem.quantity + dto.quantity);
      existingItem.unitPrice = unitPrice;
      existingItem.available = true;
    } else {
      cart.items.push({
        foodItemId: foodItem._id as Types.ObjectId,
        providerMenuItemId,
        name,
        portionSize,
        unitPrice,
        quantity: dto.quantity,
        available: true,
      } as never);
    }

    cart.providerId = providerId ?? cart.providerId ?? null;
    cart.restaurantId = restaurantId;
    await cart.save();
    return this.toContract(cart);
  }

  async updateItem(
    owner: CartOwner,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartContract> {
    const cart = await this.getOrCreate(owner);
    const item = cart.items.find((i) => String((i as { _id?: unknown })._id) === itemId);
    if (!item) throw new NotFoundException('Cart item not found');

    if (dto.quantity === 0) {
      cart.items = cart.items.filter(
        (i) => String((i as { _id?: unknown })._id) !== itemId,
      ) as never;
    } else {
      item.quantity = dto.quantity;
    }

    if (cart.items.length === 0) {
      cart.providerId = null;
      cart.restaurantId = null;
    }
    await cart.save();
    return this.toContract(cart);
  }

  async removeItem(owner: CartOwner, itemId: string): Promise<CartContract> {
    const cart = await this.getOrCreate(owner);
    const before = cart.items.length;
    cart.items = cart.items.filter((i) => String((i as { _id?: unknown })._id) !== itemId) as never;
    if (cart.items.length === before) throw new NotFoundException('Cart item not found');
    if (cart.items.length === 0) {
      cart.providerId = null;
      cart.restaurantId = null;
    }
    await cart.save();
    return this.toContract(cart);
  }

  async clear(owner: CartOwner): Promise<CartContract> {
    const cart = await this.getOrCreate(owner);
    cart.items = [];
    cart.providerId = null;
    cart.restaurantId = null;
    cart.quoteReference = null;
    cart.quoteExpiresAt = null;
    await cart.save();
    return this.toContract(cart);
  }

  async toContract(cart: CartDocument): Promise<CartContract> {
    const provider = cart.providerId
      ? await this.providerModel.findById(cart.providerId).lean().exec()
      : null;
    const restaurant = cart.restaurantId
      ? await this.restaurantModel.findById(cart.restaurantId).lean().exec()
      : null;

    const items: CartItemContract[] = cart.items.map((item) => ({
      id: String((item as { _id?: unknown })._id),
      foodItemId: String(item.foodItemId),
      providerMenuItemId: item.providerMenuItemId ? String(item.providerMenuItemId) : null,
      name: item.name,
      portionSize: item.portionSize,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      available: item.available,
    }));

    const subtotal = round2(items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0));

    return {
      id: String((cart as unknown as { _id: unknown })._id),
      providerId: cart.providerId ? String(cart.providerId) : null,
      providerName: provider?.name ?? null,
      restaurantId: cart.restaurantId ? String(cart.restaurantId) : null,
      restaurantName: restaurant?.displayName ?? null,
      items,
      subtotal,
      currency: cart.currency,
      quoteReference: cart.quoteReference ? String(cart.quoteReference) : null,
      quoteExpiresAt: cart.quoteExpiresAt ? cart.quoteExpiresAt.toISOString() : null,
      updatedAt:
        (cart as unknown as { updatedAt?: Date }).updatedAt?.toISOString() ??
        new Date().toISOString(),
    };
  }
}
