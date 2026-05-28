import { BadRequestException, ConflictException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { SectionsService } from "./sections.service";

function createSectionsService() {
  const prisma = {
    auditLog: {
      create: vi.fn()
    },
    $transaction: vi.fn(),
    friendlyUrl: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn()
    },
    section: {
      aggregate: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    }
  };
  prisma.$transaction.mockImplementation(async (callback) => callback(prisma));
  prisma.section.findMany.mockResolvedValue([]);
  prisma.friendlyUrl.findMany.mockResolvedValue([]);

  return {
    prisma,
    service: new SectionsService(prisma as never)
  };
}

describe("SectionsService friendly URL policy", () => {
  it("rejects creating a section when its path already exists as a friendly URL", async () => {
    const { prisma, service } = createSectionsService();
    prisma.section.findFirst.mockResolvedValue(null);
    prisma.friendlyUrl.findFirst.mockResolvedValue({
      id: "url-1",
      path: "/institucional",
      targetType: "content",
      contentId: "content-1"
    });

    await expect(service.create({ name: "Institucional" })).rejects.toThrow(ConflictException);
    expect(prisma.friendlyUrl.findFirst).toHaveBeenCalledWith({
      where: {
        path: "/institucional"
      }
    });
    expect(prisma.section.create).not.toHaveBeenCalled();
  });

  it("rejects updating a section when its path belongs to another friendly URL target", async () => {
    const { prisma, service } = createSectionsService();
    prisma.section.findUnique.mockResolvedValue({
      id: "section-1",
      name: "Antiga",
      slug: "antiga",
      path: "/antiga",
      parentId: null,
      order: 1,
      visibleInMenu: true,
      isActive: true
    });
    prisma.section.findFirst.mockResolvedValue(null);
    prisma.friendlyUrl.findMany.mockResolvedValue([
      {
        id: "url-1",
        path: "/noticias",
        targetType: "content",
        contentId: "content-1"
      }
    ]);

    await expect(service.update("section-1", { name: "Notícias", slug: "noticias" })).rejects.toThrow(
      ConflictException
    );
    expect(prisma.section.update).not.toHaveBeenCalled();
  });

  it("registers a section friendly URL when creating a section", async () => {
    const { prisma, service } = createSectionsService();
    prisma.section.findFirst.mockResolvedValue(null);
    prisma.friendlyUrl.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    prisma.section.aggregate.mockResolvedValue({ _max: { displayId: 8 } });
    prisma.section.create.mockResolvedValue({
      id: "section-1",
      name: "Institucional",
      slug: "institucional",
      path: "/institucional"
    });
    prisma.friendlyUrl.create.mockResolvedValue({});

    await service.create({ name: "Institucional" });

    expect(prisma.friendlyUrl.create).toHaveBeenCalledWith({
      data: {
        path: "/institucional",
        targetType: "section",
        sectionId: "section-1",
        isActive: true
      }
    });
  });

  it("allows updating the same section target without blocking its own friendly URL", async () => {
    const { prisma, service } = createSectionsService();
    prisma.section.findUnique.mockResolvedValue({
      id: "section-1",
      name: "Institucional",
      slug: "institucional",
      path: "/institucional",
      parentId: null,
      order: 1,
      visibleInMenu: true,
      isActive: true
    });
    prisma.section.findFirst.mockResolvedValue(null);
    prisma.section.findMany.mockResolvedValue([]);
    prisma.section.update.mockResolvedValue({
      id: "section-1",
      name: "Institucional",
      slug: "institucional",
      path: "/institucional"
    });
    prisma.friendlyUrl.findFirst
      .mockResolvedValueOnce({
        id: "url-1",
        path: "/institucional",
        targetType: "section",
        sectionId: "section-1"
      })
      .mockResolvedValueOnce({
        id: "url-1",
        path: "/institucional",
        targetType: "section",
        sectionId: "section-1"
      });
    prisma.friendlyUrl.update.mockResolvedValue({});

    await service.update("section-1", { name: "Institucional" });

    expect(prisma.friendlyUrl.update).toHaveBeenCalledWith({
      where: { id: "url-1" },
      data: {
        path: "/institucional",
        isActive: true
      }
    });
  });

  it("audits accessPolicy changes with minimal metadata", async () => {
    const { prisma, service } = createSectionsService();
    prisma.section.findUnique.mockResolvedValue({
      id: "section-1",
      name: "Institucional",
      slug: "institucional",
      path: "/institucional",
      parentId: null,
      order: 1,
      visibleInMenu: true,
      isActive: true,
      accessPolicy: "public"
    });
    prisma.section.findFirst.mockResolvedValue(null);
    prisma.section.findMany.mockResolvedValue([]);
    prisma.section.update.mockResolvedValue({
      id: "section-1",
      name: "Institucional",
      slug: "institucional",
      path: "/institucional",
      accessPolicy: "restricted_hidden"
    });
    prisma.friendlyUrl.findFirst
      .mockResolvedValueOnce({
        id: "url-1",
        path: "/institucional",
        targetType: "section",
        sectionId: "section-1"
      })
      .mockResolvedValueOnce({
        id: "url-1",
        path: "/institucional",
        targetType: "section",
        sectionId: "section-1"
      });
    prisma.friendlyUrl.update.mockResolvedValue({});
    prisma.auditLog.create.mockResolvedValue({});

    await service.update("section-1", {
      name: "Institucional",
      accessPolicy: "restricted_hidden"
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: "section.access_policy_changed",
        entityType: "Section",
        entityId: "section-1",
        metadata: {
          accessPolicy: {
            from: "public",
            to: "restricted_hidden"
          }
        }
      }
    });
    expect(JSON.stringify(prisma.auditLog.create.mock.calls)).not.toContain("description");
  });

  it("normalizes accents, spaces and punctuation before checking friendly URL collisions", async () => {
    const { prisma, service } = createSectionsService();
    prisma.section.findFirst.mockResolvedValue(null);
    prisma.friendlyUrl.findFirst.mockResolvedValue({
      id: "url-1",
      path: "/area-noticias",
      targetType: "content",
      contentId: "content-1"
    });

    await expect(service.create({ name: "Área & Notícias!" })).rejects.toThrow(ConflictException);
    expect(prisma.friendlyUrl.findFirst).toHaveBeenCalledWith({
      where: {
        path: "/area-noticias"
      }
    });
  });
});

