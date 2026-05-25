import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ContentsService } from "./contents.service";

const NOW = new Date("2026-05-24T23:59:59.999Z");

function createContentsService() {
  const prisma = {
    auditLog: {
      create: vi.fn()
    },
    content: {
      aggregate: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    },
    contentRevision: {
      create: vi.fn()
    },
    contentType: {
      findMany: vi.fn(),
      findUnique: vi.fn()
    },
    friendlyUrl: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn()
    },
    role: {
      findUnique: vi.fn()
    },
    section: {
      findMany: vi.fn(),
      findUnique: vi.fn()
    },
    seoMetadata: {
      create: vi.fn(),
      update: vi.fn()
    },
    template: {
      findMany: vi.fn()
    }
  };

  return {
    prisma,
    service: new ContentsService(prisma as never)
  };
}

function startOfDay(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function expectedPublicPolicyWhere() {
  return {
    section: {
      isActive: true,
      accessPolicy: "public"
    },
    status: "published",
    visibility: "public",
    OR: [
      { validateValidity: false },
      {
        validateValidity: true,
        AND: [
          {
            OR: [{ validFrom: null }, { validFrom: { lte: NOW } }]
          },
          {
            OR: [{ validUntil: null }, { validUntil: { gte: startOfDay(NOW) } }]
          }
        ]
      }
    ]
  };
}

function expectedPublicWhere(extraWhere: Record<string, unknown> = {}) {
  const publicPolicy = expectedPublicPolicyWhere();

  if (Object.keys(extraWhere).length === 0) {
    return publicPolicy;
  }

  return {
    AND: [extraWhere, publicPolicy]
  };
}

describe("ContentsService public content policy", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("applies the shared public policy to public listings", async () => {
    const { prisma, service } = createContentsService();
    prisma.content.findMany.mockResolvedValue([]);

    await expect(service.listPublished()).resolves.toEqual([]);

    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expectedPublicWhere()
      })
    );
  });

  it("returns published content in a public section when validity validation is disabled", async () => {
    const { prisma, service } = createContentsService();
    prisma.content.findMany.mockResolvedValue([
      {
        id: "content-1",
        validateValidity: false,
        validFrom: null,
        validUntil: null,
        section: { isActive: true, accessPolicy: "public" },
        status: "published",
        visibility: "public"
      }
    ]);

    await expect(service.listPublished()).resolves.toEqual([
      expect.objectContaining({
        id: "content-1",
        validateValidity: false
      })
    ]);

    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expectedPublicWhere()
      })
    );
  });

  it("keeps published public content visible in public sections through the public policy", async () => {
    const { prisma, service } = createContentsService();
    prisma.content.findMany.mockResolvedValue([
      {
        id: "content-public-policy",
        section: { isActive: true, accessPolicy: "public" },
        status: "published",
        visibility: "public",
        validateValidity: false
      }
    ]);

    await expect(service.listPublished()).resolves.toEqual([
      expect.objectContaining({
        id: "content-public-policy"
      })
    ]);

    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expectedPublicWhere()
      })
    );
  });

  it("does not list published content from restricted hidden sections", async () => {
    const { prisma, service } = createContentsService();
    prisma.content.findMany.mockResolvedValue([]);

    await expect(service.listPublished()).resolves.toEqual([]);

    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expectedPublicWhere()
      })
    );
  });

  it("applies the shared public policy to public detail by slug", async () => {
    const { prisma, service } = createContentsService();
    prisma.content.findFirst.mockResolvedValue({
      id: "content-1",
      section: { isActive: true, accessPolicy: "public" },
      slug: "publicado",
      status: "published",
      visibility: "public"
    });

    await expect(service.findBySlug("publicado")).resolves.toEqual(
      expect.objectContaining({
        id: "content-1"
      })
    );

    expect(prisma.content.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expectedPublicWhere({ slug: "publicado" })
      })
    );
  });

  it("returns not found for public detail in restricted hidden sections", async () => {
    const { prisma, service } = createContentsService();
    prisma.content.findFirst.mockResolvedValue(null);

    await expect(service.findBySlug("restrito")).rejects.toThrow(NotFoundException);

    expect(prisma.content.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expectedPublicWhere({ slug: "restrito" })
      })
    );
  });

  it("preserves specific SEO metadata when it exists", async () => {
    const { prisma, service } = createContentsService();
    const seo = {
      title: "SEO especifico",
      description: "Descricao especifica",
      keywords: "custom",
      canonicalUrl: "/canonical",
      robots: "noindex"
    };
    prisma.content.findFirst.mockResolvedValue({
      id: "content-seo",
      title: "Titulo publico",
      excerpt: "Resumo publico",
      section: { isActive: true, name: "Noticias" },
      slug: "publicado",
      status: "published",
      visibility: "public",
      seo
    });

    await expect(service.findBySlug("publicado")).resolves.toEqual(
      expect.objectContaining({
        seo
      })
    );
  });

  it("builds a safe SEO fallback when SEO metadata is absent", async () => {
    const { prisma, service } = createContentsService();
    prisma.content.findFirst.mockResolvedValue({
      id: "content-fallback",
      title: "Titulo publico",
      excerpt: "<p>Resumo seguro token=valor-secreto</p>",
      body: "<strong>corpo completo que nao deve alimentar fallback</strong>",
      section: { isActive: true, name: "Noticias" },
      slug: "sem-seo",
      status: "published",
      visibility: "public",
      seo: null
    });

    const result = await service.findBySlug("sem-seo");

    expect(result).toMatchObject({
      id: "content-fallback",
      slug: "sem-seo",
      section: { name: "Noticias" },
      seo: {
        title: "Titulo publico",
        description: "Resumo seguro token=[redacted]",
        canonicalUrl: null,
        robots: "index,follow"
      }
    });
    if (!result.seo) {
      throw new Error("Expected SEO fallback to be present");
    }
    expect(result.seo.description).not.toContain("<p>");
    expect(result.seo.description).not.toContain("valor-secreto");
    expect(result.seo.description).not.toContain("corpo completo");
  });

  it("returns published content when validity validation is enabled and the current date is inside the interval", async () => {
    const { prisma, service } = createContentsService();
    prisma.content.findFirst.mockResolvedValue({
      id: "content-2",
      section: { isActive: true },
      slug: "vigente",
      status: "published",
      visibility: "public",
      validateValidity: true,
      validFrom: new Date("2026-05-01T00:00:00.000Z"),
      validUntil: new Date("2026-05-24T00:00:00.000Z")
    });

    await expect(service.findBySlug("vigente")).resolves.toEqual(
      expect.objectContaining({
        id: "content-2"
      })
    );

    expect(prisma.content.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expectedPublicWhere({ slug: "vigente" })
      })
    );
  });

  it("treats validUntil as valid through the final day", async () => {
    const { prisma, service } = createContentsService();
    prisma.content.findFirst.mockResolvedValue({
      id: "content-3",
      section: { isActive: true },
      slug: "ultimo-dia",
      status: "published",
      visibility: "public",
      validateValidity: true,
      validUntil: new Date("2026-05-24T00:00:00.000Z")
    });

    await expect(service.findBySlug("ultimo-dia")).resolves.toEqual(
      expect.objectContaining({
        id: "content-3"
      })
    );

    expect(prisma.content.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expectedPublicWhere({ slug: "ultimo-dia" })
      })
    );
  });

  it.each([
    ["content before validFrom"],
    ["content after validUntil"],
    ["draft content"],
    ["archived content"],
    ["private content"],
    ["content in inactive section"],
    ["missing content"]
  ])("returns not found for non-public detail: %s", async () => {
    const { prisma, service } = createContentsService();
    prisma.content.findFirst.mockResolvedValue(null);

    await expect(service.findBySlug("restrito")).rejects.toThrow(NotFoundException);
    expect(prisma.content.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expectedPublicWhere({ slug: "restrito" })
      })
    );
  });
});

