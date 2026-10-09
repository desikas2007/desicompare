import { applyDecorators, UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt.guard';

/**
 * Allows the route to run for anonymous users while still populating
 * `req.user` when a valid access token is supplied.
 */
export const OptionalJwt = (): MethodDecorator & ClassDecorator =>
  applyDecorators(UseGuards(OptionalJwtAuthGuard));
