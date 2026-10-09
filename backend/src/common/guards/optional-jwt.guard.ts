import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedUser } from '../decorators/auth.decorators';

/**
 * Attaches req.user when a valid access token is present, but never rejects the
 * request when it is absent. Used for endpoints that are public yet enhanced
 * for signed-in users (e.g. saving comparison history).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = AuthenticatedUser>(_err: unknown, user: TUser): TUser | undefined {
    return user || undefined;
  }
}
