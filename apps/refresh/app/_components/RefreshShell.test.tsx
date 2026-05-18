// @vitest-environment jsdom

import { act, type ImgHTMLAttributes, type ReactNode, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LoggedUser, MenuConfig, TopMenuKey, ViewKey } from "../_lib/types";
import { RefreshShell } from "./RefreshShell";

type MockImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  priority?: boolean;
  unoptimized?: boolean;
};

vi.mock("next/image", async () => {
  const React = await import("react");

  return {
    default: ({ priority: _priority, unoptimized: _unoptimized, ...props }: MockImageProps) =>
      React.createElement("img", props)
  };
});

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const user: LoggedUser = {
  id: "user-1",
  name: "Maria Refresh",
  email: "maria.refresh@example.com",
  permissions: [],
  activeRoleId: "role-admin",
  roles: [
    {
      id: "role-admin",
      name: "Administrador",
      description: null,
      permissions: ["users.read"],
      menuAccesses: [],
      appAccesses: []
    },
    {
      id: "role-editor",
      name: "Editor",
      description: null,
      permissions: ["content.write"],
      menuAccesses: [],
      appAccesses: []
    }
  ]
};

const menuGroups: MenuConfig["groups"] = {
  content: [
    { key: "content-list", label: "Listagem de conteúdos" },
    { key: "content-editor", label: "Editor de conteúdo" }
  ],
  administration: [{ key: "users", label: "Usuários" }],
  system: [],
  newsletter: []
};

let root: Root | null = null;
let container: HTMLDivElement | null = null;

afterEach(() => {
  if (root) {
    act(() => {
      root?.unmount();
    });
  }

  root = null;
  container = null;
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

function ControlledRefreshShell({
  children = "Conteúdo da tela",
  onLogout = vi.fn(),
  onSwitchProfile = vi.fn()
}: {
  children?: ReactNode;
  onLogout?: () => void;
  onSwitchProfile?: (profileId: string) => void;
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [expandedTopMenu, setExpandedTopMenu] = useState<TopMenuKey | null>(null);
  const [topMenu, setTopMenu] = useState<TopMenuKey>("content");
  const [view, setView] = useState<ViewKey>("content-list");

  return (
    <RefreshShell
      error=""
      expandedTopMenu={expandedTopMenu}
      isPending={false}
      menuGroups={menuGroups}
      onCloseProfileMenu={() => setProfileMenuOpen(false)}
      onCloseTopMenu={() => setExpandedTopMenu(null)}
      onLogout={() => {
        setProfileMenuOpen(false);
        setExpandedTopMenu(null);
        onLogout();
      }}
      onSelectView={(nextTopMenu, nextView) => {
        setProfileMenuOpen(false);
        setTopMenu(nextTopMenu);
        setView(nextView);
        setExpandedTopMenu(null);
      }}
      onSwitchProfile={(profileId) => {
        setProfileMenuOpen(false);
        onSwitchProfile(profileId);
      }}
      onToggleProfileMenu={() => {
        setExpandedTopMenu(null);
        setProfileMenuOpen((current) => !current);
      }}
      onToggleTopMenu={(menuKey) => {
        setProfileMenuOpen(false);
        setTopMenu(menuKey);
        setExpandedTopMenu((current) => (current === menuKey ? null : menuKey));
      }}
      profileMenuOpen={profileMenuOpen}
      roleLabel="Administrador"
      selectedProfileId="role-admin"
      success=""
      topMenu={topMenu}
      topMenus={[
        { key: "content", label: "Conteúdo" },
        { key: "administration", label: "Administração" }
      ]}
      user={user}
      view={view}
    >
      {children}
    </RefreshShell>
  );
}

function renderShell(props: Parameters<typeof ControlledRefreshShell>[0] = {}) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root?.render(<ControlledRefreshShell {...props} />);
  });

  return container;
}

function getButtonByText(containerElement: HTMLElement, text: string) {
  const button = Array.from(containerElement.querySelectorAll("button")).find((currentButton) =>
    currentButton.textContent?.includes(text)
  );

  if (!button) {
    throw new Error(`Button with text "${text}" was not found.`);
  }

  return button;
}

function click(element: Element) {
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

function mouseEvent(element: Element, eventName: "mouseover" | "mouseout") {
  act(() => {
    element.dispatchEvent(new MouseEvent(eventName, { bubbles: true, cancelable: true }));
  });
}

function pointerDownOutside() {
  act(() => {
    document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true }));
  });
}

describe("RefreshShell dropdowns", () => {
  it("mantem os dropdowns fechados na renderizacao inicial e ignora hover", () => {
    const shell = renderShell();
    const profileTrigger = getButtonByText(shell, "Maria Refresh");
    const topMenuTrigger = getButtonByText(shell, "Conteúdo");

    expect(shell.textContent).not.toContain("Perfis do usuário");
    expect(shell.querySelector("#refresh-top-menu-content")).toBeNull();
    expect(profileTrigger.getAttribute("aria-expanded")).toBe("false");
    expect(topMenuTrigger.getAttribute("aria-expanded")).toBe("false");

    mouseEvent(profileTrigger, "mouseover");
    mouseEvent(topMenuTrigger, "mouseover");

    expect(shell.textContent).not.toContain("Perfis do usuário");
    expect(shell.querySelector("#refresh-top-menu-content")).toBeNull();
  });

  it("abre e fecha o seletor de perfil apenas por clique, clique fora ou selecao", () => {
    const onSwitchProfile = vi.fn();
    const shell = renderShell({ onSwitchProfile });
    const profileTrigger = getButtonByText(shell, "Maria Refresh");

    click(profileTrigger);
    expect(shell.textContent).toContain("Perfis do usuário");
    expect(profileTrigger.getAttribute("aria-expanded")).toBe("true");

    mouseEvent(profileTrigger, "mouseout");
    expect(shell.textContent).toContain("Perfis do usuário");

    click(profileTrigger);
    expect(shell.textContent).not.toContain("Perfis do usuário");
    expect(profileTrigger.getAttribute("aria-expanded")).toBe("false");

    click(profileTrigger);
    pointerDownOutside();
    expect(shell.textContent).not.toContain("Perfis do usuário");

    click(profileTrigger);
    click(getButtonByText(shell, "Editor"));

    expect(onSwitchProfile).toHaveBeenCalledWith("role-editor");
    expect(shell.textContent).not.toContain("Perfis do usuário");
  });

  it("abre e fecha os grupos do menu lateral por clique, clique fora ou selecao", () => {
    const shell = renderShell();
    const topMenuTrigger = getButtonByText(shell, "Conteúdo");

    click(topMenuTrigger);
    expect(shell.querySelector("#refresh-top-menu-content")).not.toBeNull();
    expect(topMenuTrigger.getAttribute("aria-expanded")).toBe("true");

    mouseEvent(topMenuTrigger, "mouseout");
    expect(shell.querySelector("#refresh-top-menu-content")).not.toBeNull();

    click(topMenuTrigger);
    expect(shell.querySelector("#refresh-top-menu-content")).toBeNull();
    expect(topMenuTrigger.getAttribute("aria-expanded")).toBe("false");

    click(topMenuTrigger);
    pointerDownOutside();
    expect(shell.querySelector("#refresh-top-menu-content")).toBeNull();

    click(topMenuTrigger);
    click(getButtonByText(shell, "Editor de conteúdo"));
    expect(shell.querySelector("#refresh-top-menu-content")).toBeNull();
  });
});
