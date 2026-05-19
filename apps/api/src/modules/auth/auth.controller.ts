import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser } from "./current-user.decorator";
import type { AuthenticatedUser } from "./auth.types";
import { Throttle } from "@nestjs/throttler";
import { AuthSessionService, AUTH_SESSION_COOKIE_NAME } from "./auth-session.service";

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
  constructor(
    private readonly authService: AuthService,
    private readonly authSessionService: AuthSessionService
  ) {}

  @Post("login")
  @HttpCode(200)
  async login(@Body() body: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(body.identifier ?? body.email ?? "", body.password, body.roleId, {
      ipAddress: request.ip,
      userAgent: request.get("user-agent") ?? undefined
    });

    response.cookie(AUTH_SESSION_COOKIE_NAME, result.sessionToken, this.authSessionService.getSessionCookieOptions());

    return {
      csrfToken: result.csrfToken,
      user: result.user
    };
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

  @Post("logout")
  @HttpCode(200)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.authSessionService.revokeSessionToken(this.authSessionService.getSessionTokenFromRequest(request));
    response.clearCookie(AUTH_SESSION_COOKIE_NAME, this.authSessionService.getSessionCookieOptions());

    return { message: "Sessão encerrada." };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getCurrentUser(user);
  }
}
