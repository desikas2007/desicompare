import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthenticatedUser, CurrentUser, Public } from '../common/decorators/auth.decorators';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { OptionalJwt } from '../common/decorators/optional-jwt.decorator';
import { ComparisonsService } from './comparisons.service';
import { CreateComparisonDto } from './dto/create-comparison.dto';

@ApiTags('comparisons')
@Controller('comparisons')
export class ComparisonsController {
  constructor(private readonly comparisons: ComparisonsService) {}

  @Public()
  @OptionalJwt()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post()
  compare(@Body() dto: CreateComparisonDto, @CurrentUser() user?: AuthenticatedUser) {
    return this.comparisons.compare(dto, user?.userId);
  }

  @ApiBearerAuth()
  @Get('history')
  history(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationQueryDto) {
    return this.comparisons.history(user.userId, query.page, query.limit);
  }

  @Public()
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.comparisons.getById(id);
  }
}
