import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/auth.decorators';
import { RestaurantsService } from './restaurants.service';
import { RestaurantQueryDto } from './dto/restaurant-query.dto';

@ApiTags('restaurants')
@Public()
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurants: RestaurantsService) {}

  @Get()
  list(@Query() query: RestaurantQueryDto) {
    return this.restaurants.list(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.restaurants.getById(id);
  }
}