describe("SectionsService hierarchy integrity", () => {
  it("rejects updating a section to use itself as parent", async () => {
    const { prisma, service } = createSectionsService();
    prisma.section.findUnique.mockResolvedValue({
      id: "section-1",
      name: "Institucional",
      slug: "institucional",
      path: "/institucional",
      parentId: null,
      order: 1,
      visibleInMenu: true,
      isActive: true
    });

    await expect(
      service.update("section-1", {
        name: "Institucional",
        parentId: "section-1"
      })
    ).rejects.toThrow(BadRequestException);
    expect(prisma.section.update).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.findFirst).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.create).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.update).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("rejects moving a section under its direct child", async () => {
    const { prisma, service } = createSectionsService();
    prisma.section.findUnique
      .mockResolvedValueOnce({
        id: "parent",
        name: "Institucional",
        slug: "institucional",
        path: "/institucional",
        parentId: null,
        order: 1,
        visibleInMenu: true,
        isActive: true
      })
      .mockResolvedValueOnce({
        id: "child",
        name: "Sobre",
        slug: "sobre",
        path: "/institucional/sobre",
        parentId: "parent",
        order: 1,
        visibleInMenu: true,
        isActive: true
      });

    await expect(
      service.update("parent", {
        name: "Institucional",
        parentId: "child"
      })
    ).rejects.toThrow(BadRequestException);
    expect(prisma.section.update).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.findFirst).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.create).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.update).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("rejects moving a section under a deep descendant", async () => {
    const { prisma, service } = createSectionsService();
    prisma.section.findUnique
      .mockResolvedValueOnce({
        id: "root",
        name: "Institucional",
        slug: "institucional",
        path: "/institucional",
        parentId: null,
        order: 1,
        visibleInMenu: true,
        isActive: true
      })
      .mockResolvedValueOnce({
        id: "grandchild",
        name: "Equipe",
        slug: "equipe",
        path: "/institucional/sobre/equipe",
        parentId: "child",
        order: 1,
        visibleInMenu: true,
        isActive: true
      });

    await expect(
      service.update("root", {
        name: "Institucional",
        parentId: "grandchild"
      })
    ).rejects.toThrow(BadRequestException);
    expect(prisma.section.update).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.findFirst).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.create).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.update).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });
});