describe("ContentsService friendly URL policy", () => {
  const user = { sub: "user-1" } as never;
  const writerUser = { sub: "writer-1", permissions: ["contents.write"] } as never;
  const publisherUser = { sub: "publisher-1", permissions: ["contents.write", "contents.publish"] } as never;
  const scopedUser = {
    sub: "scoped-1",
    permissions: ["contents.write"],
    roleId: "role-editor"
  } as never;
  const validPayload = {
    title: "Notícias",
    slug: "Notícias",
    sectionId: "section-1",
    contentTypeId: "type-1"
  };

  function mockValidRelations(prisma: ReturnType<typeof createContentsService>["prisma"]) {
    prisma.section.findUnique.mockResolvedValue({ id: "section-1", path: "/editorial", isActive: true });
    prisma.contentType.findUnique.mockResolvedValue({ id: "type-1" });
  }

  function mockScopedRole(
    prisma: ReturnType<typeof createContentsService>["prisma"],
    sectionIds = ["section-1"],
    contentTypeIds = ["type-1"]
  ) {
    prisma.role.findUnique.mockResolvedValue({
      id: "role-editor",
      name: "Editor",
      functionName: "Editor",
      sectionAccesses: sectionIds.map((sectionId) => ({ sectionId })),
      contentTypeAccesses: contentTypeIds.map((contentTypeId) => ({ contentTypeId }))
    });
  }

  it("allows creating content in an explicitly scoped section", async () => {
    const { prisma, service } = createContentsService();
    mockScopedRole(prisma);
    mockValidRelations(prisma);
    prisma.content.findFirst.mockResolvedValue(null);
    prisma.friendlyUrl.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    prisma.seoMetadata.create.mockResolvedValue({ id: "seo-1" });
    prisma.content.aggregate.mockResolvedValue({ _max: { displayId: 4 } });
    prisma.content.create.mockResolvedValue({
      id: "content-1",
      slug: "noticias",
      sectionId: "section-1",
      status: "draft"
    });
    prisma.contentRevision.create.mockResolvedValue({});
    prisma.friendlyUrl.create.mockResolvedValue({});

    await service.create(scopedUser, validPayload);

    expect(prisma.content.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sectionId: "section-1",
          contentTypeId: "type-1"
        })
      })
    );
  });

  it("rejects creating content outside explicit section scope without side effects", async () => {
    const { prisma, service } = createContentsService();
    mockScopedRole(prisma, ["section-1"]);
    prisma.section.findUnique.mockResolvedValue({ id: "section-2", path: "/fora", isActive: true });
    prisma.contentType.findUnique.mockResolvedValue({ id: "type-1" });

    await expect(
      service.create(scopedUser, {
        ...validPayload,
        sectionId: "section-2"
      })
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.content.create).not.toHaveBeenCalled();
    expect(prisma.seoMetadata.create).not.toHaveBeenCalled();
    expect(prisma.contentRevision.create).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.create).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("rejects updating content when the existing section is outside active role scope", async () => {
    const { prisma, service } = createContentsService();
    mockScopedRole(prisma, ["section-1"]);
    prisma.content.findUnique.mockResolvedValue({
      id: "content-1",
      slug: "noticias",
      status: "draft",
      visibility: "public",
      publishedAt: null,
      validFrom: null,
      validUntil: null,
      validateValidity: false,
      sectionId: "section-2",
      seoId: null
    });

    await expect(service.update("content-1", scopedUser, validPayload)).rejects.toThrow(ForbiddenException);
    expect(prisma.section.findUnique).not.toHaveBeenCalled();
    expect(prisma.contentType.findUnique).not.toHaveBeenCalled();
    expect(prisma.content.update).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.create).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.update).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("rejects moving content from an allowed section to an out-of-scope section", async () => {
    const { prisma, service } = createContentsService();
    mockScopedRole(prisma, ["section-1"]);
    prisma.content.findUnique.mockResolvedValue({
      id: "content-1",
      slug: "noticias",
      status: "draft",
      visibility: "public",
      publishedAt: null,
      validFrom: null,
      validUntil: null,
      validateValidity: false,
      sectionId: "section-1",
      seoId: null
    });
    prisma.section.findUnique.mockResolvedValue({ id: "section-2", path: "/fora", isActive: true });
    prisma.contentType.findUnique.mockResolvedValue({ id: "type-1" });

    await expect(
      service.update("content-1", scopedUser, {
        ...validPayload,
        sectionId: "section-2"
      })
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.content.update).not.toHaveBeenCalled();
    expect(prisma.seoMetadata.create).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.create).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.update).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("does not grant descendant sections from a parent section scope automatically", async () => {
    const { prisma, service } = createContentsService();
    mockScopedRole(prisma, ["parent-section"]);
    prisma.section.findUnique.mockResolvedValue({
      id: "child-section",
      path: "/institucional/filho",
      isActive: true
    });
    prisma.contentType.findUnique.mockResolvedValue({ id: "type-1" });

    await expect(
      service.create(scopedUser, {
        ...validPayload,
        sectionId: "child-section"
      })
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.section.findMany).not.toHaveBeenCalled();
    expect(prisma.content.create).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.create).not.toHaveBeenCalled();
  });

  it("blocks creating published content without contents.publish", async () => {
    const { prisma, service } = createContentsService();
    mockValidRelations(prisma);

    await expect(
      service.create(writerUser, {
        ...validPayload,
        status: "published"
      })
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.content.create).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.create).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("blocks changing draft content to published without contents.publish", async () => {
    const { prisma, service } = createContentsService();
    prisma.content.findUnique.mockResolvedValue({
      id: "content-1",
      slug: "noticias",
      status: "draft",
      visibility: "public",
      publishedAt: null,
      validFrom: null,
      validUntil: null,
      validateValidity: false,
      seoId: null
    });
    mockValidRelations(prisma);

    await expect(
      service.update("content-1", writerUser, {
        ...validPayload,
        status: "published"
      })
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.content.update).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.create).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.update).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("blocks changing publication validity on published content without contents.publish", async () => {
    const { prisma, service } = createContentsService();
    prisma.content.findUnique.mockResolvedValue({
      id: "content-1",
      slug: "noticias",
      status: "published",
      visibility: "public",
      publishedAt: new Date("2026-05-01T00:00:00.000Z"),
      validFrom: null,
      validUntil: null,
      validateValidity: false,
      seoId: null
    });
    mockValidRelations(prisma);

    await expect(
      service.update("content-1", writerUser, {
        ...validPayload,
        validUntil: "2026-06-01T00:00:00.000Z",
        validateValidity: true
      })
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.content.update).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.create).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.update).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("blocks archiving published content without contents.publish", async () => {
    const { prisma, service } = createContentsService();
    prisma.content.findUnique.mockResolvedValue({
      id: "content-1",
      slug: "noticias",
      status: "published",
      visibility: "public",
      publishedAt: new Date("2026-05-01T00:00:00.000Z"),
      validFrom: null,
      validUntil: null,
      validateValidity: false,
      seoId: null
    });
    mockValidRelations(prisma);

    await expect(
      service.update("content-1", writerUser, {
        ...validPayload,
        status: "archived"
      })
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.content.update).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("allows publishing content with contents.publish", async () => {
    const { prisma, service } = createContentsService();
    mockValidRelations(prisma);
    prisma.content.findFirst.mockResolvedValue(null);
    prisma.friendlyUrl.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    prisma.seoMetadata.create.mockResolvedValue({ id: "seo-1" });
    prisma.content.aggregate.mockResolvedValue({ _max: { displayId: 4 } });
    prisma.content.create.mockResolvedValue({
      id: "content-1",
      slug: "noticias",
      sectionId: "section-1",
      status: "published"
    });
    prisma.contentRevision.create.mockResolvedValue({});
    prisma.friendlyUrl.create.mockResolvedValue({});
    prisma.auditLog.create.mockResolvedValue({});

    await service.create(publisherUser, {
      ...validPayload,
      status: "published"
    });

    expect(prisma.content.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "published",
          publishedAt: expect.any(Date)
        })
      })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: "publisher-1",
        action: "content.published",
        entityType: "Content",
        entityId: "content-1",
        metadata: {
          status: { to: "published" }
        }
      }
    });
  });

  it("audits publishing existing content with minimal metadata", async () => {
    const { prisma, service } = createContentsService();
    prisma.content.findUnique.mockResolvedValue({
      id: "content-1",
      slug: "noticias",
      status: "draft",
      visibility: "public",
      publishedAt: null,
      validFrom: null,
      validUntil: null,
      validateValidity: false,
      sectionId: "section-1",
      seoId: null
    });
    mockValidRelations(prisma);
    prisma.content.findFirst.mockResolvedValue(null);
    prisma.friendlyUrl.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    prisma.seoMetadata.create.mockResolvedValue({ id: "seo-1" });
    prisma.content.update.mockResolvedValue({
      id: "content-1",
      slug: "noticias",
      sectionId: "section-1",
      status: "published",
      validFrom: null,
      validUntil: null,
      validateValidity: false
    });
    prisma.friendlyUrl.create.mockResolvedValue({});
    prisma.contentRevision.create.mockResolvedValue({});
    prisma.auditLog.create.mockResolvedValue({});

    await service.update("content-1", publisherUser, {
      ...validPayload,
      status: "published"
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: "publisher-1",
        action: "content.published",
        entityType: "Content",
        entityId: "content-1",
        metadata: {
          status: { from: "draft", to: "published" }
        }
      })
    });
  });

  it("audits archiving published content", async () => {
    const { prisma, service } = createContentsService();
    prisma.content.findUnique.mockResolvedValue({
      id: "content-1",
      slug: "noticias",
      status: "published",
      visibility: "public",
      publishedAt: new Date("2026-05-01T00:00:00.000Z"),
      validFrom: null,
      validUntil: null,
      validateValidity: false,
      sectionId: "section-1",
      seoId: null
    });
    mockValidRelations(prisma);
    prisma.content.findFirst.mockResolvedValue(null);
    prisma.friendlyUrl.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    prisma.seoMetadata.create.mockResolvedValue({ id: "seo-1" });
    prisma.content.update.mockResolvedValue({
      id: "content-1",
      slug: "noticias",
      sectionId: "section-1",
      status: "archived",
      validFrom: null,
      validUntil: null,
      validateValidity: false
    });
    prisma.friendlyUrl.create.mockResolvedValue({});
    prisma.contentRevision.create.mockResolvedValue({});
    prisma.auditLog.create.mockResolvedValue({});

    await service.update("content-1", publisherUser, {
      ...validPayload,
      status: "archived"
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "content.archived",
        metadata: {
          status: { from: "published", to: "archived" }
        }
      })
    });
  });

  it("audits publication validity changes without storing body content", async () => {
    const { prisma, service } = createContentsService();
    prisma.content.findUnique.mockResolvedValue({
      id: "content-1",
      slug: "noticias",
      status: "published",
      visibility: "public",
      publishedAt: new Date("2026-05-01T00:00:00.000Z"),
      validFrom: null,
      validUntil: null,
      validateValidity: false,
      sectionId: "section-1",
      seoId: null
    });
    mockValidRelations(prisma);
    prisma.content.findFirst.mockResolvedValue(null);
    prisma.friendlyUrl.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    prisma.seoMetadata.create.mockResolvedValue({ id: "seo-1" });
    prisma.content.update.mockResolvedValue({
      id: "content-1",
      slug: "noticias",
      sectionId: "section-1",
      status: "published",
      validFrom: null,
      validUntil: "2026-06-01T00:00:00.000Z",
      validateValidity: true
    });
    prisma.friendlyUrl.create.mockResolvedValue({});
    prisma.contentRevision.create.mockResolvedValue({});
    prisma.auditLog.create.mockResolvedValue({});

    await service.update("content-1", publisherUser, {
      ...validPayload,
      body: "<p>segredo token=abc</p>",
      validUntil: "2026-06-01T00:00:00.000Z",
      validateValidity: true
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "content.validity_changed",
        metadata: {
          validFrom: { from: null, to: null },
          validUntil: { from: null, to: "2026-06-01T00:00:00.000Z" },
          validateValidity: { from: false, to: true }
        }
      })
    });
    expect(JSON.stringify(prisma.auditLog.create.mock.calls)).not.toContain("segredo");
    expect(JSON.stringify(prisma.auditLog.create.mock.calls)).not.toContain("<p>");
  });

  it("audits slug and friendly URL changes", async () => {
    const { prisma, service } = createContentsService();
    prisma.content.findUnique.mockResolvedValue({
      id: "content-1",
      slug: "noticias",
      status: "draft",
      visibility: "public",
      publishedAt: null,
      validFrom: null,
      validUntil: null,
      validateValidity: false,
      sectionId: "section-1",
      seoId: null
    });
    mockValidRelations(prisma);
    prisma.content.findFirst.mockResolvedValue(null);
    prisma.friendlyUrl.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    prisma.seoMetadata.create.mockResolvedValue({ id: "seo-1" });
    prisma.content.update.mockResolvedValue({
      id: "content-1",
      slug: "nova-url",
      sectionId: "section-1",
      status: "draft",
      validFrom: null,
      validUntil: null,
      validateValidity: false
    });
    prisma.friendlyUrl.create.mockResolvedValue({});
    prisma.contentRevision.create.mockResolvedValue({});
    prisma.auditLog.create.mockResolvedValue({});

    await service.update("content-1", writerUser, {
      ...validPayload,
      slug: "Nova URL"
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "content.url_changed",
        metadata: {
          path: { from: "/noticias", to: "/nova-url" }
        }
      })
    });
  });

  it("audits primary section changes", async () => {
    const { prisma, service } = createContentsService();
    prisma.content.findUnique.mockResolvedValue({
      id: "content-1",
      slug: "noticias",
      status: "draft",
      visibility: "public",
      publishedAt: null,
      validFrom: null,
      validUntil: null,
      validateValidity: false,
      sectionId: "section-1",
      seoId: null
    });
    prisma.section.findUnique.mockResolvedValue({ id: "section-2", path: "/nova-secao", isActive: true });
    prisma.contentType.findUnique.mockResolvedValue({ id: "type-1" });
    prisma.content.findFirst.mockResolvedValue(null);
    prisma.friendlyUrl.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    prisma.seoMetadata.create.mockResolvedValue({ id: "seo-1" });
    prisma.content.update.mockResolvedValue({
      id: "content-1",
      slug: "noticias",
      sectionId: "section-2",
      status: "draft",
      validFrom: null,
      validUntil: null,
      validateValidity: false
    });
    prisma.friendlyUrl.create.mockResolvedValue({});
    prisma.contentRevision.create.mockResolvedValue({});
    prisma.auditLog.create.mockResolvedValue({});

    await service.update("content-1", writerUser, {
      ...validPayload,
      sectionId: "section-2"
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "content.primary_section_changed",
        metadata: {
          sectionId: { from: "section-1", to: "section-2" }
        }
      })
    });
  });

  it("rejects creating content in an inactive primary section", async () => {
    const { prisma, service } = createContentsService();
    prisma.section.findUnique.mockResolvedValue({ id: "section-1", path: "/editorial", isActive: false });
    prisma.contentType.findUnique.mockResolvedValue({ id: "type-1" });

    await expect(service.create(user, validPayload)).rejects.toThrow(BadRequestException);
    expect(prisma.content.create).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.create).not.toHaveBeenCalled();
  });

  it("rejects updating content in an inactive primary section", async () => {
    const { prisma, service } = createContentsService();
    prisma.content.findUnique.mockResolvedValue({
      id: "content-1",
      slug: "noticias",
      status: "draft",
      visibility: "public",
      publishedAt: null,
      seoId: null
    });
    prisma.section.findUnique.mockResolvedValue({ id: "section-1", path: "/editorial", isActive: false });
    prisma.contentType.findUnique.mockResolvedValue({ id: "type-1" });

    await expect(service.update("content-1", user, validPayload)).rejects.toThrow(BadRequestException);
    expect(prisma.content.update).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.create).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.update).not.toHaveBeenCalled();
  });

  it("does not grant editorial create access from public section accessPolicy without RoleSectionAccess", async () => {
    const { prisma, service } = createContentsService();
    mockScopedRole(prisma, [], ["type-1"]);
    prisma.section.findUnique.mockResolvedValue({
      id: "section-public",
      path: "/publica",
      isActive: true,
      accessPolicy: "public"
    });
    prisma.contentType.findUnique.mockResolvedValue({ id: "type-1" });

    await expect(
      service.create(scopedUser, {
        ...validPayload,
        sectionId: "section-public"
      })
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.content.create).not.toHaveBeenCalled();
    expect(prisma.seoMetadata.create).not.toHaveBeenCalled();
    expect(prisma.contentRevision.create).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.create).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("still requires contents.publish when an in-scope user creates published content", async () => {
    const { prisma, service } = createContentsService();
    mockScopedRole(prisma, ["section-1"], ["type-1"]);
    mockValidRelations(prisma);

    await expect(
      service.create(scopedUser, {
        ...validPayload,
        status: "published"
      })
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.content.create).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.create).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("rejects creating content when the normalized slug already exists as another friendly URL", async () => {
    const { prisma, service } = createContentsService();
    mockValidRelations(prisma);
    prisma.content.findFirst.mockResolvedValue(null);
    prisma.friendlyUrl.findFirst.mockResolvedValue({
      id: "url-1",
      path: "/noticias",
      targetType: "section",
      sectionId: "section-2"
    });

    await expect(service.create(user, validPayload)).rejects.toThrow(ConflictException);
    expect(prisma.friendlyUrl.findFirst).toHaveBeenCalledWith({
      where: {
        path: "/noticias"
      }
    });
    expect(prisma.content.create).not.toHaveBeenCalled();
  });

  it("rejects updating content when the normalized slug belongs to another target", async () => {
    const { prisma, service } = createContentsService();
    prisma.content.findUnique.mockResolvedValue({
      id: "content-1",
      slug: "antigo",
      status: "draft",
      visibility: "public",
      publishedAt: null,
      seoId: null
    });
    mockValidRelations(prisma);
    prisma.content.findFirst.mockResolvedValue(null);
    prisma.friendlyUrl.findFirst.mockResolvedValue({
      id: "url-1",
      path: "/noticias",
      targetType: "section",
      sectionId: "section-2"
    });

    await expect(service.update("content-1", user, validPayload)).rejects.toThrow(ConflictException);
    expect(prisma.content.update).not.toHaveBeenCalled();
  });

  it("registers a content friendly URL when creating content", async () => {
    const { prisma, service } = createContentsService();
    mockValidRelations(prisma);
    prisma.content.findFirst.mockResolvedValue(null);
    prisma.friendlyUrl.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    prisma.seoMetadata.create.mockResolvedValue({ id: "seo-1" });
    prisma.content.aggregate.mockResolvedValue({ _max: { displayId: 4 } });
    prisma.content.create.mockResolvedValue({
      id: "content-1",
      slug: "noticias",
      sectionId: "section-1"
    });
    prisma.contentRevision.create.mockResolvedValue({});
    prisma.friendlyUrl.create.mockResolvedValue({});

    await service.create(user, validPayload);

    expect(prisma.friendlyUrl.create).toHaveBeenCalledWith({
      data: {
        path: "/noticias",
        targetType: "content",
        contentId: "content-1",
        primarySectionId: "section-1",
        isActive: true
      }
    });
  });

  it("allows updating the same content target without blocking its own friendly URL", async () => {
    const { prisma, service } = createContentsService();
    prisma.content.findUnique.mockResolvedValue({
      id: "content-1",
      slug: "noticias",
      status: "draft",
      visibility: "public",
      publishedAt: null,
      seoId: null
    });
    mockValidRelations(prisma);
    prisma.content.findFirst.mockResolvedValue(null);
    prisma.friendlyUrl.findFirst
      .mockResolvedValueOnce({
        id: "url-1",
        path: "/noticias",
        targetType: "content",
        contentId: "content-1"
      })
      .mockResolvedValueOnce({
        id: "url-1",
        path: "/noticias",
        targetType: "content",
        contentId: "content-1"
      });
    prisma.seoMetadata.create.mockResolvedValue({ id: "seo-1" });
    prisma.content.update.mockResolvedValue({
      id: "content-1",
      slug: "noticias",
      sectionId: "section-1"
    });
    prisma.friendlyUrl.update.mockResolvedValue({});
    prisma.contentRevision.create.mockResolvedValue({});

    await service.update("content-1", user, validPayload);

    expect(prisma.friendlyUrl.update).toHaveBeenCalledWith({
      where: { id: "url-1" },
      data: {
        path: "/noticias",
        primarySectionId: "section-1",
        isActive: true
      }
    });
  });
});

