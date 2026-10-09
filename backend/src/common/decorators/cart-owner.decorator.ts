import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser, RequestWithUser } from './auth.decorators';

export interface ResolvedCartOwner {
  userId?: string;
  anonymousId?: string;
}

/**
 * Resolves the cart owner from either the authenticated user or the
 * `x-cart-id` header used for anonymous shopping carts.
 */
export const CurrentCartOwner = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ResolvedCartOwner => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser & Request>();
    const user = request.user as AuthenticatedUser | undefined;
    const headerValue = request.headers['x-cart-id'];
    const anonymousId =
      typeof headerValue === 'string' && headerValue.length <= 64 ? headerValue : undefined;
    return { userId: user?.userId, anonymousId };
  },
);
