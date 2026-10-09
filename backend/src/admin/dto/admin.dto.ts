import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class UpdateProviderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateOfferStatusDto {
  @ApiProperty({ enum: ['verified', 'unverified', 'demo', 'expired'] })
  @IsIn(['verified', 'unverified', 'demo', 'expired'])
  verificationStatus!: 'verified' | 'unverified' | 'demo' | 'expired';
}
