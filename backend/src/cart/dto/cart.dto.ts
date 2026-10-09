import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsOptional, Max, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ description: 'Food item id' })
  @IsMongoId()
  foodItemId!: string;

  @ApiPropertyOptional({ description: 'Provider menu item id (recommended for accurate pricing)' })
  @IsOptional()
  @IsMongoId()
  providerMenuItemId?: string;

  @ApiProperty({ example: 1, minimum: 1, maximum: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  quantity!: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 2, minimum: 0, maximum: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  quantity!: number;
}
