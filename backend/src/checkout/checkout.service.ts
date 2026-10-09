import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SourceType } from '@foodcompare/shared-types';
import { ModelNames } from '../database/model-names';
import { Provider } from '../database/schemas/provider.schema';
import { ProviderMenuItem } from '../database/schemas/provider-menu-item.schema';
import { CartService, CartOwner } from '../cart/cart.service';
import { ProviderRegistryService } from '../providers/provider-registry.service';
import { OrderQuoteLine, ProviderOperationError } from '../providers/provider-adapter.interface';
import { computeFinalPrice, round2 } from '../common/utils/money';
import { AppLogger } from '../common/logger/app-logger.service';

export interface CheckoutQuote {
  providerId: string | null;
  providerName: string | null;
  restaurantId: string | null;
  restaurantName: string | null;
  items: Array<{ id: string; name: string; unitPrice: number; quantity: number }>;
  breakdown: {
    itemSubtotal: number;
    itemDiscount: number;
    deliveryFee: number;
    platformFee: number;
    packagingFee: number;
    tax: number;
    otherFees: number;
    couponDiscount: number;
    estimatedTotal: number;
    currency: string;
  };
  quoteStatus: 'complete' | 'incomplete' | 'estimated' | 'unavailable';
  quoteTimestamp: string;
  expiresAt: string | null;
  sourceType: SourceType;
  isDemoData: boolean;
  notes: string[];
}

@Injectable()
export class CheckoutService {
  constructor(
    private readonly cart: CartService,
    private readonly registry: ProviderRegistryService,
    @InjectModel(ModelNames.Provider) private readonly providerModel: Model<Provider>,
    @InjectModel(ModelNames.ProviderMenuItem)
    private readonly providerMenuItemModel: Model<ProviderMenuItem>,
    private readonly logger: AppLogger,
  ) {}

  async quote(owner: CartOwner, location = 'default'): Promise<CheckoutQuote> {
    const cart = await this.cart.getCart(owner);
    if (cart.items.length === 0) {
      throw new BadRequestException('Your cart is empty');
    }

    const baseItems = cart.items.map((i) => ({
      id: i.id,
      name: i.name,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
    }));

    // No provider selected: subtotal is known, mandatory fees are not.
    if (!cart.providerId) {
      const subtotal = round2(baseItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0));
      return {
        providerId: null,
        providerName: null,
        restaurantId: cart.restaurantId ?? null,
        restaurantName: cart.restaurantName ?? null,
        items: baseItems,
        breakdown: {
          ...computeFinalPrice({ itemSubtotal: subtotal }),
          currency: cart.currency,
        },
        quoteStatus: 'incomplete',
        quoteTimestamp: new Date().toISOString(),
        expiresAt: null,
        sourceType: SourceType.Live,
        isDemoData: false,
        notes: ['No provider selected for this cart. Fees and final total cannot be verified yet.'],
      };
    }

    const provider = await this.providerModel.findById(cart.providerId).exec();
    const providerName = provider?.name ?? cart.providerName ?? 'Provider';

    const missingMenuItem = cart.items.some((i) => !i.providerMenuItemId);
    if (missingMenuItem) {
      const subtotal = round2(baseItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0));
      return {
        providerId: cart.providerId ?? null,
        providerName,
        restaurantId: cart.restaurantId ?? null,
        restaurantName: cart.restaurantName ?? null,
        items: baseItems,
        breakdown: {
          ...computeFinalPrice({ itemSubtotal: subtotal }),
          currency: cart.currency,
        },
        quoteStatus: 'estimated',
        quoteTimestamp: new Date().toISOString(),
        expiresAt: null,
        sourceType: SourceType.Live,
        isDemoData: false,
        notes: [
          'Some items are not linked to a provider listing, so mandatory fees cannot be verified.',
        ],
      };
    }

    // Resolve provider item ids and restaurant ids from the stored menu mappings.
    const menuItemIds = cart.items
      .filter((i) => i.providerMenuItemId)
      .map((i) => i.providerMenuItemId as string);
    const menuItems = await this.providerMenuItemModel
      .find({ _id: { $in: menuItemIds } })
      .lean()
      .exec();
    const menuItemById = new Map(menuItems.map((m) => [String(m._id), m]));

    const lines: OrderQuoteLine[] = [];
    for (const item of cart.items) {
      if (!item.providerMenuItemId) continue;
      const menuItem = menuItemById.get(String(item.providerMenuItemId));
      if (!menuItem) continue;
      lines.push({
        providerItemId: menuItem.providerItemId,
        providerRestaurantId: menuItem.providerRestaurantId,
        quantity: item.quantity,
      });
    }

    try {
      const adapter = await this.registry.getAdapterBySlug(
        provider?.slug ? provider.slug : cart.providerId!,
      );
      const normalized = await adapter.getOrderQuote(lines, location.trim() || 'default');
      const isDemo = normalized.sourceType === SourceType.Demo;
      this.logger.log('Checkout quote generated', {
        provider: adapter.context.providerSlug,
        total: normalized.estimatedTotal,
      });
      return {
        providerId: cart.providerId ?? null,
        providerName,
        restaurantId: cart.restaurantId ?? null,
        restaurantName: cart.restaurantName ?? null,
        items: baseItems,
        breakdown: {
          itemSubtotal: normalized.itemSubtotal,
          itemDiscount: normalized.itemDiscount,
          deliveryFee: normalized.deliveryFee,
          platformFee: normalized.platformFee,
          packagingFee: normalized.packagingFee,
          tax: normalized.tax,
          otherFees: normalized.otherFees,
          couponDiscount: normalized.couponDiscount,
          estimatedTotal: normalized.estimatedTotal,
          currency: normalized.currency,
        },
        quoteStatus: normalized.available ? 'complete' : 'unavailable',
        quoteTimestamp: new Date().toISOString(),
        expiresAt: normalized.expiresAt ? normalized.expiresAt.toISOString() : null,
        sourceType: normalized.sourceType,
        isDemoData: isDemo,
        notes: normalized.notes,
      };
    } catch (error) {
      const subtotal = round2(baseItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0));
      const message =
        error instanceof ProviderOperationError
          ? error.message
          : 'The provider could not be reached. The total shown is an estimate only.';
      this.logger.warn('Checkout quote failed', { provider: providerName, message });
      return {
        providerId: cart.providerId ?? null,
        providerName,
        restaurantId: cart.restaurantId ?? null,
        restaurantName: cart.restaurantName ?? null,
        items: baseItems,
        breakdown: {
          ...computeFinalPrice({ itemSubtotal: subtotal }),
          currency: cart.currency,
        },
        quoteStatus: 'incomplete',
        quoteTimestamp: new Date().toISOString(),
        expiresAt: null,
        sourceType: SourceType.Live,
        isDemoData: false,
        notes: [message],
      };
    }
  }
}
