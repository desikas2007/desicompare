import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';

function configFor(values: Record<string, string>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

describe('TokenService', () => {
  const jwt = new JwtService({});
  const service = new TokenService(
    jwt,
    configFor({
      'jwt.accessSecret': 'test-access-secret-at-least-32-characters-long',
      'jwt.accessTtl': '15m',
      'jwt.refreshTtl': '30d',
    }),
  );

  it('signs an access token that verifies and carries the payload', () => {
    const { token, expiresIn } = service.signAccessToken({
      sub: 'user-1',
      email: 'a@b.com',
      role: 'user',
    });
    const decoded = jwt.verify(token, {
      secret: 'test-access-secret-at-least-32-characters-long',
    }) as { sub: string; email: string };
    expect(decoded.sub).toBe('user-1');
    expect(decoded.email).toBe('a@b.com');
    expect(expiresIn).toBe(900);
  });

  it('generates opaque refresh tokens and stable hashes', () => {
    const { token, hash } = service.generateRefreshToken();
    expect(token).not.toEqual(hash);
    expect(service.hashRefreshToken(token)).toBe(hash);
    expect(hash).toHaveLength(64);
  });

  it('parses human-readable TTL values', () => {
    expect(service.parseTtl('30d')).toBe(2592000);
    expect(service.parseTtl('15m')).toBe(900);
    expect(service.parseTtl('2h')).toBe(7200);
  });

  it('signs and verifies password reset tokens with a purpose claim', () => {
    const token = service.signPasswordResetToken({ id: 'u1', email: 'a@b.com' });
    const payload = service.verifyPasswordResetToken(token);
    expect(payload.purpose).toBe('reset');
    expect(payload.sub).toBe('u1');
  });
});
