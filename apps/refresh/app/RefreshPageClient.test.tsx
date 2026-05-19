// @vitest-environment jsdom

import { StrictMode, act, type AnchorHTMLAttributes, type ImgHTMLAttributes } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest, safeApiRequest } from "./_lib/api";
import { emptyManagementBootstrap } from "./_lib/constants";
import {
  refreshAccessTokenStorageKey,
  refreshAuthenticatedSessionStorageKey,
  refreshNavigationStorageKey,
  serializeRefreshNavigationState
} from "./_lib/utils";
import type { LoggedUser } from "./_lib/types";
import RefreshPageClient from "./RefreshPageClient";

type MockImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
};

type MockLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

vi.mock("next/image", async () => {
  const React = await import("react");

  return {
    default: ({ fill: _fill, priority: _priority, unoptimized: _unoptimized, ...props }: MockImageProps) =>
      React.createElement("img", props)
  };
});

vi.mock("next/link", async () => {
  const React = await import("react");

  return {
    default: ({ href, children, ...props }: MockLinkProps) =>
      React.createElement("a", { href, ...props }, children)
  };
});

vi.mock("./_lib/api", () => ({
  apiRequest: vi.fn(),
  clearApiCsrfToken: vi.fn(),
  safeApiRequest: vi.fn(),
  setApiCsrfToken: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn()
  })
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const apiRequestMock = vi.mocked(apiRequest);
const safeApiRequestMock = vi.mocked(safeApiRequest);

const adminUser = buildUser("role-admin", "Administrador", ["users.read", "roles.read"], [
  { topMenu: "administration", viewKey: "users" },
  { topMenu: "administration", viewKey: "groups" }
]);

const editorUser = buildUser("role-editor", "Editor", ["contents.read"], [
  { topMenu: "content", viewKey: "content-list" }
]);

let root: Root | null = null;
let container: HTMLDivElement | null = null;

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  apiRequestMock.mockReset();
  safeApiRequestMock.mockReset();
});

afterEach(() => {
  unmountRefresh();
  document.body.innerHTML = "";
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.clearAllMocks();
});

