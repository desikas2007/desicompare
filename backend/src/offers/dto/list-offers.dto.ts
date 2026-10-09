import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBooleanString, IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class ListOffersDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  providerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  restaurantId?: string;

  @ApiPropertyOptional({ description: 'Only return currently active, non-expired offers' })
  @IsOptional()
  @IsBooleanString()
  @Transform(({ value }: { value: unknown }) => String(value))
  activeOnly?: string;
}
