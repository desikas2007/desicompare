import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { PASSWORD_MESSAGE, PASSWORD_PATTERN } from './register.dto';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'aarav@example.com' })
  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Password reset token received by email' })
  @IsString()
  @Length(10, 2000)
  token!: string;

  @ApiProperty({ example: 'NewPassword123' })
  @IsString()
  @Length(8, 72)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  password!: string;

  @ApiProperty({ example: 'NewPassword123' })
  @IsString()
  @Length(8, 72)
  confirmPassword!: string;
}

export class RefreshTokenDto {
  @ApiPropertyOptional({ description: 'Refresh token when not using HttpOnly cookies' })
  @IsOptional()
  @IsString()
  @Length(10, 500)
  refreshToken?: string;
}
