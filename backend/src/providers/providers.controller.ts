import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/auth.decorators';
import { ProviderRegistryService } from './provider-registry.service';

@ApiTags('providers')
@Public()
@Controller('providers')
export class ProvidersController {
  constructor(private readonly registry: ProviderRegistryService) {}

  @Get()
  list() {
    return this.registry.listProviders();
  }

  @Get(':id/status')
  status(@Param('id') id: string) {
    return this.registry.getStatus(id);
  }
}
