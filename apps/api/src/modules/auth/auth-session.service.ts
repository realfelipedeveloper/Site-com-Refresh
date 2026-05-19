import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { CookieOptions, Request } from "express";
import { PrismaService } from "../../infra/prisma.service";
import type { AuthenticatedUser } from "./auth.types";

export const AUTH_SESSION_COOKIE_NAME = "refresh_session";
export const AUTH_CSRF_HEADER_NAME = "x-csrf-token";

type RequestWithCookies = Request & {
  cookies?: Record<string, string | undefined>;
};

type RequestMetadata = {
  userAgent?: string;
  ipAddress?: string;
};

type SessionRolePermissionEntry = {
  permission: {
    code: string;
  };
};

type SessionRoleEntry = {
  role: {
    id: string;
    permissions: SessionRolePermissionEntry[];
  };
};

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  async createSession(userId: string, roleId: string | null | undefined, metadata: RequestMetadata) {
    const token = randomBytes(48).toString("base64url");
    const now = new Date();
    const idleExpiresAt = new Date(now.getTime() + this.getIdleTtlMinutes() * 60_000);
    const absoluteExpiresAt = new Date(now.getTime() + this.getAbsoluteTtlHours() * 60 * 60_000);

    const session = await this.prisma.authSession.create({
      data: {
        userId,
        roleId,
        tokenHash: hashSessionToken(token),
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
        lastSeenAt: now,
        idleExpiresAt,
        absoluteExpiresAt
      }
    });

    return {
      csrfToken: this.createCsrfToken(session.id),
      session,
      token
    };
  }

  getSessionTokenFromRequest(request: RequestWithCookies) {
    return request.cookies?.[AUTH_SESSION_COOKIE_NAME] ?? "";
  }

  getSessionCookieOptions(): CookieOptions {
    const domain = this.configService.get<string>("AUTH_COOKIE_DOMAIN") || undefined;
    const sameSite = (this.configService.get<string>("AUTH_COOKIE_SAME_SITE") ?? "lax").toLowerCase();
    const secureConfig = this.configService.get<string>("AUTH_COOKIE_SECURE");

    return {
      domain,
      httpOnly: true,
      path: "/",
      sameSite: sameSite === "none" ? "none" : sameSite === "strict" ? "strict" : "lax",
      secure: secureConfig ? secureConfig === "true" : this.isProductionDeploy()
    };
  }

  async validateSessionToken(token: string): Promise<AuthenticatedUser & { sessionId: string }> {
    if (!token) {
      throw new UnauthorizedException("Sessão ausente.");
    }

    const now = new Date();
    const session = await this.prisma.authSession.findUnique({
      where: {
        tokenHash: hashSessionToken(token)
      },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (
      !session ||
      session.revokedAt ||
      session.idleExpiresAt <= now ||
      session.absoluteExpiresAt <= now ||
      !session.user.isActive ||
      ["Inativo", "Excluído"].includes(session.user.status)
    ) {
      throw new UnauthorizedException("Sessão inválida ou expirada.");
    }

    const userRoles: SessionRoleEntry[] = session.user.roles;
    const activeRole = userRoles.find((entry) => entry.role.id === session.roleId)?.role ?? userRoles[0]?.role;
    const permissions = activeRole
      ? activeRole.permissions.map((permissionEntry) => permissionEntry.permission.code)
      : [];

    await this.extendIdleExpiration(session.id, session.lastSeenAt, now);

    return {
      sub: session.user.id,
      sessionId: session.id,
      email: session.user.email,
      username: session.user.username,
      cpf: session.user.cpf,
      picture: session.user.picture,
      permissions,
      roleId: activeRole?.id
    };
  }

  async updateSessionRole(sessionId: string | undefined, roleId: string) {
    if (!sessionId) {
      throw new UnauthorizedException("Sessão ausente.");
    }

    await this.prisma.authSession.update({
      where: {
        id: sessionId
      },
      data: {
        roleId
      }
    });
  }

  async revokeSessionToken(token: string) {
    if (!token) {
      return;
    }

    await this.prisma.authSession.updateMany({
      where: {
        tokenHash: hashSessionToken(token),
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  createCsrfToken(sessionId: string | undefined) {
    if (!sessionId) {
      throw new UnauthorizedException("Sessão ausente.");
    }

    return createHmac("sha256", this.getCsrfSecret()).update(sessionId).digest("base64url");
  }

  assertValidCsrfToken(request: Request, sessionId: string | undefined) {
    if (["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) {
      return;
    }

    const receivedToken = request.headers[AUTH_CSRF_HEADER_NAME];
    const expectedToken = this.createCsrfToken(sessionId);

    if (typeof receivedToken !== "string" || !safeTokenEquals(receivedToken, expectedToken)) {
      throw new UnauthorizedException("Token CSRF inválido.");
    }
  }

  private async extendIdleExpiration(sessionId: string, lastSeenAt: Date, now: Date) {
    if (now.getTime() - lastSeenAt.getTime() < 60_000) {
      return;
    }

    await this.prisma.authSession.update({
      where: {
        id: sessionId
      },
      data: {
        lastSeenAt: now,
        idleExpiresAt: new Date(now.getTime() + this.getIdleTtlMinutes() * 60_000)
      }
    });
  }

  private getIdleTtlMinutes() {
    return Number(this.configService.get<string>("AUTH_SESSION_IDLE_TTL_MINUTES") ?? "30");
  }

  private getAbsoluteTtlHours() {
    return Number(this.configService.get<string>("AUTH_SESSION_ABSOLUTE_TTL_HOURS") ?? "8");
  }

  private getCsrfSecret() {
    const secret =
      this.configService.get<string>("AUTH_CSRF_SECRET") ||
      this.configService.get<string>("COOKIE_SECRET") ||
      this.configService.get<string>("JWT_ACCESS_SECRET");

    if (secret) {
      return secret;
    }

    if (this.isProductionDeploy()) {
      throw new Error("AUTH_CSRF_SECRET, COOKIE_SECRET ou JWT_ACCESS_SECRET deve ser configurado em produção.");
    }

    return "refresh-dev-csrf-secret";
  }

  private isProductionDeploy() {
    const appEnv = (this.configService.get<string>("APP_ENV") ?? process.env.APP_ENV ?? "").trim().toLowerCase();

    if (appEnv) {
      return appEnv === "production";
    }

    return (this.configService.get<string>("NODE_ENV") ?? process.env.NODE_ENV) === "production";
  }
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function safeTokenEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