describe("SectionsService descendant path propagation", () => {
  it("updates descendant paths and friendly URLs when renaming an ancestor", async () => {
    const { prisma, service } = createSectionsService();
    prisma.section.findUnique.mockResolvedValue({
      id: "root",
      name: "Institucional",
      slug: "institucional",
      path: "/institucional",
      parentId: null,
      order: 1,
      visibleInMenu: true,
      isActive: true,
      accessPolicy: "public"
    });
    prisma.section.findFirst.mockResolvedValue(null);
    prisma.section.findMany
      .mockResolvedValueOnce([
        {
          id: "child",
          name: "Sobre",
          slug: "sobre",
          path: "/institucional/sobre",
          parentId: "root",
          order: 1,
          visibleInMenu: true,
          isActive: true,
          accessPolicy: "public"
        }
      ])
      .mockResolvedValueOnce([]);
    prisma.section.update
      .mockResolvedValueOnce({
        id: "root",
        name: "Institucional Novo",
        slug: "institucional-novo",
        path: "/institucional-novo",
        accessPolicy: "public"
      })
      .mockResolvedValueOnce({
        id: "child",
        name: "Sobre",
        slug: "sobre",
        path: "/institucional-novo/sobre",
        accessPolicy: "public"
      });
    prisma.friendlyUrl.findFirst
      .mockResolvedValueOnce({
        id: "root-url",
        path: "/institucional",
        targetType: "section",
        sectionId: "root"
      })
      .mockResolvedValueOnce({
        id: "child-url",
        path: "/institucional/sobre",
        targetType: "section",
        sectionId: "child"
      });
    prisma.friendlyUrl.update.mockResolvedValue({});

    await service.update("root", {
      name: "Institucional Novo",
      slug: "institucional-novo"
    });

    expect(prisma.section.update).toHaveBeenNthCalledWith(1, {
      where: { id: "root" },
      data: expect.objectContaining({
        path: "/institucional-novo",
        slug: "institucional-novo"
      })
    });
    expect(prisma.section.update).toHaveBeenNthCalledWith(2, {
      where: { id: "child" },
      data: {
        path: "/institucional-novo/sobre"
      }
    });
    expect(prisma.friendlyUrl.update).toHaveBeenCalledWith({
      where: { id: "child-url" },
      data: {
        path: "/institucional-novo/sobre",
        isActive: true
      }
    });
  });

  it("updates descendant paths when moving an ancestor under a new parent", async () => {
    const { prisma, service } = createSectionsService();
    prisma.section.findUnique
      .mockResolvedValueOnce({
        id: "root",
        name: "Institucional",
        slug: "institucional",
        path: "/institucional",
        parentId: null,
        order: 1,
        visibleInMenu: true,
        isActive: true,
        accessPolicy: "public"
      })
      .mockResolvedValueOnce({
        id: "portal",
        name: "Portal",
        slug: "portal",
        path: "/portal",
        parentId: null,
        order: 1,
        visibleInMenu: true,
        isActive: true,
        accessPolicy: "public"
      });
    prisma.section.findFirst.mockResolvedValue(null);
    prisma.section.findMany
      .mockResolvedValueOnce([
        {
          id: "child",
          name: "Sobre",
          slug: "sobre",
          path: "/institucional/sobre",
          parentId: "root",
          order: 1,
          visibleInMenu: true,
          isActive: true,
          accessPolicy: "public"
        }
      ])
      .mockResolvedValueOnce([]);
    prisma.section.update
      .mockResolvedValueOnce({
        id: "root",
        name: "Institucional",
        slug: "institucional",
        path: "/portal/institucional",
        accessPolicy: "public"
      })
      .mockResolvedValueOnce({
        id: "child",
        name: "Sobre",
        slug: "sobre",
        path: "/portal/institucional/sobre",
        accessPolicy: "public"
      });
    prisma.friendlyUrl.findFirst
      .mockResolvedValueOnce({
        id: "root-url",
        path: "/institucional",
        targetType: "section",
        sectionId: "root"
      })
      .mockResolvedValueOnce({
        id: "child-url",
        path: "/institucional/sobre",
        targetType: "section",
        sectionId: "child"
      });
    prisma.friendlyUrl.update.mockResolvedValue({});

    await service.update("root", {
      name: "Institucional",
      parentId: "portal"
    });

    expect(prisma.section.update).toHaveBeenNthCalledWith(1, {
      where: { id: "root" },
      data: expect.objectContaining({
        parentId: "portal",
        path: "/portal/institucional"
      })
    });
    expect(prisma.section.update).toHaveBeenNthCalledWith(2, {
      where: { id: "child" },
      data: {
        path: "/portal/institucional/sobre"
      }
    });
  });

  it("rejects descendant path collisions before persisting partial changes", async () => {
    const { prisma, service } = createSectionsService();
    prisma.section.findUnique.mockResolvedValue({
      id: "root",
      name: "Institucional",
      slug: "institucional",
      path: "/institucional",
      parentId: null,
      order: 1,
      visibleInMenu: true,
      isActive: true,
      accessPolicy: "public"
    });
    prisma.section.findFirst.mockResolvedValue(null);
    prisma.section.findMany
      .mockResolvedValueOnce([
        {
          id: "child",
          name: "Sobre",
          slug: "sobre",
          path: "/institucional/sobre",
          parentId: "root",
          order: 1,
          visibleInMenu: true,
          isActive: true,
          accessPolicy: "public"
        }
      ])
      .mockResolvedValueOnce([
        {
          id: "other-section",
          path: "/institucional-novo/sobre"
        }
      ]);
    prisma.friendlyUrl.findFirst.mockResolvedValue({
      id: "root-url",
      path: "/institucional",
      targetType: "section",
      sectionId: "root"
    });

    await expect(
      service.update("root", {
        name: "Institucional Novo",
        slug: "institucional-novo"
      })
    ).rejects.toThrow(ConflictException);
    expect(prisma.section.update).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.create).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.update).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("rejects descendant FriendlyUrl collisions before persisting partial changes", async () => {
    const { prisma, service } = createSectionsService();
    prisma.section.findUnique.mockResolvedValue({
      id: "root",
      name: "Institucional",
      slug: "institucional",
      path: "/institucional",
      parentId: null,
      order: 1,
      visibleInMenu: true,
      isActive: true,
      accessPolicy: "public"
    });
    prisma.section.findFirst.mockResolvedValue(null);
    prisma.section.findMany
      .mockResolvedValueOnce([
        {
          id: "child",
          name: "Sobre",
          slug: "sobre",
          path: "/institucional/sobre",
          parentId: "root",
          order: 1,
          visibleInMenu: true,
          isActive: true,
          accessPolicy: "public"
        }
      ])
      .mockResolvedValueOnce([]);
    prisma.friendlyUrl.findFirst.mockResolvedValue({
      id: "root-url",
      path: "/institucional",
      targetType: "section",
      sectionId: "root"
    });
    prisma.friendlyUrl.findMany.mockResolvedValue([
      {
        id: "content-url",
        path: "/institucional-novo/sobre",
        targetType: "content",
        contentId: "content-1"
      }
    ]);

    await expect(
      service.update("root", {
        name: "Institucional Novo",
        slug: "institucional-novo"
      })
    ).rejects.toThrow(ConflictException);
    expect(prisma.section.update).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.create).not.toHaveBeenCalled();
    expect(prisma.friendlyUrl.update).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });
});

