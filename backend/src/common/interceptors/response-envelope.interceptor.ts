import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { isPaginated } from '../dto/pagination.dto';

@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<unknown> {
    return next.handle().pipe(
      map((value) => {
        if (value === undefined || value === null) {
          return value;
        }
        if (isPaginated(value)) {
          return {
            success: true,
            data: value.items,
            meta: value.meta,
          };
        }
        return { success: true, data: value };
      }),
    );
  }
}
