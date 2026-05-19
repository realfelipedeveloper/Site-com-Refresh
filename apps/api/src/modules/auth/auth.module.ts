import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaService } from "../../infra/prisma.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { PermissionsGuard } from "./permissions.guard";
import { PasswordResetMailService } from "./password-reset-mail.service";
import { AuthSessionService } from "./auth-session.service";

@Module({
  imports: [
    ConfigModule
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthSessionService, PasswordResetMailService, PrismaService, JwtAuthGuard, PermissionsGuard, Reflector],
  exports: [AuthService, AuthSessionService, JwtAuthGuard, PermissionsGuard]
})
export class AuthModule {}
