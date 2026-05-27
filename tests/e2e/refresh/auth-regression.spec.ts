import { expect, test, type Page } from "@playwright/test";

import {
  emptyManagementBootstrapFixture,
  refreshAdminUserFixture,
  refreshTestCredentials
} from "../../fixtures/refresh-auth-fixtures";

const refreshUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3101/abbatech/refresh";
const refreshReadyTimeoutMs = 15_000;

test.describe("Refresh auth regressions", () => {
  test("first access without token renders login without expired-session alert", async ({ page }) => {
    const nativeDialogs: string[] = [];
    page.on("dialog", async (dialog) => {
      nativeDialogs.push(dialog.message());
      await dialog.dismiss();
    });

    await routeAuthMe(page, 401, { message: "Sessão ausente." });
    await page.goto(refreshUrl);

    await expect(page.getByRole("heading", { name: "Login de usuário" })).toBeVisible({
      timeout: refreshReadyTimeoutMs
    });
    await expect(page.getByText("Sessão expirada")).toHaveCount(0);
    expect(nativeDialogs).toEqual([]);
  });

  test("real expired session clears storage and shows only the custom alert", async ({ page }) => {
    const nativeDialogs: string[] = [];
    page.on("dialog", async (dialog) => {
      nativeDialogs.push(dialog.message());
      await dialog.dismiss();
    });
    await page.addInitScript(() => {
      window.sessionStorage.setItem("refresh_authenticated_session", "true");
      window.sessionStorage.setItem("refresh_access_token", "legacy-token");
      window.sessionStorage.setItem(
        "refresh_navigation_state",
        JSON.stringify({ profileId: "role-admin", topMenu: "administration", view: "groups" })
      );
    });

    await routeAuthMe(page, 401, { message: "Sessão inválida ou expirada." });
    await page.goto(refreshUrl);

    await expect(page.getByText("Sessão expirada")).toBeVisible({ timeout: refreshReadyTimeoutMs });
    await expect(page.getByRole("heading", { name: "Login de usuário" })).toBeVisible({
      timeout: refreshReadyTimeoutMs
    });
    expect(nativeDialogs).toEqual([]);
    await expect
      .poll(async () =>
        page.evaluate(() => ({
          authenticated: window.sessionStorage.getItem("refresh_authenticated_session"),
          navigation: window.sessionStorage.getItem("refresh_navigation_state"),
          token: window.sessionStorage.getItem("refresh_access_token")
        }))
      )
      .toEqual({
        authenticated: null,
        navigation: null,
        token: null
      });
  });

  test("admin login redirects to users and reload preserves the selected internal route", async ({ page }) => {
    await routeRefreshLoginFlowApi(page);
    await page.goto(refreshUrl);

    await page.getByLabel("Usuário").fill(refreshTestCredentials.admin.email);
    await page.getByLabel("Senha").fill(refreshTestCredentials.admin.password);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText("Cadastro de Usuários")).toBeVisible({ timeout: refreshReadyTimeoutMs });
    await page.getByRole("button", { name: "Administração" }).click();
    await page.getByRole("button", { name: "Grupos" }).click();
    await expect(page.getByText("Cadastro de Grupos")).toBeVisible();

    await page.reload();

    await expect(page.getByText("Cadastro de Grupos")).toBeVisible();
    await expect(page.getByText("Cadastro de Usuários")).toHaveCount(0);
  });

  test("profile dropdown starts closed, ignores hover and toggles by click", async ({ page }) => {
    await routeLoggedInRefreshApi(page);
    await page.addInitScript(() => {
      window.sessionStorage.setItem("refresh_authenticated_session", "true");
    });
    await page.goto(refreshUrl);

    const profileButton = page.getByRole("button", { name: /Admin Refresh/ });
    await expect(profileButton).toHaveAttribute("aria-expanded", "false", { timeout: refreshReadyTimeoutMs });
    await expect(page.getByText("Perfis do usuário")).toHaveCount(0);

    await profileButton.hover();
    await expect(page.getByText("Perfis do usuário")).toHaveCount(0);

    await profileButton.click();
    await expect(page.getByText("Perfis do usuário")).toBeVisible();
    await expect(profileButton).toHaveAttribute("aria-expanded", "true");

    await page.mouse.click(10, 10);
    await expect(page.getByText("Perfis do usuário")).toHaveCount(0);
  });
});

async function routeAuthMe(page: Page, status: number, body: unknown) {
  await page.route("**/api/v1/auth/me", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      status,
      body: JSON.stringify(body)
    });
  });
}

async function routeRefreshLoginFlowApi(page: Page) {
  let authenticated = false;

  await page.route("**/api/v1/auth/login", async (route) => {
    authenticated = true;
    await route.fulfill({
      contentType: "application/json",
      status: 200,
      body: JSON.stringify({ csrfToken: "csrf-token" })
    });
  });

  await page.route("**/api/v1/auth/me", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      status: authenticated ? 200 : 401,
      body: JSON.stringify(authenticated ? refreshAdminUserFixture : { message: "Sessão ausente." })
    });
  });

  await routeRefreshDataApi(page);
}

async function routeLoggedInRefreshApi(page: Page) {
  await page.route("**/api/v1/auth/login", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      status: 200,
      body: JSON.stringify({ csrfToken: "csrf-token" })
    });
  });
  await routeAuthMe(page, 200, refreshAdminUserFixture);
  await routeRefreshDataApi(page);
}

async function routeRefreshDataApi(page: Page) {
  const emptyJsonRoutes = [
    "**/api/v1/contents/meta",
    "**/api/v1/sections/admin/list",
    "**/api/v1/contents/admin/list",
    "**/api/v1/management/bootstrap"
  ];

  for (const pattern of emptyJsonRoutes) {
    await page.route(pattern, async (route) => {
      const url = route.request().url();
      const body = url.includes("/contents/meta")
        ? { templates: [], sections: [], contentTypes: [] }
        : url.includes("/management/bootstrap")
          ? emptyManagementBootstrapFixture
          : [];

      await route.fulfill({
        contentType: "application/json",
        status: 200,
        body: JSON.stringify(body)
      });
    });
  }
}
