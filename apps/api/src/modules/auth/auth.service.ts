import { BadRequestException, Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Prisma } from "@prisma/client";
import { hash, verify } from "argon2";
import { createHash, randomBytes } from "crypto";
import { PrismaService } from "../../infra/prisma.service";
import { buildRefreshRouteUrl } from "../../config/environment.utils";
import type { AuthenticatedUser } from "./auth.types";
import { AuthSessionService } from "./auth-session.service";
import { PasswordResetMailService } from "./password-reset-mail.service";

export const PASSWORD_RESET_GENERIC_MESSAGE =
  "Se os dados informados estiverem vinculados a uma conta ativa, enviaremos instruções para recuperação de acesso.";

export const PASSWORD_RESET_SUCCESS_MESSAGE = "Senha redefinida com sucesso.";

export const PASSWORD_RESET_INVALID_LINK_MESSAGE =
  "Este link de recuperação é inválido ou expirou. Solicite uma nova recuperação de acesso.";

export const PASSWORD_RESET_EMAIL_UNAVAILABLE_MESSAGE =
  "Não foi possível enviar as instruções de recuperação agora. Tente novamente em instantes.";

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function validatePasswordPolicy(password: string) {
  if (password.length < 8) {
    return "A senha deve ter pelo menos 8 caracteres.";
  }

  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return "A senha deve combinar letras e números.";
  }

  return null;
}

