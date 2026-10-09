import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/auth.decorators';
import { OffersService } from './offers.service';
import { ListOffersDto } from './dto/list-offers.dto';

@ApiTags('offers')
@Public()
@Controller('offers')
export class OffersController {
  constructor(private readonly offers: OffersService) {}

  @Get()
  list(@Query() query: ListOffersDto) {
    return this.offers.list(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.offers.getById(id);
  }
}
