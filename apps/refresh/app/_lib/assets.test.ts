import { describe, expect, it } from "vitest";

import { normalizeRefreshAssetPath, refreshAssetPath, refreshLoginBackgroundSrc, refreshLogoSrc } from "./assets";

describe("refresh assets", () => {
  it("adds the Refresh base path to relative public assets only once", () => {
    expect(refreshAssetPath("/brand/logo.png")).toBe("/abbatech/refresh/brand/logo.png");
    expect(refreshAssetPath("/abbatech/refresh/brand/logo.png")).toBe("/abbatech/refresh/brand/logo.png");
    expect(normalizeRefreshAssetPath("media/users/avatar.png")).toBe(
      "/abbatech/refresh/media/users/avatar.png"
    );
  });

  it("publishes stable login image paths under the configured subpath", () => {
    expect(refreshLogoSrc).toBe("/abbatech/refresh/brand/logov2.png");
    expect(refreshLoginBackgroundSrc).toBe("/abbatech/refresh/brand/img-cms.png");
  });
});