describe("ContentsService editorial scope listings", () => {
  const scopedUser = {
    sub: "scoped-1",
    permissions: ["contents.read"],
    roleId: "role-editor"
  } as never;
  const emptyScopeUser = {
    sub: "empty-1",
    permissions: ["contents.read"],
    roleId: "role-empty"
  } as never;
  const adminUser = {
    sub: "admin-1",
    permissions: ["contents.read"],
    roleId: "role-admin"
  } as never;

  function mockRoleScope(
    prisma: ReturnType<typeof createContentsService>["prisma"],
    input: {
      name?: string;
      functionName?: string;
      sectionIds?: string[];
      contentTypeIds?: string[];
    }
  ) {
    prisma.role.findUnique.mockResolvedValue({
      id: "role-1",
      name: input.name ?? "Editor",
      functionName: input.functionName ?? "Editor",
      sectionAccesses: (input.sectionIds ?? []).map((sectionId) => ({ sectionId })),
      contentTypeAccesses: (input.contentTypeIds ?? []).map((contentTypeId) => ({ contentTypeId }))
    });
  }

  it("filters admin content list by active role sections and content types", async () => {
    const { prisma, service } = createContentsService();
    mockRoleScope(prisma, {
      sectionIds: ["section-1", "section-2"],
      contentTypeIds: ["type-1"]
    });
    prisma.content.findMany.mockResolvedValue([]);

    await service.listAdmin(scopedUser);

    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          sectionId: { in: ["section-1", "section-2"] },
          contentTypeId: { in: ["type-1"] }
        }
      })
    );
  });

  it("keeps empty normal role scope as an empty admin content result filter", async () => {
    const { prisma, service } = createContentsService();
    mockRoleScope(prisma, {
      sectionIds: [],
      contentTypeIds: []
    });
    prisma.content.findMany.mockResolvedValue([]);

    await service.listAdmin(emptyScopeUser);

    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          sectionId: { in: [] },
          contentTypeId: { in: [] }
        }
      })
    );
  });

  it("keeps explicit administrator roles unrestricted in admin content list", async () => {
    const { prisma, service } = createContentsService();
    mockRoleScope(prisma, {
      name: "Administrador",
      functionName: "Administrador",
      sectionIds: [],
      contentTypeIds: []
    });
    prisma.content.findMany.mockResolvedValue([]);

    await service.listAdmin(adminUser);

    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {}
      })
    );
  });

  it("filters editor metadata sections and content types by active role scope", async () => {
    const { prisma, service } = createContentsService();
    mockRoleScope(prisma, {
      sectionIds: ["section-1"],
      contentTypeIds: ["type-1"]
    });
    prisma.section.findMany.mockResolvedValue([]);
    prisma.template.findMany.mockResolvedValue([]);
    prisma.contentType.findMany.mockResolvedValue([]);

    await service.getEditorMeta(scopedUser);

    expect(prisma.section.findMany).toHaveBeenCalledWith({
      where: {
        isActive: true,
        id: { in: ["section-1"] }
      },
      orderBy: [{ path: "asc" }]
    });
    expect(prisma.contentType.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["type-1"] } },
      orderBy: [{ name: "asc" }]
    });
  });

  it("keeps empty normal role scope out of editor metadata sections and content types", async () => {
    const { prisma, service } = createContentsService();
    mockRoleScope(prisma, {
      sectionIds: [],
      contentTypeIds: []
    });
    prisma.section.findMany.mockResolvedValue([]);
    prisma.template.findMany.mockResolvedValue([]);
    prisma.contentType.findMany.mockResolvedValue([]);

    await service.getEditorMeta(emptyScopeUser);

    expect(prisma.section.findMany).toHaveBeenCalledWith({
      where: {
        isActive: true,
        id: { in: [] }
      },
      orderBy: [{ path: "asc" }]
    });
    expect(prisma.contentType.findMany).toHaveBeenCalledWith({
      where: { id: { in: [] } },
      orderBy: [{ name: "asc" }]
    });
  });

  it("keeps explicit administrator roles unrestricted in editor metadata", async () => {
    const { prisma, service } = createContentsService();
    mockRoleScope(prisma, {
      name: "Administrador",
      functionName: "Administrador",
      sectionIds: [],
      contentTypeIds: []
    });
    prisma.section.findMany.mockResolvedValue([]);
    prisma.template.findMany.mockResolvedValue([]);
    prisma.contentType.findMany.mockResolvedValue([]);

    await service.getEditorMeta(adminUser);

    expect(prisma.section.findMany).toHaveBeenCalledWith({
      where: {
        isActive: true
      },
      orderBy: [{ path: "asc" }]
    });
    expect(prisma.contentType.findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: [{ name: "asc" }]
    });
  });
});
