import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  ComparisonResult,
  IntegrationMode,
  MatchConfidence,
  ProviderQuote,
  QuoteStatus,
  SourceType,
} from '@foodcompare/shared-types';
import { ModelNames } from '../database/model-names';
import { FoodItem } from '../database/schemas/food-item.schema';
import { Restaurant } from '../database/schemas/restaurant.schema';
import { Provider } from '../database/schemas/provider.schema';
import { ProviderMenuItem } from '../database/schemas/provider-menu-item.schema';
import { ProviderRestaurant } from '../database/schemas/provider-restaurant.schema';
import { ComparisonDocument, Comparison } from '../database/schemas/comparison.schema';
import { PriceQuote } from '../database/schemas/price-quote.schema';
import { computeSavings } from '../common/utils/money';
import { normalizeName } from '../common/utils/normalize';
import { Paginated, paginate } from '../common/dto/pagination.dto';
import { AppLogger } from '../common/logger/app-logger.service';
import { ProviderRegistryService } from '../providers/provider-registry.service';
import { ProviderOperationError } from '../providers/provider-adapter.interface';
import { MatchingService } from './matching.service';
import { CreateComparisonDto } from './dto/create-comparison.dto';

const PROVIDER_TIMEOUT_MS = 5000;

@Injectable()
export class ComparisonsService {
  constructor(
    @InjectModel(ModelNames.FoodItem) private readonly foodItemModel: Model<FoodItem>,
    @InjectModel(ModelNames.Restaurant) private readonly restaurantModel: Model<Restaurant>,
    @InjectModel(ModelNames.ProviderMenuItem)
    private readonly providerMenuItemModel: Model<ProviderMenuItem>,
    @InjectModel(ModelNames.ProviderRestaurant)
    private readonly providerRestaurantModel: Model<ProviderRestaurant>,
    @InjectModel(ModelNames.Provider) private readonly providerModel: Model<Provider>,
    @InjectModel(ModelNames.Comparison) private readonly comparisonModel: Model<Comparison>,
    @InjectModel(ModelNames.PriceQuote) private readonly priceQuoteModel: Model<PriceQuote>,
    private readonly matching: MatchingService,
    private readonly registry: ProviderRegistryService,
    private readonly logger: AppLogger,
  ) {}

