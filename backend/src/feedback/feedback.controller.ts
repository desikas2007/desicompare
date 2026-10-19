import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@foodcompare/shared-types';
import { AuthenticatedUser, CurrentUser, Roles } from '../common/decorators/auth.decorators';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, FeedbackQueryDto, UpdateFeedbackStatusDto } from './dto/feedback.dto';

@ApiTags('feedback')
@ApiBearerAuth()
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFeedbackDto) {
    return this.feedback.create(user.userId, dto);
  }

  @Get('mine')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.feedback.listMine(user.userId);
  }

  @Get()
  @Roles(UserRole.Admin)
  list(@Query() query: FeedbackQueryDto) {
    return this.feedback.list(query);
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateFeedbackStatusDto) {
    return this.feedback.updateStatus(id, dto.status);
  }
}
