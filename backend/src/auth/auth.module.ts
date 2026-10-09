import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { ModelNames } from '../database/model-names';
import { RefreshSessionSchema } from '../database/schemas/refresh-session.schema';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { MailService } from './mail.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: ModelNames.RefreshSession, schema: RefreshSessionSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, TokenService, MailService, JwtStrategy],
  exports: [AuthService, PasswordService, TokenService],
})
export class AuthModule {}
