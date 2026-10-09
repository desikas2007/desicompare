import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/auth.decorators';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { AddFavoriteDto } from './dto/favorite.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users/me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async me(@CurrentUser() user: AuthenticatedUser) {
    const found = await this.usersService.findByIdOrFail(user.userId);
    return this.usersService.toProfile(found);
  }

  @Patch()
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.userId, dto);
  }

  @Get('addresses')
  listAddresses(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.listAddresses(user.userId);
  }

  @Post('addresses')
  createAddress(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAddressDto) {
    return this.usersService.createAddress(user.userId, dto);
  }

  @Patch('addresses/:id')
  updateAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(user.userId, id, dto);
  }

  @Delete('addresses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAddress(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.usersService.deleteAddress(user.userId, id);
  }

  @Get('favorites')
  listFavorites(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.listFavorites(user.userId);
  }

  @Post('favorites')
  addFavorite(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddFavoriteDto) {
    return this.usersService.addFavorite(user.userId, dto);
  }

  @Delete('favorites/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFavorite(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.usersService.removeFavorite(user.userId, id);
  }
}
