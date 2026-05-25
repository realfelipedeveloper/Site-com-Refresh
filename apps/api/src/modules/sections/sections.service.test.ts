import { BadRequestException, ConflictException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { SectionsService } from "./sections.service";

function createSectionsService() {
  const prisma = {
    auditLog: {
      create: vi.fn()
    },
    friendlyUrl: {
      create: vi.fn(),
      findFirst: vi.fn(),
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
    prisma.friendlyUrl.findFirst.mockResolvedValue({
      id: "url-1",
      path: "/noticias",
      targetType: "content",
      contentId: "content-1"
    });

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
