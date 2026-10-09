import { Logger, Module, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InjectConnection, MongooseModule } from '@nestjs/mongoose';
import mongoose, { Connection } from 'mongoose';
import { DatabaseHealthService } from './database-health.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongodbUri'),
        // Fail fast on bad credentials or unreachable clusters.
        serverSelectionTimeoutMS: 8000,
        // Keep queries efficient and predictable.
        maxPoolSize: 20,
        autoIndex: config.get<string>('nodeEnv') !== 'production',
      }),
    }),
  ],
  providers: [DatabaseHealthService],
  exports: [DatabaseHealthService, MongooseModule],
})
export class DatabaseModule implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger('DatabaseModule');

  constructor(@InjectConnection() private readonly connection: Connection) {}

  onModuleInit(): void {
    // Expose `id` instead of `_id` and strip internal version keys on JSON output.
    mongoose.set('toJSON', {
      versionKey: false,
      transform: (_doc: unknown, ret: Record<string, unknown>) => {
        if (ret._id && typeof ret._id === 'object' && 'toString' in ret._id) {
          ret.id = (ret._id as { toString(): string }).toString();
        } else if (typeof ret._id === 'string') {
          ret.id = ret._id;
        }
        delete ret._id;
        return ret;
      },
    });
    this.connection.on('connected', () => this.logger.log('MongoDB connected'));
    this.connection.on('error', (err) => this.logger.error(`MongoDB error: ${err.message}`));
    this.connection.on('disconnected', () => this.logger.warn('MongoDB disconnected'));
  }

  async onApplicationShutdown(): Promise<void> {
    await this.connection.close();
  }
}
