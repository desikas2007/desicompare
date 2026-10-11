import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthSession, UserProfile } from '@foodcompare/shared-types';
import { ModelNames } from '../database/model-names';
import { RefreshSession } from '../database/schemas/refresh-session.schema';
import { UsersService } from '../users/users.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { MailService } from './mail.service';
import { AppLogger } from '../common/logger/app-logger.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';

export interface AuthResult extends AuthSession {
  refreshToken: string;
  refreshExpiresAt: Date;
}

interface RequestContext {
  userAgent?: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly logger: AppLogger,
    @InjectModel(ModelNames.RefreshSession)
    private readonly refreshModel: Model<RefreshSession>,
  ) {}

  async register(dto: RegisterDto, ctx: RequestContext): Promise<AuthResult> {
    if (!(this.config.get<boolean>('auth.allowRegistration') ?? true)) {
      throw new ForbiddenException('Registration is currently disabled');
    }
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('An account with this email already exists');
    }

    const passwordHash = await this.passwords.hash(dto.password);
    const user = await this.users.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      mobile: dto.mobile ?? null,
    });

    if (this.config.get<boolean>('auth.requireEmailVerification')) {
      await this.sendVerificationEmail(user.id, user.email);
    }

    return this.issueSession(user.id, user.email, user.role, ctx, this.users.toProfile(user));
  }

  async login(dto: LoginDto, ctx: RequestContext): Promise<AuthResult> {
    const user = await this.users.findByEmail(dto.email, true);
    const passwordOk = user ? await this.passwords.compare(dto.password, user.passwordHash) : false;
    if (!user || !passwordOk) {
      // Generic message: never reveal whether the email exists.
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.status !== 'active') {
      throw new ForbiddenException('This account is not active');
    }
    if (this.config.get<boolean>('auth.requireEmailVerification') && !user.emailVerified) {
      throw new ForbiddenException('Please verify your email before signing in');
    }
    return this.issueSession(user.id, user.email, user.role, ctx, this.users.toProfile(user));
  }

  async refresh(rawToken: string | undefined, ctx: RequestContext): Promise<AuthResult> {
    if (!rawToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const tokenHash = this.tokens.hashRefreshToken(rawToken);
    const session = await this.refreshModel.findOne({ tokenHash }).exec();
    if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }

    const user = await this.users.findById(String(session.userId));
    if (!user || user.status !== 'active') {
      await this.revoke(tokenHash);
      throw new UnauthorizedException('Session is no longer valid');
    }

    // Rotate: revoke the presented token, then issue a fresh pair.
    const next = this.tokens.generateRefreshToken();
    session.revokedAt = new Date();
    session.replacedBy = next.hash;
    await session.save();

    return this.issueSession(user.id, user.email, user.role, ctx, this.users.toProfile(user), next);
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    await this.revoke(this.tokens.hashRefreshToken(rawToken));
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ delivered: boolean }> {
    const user = await this.users.findByEmail(dto.email);
    if (user) {
      const token = this.tokens.signPasswordResetToken({ id: user.id, email: user.email });
      const frontend = this.config.get<string>('frontendUrl');
      const link = `${frontend}/reset-password?token=${token}`;
      await this.mail.send(
        user.email,
        'Reset your FoodCompare password',
        `Use this link to reset your password (valid for 30 minutes): ${link}`,
      );
    }
    // Always the same response to avoid account enumeration.
    return { delivered: true };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ reset: boolean }> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    let payload;
    try {
      payload = this.tokens.verifyPasswordResetToken(dto.token);
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }
    if (payload.purpose !== 'reset') {
      throw new BadRequestException('Invalid reset token');
    }
    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new BadRequestException('Invalid reset token');
    }
    const passwordHash = await this.passwords.hash(dto.password);
    await this.users.updatePassword(user.id, passwordHash);
    // Invalidate all existing sessions after a password reset.
    await this.refreshModel.updateMany(
      { userId: user._id, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    this.logger.log('Password reset completed', { userId: user.id });
    return { reset: true };
  }

  async me(userId: string): Promise<UserProfile> {
    const user = await this.users.findByIdOrFail(userId);
    return this.users.toProfile(user);
  }

  private async issueSession(
    userId: string,
    email: string,
    role: AuthResult['user']['role'],
    ctx: RequestContext,
    profile: UserProfile,
    presetToken?: { token: string; hash: string },
  ): Promise<AuthResult> {
    const access = this.tokens.signAccessToken({ sub: userId, email, role });
    const refresh = presetToken ?? this.tokens.generateRefreshToken();
    const refreshExpiresAt = new Date(Date.now() + this.tokens.refreshTtlSeconds * 1000);

    await this.refreshModel.create({
      userId,
      tokenHash: refresh.hash,
      expiresAt: refreshExpiresAt,
      userAgent: ctx.userAgent ?? null,
    });

    return {
      user: profile,
      accessToken: access.token,
      expiresIn: access.expiresIn,
      refreshToken: refresh.token,
      refreshExpiresAt,
    };
  }

  private async revoke(tokenHash: string): Promise<void> {
    await this.refreshModel
      .updateOne({ tokenHash, revokedAt: null }, { $set: { revokedAt: new Date() } })
      .exec();
  }

  private async sendVerificationEmail(userId: string, email: string): Promise<void> {
    const frontend = this.config.get<string>('frontendUrl');
    await this.mail.send(
      email,
      'Verify your FoodCompare email',
      `Confirm your email: ${frontend}/login?verified=1`,
    );
  }
}
