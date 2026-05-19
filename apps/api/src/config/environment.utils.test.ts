import { describe, expect, it } from "vitest";

import { buildRefreshRouteUrl, resolveApiUrls, resolveRefreshPublicUrl } from "./environment.utils";

describe("environment URL utilities", () => {
  it("keeps browser and container API URLs separated", () => {
    expect(
      resolveApiUrls({
        INTERNAL_API_URL: "http://api:3333/api/v1",
        NEXT_PUBLIC_API_URL: "http://localhost:4333/api/v1"
      })
    ).toEqual({
      internalApiUrl: "http://api:3333/api/v1",
      publicApiUrl: "http://localhost:4333/api/v1"
    });
  });

  it("falls back to the public API URL when the internal URL is absent", () => {
    expect(resolveApiUrls({ NEXT_PUBLIC_API_URL: "http://localhost:3333/api/v1" })).toEqual({
      internalApiUrl: "http://localhost:3333/api/v1",
      publicApiUrl: "http://localhost:3333/api/v1"
    });
  });

  it("normalizes the Refresh public URL with the required base path", () => {
    expect(resolveRefreshPublicUrl({ NEXT_PUBLIC_REFRESH_URL: "http://localhost:4101" })).toBe(
      "http://localhost:4101/abbatech/refresh"
    );

    expect(resolveRefreshPublicUrl({ NEXT_PUBLIC_REFRESH_URL: "http://localhost:4101/abbatech/refresh/" })).toBe(
      "http://localhost:4101/abbatech/refresh"
    );
  });

  it("builds password reset links without duplicating the base path", () => {
    expect(
      buildRefreshRouteUrl(
        {
          NEXT_PUBLIC_REFRESH_URL: "https://abbatech.dev.br/abbatech/refresh"
        },
        "/reset-password",
        { token: "opaque-token" }
      )
    ).toBe("https://abbatech.dev.br/abbatech/refresh/reset-password?token=opaque-token");
  });
});
