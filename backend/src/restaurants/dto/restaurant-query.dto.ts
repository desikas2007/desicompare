import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class RestaurantQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Free-text search across name and cuisine' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by cuisine' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  cuisine?: string;
}
