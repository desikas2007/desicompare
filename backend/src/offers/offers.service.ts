import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { OfferSummary } from '@foodcompare/shared-types';
import { ModelNames } from '../database/model-names';
import { OfferDocument, Offer } from '../database/schemas/offer.schema';
import { Provider } from '../database/schemas/provider.schema';
import { Restaurant } from '../database/schemas/restaurant.schema';
import { Paginated, paginate } from '../common/dto/pagination.dto';
import { ListOffersDto } from './dto/list-offers.dto';

@Injectable()
export class OffersService {
  constructor(
    @InjectModel(ModelNames.Offer) private readonly offerModel: Model<Offer>,
    @InjectModel(ModelNames.Provider) private readonly providerModel: Model<Provider>,
    @InjectModel(ModelNames.Restaurant) private readonly restaurantModel: Model<Restaurant>,
  ) {}

  async list(query: ListOffersDto): Promise<Paginated<OfferSummary>> {
    const filter: FilterQuery<Offer> = {};
    if (query.providerId && Types.ObjectId.isValid(query.providerId)) {
      filter.providerId = new Types.ObjectId(query.providerId);
    }
    if (query.restaurantId && Types.ObjectId.isValid(query.restaurantId)) {
      filter.restaurantId = new Types.ObjectId(query.restaurantId);
    }
    if (query.activeOnly === 'true') {
      const now = new Date();
      filter.$and = [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }] },
        { verificationStatus: { $in: ['verified', 'demo'] } },
      ];
    }

    const [docs, total] = await Promise.all([
      this.offerModel
        .find(filter)
        .sort({ expiresAt: -1, createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .exec(),
      this.offerModel.countDocuments(filter).exec(),
    ]);

    const providerIds = [...new Set(docs.map((d) => String(d.providerId)))];
    const providers = providerIds.length
      ? await this.providerModel.find({ _id: { $in: providerIds } }).exec()
      : [];
    const providerMap = new Map(providers.map((p) => [String(p._id), p.name]));

    const items = docs.map((doc) => this.toSummary(doc, providerMap));
    return paginate(items, total, query.page, query.limit);
  }

  async getById(id: string): Promise<OfferSummary> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Offer not found');
    const doc = await this.offerModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Offer not found');
    const provider = await this.providerModel.findById(doc.providerId).exec();
    const providerMap = new Map([[String(doc.providerId), provider?.name ?? '']]);
    return this.toSummary(doc, providerMap);
  }

  private toSummary(
    doc: OfferDocument | (Offer & { _id: unknown }),
    providerMap: Map<string, string>,
  ): OfferSummary {
    const any = doc as unknown as { _id: unknown };
    const expired = doc.expiresAt ? doc.expiresAt.getTime() < Date.now() : false;
    const verificationStatus = expired ? 'expired' : doc.verificationStatus;
    return {
      id: String(any._id),
      providerId: String(doc.providerId),
      providerName: providerMap.get(String(doc.providerId)) ?? '',
      restaurantId: doc.restaurantId ? String(doc.restaurantId) : null,
      code: doc.code ?? null,
      description: doc.description,
      discountType: doc.discountType,
      discountValue: doc.discountValue,
      minimumOrderValue: doc.minimumOrderValue ?? null,
      maximumDiscount: doc.maximumDiscount ?? null,
      startsAt: doc.startsAt ? doc.startsAt.toISOString() : null,
      expiresAt: doc.expiresAt ? doc.expiresAt.toISOString() : null,
      terms: doc.terms ?? null,
      verificationStatus,
    };
  }
}
