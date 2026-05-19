import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import type { AuthenticatedUser } from "./auth.types";
import { AuthSessionService } from "./auth-session.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authSessionService: AuthSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const sessionToken = this.authSessionService.getSessionTokenFromRequest(request);

    if (sessionToken) {
      const sessionUser = await this.authSessionService.validateSessionToken(sessionToken);
      this.authSessionService.assertValidCsrfToken(request, sessionUser.sessionId);
      request.user = sessionUser;
      return true;
    }

    throw new UnauthorizedException("Sessão ausente.");
  }
}
