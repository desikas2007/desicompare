import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IntegrationMode, ProviderCapability, ProviderSummary } from '@foodcompare/shared-types';
import { ModelNames } from '../database/model-names';
import { ProviderDocument, Provider } from '../database/schemas/provider.schema';
import { ProviderMenuItem } from '../database/schemas/provider-menu-item.schema';
import { FoodItem } from '../database/schemas/food-item.schema';
import { Restaurant } from '../database/schemas/restaurant.schema';
import { ProviderRestaurant } from '../database/schemas/provider-restaurant.schema';
import { AppLogger } from '../common/logger/app-logger.service';
import {
  DemoAdapterModels,
  DemoProviderAdapter,
  UnconfiguredProviderAdapter,
} from './adapters/demo.adapter';
import { ProviderAdapter, ProviderContext } from './provider-adapter.interface';

export interface ProviderStatus {
  provider: ProviderSummary;
  healthy: boolean;
  detail: string;
}

@Injectable()
export class ProviderRegistryService implements OnModuleInit {
  private adapters = new Map<string, ProviderAdapter>();

  constructor(
    @InjectModel(ModelNames.Provider) private readonly providerModel: Model<Provider>,
    @InjectModel(ModelNames.ProviderMenuItem)
    private readonly providerMenuItem: Model<ProviderMenuItem>,
    @InjectModel(ModelNames.FoodItem) private readonly foodItem: Model<FoodItem>,
    @InjectModel(ModelNames.Restaurant) private readonly restaurant: Model<Restaurant>,
    @InjectModel(ModelNames.ProviderRestaurant)
    private readonly providerRestaurant: Model<ProviderRestaurant>,
    private readonly config: ConfigService,
    private readonly logger: AppLogger,
  ) {}

  async onModuleInit(): Promise<void> {
    // Best-effort warm-up; failures must not crash the application.
    try {
      await this.reload();
    } catch (error) {
      this.logger.warn('Provider registry warm-up failed; will retry lazily', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  async reload(): Promise<void> {
    const providers = await this.providerModel.find({ enabled: true }).exec();
    this.adapters.clear();
    for (const provider of providers) {
      this.adapters.set(provider.slug, this.buildAdapter(provider));
    }
    this.logger.log('Provider registry loaded', { count: this.adapters.size });
  }

  private buildAdapter(provider: ProviderDocument): ProviderAdapter {
    const context: ProviderContext = {
      providerId: String(provider._id),
      providerSlug: provider.slug,
      providerName: provider.name,
      integrationMode: provider.integrationMode,
    };
    const globalMode = this.config.get<string>('providerIntegrationMode');
    const useDemo = provider.integrationMode === IntegrationMode.Demo && globalMode === 'demo';
    if (useDemo) {
      const models: DemoAdapterModels = {
        providerMenuItem: this.providerMenuItem,
        foodItem: this.foodItem,
        restaurant: this.restaurant,
        providerRestaurant: this.providerRestaurant,
      };
      return new DemoProviderAdapter(context, models);
    }
    return new UnconfiguredProviderAdapter({
      ...context,
      integrationMode: IntegrationMode.Unconfigured,
    });
  }

  async getEnabledAdapters(): Promise<ProviderAdapter[]> {
    if (this.adapters.size === 0) {
      await this.reload();
    }
    return [...this.adapters.values()];
  }

  async getAdapterBySlug(slug: string): Promise<ProviderAdapter> {
    if (this.adapters.size === 0) await this.reload();
    const adapter = this.adapters.get(slug);
    if (!adapter) {
      throw new NotFoundException(`Provider "${slug}" is not enabled`);
    }
    return adapter;
  }

  async listProviders(): Promise<ProviderSummary[]> {
    const providers = await this.providerModel.find().sort({ name: 1 }).exec();
    return providers.map((p) => this.toSummary(p));
  }

  async getProviderByIdOrSlug(idOrSlug: string): Promise<ProviderSummary> {
    const provider = await this.findProvider(idOrSlug);
    return this.toSummary(provider);
  }

  async getStatus(idOrSlug: string): Promise<ProviderStatus> {
    const provider = await this.findProvider(idOrSlug);
    const summary = this.toSummary(provider);
    const globalMode = this.config.get<string>('providerIntegrationMode');

    if (!provider.enabled) {
      return {
        provider: summary,
        healthy: false,
        detail: 'Provider is disabled by an administrator.',
      };
    }
    if (provider.integrationMode === IntegrationMode.Demo && globalMode === 'demo') {
      const itemCount = await this.providerMenuItem
        .countDocuments({ providerId: provider._id })
        .exec();
      return {
        provider: summary,
        healthy: itemCount > 0,
        detail:
          itemCount > 0
            ? `Demonstration data available (${itemCount} menu records). Not live provider pricing.`
            : 'No demonstration menu records are available yet. Run the seed script.',
      };
    }
    if (provider.integrationMode === IntegrationMode.Demo && globalMode !== 'demo') {
      return {
        provider: summary,
        healthy: false,
        detail:
          'Demonstration mode is disabled but no authorized live integration is configured for this provider.',
      };
    }
    return {
      provider: summary,
      healthy: false,
      detail:
        provider.statusNote ??
        'No authorized integration is configured. Live pricing and ordering are unavailable.',
    };
  }

  async findProvider(idOrSlug: string): Promise<ProviderDocument> {
    const query = Types.ObjectId.isValid(idOrSlug)
      ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
      : { slug: idOrSlug };
    const provider = await this.providerModel.findOne(query).exec();
    if (!provider) throw new NotFoundException(`Provider "${idOrSlug}" was not found`);
    return provider;
  }

  async setEnabled(idOrSlug: string, enabled: boolean): Promise<ProviderSummary> {
    return this.updateProvider(idOrSlug, { enabled });
  }

  async updateProvider(
    idOrSlug: string,
    patch: { enabled?: boolean; integrationMode?: IntegrationMode; statusNote?: string },
  ): Promise<ProviderSummary> {
    const provider = await this.findProvider(idOrSlug);
    if (patch.enabled !== undefined) provider.enabled = patch.enabled;
    if (patch.integrationMode !== undefined) provider.integrationMode = patch.integrationMode;
    if (patch.statusNote !== undefined) provider.statusNote = patch.statusNote;
    await provider.save();
    await this.reload();
    return this.toSummary(provider);
  }

  toSummary(provider: ProviderDocument): ProviderSummary {
    return {
      id: String(provider._id),
      name: provider.name,
      slug: provider.slug,
      logoUrl: provider.logoUrl ?? null,
      enabled: provider.enabled,
      integrationMode: provider.integrationMode,
      capabilities: (provider.capabilities ?? []) as ProviderCapability[],
      officialWebsite: provider.officialWebsite ?? null,
      lastSuccessfulSync: provider.lastSuccessfulSync
        ? provider.lastSuccessfulSync.toISOString()
        : null,
      statusNote: provider.statusNote ?? null,
    };
  }
}