describe("RefreshPageClient session integration", () => {
  it("redireciona o Administrador para Usuarios somente apos login bem-sucedido", async () => {
    configureApi({ loginProfile: "admin" });
    const screen = renderRefresh();

    await waitForText(screen, "Login de usuário");
    submitLoginForm(screen);

    await waitForText(screen, "Cadastro de Usuários");
    expect(screen.textContent).toContain("Cadastro de Usuários");
  });

  it("mantem Grupos ao recarregar a aplicacao com sessao administrativa valida", async () => {
    configureApi({ loginProfile: "admin" });
    const firstScreen = renderRefresh();

    await waitForText(firstScreen, "Login de usuário");
    submitLoginForm(firstScreen);
    await waitForText(firstScreen, "Cadastro de Usuários");

    const authMeCallsBeforeNavigation = countAuthMeCalls();
    clickButtonByText(firstScreen, "Administração");
    clickButtonByText(firstScreen, "Grupos");

    await waitForText(firstScreen, "Cadastro de Grupos");
    await flushReact();
    expect(countAuthMeCalls()).toBe(authMeCallsBeforeNavigation);
    await waitForStoredView("groups");

    unmountRefresh();

    const reloadedScreen = renderRefresh();

    await waitForText(reloadedScreen, "Cadastro de Grupos");
    expect(reloadedScreen.textContent).not.toContain("Cadastro de Usuários");
  });

  it("restaura uma sessao administrativa sem reaplicar o redirecionamento de Usuarios", async () => {
    configureApi({ loginProfile: "admin", restoredProfile: "admin" });
    window.sessionStorage.setItem(refreshAuthenticatedSessionStorageKey, "true");
    window.sessionStorage.setItem(
      refreshNavigationStorageKey,
      serializeRefreshNavigationState({
        profileId: "role-admin",
        topMenu: "administration",
        view: "groups"
      })
    );

    const screen = renderRefresh();

    expect(screen.textContent).not.toContain("Login de usuário");
    await waitForText(screen, "Cadastro de Grupos");
    expect(screen.textContent).not.toContain("Cadastro de Usuários");
  });

  it("nao restaura sessao quando o token existe apenas no localStorage legado", async () => {
    configureApi({ loginProfile: "admin" });
    window.localStorage.setItem(refreshAccessTokenStorageKey, "token-admin");
    window.localStorage.setItem(refreshAuthenticatedSessionStorageKey, "true");
    window.localStorage.setItem(
      refreshNavigationStorageKey,
      serializeRefreshNavigationState({
        profileId: "role-admin",
        topMenu: "administration",
        view: "groups"
      })
    );

    const screen = renderRefresh();

    await flushReact();
    expect(screen.textContent).toContain("Login de usuário");
    expect(window.localStorage.getItem(refreshAccessTokenStorageKey)).toBeNull();
    expect(window.localStorage.getItem(refreshAuthenticatedSessionStorageKey)).toBeNull();
    expect(window.localStorage.getItem(refreshNavigationStorageKey)).toBeNull();
    expect(window.sessionStorage.getItem(refreshAccessTokenStorageKey)).toBeNull();
  });

  it("encerra o loading inicial quando a API falha", async () => {
    safeApiRequestMock.mockImplementation(async (_path, fallback) => fallback);
    apiRequestMock.mockImplementation(async (path) => {
      if (path === "/auth/me") {
        throw httpError("API indisponível.", 500);
      }

      return {};
    });

    const screen = renderRefresh();

    await waitForText(screen, "Login de usuário");
    expect(screen.textContent).toContain("API indisponível.");
    expect(screen.textContent).not.toContain("Carregando sessão...");
  });

  it("nao duplica o bootstrap inicial em Strict Mode", async () => {
    configureApi({ loginProfile: "admin", restoredProfile: "admin" });
    window.sessionStorage.setItem(refreshAuthenticatedSessionStorageKey, "true");

    const screen = renderRefresh({ strictMode: true });

    await waitForText(screen, "Cadastro de Usuários");
    expect(countAuthMeCalls()).toBe(1);
  });

  it("envia a recuperacao de senha pela UI sem inicializar sessao", async () => {
    apiRequestMock.mockImplementation(async (path) => {
      if (path === "/auth/forgot-password") {
        return { message: "Instruções enviadas." };
      }

      if (path === "/auth/me") {
        throw httpError("Sessão ausente.", 401);
      }

      return {};
    });
    safeApiRequestMock.mockImplementation(async (_path, fallback) => fallback);

    renderRefresh({ recoveryModalMode: "forgot-password" });

    await waitForText(document.body, "Recuperar acesso");
    const emailInput = Array.from(document.body.querySelectorAll("input")).find(
      (input) => input.getAttribute("inputmode") === "email"
    );
    setInputValue(emailInput, "admin@abbatech.local");

    const recoveryForm = Array.from(document.body.querySelectorAll("form")).find((form) =>
      form.textContent?.includes("Enviar instruções")
    );
    if (!recoveryForm) {
      throw new Error("Recovery form was not found.");
    }

    act(() => {
      recoveryForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    await waitForText(document.body, "Instruções enviadas.");
    expect(apiRequestMock).toHaveBeenCalledWith(
      "/auth/forgot-password",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "admin@abbatech.local" })
      })
    );
    expect(countAuthMeCalls()).toBe(0);
  });

  it("nao aplica a regra de Administrador para usuario comum", async () => {
    configureApi({ loginProfile: "editor" });
    const screen = renderRefresh();

    await waitForText(screen, "Login de usuário");
    const [identifierInput, passwordInput] = Array.from(screen.querySelectorAll("input")) as HTMLInputElement[];

    setInputValue(identifierInput, "editor@example.test");
    setInputValue(passwordInput, "Refresh123!");
    submitLoginForm(screen);

    await waitForText(screen, "Cadastro de Conteúdo");
    expect(screen.textContent).not.toContain("Cadastro de Usuários");
  });

  it("nao cria estado de pos-login quando o login falha", async () => {
    configureApi({ loginProfile: "admin", loginFails: true });
    const screen = renderRefresh();

    await waitForText(screen, "Login de usuário");
    submitLoginForm(screen);

    await waitForText(screen, "Credenciais invalidas.");
    expect(window.sessionStorage.getItem(refreshAccessTokenStorageKey)).toBeNull();
    expect(window.sessionStorage.getItem(refreshNavigationStorageKey)).toBeNull();
  });
});

