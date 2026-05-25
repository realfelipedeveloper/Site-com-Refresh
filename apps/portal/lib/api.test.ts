import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getContentBySlug,
  getContentHref,
  getPortalApiUrl,
  getPublishedContents,
  getSections
} from "./api";

describe("portal api client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the public api url helper", () => {
    expect(getPortalApiUrl()).toContain("/api/v1");
  });

  it("requests sections and published contents", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: "section-1",
            name: "Home",
            slug: "home",
            path: "/home",
            accessPolicy: "public",
            children: []
          }
        ]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: "content-1",
            title: "Hello",
            slug: "hello",
            url: "/noticias/hello",
            excerpt: "excerpt",
            body: "body",
            publishedAt: null,
            section: { id: "section-1", name: "Home", path: "/home", url: "/home" },
            seo: { title: "Hello", description: "excerpt", canonicalUrl: null, robots: "index,follow" },
            template: null
          }
        ]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "content-1",
          title: "Hello",
          slug: "hello",
          url: "/noticias/hello",
          excerpt: "excerpt",
          body: "body",
          publishedAt: null,
          section: { id: "section-1", name: "Home", path: "/home", url: "/home" },
          seo: { title: "Hello", description: "excerpt", canonicalUrl: null, robots: "index,follow" },
          template: null
        })
      });

    vi.stubGlobal("fetch", fetchMock);

    const sections = await getSections();
    const contents = await getPublishedContents();
    const content = await getContentBySlug("hello");

    expect(sections).toHaveLength(1);
    expect(contents[0]?.slug).toBe("hello");
    expect(content).not.toBeNull();
    if (!content) {
      throw new Error("Expected content to be returned");
    }
    expect(content.title).toBe("Hello");
    expect(getContentHref(contents[0]!)).toBe("/noticias/hello");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("falls back to the slug when a canonical content url is not present", () => {
    expect(getContentHref({ slug: "hello", url: null })).toBe("/hello");
  });

  it("returns null for missing content details", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getContentBySlug("missing")).resolves.toBeNull();
  });

  it("fails loudly when the API does not return a successful response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getSections()).rejects.toThrow("Falha ao carregar /sections");
  });
});
