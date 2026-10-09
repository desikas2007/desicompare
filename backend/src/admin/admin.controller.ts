import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@foodcompare/shared-types';
import { Roles } from '../common/decorators/auth.decorators';
import { AdminService } from './admin.service';
import { ProviderRegistryService } from '../providers/provider-registry.service';
import { UpdateOfferStatusDto, UpdateProviderDto } from './dto/admin.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.Admin)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly registry: ProviderRegistryService,
  ) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Get('providers')
  providers() {
    return this.registry.listProviders();
  }

  @Patch('providers/:id')
  setProvider(@Param('id') id: string, @Body() dto: UpdateProviderDto) {
    return this.registry.setEnabled(id, dto.enabled ?? false);
  }

  @Patch('offers/:id/status')
  updateOfferStatus(@Param('id') id: string, @Body() dto: UpdateOfferStatusDto) {
    return this.admin.updateOfferStatus(id, dto.verificationStatus);
  }
}
