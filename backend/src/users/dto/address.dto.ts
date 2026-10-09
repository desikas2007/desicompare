import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateAddressDto {
  @ApiProperty({ example: 'Home' })
  @IsString()
  @Length(1, 40)
  @Transform(trim)
  label!: string;

  @ApiProperty({ example: 'Aarav Sharma' })
  @IsString()
  @Length(1, 120)
  @Transform(trim)
  recipientName!: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @Matches(/^[+0-9\s-]{6,20}$/, { message: 'Enter a valid phone number' })
  @Transform(trim)
  phone!: string;

  @ApiProperty({ example: 'Flat 402, Green Residency' })
  @IsString()
  @Length(3, 200)
  @Transform(trim)
  addressLine1!: string;

  @ApiPropertyOptional({ example: 'Near City Mall' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(trim)
  addressLine2?: string;

  @ApiProperty({ example: 'Bengaluru' })
  @IsString()
  @Length(1, 80)
  @Transform(trim)
  city!: string;

  @ApiProperty({ example: 'Karnataka' })
  @IsString()
  @Length(1, 80)
  @Transform(trim)
  state!: string;

  @ApiProperty({ example: '560001' })
  @IsString()
  @Length(3, 12)
  @Transform(trim)
  postalCode!: string;

  @ApiPropertyOptional({ example: 12.9716 })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ example: 77.5946 })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
