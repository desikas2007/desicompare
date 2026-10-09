import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/auth.decorators';
import { FoodItemsService } from './food-items.service';
import { FoodItemQueryDto } from './dto/food-item-query.dto';

@ApiTags('food-items')
@Public()
@Controller('food-items')
export class FoodItemsController {
  constructor(private readonly foodItems: FoodItemsService) {}

  @Get()
  list(@Query() query: FoodItemQueryDto) {
    return this.foodItems.list(query);
  }

  @Get('categories')
  categories() {
    return this.foodItems.listCategories();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.foodItems.getById(id);
  }
}
