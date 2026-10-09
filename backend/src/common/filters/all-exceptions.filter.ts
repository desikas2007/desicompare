import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorBody } from '@foodcompare/shared-types';

interface NormalizedError {
  status: number;
  body: ApiErrorBody;
}

const STATUS_CODES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = (request.headers['x-correlation-id'] as string) ?? undefined;

    const normalized = this.normalize(exception);

    if (normalized.status >= 500) {
      this.logger.error(
        `[${correlationId ?? '-'}] ${request.method} ${request.url} -> ${normalized.status} ${normalized.body.message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `[${correlationId ?? '-'}] ${request.method} ${request.url} -> ${normalized.status} ${normalized.body.code}`,
      );
    }

    response.status(normalized.status).json({
      success: false,
      error: { ...normalized.body, correlationId },
    });
  }

  private normalize(exception: unknown): NormalizedError {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const code = STATUS_CODES[status] ?? 'HTTP_ERROR';

      if (status === HttpStatus.UNPROCESSABLE_ENTITY || status === HttpStatus.BAD_REQUEST) {
        // class-validator produces { message: string[] }
        if (typeof raw === 'object' && raw !== null) {
          const rawObj = raw as Record<string, unknown>;
          const message = rawObj.message;
          return {
            status,
            body: {
              code: status === HttpStatus.UNPROCESSABLE_ENTITY ? 'VALIDATION_ERROR' : code,
              message:
                status === HttpStatus.UNPROCESSABLE_ENTITY
                  ? 'The request contains invalid fields'
                  : Array.isArray(message)
                    ? (message[0] as string)
                    : ((message as string) ?? 'Bad request'),
              details: Array.isArray(message) ? message : undefined,
            },
          };
        }
      }

      const message =
        typeof raw === 'string'
          ? raw
          : (((raw as Record<string, unknown>)?.message as string) ?? exception.message);
      return {
        status,
        body: {
          code,
          message: Array.isArray(message) ? (message[0] as string) : String(message),
          details: Array.isArray(message) ? message : undefined,
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again later.',
      },
    };
  }
}