function buildUser(
  roleId: string,
  roleName: string,
  permissions: string[],
  menuAccesses: LoggedUser["roles"][number]["menuAccesses"]
): LoggedUser {
  return {
    id: `user-${roleId}`,
    name: `${roleName} Refresh`,
    email: `${roleId}@example.test`,
    permissions,
    activeRoleId: roleId,
    roles: [
      {
        id: roleId,
        name: roleName,
        description: null,
        functionName: roleName,
        status: "Ativo",
        permissions,
        menuAccesses,
        appAccesses: []
      }
    ]
  };
}

function countAuthMeCalls() {
  return apiRequestMock.mock.calls.filter(([path]) => path === "/auth/me").length;
}

function configureApi({
  loginProfile,
  loginFails = false,
  restoredProfile = null
}: {
  loginProfile: "admin" | "editor";
  loginFails?: boolean;
  restoredProfile?: "admin" | "editor" | null;
}) {
  let authenticatedProfile: "admin" | "editor" | null = restoredProfile;

  safeApiRequestMock.mockImplementation(async (_path, fallback) => fallback);
  apiRequestMock.mockImplementation(async (path) => {
    if (path === "/auth/login") {
      if (loginFails) {
        throw httpError("Credenciais invalidas.", 401);
      }

      authenticatedProfile = loginProfile;
      return {
        csrfToken: "csrf-token"
      };
    }

    if (path === "/auth/me") {
      if (authenticatedProfile === "admin") {
        return adminUser;
      }

      if (authenticatedProfile === "editor") {
        return editorUser;
      }

      throw httpError("Sessão ausente.", 401);
    }

    if (path === "/auth/logout") {
      authenticatedProfile = null;
      return { message: "Sessão encerrada." };
    }

    if (path === "/management/bootstrap") {
      return emptyManagementBootstrap;
    }

    return {};
  });
}

function httpError(message: string, status: number) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function renderRefresh(options: { recoveryModalMode?: "forgot-password"; strictMode?: boolean } = {}) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  const component = <RefreshPageClient recoveryModalMode={options.recoveryModalMode} />;

  act(() => {
    root?.render(
      options.strictMode ? (
        <StrictMode>
          {component}
        </StrictMode>
      ) : (
        component
      )
    );
  });

  return container;
}

function unmountRefresh() {
  if (!root) {
    return;
  }

  act(() => {
    root?.unmount();
  });

  root = null;
  container = null;
}

function submitLoginForm(screen: HTMLElement) {
  const form = screen.querySelector("form");

  if (!form) {
    throw new Error("Login form was not found.");
  }

  act(() => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

function clickButtonByText(screen: HTMLElement, text: string) {
  const button = Array.from(screen.querySelectorAll("button")).find((currentButton) =>
    currentButton.textContent?.includes(text)
  );

  if (!button) {
    throw new Error(`Button with text "${text}" was not found.`);
  }

  act(() => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

function setInputValue(input: HTMLInputElement | undefined, value: string) {
  if (!input) {
    throw new Error("Input was not found.");
  }

  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;

  act(() => {
    valueSetter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function flushReact() {
  await act(async () => {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function waitForText(screen: HTMLElement, text: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await flushReact();

    if (screen.textContent?.includes(text)) {
      return;
    }
  }

  throw new Error(`Text "${text}" was not found. Current text: ${screen.textContent ?? ""}`);
}

async function waitForStoredView(view: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await flushReact();

    const storedNavigation = window.sessionStorage.getItem(refreshNavigationStorageKey);
    if (storedNavigation && JSON.parse(storedNavigation).view === view) {
      return;
    }
  }

  throw new Error(`Stored view "${view}" was not found.`);
}
