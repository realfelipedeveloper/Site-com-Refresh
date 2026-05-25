import { describe, expect, it, vi } from "vitest";

import {
  AuthService,
  PASSWORD_RESET_EMAIL_UNAVAILABLE_MESSAGE,
  PASSWORD_RESET_GENERIC_MESSAGE,
  PASSWORD_RESET_INVALID_LINK_MESSAGE,
  PASSWORD_RESET_SUCCESS_MESSAGE,
  hashPasswordResetToken,
  validatePasswordPolicy
} from "./auth.service";

function createAuthService(overrides?: {
  config?: Record<string, string>;
  prisma?: Record<string, unknown>;
  transaction?: Record<string, unknown>;
}) {
  const transaction = {
    user: {
      update: vi.fn().mockResolvedValue({})
    },
    passwordResetToken: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 })
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({})
    },
    ...(overrides?.transaction ?? {})
  };

  const prisma = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn()
    },
    passwordResetToken: {
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn()
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({})
    },
    $transaction: vi.fn(async (callback: (client: typeof transaction) => Promise<unknown>) => callback(transaction)),
    ...(overrides?.prisma ?? {})
  };

  const configValues = {
    NEXT_PUBLIC_REFRESH_URL: "http://localhost:3101",
    PASSWORD_RESET_TOKEN_TTL_MINUTES: "30",
    ...(overrides?.config ?? {})
  };

  const configService = {
    get: vi.fn((key: string) => configValues[key as keyof typeof configValues])
  };

  const mailService = {
    assertPasswordResetTransportReady: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetInstructions: vi.fn().mockResolvedValue(undefined)
  };

  const authSessionService = {
    createCsrfToken: vi.fn().mockReturnValue("csrf-token"),
    createSession: vi.fn().mockResolvedValue({
      csrfToken: "csrf-token",
      session: { id: "session-1" },
      token: "session-token"
    }),
    updateSessionRole: vi.fn().mockResolvedValue(undefined)
  };

  return {
    authSessionService,
    configService,
    mailService,
    prisma,
    service: new AuthService(configService as never, mailService as never, prisma as never, authSessionService as never),
    transaction
  };
}

describe("AuthService password reset", () => {
  it("hashes reset tokens without keeping the plain token", () => {
    expect(hashPasswordResetToken("token-123")).toHaveLength(64);
    expect(hashPasswordResetToken("token-123")).not.toBe("token-123");
  });

  it("validates the password reset policy", () => {
    expect(validatePasswordPolicy("short1")).toBe("A senha deve ter pelo menos 8 caracteres.");
    expect(validatePasswordPolicy("abcdefgh")).toBe("A senha deve combinar letras e números.");
    expect(validatePasswordPolicy("Senha123")).toBeNull();
  });

  it("returns the generic message for missing users without creating a token", async () => {
    const { prisma, service } = createAuthService();
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.forgotPassword("missing@example.com")).resolves.toEqual({
      message: PASSWORD_RESET_GENERIC_MESSAGE
    });

    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it("checks SMTP before user lookup when password reset delivery is required", async () => {
    const { mailService, prisma, service } = createAuthService({
      config: {
        REQUIRE_SMTP_FOR_PASSWORD_RESET: "true"
      }
    });
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.forgotPassword("missing@example.com")).resolves.toEqual({
      message: PASSWORD_RESET_GENERIC_MESSAGE
    });

    expect(mailService.assertPasswordResetTransportReady).toHaveBeenCalledTimes(1);
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
  });

  it("fails all password reset requests before user lookup when required SMTP is unavailable", async () => {
    const { mailService, prisma, service } = createAuthService({
      config: {
        REQUIRE_SMTP_FOR_PASSWORD_RESET: "true"
      }
    });
    mailService.assertPasswordResetTransportReady.mockRejectedValue(new Error("SMTP offline"));

    await expect(service.forgotPassword("admin@example.com")).rejects.toThrow(PASSWORD_RESET_EMAIL_UNAVAILABLE_MESSAGE);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it("creates a hashed token and sends reset instructions for active users", async () => {
    const { mailService, prisma, service } = createAuthService();
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "admin@example.com",
      name: "Admin",
      isActive: true,
      status: "Ativo"
    });

    await expect(service.forgotPassword(" ADMIN@EXAMPLE.COM ")).resolves.toEqual({
      message: PASSWORD_RESET_GENERIC_MESSAGE
    });

    const createCall = prisma.passwordResetToken.create.mock.calls[0]?.[0];
    const mailCall = mailService.sendPasswordResetInstructions.mock.calls[0]?.[0];
    const resetUrl = new URL(mailCall.resetUrl);
    const plainToken = resetUrl.searchParams.get("token") ?? "";

    expect(createCall.data.userId).toBe("user-1");
    expect(createCall.data.tokenHash).toBe(hashPasswordResetToken(plainToken));
    expect(createCall.data.tokenHash).not.toBe(plainToken);
    expect(resetUrl.pathname).toBe("/abbatech/refresh/reset-password");
    expect(mailCall.to).toBe("admin@example.com");
  });

  it.each(["Verificado", "Novo", "Inativo", "Excluido", "Excluído"])(
    "returns the generic message without creating a token for %s users",
    async (status) => {
      const { mailService, prisma, service } = createAuthService();
      prisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "admin@example.com",
        name: "Admin",
        isActive: true,
        status
      });

      await expect(service.forgotPassword("admin@example.com")).resolves.toEqual({
        message: PASSWORD_RESET_GENERIC_MESSAGE
      });

      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mailService.sendPasswordResetInstructions).not.toHaveBeenCalled();
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    }
  );

  it("returns the generic message without creating a token when the user flag is inactive", async () => {
    const { mailService, prisma, service } = createAuthService();
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "admin@example.com",
      name: "Admin",
      isActive: false,
      status: "Ativo"
    });

    await expect(service.forgotPassword("admin@example.com")).resolves.toEqual({
      message: PASSWORD_RESET_GENERIC_MESSAGE
    });

    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(mailService.sendPasswordResetInstructions).not.toHaveBeenCalled();
  });

  it("rejects invalid, expired or already used tokens", async () => {
    const { prisma, service } = createAuthService();
    prisma.passwordResetToken.findUnique.mockResolvedValue(null);

    await expect(service.resetPassword("invalid", "Senha123", "Senha123")).rejects.toThrow(
      PASSWORD_RESET_INVALID_LINK_MESSAGE
    );

    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: "reset-1",
      userId: "user-1",
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      user: { isActive: true, status: "Ativo" }
    });

    await expect(service.resetPassword("used", "Senha123", "Senha123")).rejects.toThrow(
      PASSWORD_RESET_INVALID_LINK_MESSAGE
    );

    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: "reset-2",
      userId: "user-1",
      usedAt: null,
      expiresAt: new Date(Date.now() - 60_000),
      user: { isActive: true, status: "Ativo" }
    });

    await expect(service.resetPassword("expired", "Senha123", "Senha123")).rejects.toThrow(
      PASSWORD_RESET_INVALID_LINK_MESSAGE
    );
  });

  it("updates the password and consumes the token once", async () => {
    const { prisma, service, transaction } = createAuthService();
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: "reset-1",
      userId: "user-1",
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { isActive: true, status: "Ativo" }
    });

    await expect(service.resetPassword("valid-token", "Senha123", "Senha123")).resolves.toEqual({
      message: PASSWORD_RESET_SUCCESS_MESSAGE
    });

    expect(transaction.passwordResetToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "reset-1", usedAt: null }
      })
    );
    expect(transaction.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({
          forcePasswordChange: false,
          passwordHash: expect.any(String)
        })
      })
    );
    expect(transaction.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "auth.password_reset_completed",
          entityId: "user-1"
        })
      })
    );
  });

  it.each(["Verificado", "Novo", "Inativo", "Excluido", "Excluído"])(
    "rejects password reset tokens for %s users",
    async (status) => {
      const { prisma, service } = createAuthService();
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: "reset-1",
        userId: "user-1",
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user: { isActive: true, status }
      });

      await expect(service.resetPassword("valid-token", "Senha123", "Senha123")).rejects.toThrow(
        PASSWORD_RESET_INVALID_LINK_MESSAGE
      );
    }
  );
});

