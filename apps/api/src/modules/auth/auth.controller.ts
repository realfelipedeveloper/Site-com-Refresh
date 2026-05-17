import { Body, Controller, Get, HttpCode, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser } from "./current-user.decorator";
import type { AuthenticatedUser } from "./auth.types";
import { Throttle } from "@nestjs/throttler";

class LoginDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  identifier?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  email?: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  roleId?: string;
}

class SwitchProfileDto {
  @IsString()
  @MinLength(1)
  roleId!: string;
}

class ForgotPasswordDto {
  @IsString()
  @IsEmail()
  email!: string;
}

class ResetPasswordDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(8)
  passwordConfirmation!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(200)
  login(@Body() body: LoginDto) {
    return this.authService.login(body.identifier ?? body.email ?? "", body.password, body.roleId);
  }

  @Post("forgot-password")
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post("reset-password")
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.password, body.passwordConfirmation);
  }

  @Post("switch-profile")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  switchProfile(@CurrentUser() user: AuthenticatedUser, @Body() body: SwitchProfileDto) {
    return this.authService.switchProfile(user, body.roleId);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getCurrentUser(user);
  }
}
