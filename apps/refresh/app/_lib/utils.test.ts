import { describe, expect, it } from "vitest";

import {
  clearRefreshAuthStorage,
  clearLegacyRefreshLocalStorage,
  clearRefreshSessionStorage,
  compareRecordNumbersDesc,
  displayRecordCode,
  getDefaultNavigation,
  getDefaultTopMenu,
  getMenuConfig,
  normalizeIdentityValue,
  parseRefreshNavigationState,
  refreshAccessTokenStorageKey,
  refreshAuthenticatedSessionStorageKey,
  refreshNavigationStorageKey,
  resolveApplicationView,
  resolveStoredRefreshNavigation,
  serializeRefreshNavigationState,
  shouldRedirectAdminAfterLogin
} from "./utils";
import type { LoggedUser } from "./types";

function buildLoggedUser(roleName: string): LoggedUser {
  return {
    id: "user-1",
    name: "Usuario Teste",
    email: "usuario@example.com",
    permissions: [],
    activeRoleId: "role-1",
    roles: [
      {
        id: "role-1",
        name: roleName,
        description: null,
        functionName: roleName,
        status: "Ativo",
        permissions: roleName === "Administrador" ? ["users.read", "roles.read"] : ["contents.read"],
        menuAccesses:
          roleName === "Administrador"
            ? [
                { topMenu: "administration", viewKey: "users" },
                { topMenu: "administration", viewKey: "groups" }
              ]
            : [{ topMenu: "content", viewKey: "content-list" }],
        appAccesses: []
      }
    ]
  };
}

