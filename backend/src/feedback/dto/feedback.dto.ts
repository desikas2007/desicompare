import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackCategory, FeedbackStatus } from '@foodcompare/shared-types';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({ enum: FeedbackCategory, description: 'What the feedback is about' })
  @IsEnum(FeedbackCategory)
  category!: FeedbackCategory;

  @ApiPropertyOptional({
    description: 'Optional rating from 1 (worst) to 5 (best)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({ minLength: 10, maxLength: 2000, description: 'The feedback message' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message!: string;

  @ApiPropertyOptional({ description: 'Restaurant the feedback refers to' })
  @IsOptional()
  @IsMongoId()
  restaurantId?: string;

  @ApiPropertyOptional({ description: 'Dish the feedback refers to' })
  @IsOptional()
  @IsMongoId()
  foodItemId?: string;
}

export class FeedbackQueryDto {
  @ApiPropertyOptional({ enum: FeedbackStatus, description: 'Filter by review status' })
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;

  @ApiPropertyOptional({ enum: FeedbackCategory, description: 'Filter by category' })
  @IsOptional()
  @IsEnum(FeedbackCategory)
  category?: FeedbackCategory;
}

export class UpdateFeedbackStatusDto {
  @ApiProperty({ enum: FeedbackStatus })
  @IsEnum(FeedbackStatus)
  status!: FeedbackStatus;
}
