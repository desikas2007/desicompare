import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelNames } from '../database/model-names';
import { FeedbackSchema } from '../database/schemas/feedback.schema';
import { RestaurantSchema } from '../database/schemas/restaurant.schema';
import { FoodItemSchema } from '../database/schemas/food-item.schema';
import { UserSchema } from '../database/schemas/user.schema';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ModelNames.Feedback, schema: FeedbackSchema },
      { name: ModelNames.Restaurant, schema: RestaurantSchema },
      { name: ModelNames.FoodItem, schema: FoodItemSchema },
      { name: ModelNames.User, schema: UserSchema },
    ]),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
