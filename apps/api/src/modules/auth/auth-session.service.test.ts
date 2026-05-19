import { describe, expect, it, vi } from "vitest";

import { AUTH_CSRF_HEADER_NAME, AuthSessionService, hashSessionToken } from "./auth-session.service";

function createAuthSessionService(overrides: Record<string, string | undefined> = {}) {
  const configService = {
    get: vi.fn((key: string) => {
      const values: Record<string, string> = {
        AUTH_CSRF_SECRET: "csrf-secret",
        AUTH_SESSION_ABSOLUTE_TTL_HOURS: "8",
        AUTH_SESSION_IDLE_TTL_MINUTES: "30",
        NODE_ENV: "test"
      };

      return overrides[key] ?? values[key];
    })
  };
  const prisma = {
    authSession: {
      create: vi.fn(async ({ data }) => ({
        id: "session-1",
        ...data
      })),
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 1 })
    }
  };

  return {
    configService,
    prisma,
    service: new AuthSessionService(configService as never, prisma as never)
  };
}

describe("AuthSessionService", () => {
  it("creates an opaque session and stores only the token hash", async () => {
    const { prisma, service } = createAuthSessionService();

    const result = await service.createSession("user-1", "role-1", {
      ipAddress: "127.0.0.1",
      userAgent: "Vitest"
    });

    const createCall = prisma.authSession.create.mock.calls[0]?.[0];

    expect(result.token).not.toBe(createCall.data.tokenHash);
    expect(createCall.data.tokenHash).toBe(hashSessionToken(result.token));
    expect(result.csrfToken).toBe(service.createCsrfToken("session-1"));
    expect(createCall.data.userAgent).toBe("Vitest");
  });

  it("validates an active session and derives permissions from the active role", async () => {
    const { prisma, service } = createAuthSessionService();
    const now = Date.now();

    prisma.authSession.findUnique.mockResolvedValue({
      id: "session-1",
      roleId: "role-admin",
      revokedAt: null,
      lastSeenAt: new Date(now - 120_000),
      idleExpiresAt: new Date(now + 120_000),
      absoluteExpiresAt: new Date(now + 600_000),
      user: {
        id: "user-1",
        email: "admin@example.test",
        username: "admin",
        cpf: null,
        picture: null,
        isActive: true,
        status: "Ativo",
        roles: [
          {
            role: {
              id: "role-admin",
              permissions: [{ permission: { code: "users.read" } }]
            }
          }
        ]
      }
    });

    await expect(service.validateSessionToken("session-token")).resolves.toEqual(
      expect.objectContaining({
        permissions: ["users.read"],
        roleId: "role-admin",
        sessionId: "session-1",
        sub: "user-1"
      })
    );
    expect(prisma.authSession.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tokenHash: hashSessionToken("session-token") }
      })
    );
    expect(prisma.authSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "session-1" }
      })
    );
  });

  it("rejects expired, revoked or missing sessions", async () => {
    const { prisma, service } = createAuthSessionService();

    prisma.authSession.findUnique.mockResolvedValue(null);
    await expect(service.validateSessionToken("missing")).rejects.toThrow("Sessão inválida ou expirada.");

    prisma.authSession.findUnique.mockResolvedValue({
      id: "session-1",
      revokedAt: new Date(),
      idleExpiresAt: new Date(Date.now() + 120_000),
      absoluteExpiresAt: new Date(Date.now() + 600_000),
      user: { isActive: true, status: "Ativo", roles: [] }
    });

    await expect(service.validateSessionToken("revoked")).rejects.toThrow("Sessão inválida ou expirada.");
  });

  it("requires a valid CSRF token for unsafe authenticated requests", () => {
    const { service } = createAuthSessionService();
    const csrfToken = service.createCsrfToken("session-1");

    expect(() =>
      service.assertValidCsrfToken(
        {
          headers: { [AUTH_CSRF_HEADER_NAME]: csrfToken },
          method: "POST"
        } as never,
        "session-1"
      )
    ).not.toThrow();

    expect(() =>
      service.assertValidCsrfToken(
        {
          headers: { [AUTH_CSRF_HEADER_NAME]: "invalid" },
          method: "POST"
        } as never,
        "session-1"
      )
    ).toThrow("Token CSRF inválido.");
  });

  it("keeps local-prod cookies usable over local HTTP while production stays secure", () => {
    const localProd = createAuthSessionService({
      APP_ENV: "local-prod",
      AUTH_COOKIE_SECURE: undefined,
      NODE_ENV: "production"
    });
    const production = createAuthSessionService({
      APP_ENV: "production",
      AUTH_COOKIE_SECURE: undefined,
      NODE_ENV: "production"
    });

    expect(localProd.service.getSessionCookieOptions().secure).toBe(false);
    expect(production.service.getSessionCookieOptions().secure).toBe(true);
  });
});
