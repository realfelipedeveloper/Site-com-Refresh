import { describe, expect, it } from "vitest";

import {
  clearRefreshSessionStorage,
  parseRefreshNavigationState,
  refreshAccessTokenStorageKey,
  refreshAuthenticatedSessionStorageKey,
  refreshNavigationStorageKey,
  shouldRedirectAdminAfterLogin
} from "./utils";
import type { LoggedUser } from "./types";

const administrator: LoggedUser = {
  id: "user-admin",
  name: "Admin Refresh",
  email: "admin@example.test",
  activeRoleId: "role-admin",
  permissions: ["users.read"],
  roles: [
    {
      id: "role-admin",
      name: "Administrador",
      description: null,
      functionName: "Administrador",
      status: "Ativo",
      permissions: ["users.read"],
      menuAccesses: [{ topMenu: "administration", viewKey: "users" }],
      appAccesses: []
    }
  ]
};

describe("Refresh session regressions", () => {
  it("does not treat an anonymous first access as an expired authenticated session", () => {
    expect(
      shouldRedirectAdminAfterLogin({
        currentView: "users",
        isAuthenticated: false,
        isLoadingSession: false,
        isPostLogin: false,
        user: null
      })
    ).toBe(false);
  });

  it("redirects administrators only after login, not during reload restoration", () => {
    expect(
      shouldRedirectAdminAfterLogin({
        currentView: "groups",
        isAuthenticated: true,
        isLoadingSession: false,
        isPostLogin: true,
        user: administrator
      })
    ).toBe(true);

    expect(
      shouldRedirectAdminAfterLogin({
        currentView: "groups",
        isAuthenticated: true,
        isLoadingSession: false,
        isPostLogin: false,
        user: administrator
      })
    ).toBe(false);
  });

  it("removes all session markers when an authenticated session expires", () => {
    const removedKeys: string[] = [];
    const storage = {
      removeItem: (key: string) => {
        removedKeys.push(key);
      }
    } as unknown as Storage;

    clearRefreshSessionStorage(storage);

    expect(removedKeys).toEqual([
      refreshAccessTokenStorageKey,
      refreshAuthenticatedSessionStorageKey,
      refreshNavigationStorageKey
    ]);
  });

  it("rejects malformed stored navigation before route restoration", () => {
    expect(parseRefreshNavigationState('{"profileId":"","topMenu":"administration","view":"groups"}')).toBeNull();
    expect(parseRefreshNavigationState('{"profileId":"role-admin","topMenu":"bad","view":"groups"}')).toBeNull();
  });
});
