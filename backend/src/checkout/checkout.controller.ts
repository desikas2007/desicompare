import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/auth.decorators';
import { OptionalJwt } from '../common/decorators/optional-jwt.decorator';
import { CurrentCartOwner, ResolvedCartOwner } from '../common/decorators/cart-owner.decorator';
import { CheckoutService } from './checkout.service';
import { CheckoutQuoteDto } from './dto/checkout-quote.dto';

@ApiTags('checkout')
@Public()
@OptionalJwt()
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @Post('quote')
  quote(@CurrentCartOwner() owner: ResolvedCartOwner, @Body() dto: CheckoutQuoteDto) {
    return this.checkout.quote(owner, dto.location);
  }
}
