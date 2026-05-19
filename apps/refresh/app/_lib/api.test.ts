import { afterEach, describe, expect, it, vi } from "vitest";

import { apiRequest, buildApiRequestUrl, clearApiCsrfToken, setApiCsrfToken } from "./api";

describe("Refresh API client", () => {
  afterEach(() => {
    clearApiCsrfToken();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("sends cookies and CSRF token on unsafe requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    setApiCsrfToken("csrf-token");

    await apiRequest("/management/users", {
      method: "POST",
      body: JSON.stringify({ name: "Admin" })
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/management/users"),
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-CSRF-Token": "csrf-token"
        })
      })
    );
  });

  it("does not send CSRF token on safe requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    setApiCsrfToken("csrf-token");

    await apiRequest("/auth/me");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/auth/me"),
      expect.objectContaining({
        credentials: "include",
        headers: expect.not.objectContaining({
          "X-CSRF-Token": "csrf-token"
        })
      })
    );
  });

  it("normalizes API URLs without duplicate slashes", () => {
    expect(buildApiRequestUrl("auth/me", "http://localhost:3333/api/v1/")).toBe(
      "http://localhost:3333/api/v1/auth/me"
    );
  });

  it("fails finite requests when the API does not answer", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const request = apiRequest("/auth/me", undefined, undefined, { timeoutMs: 25 });
    const assertion = expect(request).rejects.toThrow("Tempo esgotado ao comunicar com a API.");
    await vi.advanceTimersByTimeAsync(25);

    await assertion;
    vi.useRealTimers();
  });
});

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json"
    },
    status: 200
  });
}
