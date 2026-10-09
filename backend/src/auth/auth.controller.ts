import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CookieOptions, Request, Response } from 'express';
import { AuthenticatedUser, CurrentUser, Public } from '../common/decorators/auth.decorators';
import { AuthService, AuthResult } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, RefreshTokenDto, ResetPasswordDto } from './dto/auth.dto';

const REFRESH_COOKIE_PATH = '/';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.register(dto, { userAgent: req.headers['user-agent'] });
    this.setRefreshCookie(res, result);
    return this.sessionBody(result);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto, { userAgent: req.headers['user-agent'] });
    this.setRefreshCookie(res, result);
    return this.sessionBody(result);
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieToken = (req.cookies as Record<string, string> | undefined)?.[this.cookieName];
    const result = await this.auth.refresh(cookieToken ?? dto.refreshToken, {
      userAgent: req.headers['user-agent'],
    });
    this.setRefreshCookie(res, result);
    return this.sessionBody(result);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookieToken = (req.cookies as Record<string, string> | undefined)?.[this.cookieName];
    await this.auth.logout(cookieToken);
    res.clearCookie(this.cookieName, { path: REFRESH_COOKIE_PATH });
    return { loggedOut: true };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.me(user.userId);
  }

  private get cookieName(): string {
    return this.config.get<string>('cookie.name') ?? 'fc_refresh';
  }

  private cookieOptions(): CookieOptions {
    const isProd = this.config.get<string>('nodeEnv') === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: REFRESH_COOKIE_PATH,
    };
  }

  private setRefreshCookie(res: Response, result: AuthResult): void {
    res.cookie(this.cookieName, result.refreshToken, {
      ...this.cookieOptions(),
      expires: result.refreshExpiresAt,
    });
  }

  /**
   * The HttpOnly cookie is the browser-safe path. For non-browser clients the
   * rotation token is also returned so they can persist it securely themselves.
   */
  private sessionBody(result: AuthResult) {
    return {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      refreshToken: result.refreshToken,
    };
  }
}
