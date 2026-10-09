import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';

export class AddFavoriteDto {
  @ApiPropertyOptional({ description: 'Restaurant id to favorite' })
  @IsOptional()
  @IsMongoId()
  restaurantId?: string;

  @ApiPropertyOptional({ description: 'Food item id to favorite' })
  @IsOptional()
  @IsMongoId()
  foodItemId?: string;
}
