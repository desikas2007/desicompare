import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Transporter } from 'nodemailer';
import { AppLogger } from '../common/logger/app-logger.service';

/**
 * Optional transactional email. When EMAIL_HOST is not configured the service
 * becomes a no-op and logs the intent instead of throwing, so the rest of the
 * application keeps working in development. Never log message bodies containing
 * secrets; reset links are logged only in non-production.
 */
@Injectable()
export class MailService {
  private transporter: Transporter | null = null;
  private readonly enabled: boolean;
  private readonly from: string;
  private readonly isProd: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.enabled = config.get<boolean>('email.enabled') ?? false;
    this.from = config.get<string>('email.from') ?? 'FoodCompare <no-reply@foodcompare.local>';
    this.isProd = config.get<string>('nodeEnv') === 'production';
  }

  private async getTransporter(): Promise<Transporter | null> {
    if (!this.enabled) return null;
    if (this.transporter) return this.transporter;
    const nodemailer = await import('nodemailer');
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('email.host'),
      port: this.config.get<number>('email.port') ?? 587,
      secure: (this.config.get<number>('email.port') ?? 587) === 465,
      auth:
        this.config.get<string>('email.user') && this.config.get<string>('email.password')
          ? {
              user: this.config.get<string>('email.user'),
              pass: this.config.get<string>('email.password'),
            }
          : undefined,
    });
    return this.transporter;
  }

  async send(to: string, subject: string, text: string): Promise<void> {
    const transporter = await this.getTransporter();
    if (!transporter) {
      this.logger.warn('Email delivery is not configured; message not sent', {
        to: this.maskEmail(to),
        subject,
      });
      if (!this.isProd) {
        this.logger.log(`[dev] Email content for ${this.maskEmail(to)}: ${text}`);
      }
      return;
    }
    await transporter.sendMail({ from: this.from, to, subject, text });
    this.logger.log('Email sent', { to: this.maskEmail(to), subject });
  }

  private maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    if (!domain) return '***';
    return `${name.slice(0, 2)}***@${domain}`;
  }
}
