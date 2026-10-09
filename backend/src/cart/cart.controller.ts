import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/auth.decorators';
import { OptionalJwt } from '../common/decorators/optional-jwt.decorator';
import { CurrentCartOwner, ResolvedCartOwner } from '../common/decorators/cart-owner.decorator';
import { CartService } from './cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

@ApiTags('cart')
@Public()
@OptionalJwt()
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  get(@CurrentCartOwner() owner: ResolvedCartOwner) {
    return this.cart.getCart(owner);
  }

  @Post('items')
  add(@CurrentCartOwner() owner: ResolvedCartOwner, @Body() dto: AddCartItemDto) {
    return this.cart.addItem(owner, dto);
  }

  @Patch('items/:id')
  update(
    @CurrentCartOwner() owner: ResolvedCartOwner,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cart.updateItem(owner, id, dto);
  }

  @Delete('items/:id')
  remove(@CurrentCartOwner() owner: ResolvedCartOwner, @Param('id') id: string) {
    return this.cart.removeItem(owner, id);
  }

  @Delete()
  clear(@CurrentCartOwner() owner: ResolvedCartOwner) {
    return this.cart.clear(owner);
  }
}
