import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { DietaryType } from '@foodcompare/shared-types';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export const SEARCH_SORTS = [
  'price_asc',
  'price_desc',
  'rating_desc',
  'delivery_asc',
  'relevance',
] as const;
export type SearchSort = (typeof SEARCH_SORTS)[number];

export class SearchQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Food, restaurant, cuisine or category keywords' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  cuisine?: string;

  @ApiPropertyOptional({ description: 'Provider slug' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  provider?: string;

  @ApiPropertyOptional({ enum: DietaryType })
  @IsOptional()
  @IsEnum(DietaryType)
  dietaryType?: DietaryType;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 180 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(180)
  maxDeliveryMinutes?: number;

  @ApiPropertyOptional({ enum: SEARCH_SORTS, default: 'relevance' })
  @IsOptional()
  @IsIn(SEARCH_SORTS as unknown as string[])
  sort: SearchSort = 'relevance';
}
