import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SignedTokenService } from './signed-token.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, PasswordService, SignedTokenService],
  exports: [AuthGuard, PasswordService, SignedTokenService],
})
export class AuthModule {}
