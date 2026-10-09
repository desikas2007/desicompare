import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/auth.decorators';
import { DatabaseHealthService } from '../database/database-health.service';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(private readonly databaseHealth: DatabaseHealthService) {}

  @Get()
  async health() {
    const database = await this.databaseHealth.check();
    return {
      status: database.status === 'up' ? 'ok' : 'degraded',
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
      database,
    };
  }

  @Get('database')
  async database() {
    return this.databaseHealth.check();
  }
}
