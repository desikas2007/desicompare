import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/auth.decorators';
import { FoodItemsService } from './food-items.service';

@ApiTags('categories')
@Public()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly foodItems: FoodItemsService) {}

  @Get()
  list() {
    return this.foodItems.listCategories();
  }
}
