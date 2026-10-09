import { Injectable, Logger } from '@nestjs/common';

/**
 * Thin structured-logging facade. Emits JSON lines including an optional
 * correlation id so requests can be traced across providers and modules.
 * Never log secrets, passwords, tokens or sensitive personal data through it.
 */
@Injectable()
export class AppLogger {
  private readonly logger = new Logger('FoodCompare');

  log(message: string, context?: Record<string, unknown>): void {
    this.logger.log(this.serialize(message, context));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(this.serialize(message, context));
  }

  error(message: string, context?: Record<string, unknown>, stack?: string): void {
    this.logger.error(this.serialize(message, context), stack);
  }

  private serialize(message: string, context?: Record<string, unknown>): string {
    if (!context) return message;
    try {
      return `${message} ${JSON.stringify(context)}`;
    } catch {
      return message;
    }
  }
}
