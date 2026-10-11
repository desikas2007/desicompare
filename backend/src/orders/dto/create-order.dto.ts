import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsMongoId, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: 'Client-generated idempotency key to prevent duplicate orders' })
  @IsString()
  @Length(8, 120)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  idempotencyKey!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  addressId?: string;

  @ApiPropertyOptional({ example: 'Chennai, Tamil Nadu' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;
}