  async compare(dto: CreateComparisonDto, userId?: string): Promise<ComparisonResult> {
    const quantity = dto.quantity ?? 1;
    const locationReference = (dto.location ?? 'default').trim() || 'default';
    const query = dto.query;

    const candidates = await this.findCandidates(query);
    const match = this.matching.match(
      query,
      candidates.map((c) => ({
        id: String(c._id),
        displayName: c.displayName,
        normalizedName: c.normalizedName,
        category: c.category,
        portionSize: c.portionSize,
        restaurantId: String(c.restaurantId),
      })),
    );

    if (!match.candidate) {
      const saved = await this.persist({
        userId,
        query,
        locationReference,
        quantity,
        matchConfidence: MatchConfidence.Uncertain,
        matchedItems: [],
        providerResults: [],
        bestPrice: null,
        potentialSavings: 0,
        currency: 'INR',
        isDemoData: false,
      });
      return {
        id: String((saved as unknown as { _id: unknown })._id),
        searchQuery: query,
        locationReference,
        quantity,
        matchConfidence: MatchConfidence.Uncertain,
        matchNote: match.note,
        quotes: [],
        bestQuote: null,
        potentialSavings: 0,
        savingsPercentage: 0,
        currency: 'INR',
        createdAt: new Date().toISOString(),
        isDemoData: false,
      };
    }

    const foodItem = await this.foodItemModel.findById(match.candidate.id).lean().exec();
    if (!foodItem) throw new NotFoundException('Matched food item is no longer available');
    const restaurant = await this.restaurantModel.findById(foodItem.restaurantId).lean().exec();

    const links = await this.providerRestaurantModel
      .find({ restaurantId: foodItem.restaurantId })
      .lean()
      .exec();
    const providerIds = links.map((l) => l.providerId);
    let providers = providerIds.length
      ? await this.providerModel
          .find({ _id: { $in: providerIds }, enabled: true })
          .lean()
          .exec()
      : [];

    if (dto.providers && dto.providers.length > 0) {
      providers = providers.filter((p) => dto.providers!.includes(p.slug));
    }

    const quotes: ProviderQuote[] = [];
    const providerResults: Array<Record<string, unknown>> = [];
    const currency = 'INR';
    const now = new Date();

    for (const provider of providers) {
      const link = links.find((l) => String(l.providerId) === String(provider._id));
      const menuItems = await this.providerMenuItemModel
        .find({ providerId: provider._id, normalizedFoodId: foodItem._id })
        .lean()
        .exec();

      if (menuItems.length === 0) {
        providerResults.push({
          providerId: String(provider._id),
          providerName: provider.name,
          providerSlug: provider.slug,
          available: false,
          quoteStatus: QuoteStatus.Unavailable,
          sourceType: this.sourceTypeFor(provider),
          error: 'This restaurant does not list this item on the provider.',
        });
        continue;
      }

      let adapter;
      try {
        adapter = await this.registry.getAdapterBySlug(provider.slug);
      } catch (error) {
        providerResults.push(this.providerErrorResult(provider, error));
        continue;
      }

      for (const menuItem of menuItems) {
        try {
          const normalized = await this.withTimeout(
            adapter.getQuote({
              providerRestaurantId: menuItem.providerRestaurantId,
              providerItemId: menuItem.providerItemId,
              quantity,
              locationReference,
            }),
            PROVIDER_TIMEOUT_MS,
          );

          const expired = normalized.expiresAt
            ? normalized.expiresAt.getTime() < now.getTime()
            : false;
          const quoteStatus: QuoteStatus = expired ? QuoteStatus.Expired : normalized.quoteStatus;

          const officialUrl = link?.officialUrl ?? null;
          const quote: ProviderQuote = {
            providerId: String(provider._id),
            providerName: provider.name,
            providerSlug: provider.slug,
            integrationMode: provider.integrationMode as IntegrationMode,
            sourceType: normalized.sourceType as SourceType,
            restaurantName: normalized.restaurantName,
            foodName: normalized.foodName,
            portionSize: normalized.portionSize,
            quantity: normalized.quantity,
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
            },
            currency: normalized.currency,
            quoteStatus,
            available: normalized.available,
            estimatedDeliveryMinutes: normalized.estimatedDeliveryMinutes ?? null,
            quoteTimestamp: now.toISOString(),
            expiresAt: normalized.expiresAt ? normalized.expiresAt.toISOString() : null,
            orderingCapability: adapter.capabilities.includes('create_order')
              ? 'direct'
              : officialUrl
                ? 'external'
                : 'none',
            officialOrderUrl: officialUrl,
            notes: normalized.notes,
          };

          quotes.push(quote);
          providerResults.push({
            providerId: String(provider._id),
            providerName: provider.name,
            providerSlug: provider.slug,
            estimatedTotal: normalized.estimatedTotal,
            currency: normalized.currency,
            available: normalized.available,
            quoteStatus,
            sourceType: normalized.sourceType,
            estimatedDeliveryMinutes: normalized.estimatedDeliveryMinutes ?? null,
          });

          await this.priceQuoteModel.create({
            providerId: provider._id,
            providerRestaurantId: menuItem.providerRestaurantId,
            providerItemId: menuItem.providerItemId,
            locationReference,
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
            quoteStatus,
            sourceType: normalized.sourceType,
            estimatedDeliveryMinutes: normalized.estimatedDeliveryMinutes ?? null,
            sourceTimestamp: now,
            expiresAt: normalized.expiresAt ?? null,
          });
        } catch (error) {
          providerResults.push(this.providerErrorResult(provider, error));
          this.logger.warn('Provider quote failed', {
            provider: provider.slug,
            error: error instanceof Error ? error.message : 'unknown',
          });
        }
      }
    }

    const eligible = quotes
      .filter((q) => q.quoteStatus === QuoteStatus.Complete && q.available)
      .sort((a, b) => a.breakdown.estimatedTotal - b.breakdown.estimatedTotal);

    const bestQuote = eligible[0] ?? null;
    const worstQuote = eligible.length > 1 ? eligible[eligible.length - 1] : null;
    const savings =
      bestQuote && worstQuote
        ? computeSavings(bestQuote.breakdown.estimatedTotal, worstQuote.breakdown.estimatedTotal)
        : { amount: 0, percentage: 0 };

    const isDemoData = quotes.some((q) => q.sourceType === SourceType.Demo);

    const saved = await this.persist({
      userId,
      query,
      locationReference,
      quantity,
      matchConfidence: match.confidence,
      matchedItems: [
        {
          foodItemId: String(foodItem._id),
          displayName: foodItem.displayName,
          restaurantId: String(foodItem.restaurantId),
          restaurantName: restaurant?.displayName ?? null,
          portionSize: foodItem.portionSize,
          score: match.score,
        },
      ],
      providerResults,
      bestPrice: bestQuote?.breakdown.estimatedTotal ?? null,
      potentialSavings: savings.amount,
      currency,
      isDemoData,
    });