type LoginRequestMetadata = {
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly mailService: PasswordResetMailService,
    private readonly prisma: PrismaService,
    private readonly authSessionService: AuthSessionService
  ) {}

  async login(identifier: string, password: string, roleId?: string, metadata: LoginRequestMetadata = {}) {
    const normalizedIdentifier = identifier.trim();
    const normalizedIdentifierLower = normalizedIdentifier.toLowerCase();

    if (!normalizedIdentifier) {
      throw new UnauthorizedException("Informe username, e-mail ou CPF.");
    }

    const normalizedCpf = this.normalizeCpf(normalizedIdentifier);
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedIdentifierLower },
          { username: normalizedIdentifierLower },
          { cpf: normalizedCpf },
          { name: normalizedIdentifier }
        ]
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true }
                },
                menuAccesses: true,
                appAccesses: {
                  include: {
                    app: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user || !(await this.verifyStoredPassword(user.passwordHash, password))) {
      throw new UnauthorizedException("Credenciais invalidas.");
    }

    if (!user.isActive || ["Inativo", "Excluído"].includes(user.status)) {
      throw new UnauthorizedException("Usuario inativo.");
    }

    const activeRole = this.resolveActiveRole(user.roles, roleId);
    const permissions = activeRole
      ? activeRole.permissions.map(
          (permissionEntry: (typeof activeRole.permissions)[number]) => permissionEntry.permission.code
        )
      : [];

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date()
      }
    });

    const session = await this.authSessionService.createSession(user.id, activeRole?.id ?? null, metadata);

    return {
      csrfToken: session.csrfToken,
      sessionToken: session.token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        cpf: user.cpf,
        picture: user.picture,
        permissions,
        activeRoleId: activeRole?.id ?? null
      }
    };
  }

  async switchProfile(authenticatedUser: AuthenticatedUser, roleId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: authenticatedUser.sub },
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
    });

    if (!user) {
      throw new UnauthorizedException("Usuario nao encontrado.");
    }

    const activeRole = this.resolveActiveRole(user.roles, roleId);

    if (!activeRole) {
      throw new UnauthorizedException("Usuario sem perfil vinculado.");
    }

    const permissions = activeRole.permissions.map(
      (permissionEntry: (typeof activeRole.permissions)[number]) => permissionEntry.permission.code
    );

    await this.authSessionService.updateSessionRole(authenticatedUser.sessionId, activeRole.id);

    return {
      csrfToken: this.authSessionService.createCsrfToken(authenticatedUser.sessionId),
      permissions,
      roleId: activeRole.id
    };
  }

  async getCurrentUser(authenticatedUser: AuthenticatedUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: authenticatedUser.sub },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                },
                menuAccesses: true,
                appAccesses: {
                  include: {
                    app: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new UnauthorizedException("Usuario nao encontrado.");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      cpf: user.cpf,

      // ALTERAÇÃO:
      // Inclui a foto no retorno do usuário autenticado.
      // Esse retorno alimenta o LoggedUser usado pelo RefreshShell.
      picture: user.picture,

      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      permissions: authenticatedUser.permissions,
      csrfToken: authenticatedUser.sessionId
        ? this.authSessionService.createCsrfToken(authenticatedUser.sessionId)
        : undefined,
      activeRoleId: authenticatedUser.roleId ?? this.resolveActiveRole(user.roles)?.id ?? null,
      roles: user.roles.map((entry: (typeof user.roles)[number]) => ({
        id: entry.role.id,
        name: entry.role.name,
        description: entry.role.description,
        functionName: entry.role.functionName,
        status: entry.role.status,
        menuAccesses: entry.role.menuAccesses,
        appAccesses: entry.role.appAccesses.map((access: (typeof entry.role.appAccesses)[number]) => ({
          id: access.id,
          name: access.app.name,
          area: access.app.area,
          link: access.app.link,
          canCreate: access.canCreate,
          canUpdate: access.canUpdate,
          canDelete: access.canDelete,
          canAccess: access.canAccess
        })),
        permissions: entry.role.permissions.map(
          (rolePermission: (typeof entry.role.permissions)[number]) => rolePermission.permission.code
        )
      }))
    };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date();

    if (this.shouldRequirePasswordResetSmtp()) {
      await this.assertPasswordResetTransportReady();
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user || !this.canRecoverPassword(user)) {
      return { message: PASSWORD_RESET_GENERIC_MESSAGE };
    }

    const token = this.generatePasswordResetToken();
    const tokenHash = hashPasswordResetToken(token);
    const expiresInMinutes = this.getPasswordResetTtlMinutes();
    const expiresAt = new Date(now.getTime() + expiresInMinutes * 60_000);

    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null
      },
      data: {
        usedAt: now
      }
    });

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    });

    await this.auditPasswordResetRequested(user.id, expiresAt);

    try {
      await this.mailService.sendPasswordResetInstructions({
        expiresInMinutes,
        resetUrl: this.buildPasswordResetUrl(token),
        to: user.email,
        userName: user.name
      });
    } catch (mailError) {
      this.logger.error(
        `Falha ao enviar instrucoes de recuperacao para o usuario ${user.id}.`,
        mailError instanceof Error ? mailError.stack : undefined
      );

      if (this.shouldRequirePasswordResetSmtp()) {
        throw new ServiceUnavailableException(PASSWORD_RESET_EMAIL_UNAVAILABLE_MESSAGE);
      }
    }

    return { message: PASSWORD_RESET_GENERIC_MESSAGE };
  }

  async resetPassword(token: string, password: string, passwordConfirmation: string) {
    if (password !== passwordConfirmation) {
      throw new BadRequestException("As senhas informadas não conferem.");
    }

    const passwordPolicyError = validatePasswordPolicy(password);
    if (passwordPolicyError) {
      throw new BadRequestException(passwordPolicyError);
    }

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: {
        tokenHash: hashPasswordResetToken(token)
      },
      include: {
        user: true
      }
    });

    const now = new Date();
    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt <= now ||
      !this.canRecoverPassword(resetToken.user)
    ) {
      throw new BadRequestException(PASSWORD_RESET_INVALID_LINK_MESSAGE);
    }

    const passwordHash = await hash(password);

    await this.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      const consumed = await transaction.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          usedAt: null
        },
        data: {
          usedAt: now
        }
      });

      if (consumed.count !== 1) {
        throw new BadRequestException(PASSWORD_RESET_INVALID_LINK_MESSAGE);
      }

      await transaction.user.update({
        where: { id: resetToken.userId },
        data: {
          forcePasswordChange: false,
          passwordHash
        }
      });

      await transaction.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          id: {
            not: resetToken.id
          },
          usedAt: null
        },
        data: {
          usedAt: now
        }
      });

      await transaction.auditLog.create({
        data: {
          action: "auth.password_reset_completed",
          entityType: "User",
          entityId: resetToken.userId,
          metadata: {
            resetTokenId: resetToken.id
          }
        }
      });
    });

    return { message: PASSWORD_RESET_SUCCESS_MESSAGE };
  }

  private resolveActiveRole(
    roles: Array<{
      role: {
        id: string;
        name?: string;
        functionName?: string | null;
        permissions: Array<{
          permission: {
            code: string;
          };
        }>;
      };
    }>,
    roleId?: string
  ) {
    if (roles.length === 0) {
      if (roleId) {
        throw new UnauthorizedException("Perfil solicitado nao pertence ao usuario.");
      }

      return null;
    }

    const match = roleId ? roles.find((entry) => entry.role.id === roleId) : this.getDefaultRoleEntry(roles);

    if (!match) {
      throw new UnauthorizedException("Perfil solicitado nao pertence ao usuario.");
    }

    return match.role;
  }

  private getDefaultRoleEntry<
    TRoleEntry extends {
      role: {
        name?: string;
        functionName?: string | null;
      };
    }
  >(roles: TRoleEntry[]) {
    return (
      roles.find((entry) => this.isRoleKind(entry.role, "administrador")) ??
      roles.find((entry) => this.isRoleKind(entry.role, "desenvolvedor")) ??
      roles[0]
    );
  }

  private isRoleKind(role: { name?: string; functionName?: string | null }, keyword: string) {
    const normalizedName = role.name?.toLowerCase() ?? "";
    const normalizedFunctionName = role.functionName?.toLowerCase() ?? "";

    return normalizedName.includes(keyword) || normalizedFunctionName.includes(keyword);
  }

  private async verifyStoredPassword(storedPasswordHash: string, password: string) {
    try {
      return await verify(storedPasswordHash, password);
    } catch {
      const sha1Password = createHash("sha1").update(password).digest("hex");
      return storedPasswordHash === password || storedPasswordHash === sha1Password;
    }
  }

  private normalizeCpf(value: string) {
    const digits = value.replace(/\D/g, "");
    return digits.length > 0 ? digits : value;
  }

  private generatePasswordResetToken() {
    return randomBytes(32).toString("base64url");
  }

  private getPasswordResetTtlMinutes() {
    const configuredValue = Number(this.configService.get<string>("PASSWORD_RESET_TOKEN_TTL_MINUTES") ?? 30);

    if (!Number.isFinite(configuredValue) || configuredValue < 15 || configuredValue > 60) {
      return 30;
    }

    return Math.floor(configuredValue);
  }

  private buildPasswordResetUrl(token: string) {
    return buildRefreshRouteUrl(this.configService, "/reset-password", { token });
  }

  private shouldRequirePasswordResetSmtp() {
    return this.configService.get<string>("REQUIRE_SMTP_FOR_PASSWORD_RESET")?.trim().toLowerCase() === "true";
  }

  private async assertPasswordResetTransportReady() {
    try {
      await this.mailService.assertPasswordResetTransportReady();
    } catch (smtpError) {
      this.logger.error(
        "Transporte SMTP de recuperacao de senha indisponivel.",
        smtpError instanceof Error ? smtpError.stack : undefined
      );
      throw new ServiceUnavailableException(PASSWORD_RESET_EMAIL_UNAVAILABLE_MESSAGE);
    }
  }

  private canRecoverPassword(user: { isActive: boolean; status: string }) {
    return user.isActive && !["Inativo", "Excluído"].includes(user.status);
  }

  private async auditPasswordResetRequested(userId: string, expiresAt: Date) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: "auth.password_reset_requested",
          entityType: "User",
          entityId: userId,
          metadata: {
            expiresAt: expiresAt.toISOString()
          }
        }
      });
    } catch (auditError) {
      this.logger.warn(
        `Falha ao registrar auditoria de recuperação para o usuario ${userId}: ${
          auditError instanceof Error ? auditError.message : "erro desconhecido"
        }`
      );
    }
  }
}
