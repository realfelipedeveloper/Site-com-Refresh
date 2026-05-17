import { describe, expect, it, vi } from "vitest";

import {
  AuthService,
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
    sendPasswordResetInstructions: vi.fn().mockResolvedValue(undefined)
  };

  const jwtService = {
    signAsync: vi.fn().mockResolvedValue("jwt-token")
  };

  return {
    configService,
    jwtService,
    mailService,
    prisma,
    service: new AuthService(configService as never, mailService as never, prisma as never, jwtService as never),
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
});
