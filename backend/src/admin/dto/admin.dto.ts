import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { IntegrationMode } from '@foodcompare/shared-types';

export class UpdateProviderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ enum: IntegrationMode })
  @IsOptional()
  @IsIn(Object.values(IntegrationMode))
  integrationMode?: IntegrationMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  statusNote?: string;
}

export class UpdateOfferStatusDto {
  @ApiProperty({ enum: ['verified', 'unverified', 'demo', 'expired'] })
  @IsIn(['verified', 'unverified', 'demo', 'expired'])
  verificationStatus!: 'verified' | 'unverified' | 'demo' | 'expired';
}
