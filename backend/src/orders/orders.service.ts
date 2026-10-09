import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  InternalOrderStatus,
  OrderConfirmationStatus,
  OrderSummary,
} from '@foodcompare/shared-types';
import { randomBytes } from 'node:crypto';
import { ModelNames } from '../database/model-names';
import { OrderDocument, Order } from '../database/schemas/order.schema';
import { Provider } from '../database/schemas/provider.schema';
import { ProviderRestaurant } from '../database/schemas/provider-restaurant.schema';
import { CartService } from '../cart/cart.service';
import { CheckoutService } from '../checkout/checkout.service';
import { ProviderRegistryService } from '../providers/provider-registry.service';
import { ProviderOperationError } from '../providers/provider-adapter.interface';
import { Paginated, paginate } from '../common/dto/pagination.dto';
import { AppLogger } from '../common/logger/app-logger.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(ModelNames.Order) private readonly orderModel: Model<Order>,
    @InjectModel(ModelNames.Provider) private readonly providerModel: Model<Provider>,
    @InjectModel(ModelNames.ProviderRestaurant)
    private readonly providerRestaurantModel: Model<ProviderRestaurant>,
    private readonly cart: CartService,
    private readonly checkout: CheckoutService,
    private readonly registry: ProviderRegistryService,
    private readonly logger: AppLogger,
  ) {}

  async create(userId: string, dto: CreateOrderDto): Promise<OrderSummary> {
    // Idempotency: return the previously created order for a repeated key.
    const existing = await this.orderModel
      .findOne({ userId: new Types.ObjectId(userId), idempotencyKey: dto.idempotencyKey })
      .exec();
    if (existing) {
      return this.toSummary(existing);
    }

    const quote = await this.checkout.quote({ userId }, dto.location ?? 'default');
    if (quote.items.length === 0) {
      throw new BadRequestException('Your cart is empty');
    }
    if (!quote.providerId) {
      throw new BadRequestException('Select a provider before placing an order');
    }

    const provider = await this.providerModel.findById(quote.providerId).exec();

    let officialOrderUrl: string | null = null;
    if (provider && quote.restaurantId) {
      const link = await this.providerRestaurantModel
        .findOne({ providerId: provider._id, restaurantId: quote.restaurantId })
        .lean()
        .exec();
      officialOrderUrl = link?.officialUrl ?? provider.officialWebsite ?? null;
    }

    let internalStatus: InternalOrderStatus = InternalOrderStatus.Draft;
    let providerOrderReference: string | null = null;
    let providerStatus: string | null = null;
    let confirmationStatus: OrderConfirmationStatus = OrderConfirmationStatus.NotConfirmed;
    let notes: string[] = [...quote.notes];

    if (provider) {
      try {
        const adapter = await this.registry.getAdapterBySlug(provider.slug);
        // Only attempt direct ordering when the provider explicitly advertises it.
        if (adapter.capabilities.includes('create_order')) {
          const result = await adapter.createOrder({
            providerRestaurantId: '',
            items: quote.items.map((i) => ({ providerItemId: i.id, quantity: i.quantity })),
            idempotencyKey: dto.idempotencyKey,
            contact: {
              name: dto.contactName ?? 'FoodCompare user',
              phone: dto.contactPhone ?? '',
              address: dto.addressId ?? '',
            },
          });
          if (result.supported && result.providerOrderReference) {
            internalStatus = InternalOrderStatus.Submitted;
            confirmationStatus = OrderConfirmationStatus.Pending;
            providerOrderReference = result.providerOrderReference;
            providerStatus = result.providerStatus ?? 'submitted';
          }
        } else {
          // External checkout: we never mark this as a confirmed order.
          internalStatus = InternalOrderStatus.Redirected;
          officialOrderUrl = officialOrderUrl ?? null;
          notes = [
            ...notes,
            'This provider does not support direct ordering. Complete your order on the provider app; this record is not a confirmed order.',
          ];
        }
      } catch (error) {
        if (error instanceof ProviderOperationError) {
          internalStatus = InternalOrderStatus.Failed;
          notes = [...notes, error.message];
        } else {
          throw error;
        }
      }
    }

    const internalReference = this.generateReference();
    const order = await this.orderModel.create({
      userId: new Types.ObjectId(userId),
      internalReference,
      idempotencyKey: dto.idempotencyKey,
      providerId: quote.providerId ? new Types.ObjectId(quote.providerId) : null,
      restaurantId: quote.restaurantId ? new Types.ObjectId(quote.restaurantId) : null,
      restaurantName: quote.restaurantName,
      items: quote.items.map((i) => ({
        foodItemId: i.id,
        providerMenuItemId: null,
        name: i.name,
        portionSize: '',
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        available: true,
      })),
      priceBreakdown: quote.breakdown,
      internalStatus,
      providerOrderReference,
      providerStatus,
      orderConfirmationStatus: confirmationStatus,
      officialOrderUrl,
      addressId:
        dto.addressId && Types.ObjectId.isValid(dto.addressId)
          ? new Types.ObjectId(dto.addressId)
          : null,
    });

    await this.cart.clear({ userId });
    this.logger.log('Order recorded', {
      orderId: String((order as unknown as { _id: unknown })._id),
      provider: provider?.slug,
      status: internalStatus,
      notes: notes.length ? notes : undefined,
    });
    return this.toSummary(order);
  }

  async list(userId: string, page: number, limit: number): Promise<Paginated<OrderSummary>> {
    const filter = { userId: new Types.ObjectId(userId) };
    const [docs, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);
    return paginate(
      docs.map((d) => this.toSummary(d)),
      total,
      page,
      limit,
    );
  }

  async getById(userId: string, id: string): Promise<OrderSummary> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Order not found');
    const filter: FilterQuery<Order> = { _id: id, userId: new Types.ObjectId(userId) };
    const order = await this.orderModel.findOne(filter).exec();
    if (!order) throw new NotFoundException('Order not found');
    return this.toSummary(order);
  }

  private toSummary(order: OrderDocument): OrderSummary {
    const any = order as unknown as { _id: unknown; createdAt?: Date; updatedAt?: Date };
    return {
      id: String(any._id),
      internalReference: order.internalReference,
      providerId: String(order.providerId),
      providerName: '',
      restaurantId: order.restaurantId ? String(order.restaurantId) : null,
      restaurantName: order.restaurantName ?? null,
      items: (order.items ?? []).map((i) => ({
        id: i.foodItemId,
        foodItemId: i.foodItemId,
        providerMenuItemId: i.providerMenuItemId ?? null,
        name: i.name,
        portionSize: i.portionSize,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        available: i.available,
      })),
      priceBreakdown: { ...order.priceBreakdown, currency: order.priceBreakdown.currency ?? 'INR' },
      internalStatus: order.internalStatus,
      providerOrderReference: order.providerOrderReference ?? null,
      providerStatus: order.providerStatus ?? null,
      orderConfirmationStatus: order.orderConfirmationStatus,
      officialOrderUrl: order.officialOrderUrl ?? null,
      createdAt: (any.createdAt ?? new Date()).toISOString(),
      updatedAt: (any.updatedAt ?? new Date()).toISOString(),
    };
  }

  private generateReference(): string {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `FC-${stamp}-${randomBytes(3).toString('hex').toUpperCase()}`;
  }
}