describe("refresh utils", () => {
  it("normalizes identity values for duplicate checks", () => {
    expect(normalizeIdentityValue("  ADMIN@ABBATECH.LOCAL  ")).toBe("admin@abbatech.local");
    expect(normalizeIdentityValue("   ")).toBe("");
  });

  it("sorts record numbers numerically when possible", () => {
    expect(compareRecordNumbersDesc("10", "2")).toBeLessThan(0);
    expect(compareRecordNumbersDesc("abc", "def")).toBeGreaterThan(0);
  });

  it("never displays alphanumeric cuid fragments as record codes", () => {
    expect(displayRecordCode(null, "clwabc123def")).toMatch(/^\d+$/);
    expect(displayRecordCode(42, "clwabc123def")).toBe("42");
  });

  it("resolves application views from configured links", () => {
    expect(resolveApplicationView("Conteúdo", "conteudo.php")).toBe("content-list");
    expect(resolveApplicationView("Aplicativos", "aplicativos.php")).toBe("applications");
    expect(resolveApplicationView("Desconhecido", "custom.php")).toBeNull();
  });

  it("returns the default top menu per role kind", () => {
    expect(getDefaultTopMenu("admin")).toBe("administration");
    expect(getDefaultTopMenu("developer")).toBe("content");
    expect(getDefaultTopMenu("publisher")).toBe("content");
  });

  it("shows menu items only when menu, permission and app access agree", () => {
    const role = {
      id: "role-1",
      name: "Editor",
      description: null,
      functionName: "Editor",
      status: "Ativo",
      permissions: ["newsletters.read"],
      menuAccesses: [{ topMenu: "newsletter", viewKey: "newsletter" }],
      appAccesses: [
        {
          id: "access-1",
          name: "Newsletter",
          area: "Newsletter",
          link: "/refresh/newsletter",
          canCreate: true,
          canUpdate: true,
          canDelete: false,
          canAccess: true
        }
      ]
    } satisfies LoggedUser["roles"][number];

    expect(getMenuConfig(role).groups.newsletter).toEqual([{ key: "newsletter", label: "Newsletter" }]);
    expect(getMenuConfig(role).groups.content).toEqual([]);
  });

  it("hides menu items when app access is removed", () => {
    const role = {
      id: "role-1",
      name: "Administrador",
      description: null,
      functionName: "Administrador",
      status: "Ativo",
      permissions: ["contents.read"],
      menuAccesses: [{ topMenu: "content", viewKey: "content-list" }],
      appAccesses: []
    } satisfies LoggedUser["roles"][number];

    expect(getMenuConfig({ ...role, appAccesses: [] }).groups.content).toEqual([
      { key: "content-list", label: "Conteúdo" }
    ]);
    expect(
      getMenuConfig({
        ...role,
        appAccesses: [
          {
            id: "access-1",
            name: "Conteúdo",
            area: "Conteúdo",
            link: "/refresh/content",
            canCreate: true,
            canUpdate: true,
            canDelete: true,
            canAccess: false
          }
        ]
      }).groups.content
    ).toEqual([]);
  });

  it("starts administrators on users when that menu is available", () => {
    const role = {
      id: "role-1",
      name: "Administrador",
      description: null,
      functionName: "Administrador",
      status: "Ativo",
      permissions: ["users.read"],
      menuAccesses: [{ topMenu: "administration", viewKey: "users" }],
      appAccesses: [
        {
          id: "access-1",
          name: "Usuários",
          area: "Administração",
          link: "/refresh/users",
          canCreate: true,
          canUpdate: true,
          canDelete: true,
          canAccess: true
        }
      ]
    } satisfies LoggedUser["roles"][number];

    expect(getDefaultNavigation(role, getMenuConfig(role))).toEqual({
      topMenu: "administration",
      view: "users"
    });
  });

  it("redirects administrators only in the post-login context", () => {
    expect(
      shouldRedirectAdminAfterLogin({
        isAuthenticated: true,
        isLoadingSession: false,
        isPostLogin: true,
        user: buildLoggedUser("Administrador")
      })
    ).toBe(true);

    expect(
      shouldRedirectAdminAfterLogin({
        isAuthenticated: true,
        isLoadingSession: false,
        isPostLogin: false,
        user: buildLoggedUser("Administrador")
      })
    ).toBe(false);
  });

  it("does not redirect while loading, without a user, for common users or when already on users", () => {
    expect(
      shouldRedirectAdminAfterLogin({
        isAuthenticated: false,
        isLoadingSession: true,
        isPostLogin: true,
        user: null
      })
    ).toBe(false);

    expect(
      shouldRedirectAdminAfterLogin({
        isAuthenticated: true,
        isLoadingSession: false,
        isPostLogin: true,
        user: null
      })
    ).toBe(false);

    expect(
      shouldRedirectAdminAfterLogin({
        isAuthenticated: true,
        isLoadingSession: false,
        isPostLogin: true,
        user: buildLoggedUser("Editor")
      })
    ).toBe(false);

    expect(
      shouldRedirectAdminAfterLogin({
        isAuthenticated: true,
        isLoadingSession: false,
        isPostLogin: true,
        user: buildLoggedUser("Administrador"),
        currentView: "users"
      })
    ).toBe(false);
  });

  it("restores only valid navigation for the active profile", () => {
    const role = buildLoggedUser("Administrador").roles[0];
    const menuConfig = getMenuConfig(role);
    const storedNavigation = {
      profileId: "role-1",
      topMenu: "administration",
      view: "groups"
    } as const;

    expect(parseRefreshNavigationState(serializeRefreshNavigationState(storedNavigation))).toEqual(storedNavigation);
    expect(resolveStoredRefreshNavigation(storedNavigation, "role-1", menuConfig)).toEqual({
      topMenu: "administration",
      view: "groups"
    });
    expect(resolveStoredRefreshNavigation(storedNavigation, "role-other", menuConfig)).toBeNull();
    expect(parseRefreshNavigationState("{invalid")).toBeNull();
  });

  it("clears session and legacy persistent storage keys used by Refresh auth", () => {
    const removedFromSession: string[] = [];
    const removedFromLocal: string[] = [];
    const sessionStorage = {
      removeItem: (key: string) => {
        removedFromSession.push(key);
      }
    } as unknown as Storage;
    const localStorage = {
      removeItem: (key: string) => {
        removedFromLocal.push(key);
      }
    } as unknown as Storage;

    clearRefreshSessionStorage(sessionStorage);
    clearLegacyRefreshLocalStorage(localStorage);

    const expectedKeys = [
      refreshAccessTokenStorageKey,
      refreshAuthenticatedSessionStorageKey,
      refreshNavigationStorageKey
    ];

    expect(removedFromSession).toEqual(expectedKeys);
    expect(removedFromLocal).toEqual(expectedKeys);
  });

  it("clears auth storage without removing the restored navigation state", () => {
    const removedKeys: string[] = [];
    const storage = {
      removeItem: (key: string) => {
        removedKeys.push(key);
      }
    } as unknown as Storage;

    clearRefreshAuthStorage(storage);

    expect(removedKeys).toEqual([refreshAccessTokenStorageKey, refreshAuthenticatedSessionStorageKey]);
    expect(removedKeys).not.toContain(refreshNavigationStorageKey);
  });
});