describe("SectionsService admin listing", () => {
  it("returns coherent hierarchical paths ordered by path for admin listings", async () => {
    const { prisma, service } = createSectionsService();
    const sections = [
      {
        id: "root",
        name: "Institucional",
        slug: "institucional",
        path: "/portal/institucional",
        parent: { id: "portal", path: "/portal" },
        _count: { children: 1, contents: 0 }
      },
      {
        id: "child",
        name: "Sobre",
        slug: "sobre",
        path: "/portal/institucional/sobre",
        parent: { id: "root", path: "/portal/institucional" },
        _count: { children: 0, contents: 0 }
      }
    ];
    prisma.section.findMany.mockResolvedValue(sections);

    const result = await service.listAdmin();

    expect(prisma.section.findMany).toHaveBeenCalledWith({
      include: {
        parent: true,
        _count: {
          select: {
            children: true,
            contents: true
          }
        }
      },
      orderBy: [{ path: "asc" }]
    });
    expect(result.map((section) => section.path)).toEqual([
      "/portal/institucional",
      "/portal/institucional/sobre"
    ]);
  });
});

type MenuSection = {
  id: string;
  name: string;
  slug: string;
  path: string;
  order: number;
  visibleInMenu: boolean;
  isActive: boolean;
  accessPolicy?: "public" | "restricted_visible" | "restricted_hidden";
  children: MenuSection[];
};

