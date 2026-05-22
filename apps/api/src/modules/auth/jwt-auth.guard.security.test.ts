import { UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { JwtAuthGuard } from "./jwt-auth.guard";

function createExecutionContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request
    })
  } as unknown as ExecutionContext;
}

describe("JwtAuthGuard security", () => {
  it("rejects requests without a session cookie", async () => {
    const authSessionService = {
      getSessionTokenFromRequest: vi.fn(() => ""),
      validateSessionToken: vi.fn(),
      assertValidCsrfToken: vi.fn()
    };
    const guard = new JwtAuthGuard(authSessionService as never);

    await expect(guard.canActivate(createExecutionContext({}))).rejects.toThrow(UnauthorizedException);
    expect(authSessionService.validateSessionToken).not.toHaveBeenCalled();
  });

  it("attaches the authenticated session user and validates CSRF for unsafe requests", async () => {
    const request: Record<string, unknown> = { method: "POST" };
    const sessionUser = {
      sub: "user-1",
      sessionId: "session-1",
      permissions: ["management.read"]
    };
    const authSessionService = {
      getSessionTokenFromRequest: vi.fn(() => "opaque-session-token"),
      validateSessionToken: vi.fn().mockResolvedValue(sessionUser),
      assertValidCsrfToken: vi.fn()
    };
    const guard = new JwtAuthGuard(authSessionService as never);

    await expect(guard.canActivate(createExecutionContext(request))).resolves.toBe(true);

    expect(request.user).toEqual(sessionUser);
    expect(authSessionService.validateSessionToken).toHaveBeenCalledWith("opaque-session-token");
    expect(authSessionService.assertValidCsrfToken).toHaveBeenCalledWith(request, "session-1");
  });
});
