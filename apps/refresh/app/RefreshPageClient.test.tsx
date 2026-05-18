// @vitest-environment jsdom

import { act, type AnchorHTMLAttributes, type ImgHTMLAttributes } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest, safeApiRequest } from "./_lib/api";
import { emptyManagementBootstrap } from "./_lib/constants";
import {
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
  safeApiRequest: vi.fn()
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
  apiRequestMock.mockReset();
  safeApiRequestMock.mockReset();
});

afterEach(() => {
  unmountRefresh();
  document.body.innerHTML = "";
  window.localStorage.clear();
  vi.clearAllMocks();
});

describe("RefreshPageClient session integration", () => {
  it("redireciona o Administrador para Usuarios somente apos login bem-sucedido", async () => {
    configureApi({ loginProfile: "admin" });
    const screen = renderRefresh();

    submitLoginForm(screen);

    await waitForText(screen, "Cadastro de Usuários");
    expect(screen.textContent).toContain("Cadastro de Usuários");
  });

  it("mantem Grupos ao recarregar a aplicacao com sessao administrativa valida", async () => {
    configureApi({ loginProfile: "admin" });
    const firstScreen = renderRefresh();

    submitLoginForm(firstScreen);
    await waitForText(firstScreen, "Cadastro de Usuários");

    clickButtonByText(firstScreen, "Administração");
    clickButtonByText(firstScreen, "Grupos");

    await waitForText(firstScreen, "Cadastro de Grupos");
    await waitForStoredView("groups");

    unmountRefresh();

    const reloadedScreen = renderRefresh();

    await waitForText(reloadedScreen, "Cadastro de Grupos");
    expect(reloadedScreen.textContent).not.toContain("Cadastro de Usuários");
  });

  it("restaura uma sessao administrativa sem reaplicar o redirecionamento de Usuarios", async () => {
    configureApi({ loginProfile: "admin" });
    window.localStorage.setItem("refresh_access_token", "token-admin");
    window.localStorage.setItem("refresh_authenticated_session", "true");
    window.localStorage.setItem(
      refreshNavigationStorageKey,
      serializeRefreshNavigationState({
        profileId: "role-admin",
        topMenu: "administration",
        view: "groups"
      })
    );

    const screen = renderRefresh();

    await waitForText(screen, "Cadastro de Grupos");
    expect(screen.textContent).not.toContain("Cadastro de Usuários");
  });

  it("nao aplica a regra de Administrador para usuario comum", async () => {
    configureApi({ loginProfile: "editor" });
    const screen = renderRefresh();
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

    submitLoginForm(screen);

    await waitForText(screen, "Credenciais invalidas.");
    expect(window.localStorage.getItem("refresh_access_token")).toBeNull();
    expect(window.localStorage.getItem(refreshNavigationStorageKey)).toBeNull();
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

function configureApi({
  loginProfile,
  loginFails = false
}: {
  loginProfile: "admin" | "editor";
  loginFails?: boolean;
}) {
  safeApiRequestMock.mockImplementation(async (_path, fallback) => fallback);
  apiRequestMock.mockImplementation(async (path, _options, token) => {
    if (path === "/auth/login") {
      if (loginFails) {
        throw httpError("Credenciais invalidas.", 401);
      }

      return {
        accessToken: loginProfile === "admin" ? "token-admin" : "token-editor"
      };
    }

    if (path === "/auth/me") {
      if (token === "token-admin") {
        return adminUser;
      }

      if (token === "token-editor") {
        return editorUser;
      }

      throw httpError("Token de acesso invalido.", 401);
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

function renderRefresh() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root?.render(<RefreshPageClient />);
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

    const storedNavigation = window.localStorage.getItem(refreshNavigationStorageKey);
    if (storedNavigation && JSON.parse(storedNavigation).view === view) {
      return;
    }
  }

  throw new Error(`Stored view "${view}" was not found.`);
}