    return {
      id: String((saved as unknown as { _id: unknown })._id),
      searchQuery: query,
      locationReference,
      quantity,
      matchConfidence: match.confidence,
      matchNote: match.note,
      quotes: quotes.sort((a, b) => a.breakdown.estimatedTotal - b.breakdown.estimatedTotal),
      bestQuote,
      potentialSavings: savings.amount,
      savingsPercentage: savings.percentage,
      currency,
      createdAt: now.toISOString(),
      isDemoData,
    };
  }

  async getById(id: string, userId?: string): Promise<ComparisonResult> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Comparison not found');
    const filter: FilterQuery<Comparison> = { _id: id };
    if (userId) filter.userId = new Types.ObjectId(userId);
    const doc = await this.comparisonModel.findOne(filter).exec();
    if (!doc) throw new NotFoundException('Comparison not found');
    return this.toResult(doc);
  }

  async history(userId: string, page: number, limit: number): Promise<Paginated<ComparisonResult>> {
    const filter = { userId: new Types.ObjectId(userId) };
    const [docs, total] = await Promise.all([
      this.comparisonModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.comparisonModel.countDocuments(filter).exec(),
    ]);
    return paginate(
      docs.map((d) => this.toResult(d)),
      total,
      page,
      limit,
    );
  }

  private toResult(doc: ComparisonDocument): ComparisonResult {
    const any = doc as unknown as { _id: unknown; createdAt?: Date };
    const providerResults = (doc.providerResults ?? []) as unknown as Array<
      Record<string, unknown>
    >;
    const quotes = providerResults
      .filter((r) => typeof r.estimatedTotal === 'number')
      .map((r) => this.resultToQuote(r)) as ProviderQuote[];
    const best =
      quotes
        .filter((q) => q.quoteStatus === QuoteStatus.Complete && q.available)
        .sort((a, b) => a.breakdown.estimatedTotal - b.breakdown.estimatedTotal)[0] ?? null;

    return {
      id: String(any._id),
      searchQuery: doc.searchQuery,
      locationReference: doc.locationReference,
      quantity: doc.quantity,
      matchConfidence: doc.matchConfidence,
      matchNote: null,
      quotes: quotes.sort((a, b) => a.breakdown.estimatedTotal - b.breakdown.estimatedTotal),
      bestQuote: best,
      potentialSavings: doc.potentialSavings,
      savingsPercentage: 0,
      currency: doc.currency,
      createdAt: (any.createdAt ?? new Date()).toISOString(),
      isDemoData: doc.isDemoData,
    };
  }

  private resultToQuote(r: Record<string, unknown>): ProviderQuote {
    return {
      providerId: String(r.providerId),
      providerName: String(r.providerName),
      providerSlug: String(r.providerSlug),
      integrationMode: IntegrationMode.Demo,
      sourceType: (r.sourceType as SourceType) ?? SourceType.Demo,
      restaurantName: '',
      foodName: '',
      portionSize: '',
      quantity: 1,
      breakdown: {
        itemSubtotal: 0,
        itemDiscount: 0,
        deliveryFee: 0,
        platformFee: 0,
        packagingFee: 0,
        tax: 0,
        otherFees: 0,
        couponDiscount: 0,
        estimatedTotal: typeof r.estimatedTotal === 'number' ? r.estimatedTotal : 0,
      },
      currency: (r.currency as string) ?? 'INR',
      quoteStatus: (r.quoteStatus as QuoteStatus) ?? QuoteStatus.Complete,
      available: Boolean(r.available),
      estimatedDeliveryMinutes: (r.estimatedDeliveryMinutes as number) ?? null,
      quoteTimestamp: new Date().toISOString(),
      expiresAt: null,
      orderingCapability: 'none',
      officialOrderUrl: null,
      notes: [],
    };
  }

  private async findCandidates(query: string) {
    const normalized = normalizeName(query);
    const words = normalized.split(' ').filter((w) => w.length > 1);
    const regex = new RegExp(words.join('|') || normalized, 'i');
    return this.foodItemModel
      .find({ isActive: true, $or: [{ normalizedName: regex }, { category: regex }] })
      .limit(60)
      .lean()
      .exec();
  }

  private sourceTypeFor(provider: { integrationMode: string }): SourceType {
    return provider.integrationMode === IntegrationMode.Demo ? SourceType.Demo : SourceType.Live;
  }

  private providerErrorResult(
    provider: { _id: unknown; name: string; slug: string; integrationMode: string },
    error: unknown,
  ): Record<string, unknown> {
    let message = 'Provider is temporarily unavailable.';
    if (error instanceof ProviderOperationError) {
      if (error.code === 'not_supported') message = error.message;
      else if (error.code === 'timeout') message = 'Provider timed out.';
      else message = error.message;
    }
    return {
      providerId: String(provider._id),
      providerName: provider.name,
      providerSlug: provider.slug,
      available: false,
      quoteStatus: QuoteStatus.Unavailable,
      sourceType: this.sourceTypeFor(provider),
      error: message,
    };
  }

  private async persist(input: {
    userId?: string;
    query: string;
    locationReference: string;
    quantity: number;
    matchConfidence: MatchConfidence;
    matchedItems: Record<string, unknown>[];
    providerResults: Array<Record<string, unknown>>;
    bestPrice: number | null;
    potentialSavings: number;
    currency: string;
    isDemoData: boolean;
  }): Promise<ComparisonDocument> {
    return this.comparisonModel.create({
      userId: input.userId ? new Types.ObjectId(input.userId) : null,
      searchQuery: input.query,
      locationReference: input.locationReference,
      quantity: input.quantity,
      matchConfidence: input.matchConfidence,
      matchedItems: input.matchedItems,
      providerResults: input.providerResults,
      bestPrice: input.bestPrice,
      potentialSavings: input.potentialSavings,
      currency: input.currency,
      isDemoData: input.isDemoData,
    });
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new ProviderOperationError('Provider request timed out', 'timeout')),
        ms,
      );
      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        },
      );
    });
  }
}
