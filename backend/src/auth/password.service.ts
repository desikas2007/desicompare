import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

/**
 * Password hashing facade. Uses bcrypt (bcryptjs, pure-JS implementation of the
 * bcrypt algorithm) with a strong cost factor. Centralised so the algorithm can
 * be rotated without touching call sites.
 */
@Injectable()
export class PasswordService {
  private readonly rounds = 12;

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    if (!hash) return Promise.resolve(false);
    return bcrypt.compare(plain, hash);
  }
}