function menuSection(overrides: Partial<MenuSection>): MenuSection {
  const id = overrides.id ?? "section-1";

  return {
    id,
    name: overrides.name ?? id,
    slug: overrides.slug ?? id,
    path: overrides.path ?? `/${id}`,
    order: overrides.order ?? 0,
    visibleInMenu: overrides.visibleInMenu ?? true,
    isActive: overrides.isActive ?? true,
    accessPolicy: overrides.accessPolicy ?? "public",
    children: overrides.children ?? []
  };
}

describe("SectionsService public menu policy", () => {
  it("keeps public menu filtering in the backend after hierarchy propagation changes", async () => {
    const { prisma, service } = createSectionsService();
    prisma.section.findMany.mockResolvedValue([]);

    await service.listTree();

    expect(prisma.section.findMany).toHaveBeenCalledWith({
      where: {
        isActive: true,
        visibleInMenu: true,
        accessPolicy: { in: ["public", "restricted_visible"] }
      },
      orderBy: [{ order: "asc" }, { name: "asc" }]
    });
  });

  it("does not return inactive or hidden root sections in the public menu", async () => {
    const { prisma, service } = createSectionsService();
    prisma.section.findMany.mockResolvedValue([
      menuSection({ id: "active-root", order: 2 }),
      menuSection({ id: "inactive-root", isActive: false, order: 1 }),
      menuSection({ id: "hidden-root", visibleInMenu: false, order: 3 })
    ]);

    const result = await service.listTree();

    expect(result.map((section) => section.id)).toEqual(["active-root"]);
  });

  it("does not return inactive or hidden child sections in the public menu", async () => {
    const { prisma, service } = createSectionsService();
    prisma.section.findMany.mockResolvedValue([
      menuSection({
        id: "root",
        children: [
          menuSection({ id: "visible-child", order: 2 }),
          menuSection({ id: "inactive-child", isActive: false, order: 1 }),
          menuSection({ id: "hidden-child", visibleInMenu: false, order: 3 })
        ]
      })
    ]);

    const result = await service.listTree();

    expect(result[0]?.children?.map((section) => section.id)).toEqual(["visible-child"]);
  });

  it("preserves recursive hierarchy and orders sibling sections by order", async () => {
    const { prisma, service } = createSectionsService();
    prisma.section.findMany.mockResolvedValue([
      menuSection({
        id: "root-b",
        order: 20,
        children: [
          menuSection({ id: "child-b", order: 20 }),
          menuSection({
            id: "child-a",
            order: 10,
            children: [menuSection({ id: "grandchild", order: 1 })]
          })
        ]
      }),
      menuSection({ id: "root-a", order: 10 })
    ]);

    const result = await service.listTree();
    const tree = result as unknown as MenuSection[];

    expect(tree.map((section) => section.id)).toEqual(["root-a", "root-b"]);
    expect(tree[1]?.children.map((section) => section.id)).toEqual(["child-a", "child-b"]);
    expect(tree[1]?.children[0]?.children.map((section) => section.id)).toEqual(["grandchild"]);
  });

  it("returns public and restricted_visible sections but hides restricted_hidden sections", async () => {
    const { prisma, service } = createSectionsService();
    prisma.section.findMany.mockResolvedValue([
      menuSection({ id: "public-section", accessPolicy: "public", order: 1 }),
      menuSection({ id: "restricted-visible-section", accessPolicy: "restricted_visible", order: 2 }),
      menuSection({ id: "restricted-hidden-section", accessPolicy: "restricted_hidden", order: 3 })
    ]);

    const result = await service.listTree();

    expect(result.map((section) => section.id)).toEqual(["public-section", "restricted-visible-section"]);
  });

  it("preserves canonical navigation fields without relying on Portal layout", async () => {
    const { prisma, service } = createSectionsService();
    prisma.section.findMany.mockResolvedValue([
      menuSection({
        id: "root",
        path: "/institucional",
        children: [menuSection({ id: "child", path: "/institucional/sobre" })]
      })
    ]);

    const result = await service.listTree();

    expect(result[0]).toMatchObject({
      id: "root",
      path: "/institucional"
    });
    expect(result[0]?.children?.[0]).toMatchObject({
      id: "child",
      path: "/institucional/sobre"
    });
  });
});
