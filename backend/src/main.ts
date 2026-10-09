import { HttpStatus, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);

  const frontendUrl = config.get<string>('frontendUrl') ?? 'http://localhost:3000';
  const globalPrefix = config.get<string>('globalPrefix') ?? 'api/v1';
  const port = config.get<number>('port') ?? 4000;
  const nodeEnv = config.get<string>('nodeEnv') ?? 'development';

  app.setGlobalPrefix(globalPrefix);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser(config.get<string>('cookie.secret') || undefined));

  app.enableCors({
    origin: [frontendUrl],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-cart-id', 'x-correlation-id'],
    exposedHeaders: ['x-correlation-id'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      stopAtFirstError: false,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );

  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('FoodCompare API')
    .setDescription(
      'Food price comparison API. Compare equivalent food items, fees and offers across supported providers.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('auth')
    .addTag('search')
    .addTag('comparisons')
    .addTag('providers')
    .addTag('offers')
    .addTag('cart')
    .addTag('checkout')
    .addTag('orders')
    .addTag('users')
    .addTag('admin')
    .addTag('health')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port);

  new Logger('Bootstrap').log(
    `FoodCompare API listening on http://localhost:${port}/${globalPrefix} (${nodeEnv}). Docs: http://localhost:${port}/api/docs`,
  );
}

void bootstrap();
