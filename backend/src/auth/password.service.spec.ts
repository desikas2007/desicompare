import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes passwords so the plaintext is never stored', async () => {
    const hash = await service.hash('Password123');
    expect(hash).not.toContain('Password123');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('verifies correct passwords and rejects incorrect ones', async () => {
    const hash = await service.hash('Password123');
    await expect(service.compare('Password123', hash)).resolves.toBe(true);
    await expect(service.compare('WrongPassword1', hash)).resolves.toBe(false);
  });

  it('never matches against an empty hash', async () => {
    await expect(service.compare('anything', '')).resolves.toBe(false);
  });

  it('produces unique salts for identical passwords', async () => {
    const [a, b] = await Promise.all([service.hash('SamePass1'), service.hash('SamePass1')]);
    expect(a).not.toBe(b);
  });
});
