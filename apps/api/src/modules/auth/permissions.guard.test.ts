import { ForbiddenException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { PermissionsGuard } from "./permissions.guard";

function createExecutionContext(user?: { permissions: string[] }): ExecutionContext {
  return {
    getClass: vi.fn(),
    getHandler: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user })
    })
  } as unknown as ExecutionContext;
}

function createGuard(requiredPermissions?: string[]) {
  const reflector = {
    getAllAndOverride: vi.fn(() => requiredPermissions)
  };

  return {
    guard: new PermissionsGuard(reflector as never),
    reflector
  };
}

describe("PermissionsGuard", () => {
  it("allows routes without declared permissions", () => {
    const { guard } = createGuard();

    expect(guard.canActivate(createExecutionContext())).toBe(true);
  });

  it("blocks protected routes when the request has no authenticated user", () => {
    const { guard } = createGuard(["users.read"]);

    expect(() => guard.canActivate(createExecutionContext())).toThrow(ForbiddenException);
  });

  it("blocks users missing at least one required permission", () => {
    const { guard } = createGuard(["users.read", "users.write"]);

    expect(() => guard.canActivate(createExecutionContext({ permissions: ["users.read"] }))).toThrow(
      "Permissao insuficiente para esta operacao."
    );
  });

  it("allows users with all required permissions", () => {
    const { guard } = createGuard(["users.read", "users.write"]);

    expect(guard.canActivate(createExecutionContext({ permissions: ["users.write", "users.read"] }))).toBe(true);
  });
});
