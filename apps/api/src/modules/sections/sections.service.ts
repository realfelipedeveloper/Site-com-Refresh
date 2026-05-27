import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma.service";
import { normalizeFriendlyPath, toFriendlySlug } from "../friendly-urls/friendly-url.utils";

type SectionAccessPolicy =
  | "public"
  | "restricted_visible"
  | "restricted_hidden";

type UpsertSectionInput = {
  name: string;
  slug?: string;
  description?: string;
  order?: number;
  visibleInMenu?: boolean;
  isActive?: boolean;
  accessPolicy?: SectionAccessPolicy;
  parentId?: string | null;
};

type PublicMenuSection = {
  id: string;
  name: string;
  parentId?: string | null;
  order: number;
  isActive: boolean;
  visibleInMenu: boolean;
  accessPolicy?: string | null;
  children?: PublicMenuSection[];
  [key: string]: unknown;
};

@Injectable()
export class SectionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextSequenceNumber() {
    const aggregate = await this.prisma.section.aggregate({
      _max: {
        displayId: true
      }
    });

    return (aggregate._max.displayId ?? 0) + 1;
  }

  async listTree() {
    const sections = await this.prisma.section.findMany({
      where: {
        isActive: true,
        visibleInMenu: true,
        accessPolicy: { in: ["public", "restricted_visible"] }
      },
      orderBy: [{ order: "asc" }, { name: "asc" }]
    });

    return this.buildPublicMenuTree(sections);
  }

  async listAdmin() {
    return this.prisma.section.findMany({
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
  }

  async create(payload: UpsertSectionInput) {
    const parent = await this.getParent(payload.parentId);
    const slug = toFriendlySlug(payload.slug ?? payload.name);
    const path = this.buildPath(parent?.path, slug);

    await this.ensureUniqueSlugAndPath(slug, path);
    await this.ensureFriendlyUrlAvailable(path);

    const section = await this.prisma.section.create({
      data: {
        displayId: await this.nextSequenceNumber(),
        name: payload.name,
        slug,
        path,
        description: payload.description,
        order: payload.order ?? 0,
        visibleInMenu: payload.visibleInMenu ?? true,
        isActive: payload.isActive ?? true,
        accessPolicy: payload.accessPolicy ?? "public",
        parentId: parent?.id ?? null
      }
    });

    await this.upsertFriendlyUrlForSection(section);

    return section;
  }

  async update(id: string, payload: UpsertSectionInput) {
    const current = await this.prisma.section.findUnique({
      where: { id }
    });

    if (!current) {
      throw new NotFoundException("Secao nao encontrada.");
    }

    const targetParentId = payload.parentId === undefined ? current.parentId : payload.parentId;
    this.ensureNotSelfParent(current.id, targetParentId);

    const parent = await this.getParent(targetParentId);
    this.ensureNotDescendantParent(current, parent);

    const slug = toFriendlySlug(payload.slug ?? current.slug ?? payload.name);
    const path = this.buildPath(parent?.path, slug);

    await this.ensureUniqueSlugAndPath(slug, path, id);
    await this.ensureFriendlyUrlAvailable(path, id);

    const section = await this.prisma.section.update({
      where: { id },
      data: {
        name: payload.name,
        slug,
        path,
        description: payload.description,
        order: payload.order ?? current.order,
        visibleInMenu: payload.visibleInMenu ?? current.visibleInMenu,
        isActive: payload.isActive ?? current.isActive,
        accessPolicy: payload.accessPolicy ?? current.accessPolicy ?? "public",
        parentId: parent?.id ?? null
      }
    });

    await this.rebuildChildPaths(section.id, section.path);
    await this.upsertFriendlyUrlForSection(section);
    await this.auditSectionAccessPolicyChange(current, section);

    return section;
  }

  async remove(id: string) {
    const current = await this.prisma.section.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            children: true,
            contents: true
          }
        }
      }
    });

    if (!current) {
      throw new NotFoundException("Secao nao encontrada.");
    }

    if (current._count.children > 0 || current._count.contents > 0) {
      throw new BadRequestException("Nao e possivel excluir secoes com filhos ou conteudos associados.");
    }

    return this.prisma.section.delete({
      where: { id }
    });
  }

  private async getParent(parentId?: string | null) {
    if (!parentId) {
      return null;
    }

    const parent = await this.prisma.section.findUnique({
      where: { id: parentId }
    });

    if (!parent) {
      throw new BadRequestException("Secao pai nao encontrada.");
    }

    return parent;
  }

  private buildPath(parentPath: string | undefined, slug: string) {
    const base = parentPath?.replace(/\/+$/, "") ?? "";
    return normalizeFriendlyPath(`${base}/${slug}`);
  }

  private ensureNotSelfParent(sectionId: string, parentId?: string | null) {
    if (parentId === sectionId) {
      throw new BadRequestException("Secao nao pode ser pai dela mesma.");
    }
  }

  private ensureNotDescendantParent(
    current: { id: string; path?: string | null },
    parent: { id: string; path?: string | null } | null
  ) {
    if (!parent) {
      return;
    }

    const currentPath = current.path?.replace(/\/+$/, "");
    const parentPath = parent.path?.replace(/\/+$/, "");

    if (currentPath && parentPath?.startsWith(`${currentPath}/`)) {
      throw new BadRequestException("Secao nao pode ser movida para uma descendente.");
    }
  }

  private buildPublicMenuTree(sections: PublicMenuSection[]) {
    const eligibleSections = sections.filter((section) => this.isPublicMenuSection(section));
    const hasParentReferences = eligibleSections.some((section) => section.parentId !== null && section.parentId !== undefined);

    if (!hasParentReferences) {
      return this.sortPublicMenuSections(eligibleSections).map((section) => this.toPublicMenuNode(section));
    }

    const sectionsByParent = new Map<string | null, PublicMenuSection[]>();
    for (const section of eligibleSections) {
      const parentId = section.parentId ?? null;
      sectionsByParent.set(parentId, [...(sectionsByParent.get(parentId) ?? []), section]);
    }

    const buildChildren = (parentId: string | null): PublicMenuSection[] =>
      this.sortPublicMenuSections(sectionsByParent.get(parentId) ?? []).map((section) => ({
        ...section,
        children: buildChildren(section.id)
      }));

    return buildChildren(null);
  }

  private isPublicMenuSection(section: PublicMenuSection) {
    const accessPolicy = section.accessPolicy ?? "public";
    return section.isActive && section.visibleInMenu && accessPolicy !== "restricted_hidden";
  }

  private sortPublicMenuSections(sections: PublicMenuSection[]) {
    return [...sections].sort((left, right) => left.order - right.order || left.name.localeCompare(right.name));
  }

  private toPublicMenuNode(section: PublicMenuSection): PublicMenuSection {
    return {
      ...section,
      children: this.sortPublicMenuSections(section.children?.filter((child) => this.isPublicMenuSection(child)) ?? []).map((child) =>
        this.toPublicMenuNode(child)
      )
    };
  }

  private async ensureUniqueSlugAndPath(slug: string, path: string, currentId?: string) {
    const existing = await this.prisma.section.findFirst({
      where: {
        OR: [{ slug }, { path }],
        ...(currentId ? { NOT: { id: currentId } } : {})
      }
    });

    if (existing) {
      throw new BadRequestException("Ja existe uma secao com o mesmo slug ou path.");
    }
  }

  private async ensureFriendlyUrlAvailable(path: string, currentSectionId?: string) {
    const normalizedPath = normalizeFriendlyPath(path);
    const existing = await this.prisma.friendlyUrl.findFirst({
      where: {
        path: normalizedPath
      }
    });

    if (!existing || (existing.targetType === "section" && existing.sectionId === currentSectionId)) {
      return normalizedPath;
    }

    throw new ConflictException("Ja existe uma URL amigavel com o mesmo caminho.");
  }

  private async upsertFriendlyUrlForSection(section: { id: string; path: string }) {
    const path = normalizeFriendlyPath(section.path);
    const existing = await this.prisma.friendlyUrl.findFirst({
      where: {
        targetType: "section",
        sectionId: section.id
      }
    });

    if (existing) {
      await this.prisma.friendlyUrl.update({
        where: { id: existing.id },
        data: {
          path,
          isActive: true
        }
      });
      return;
    }

    await this.prisma.friendlyUrl.create({
      data: {
        path,
        targetType: "section",
        sectionId: section.id,
        isActive: true
      }
    });
  }

  private async auditSectionAccessPolicyChange(
    previous: { id: string; accessPolicy?: string | null },
    current: { id: string; accessPolicy?: string | null }
  ) {
    const previousPolicy = previous.accessPolicy ?? "public";
    const currentPolicy = current.accessPolicy ?? "public";

    if (previousPolicy === currentPolicy) {
      return;
    }

    await this.prisma.auditLog.create({
      data: {
        action: "section.access_policy_changed",
        entityType: "Section",
        entityId: current.id,
        metadata: {
          accessPolicy: {
            from: previousPolicy,
            to: currentPolicy
          }
        }
      }
    });
  }

  private async rebuildChildPaths(parentId: string, parentPath: string) {
    const children = await this.prisma.section.findMany({
      where: { parentId },
      orderBy: { order: "asc" }
    });

    for (const child of children) {
      const nextPath = this.buildPath(parentPath, child.slug);
      await this.ensureFriendlyUrlAvailable(nextPath, child.id);
      await this.prisma.section.update({
        where: { id: child.id },
        data: {
          path: nextPath
        }
      });

      await this.upsertFriendlyUrlForSection({
        ...child,
        path: nextPath
      });
      await this.rebuildChildPaths(child.id, nextPath);
    }
  }
}
