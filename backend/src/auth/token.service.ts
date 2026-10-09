import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { UserRole } from '@foodcompare/shared-types';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface PasswordResetPayload {
  sub: string;
  email: string;
  purpose: 'reset';
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private get accessTtlSeconds(): number {
    const ttl = this.config.get<string>('jwt.accessTtl') ?? '15m';
    return this.parseTtl(ttl);
  }

  parseTtl(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl.trim());
    if (!match) {
      const asNumber = Number.parseInt(ttl, 10);
      return Number.isFinite(asNumber) ? asNumber : 900;
    }
    const value = Number.parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * multipliers[unit];
  }

  signAccessToken(payload: AccessTokenPayload): { token: string; expiresIn: number } {
    const token = this.jwt.sign(payload, {
      secret: this.config.get<string>('jwt.accessSecret') || 'dev-access-secret-change-me',
      expiresIn: this.config.get<string>('jwt.accessTtl') ?? '15m',
    });
    return { token, expiresIn: this.accessTtlSeconds };
  }

  signPasswordResetToken(user: { id: string; email: string }): string {
    const payload: PasswordResetPayload = { sub: user.id, email: user.email, purpose: 'reset' };
    return this.jwt.sign(payload, {
      secret: this.config.get<string>('jwt.accessSecret') || 'dev-access-secret-change-me',
      expiresIn: '30m',
    });
  }

  verifyPasswordResetToken(token: string): PasswordResetPayload {
    return this.jwt.verify<PasswordResetPayload>(token, {
      secret: this.config.get<string>('jwt.accessSecret') || 'dev-access-secret-change-me',
    });
  }

  /** Cryptographically-random opaque refresh token + its storage hash. */
  generateRefreshToken(): { token: string; hash: string } {
    const token = randomBytes(48).toString('base64url');
    return { token, hash: this.hashRefreshToken(token) };
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  get refreshTtlSeconds(): number {
    return this.parseTtl(this.config.get<string>('jwt.refreshTtl') ?? '30d');
  }
}