describe("AuthService login security", () => {
  it("authenticates with an opaque session token without leaking password hashes", async () => {
    const { authSessionService, prisma, service } = createAuthService();
    prisma.user.findFirst.mockResolvedValue({
      id: "user-1",
      name: "Admin Refresh",
      email: "admin@example.test",
      username: "admin",
      cpf: null,
      picture: null,
      passwordHash: "Refresh123!",
      isActive: true,
      status: "Ativo",
      roles: [
        {
          role: {
            id: "role-admin",
            name: "Administrador",
            functionName: "Administrador",
            permissions: [{ permission: { code: "users.read" } }]
          }
        }
      ]
    });

    const result = await service.login(" ADMIN@example.test ", "Refresh123!", undefined, {
      ipAddress: "127.0.0.1",
      userAgent: "Vitest"
    });

    expect(result.sessionToken).toBe("session-token");
    expect(result.user).toEqual(
      expect.objectContaining({
        activeRoleId: "role-admin",
        email: "admin@example.test",
        permissions: ["users.read"]
      })
    );
    expect(result.user).not.toHaveProperty("passwordHash");
    expect(result.user).not.toHaveProperty("tokenHash");
    expect(authSessionService.createSession).toHaveBeenCalledWith("user-1", "role-admin", {
      ipAddress: "127.0.0.1",
      userAgent: "Vitest"
    });
  });

  it.each(["Verificado", "Novo", "Inativo", "Excluido", "Excluído"])(
    "rejects %s users before creating a session",
    async (status) => {
      const { authSessionService, prisma, service } = createAuthService();
      prisma.user.findFirst.mockResolvedValue({
        id: "user-1",
        passwordHash: "Refresh123!",
        isActive: true,
        status,
        roles: []
      });

      await expect(service.login("user@example.test", "Refresh123!")).rejects.toThrow("Usuario inativo.");
      expect(authSessionService.createSession).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    }
  );

  it("rejects users with inactive flag before creating a session", async () => {
    const { authSessionService, prisma, service } = createAuthService();
    prisma.user.findFirst.mockResolvedValue({
      id: "user-1",
      passwordHash: "Refresh123!",
      isActive: false,
      status: "Ativo",
      roles: []
    });

    await expect(service.login("deleted@example.test", "Refresh123!")).rejects.toThrow("Usuario inativo.");
    expect(authSessionService.createSession).not.toHaveBeenCalled();
  });
});
