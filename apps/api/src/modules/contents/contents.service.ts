import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../infra/prisma.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import { normalizeFriendlyPath, toFriendlySlug } from "../friendly-urls/friendly-url.utils";

const CONTENT_PUBLISH_PERMISSION = "contents.publish";

type UpsertContentInput = {
  title: string;
  slug?: string;
  excerpt?: string;
  body?: string;
  status?: string;
  visibility?: string;
  sectionId: string;
  contentTypeId: string;
  templateId?: string | null;
  featuredMediaId?: string | null;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  seoCanonicalUrl?: string;
  seoRobots?: string;
  validFrom?: Date | string | null;
  validUntil?: Date | string | null;
  validateValidity?: boolean;
};

type PublicationState = {
  id?: string;
  sectionId?: string | null;
  slug?: string | null;
  status: string;
  validFrom?: Date | string | null;
  validUntil?: Date | string | null;
  validateValidity?: boolean | null;
};

type SeoFallbackContent = {
  title?: string | null;
  excerpt?: string | null;
  body?: string | null;
  seo?: {
    title?: string | null;
    description?: string | null;
    keywords?: string | null;
    canonicalUrl?: string | null;
    robots?: string | null;
  } | null;
  section?: {
    name?: string | null;
  } | null;
};

@Injectable()
export class ContentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextSequenceNumber() {
    const aggregate = await this.prisma.content.aggregate({
      _max: {
        displayId: true
      }
    });

    return (aggregate._max.displayId ?? 0) + 1;
  }

  async listPublished() {
    const contents = await this.prisma.content.findMany({
      where: this.buildPublicContentWhere(),
      include: {
        section: true,
        seo: true,
        template: true
      },
      orderBy: { publishedAt: "desc" },
      take: 20
    });

    return contents.map((content) => this.withSeoFallback(content));
  }

  async findBySlug(slug: string) {
    const content = await this.prisma.content.findFirst({
      where: this.buildPublicContentWhere({ slug }),
      include: {
        section: true,
        seo: true,
        template: true,
        featuredMedia: true
      }
    });

    if (!content) {
      throw new NotFoundException("Conteudo nao encontrado.");
    }

    return this.withSeoFallback(content);
  }

  async listAdmin(user: AuthenticatedUser) {
    const scope = await this.getRoleScope(user.roleId);

    return this.prisma.content.findMany({
      where: {
        ...(scope.sectionIds
          ? { sectionId: { in: scope.sectionIds } }
          : {}),
        ...(scope.contentTypeIds
          ? { contentTypeId: { in: scope.contentTypeIds } }
          : {})
      },
      include: {
        section: true,
        seo: true,
        template: true,
        contentType: true,
        author: true
      },
      orderBy: [{ updatedAt: "desc" }]
    });
  }

  async getEditorMeta(user: AuthenticatedUser) {
    const scope = await this.getRoleScope(user.roleId);
    const [sections, templates, contentTypes] = await Promise.all([
      this.prisma.section.findMany({
        where: {
          isActive: true,
          ...(scope.sectionIds ? { id: { in: scope.sectionIds } } : {})
        },
        orderBy: [{ path: "asc" }]
      }),
      this.prisma.template.findMany({
        where: { isActive: true },
        orderBy: [{ name: "asc" }]
      }),
      this.prisma.contentType.findMany({
        where: scope.contentTypeIds ? { id: { in: scope.contentTypeIds } } : undefined,
        orderBy: [{ name: "asc" }]
      })
    ]);

    return {
      sections,
      templates,
      contentTypes
    };
  }

  async create(user: AuthenticatedUser, payload: UpsertContentInput) {
    await this.ensureRelations(payload, user.roleId);
    this.ensurePublicationPermission(user, null, payload);

    const slug = await this.resolveUniqueSlug(payload.slug ?? payload.title);
    const friendlyPath = await this.ensureFriendlyUrlAvailable(slug);
    const seo = await this.upsertSeo(undefined, payload);

    const content = await this.prisma.content.create({
      data: {
        displayId: await this.nextSequenceNumber(),
        title: payload.title,
        slug,
        excerpt: payload.excerpt,
        body: payload.body,
        status: payload.status ?? "draft",
        visibility: payload.visibility ?? "public",
        publishedAt: payload.status === "published" ? new Date() : null,
        validFrom: payload.validFrom ?? null,
        validUntil: payload.validUntil ?? null,
        validateValidity: payload.validateValidity ?? false,
        sectionId: payload.sectionId,
        contentTypeId: payload.contentTypeId,
        templateId: payload.templateId || null,
        featuredMediaId: payload.featuredMediaId || null,
        authorId: user.sub,
        seoId: seo?.id ?? null
      },
      include: {
        section: true,
        seo: true,
        template: true,
        contentType: true
      }
    });

    await this.upsertFriendlyUrlForContent(content.id, friendlyPath, content.sectionId);
    await this.createRevision(content.id, user.sub, content);
    await this.auditContentChanges(user.sub, null, content, null, friendlyPath);

    return content;
  }

  async update(id: string, user: AuthenticatedUser, payload: UpsertContentInput) {
    const existing = await this.prisma.content.findUnique({
      where: { id },
      include: {
        seo: true
      }
    });

    if (!existing) {
      throw new NotFoundException("Conteudo nao encontrado.");
    }

    await this.ensureExistingContentInScope(existing, user.roleId);
    await this.ensureRelations(payload, user.roleId);
    this.ensurePublicationPermission(user, existing, payload);

    const slug = await this.resolveUniqueSlug(payload.slug ?? existing.slug, id);
    const friendlyPath = await this.ensureFriendlyUrlAvailable(slug, id);
    const seo = await this.upsertSeo(existing.seoId, payload);
    const nextStatus = payload.status ?? existing.status;

    const content = await this.prisma.content.update({
      where: { id },
      data: {
        title: payload.title,
        slug,
        excerpt: payload.excerpt,
        body: payload.body,
        status: nextStatus,
        visibility: payload.visibility ?? existing.visibility,
        publishedAt:
          nextStatus === "published"
            ? existing.publishedAt ?? new Date()
            : payload.status === "draft"
              ? null
              : existing.publishedAt,
        validFrom: payload.validFrom ?? existing.validFrom,
        validUntil: payload.validUntil ?? existing.validUntil,
        validateValidity: payload.validateValidity ?? existing.validateValidity,
        sectionId: payload.sectionId,
        contentTypeId: payload.contentTypeId,
        templateId: payload.templateId || null,
        featuredMediaId: payload.featuredMediaId || null,
        seoId: seo?.id ?? null
      },
      include: {
        section: true,
        seo: true,
        template: true,
        contentType: true
      }
    });

    await this.upsertFriendlyUrlForContent(content.id, friendlyPath, content.sectionId);
    await this.createRevision(content.id, user.sub, content);
    await this.auditContentChanges(user.sub, existing, content, normalizeFriendlyPath(existing.slug), friendlyPath);

    return content;
  }

  async remove(id: string) {
    const existing = await this.prisma.content.findUnique({
      where: { id },
      include: {
        revisions: true
      }
    });

    if (!existing) {
      throw new NotFoundException("Conteudo nao encontrado.");
    }

    await this.prisma.contentRevision.deleteMany({
      where: { contentId: id }
    });

    return this.prisma.content.delete({
      where: { id }
    });
  }

  private async ensureRelations(payload: UpsertContentInput, roleId?: string) {
    const [section, contentType] = await Promise.all([
      this.prisma.section.findUnique({
        where: { id: payload.sectionId }
    }),
      this.prisma.contentType.findUnique({
        where: { id: payload.contentTypeId }
      })
    ]);

    if (!section) {
      throw new BadRequestException("Seção inválida.");
    }

    if (!section.isActive) {
      throw new BadRequestException("A seção selecionada está inativa.");
    }

    if (!contentType) {
      throw new BadRequestException("Máscara invalida.");
    }

    const scope = await this.getRoleScope(roleId);

    if (scope.sectionIds && !scope.sectionIds.includes(payload.sectionId)) {
      throw new ForbiddenException("Este perfil nao pode publicar na seção selecionada.");
    }

    if (scope.contentTypeIds && !scope.contentTypeIds.includes(payload.contentTypeId)) {
      throw new ForbiddenException("Este perfil nao pode usar a máscara selecionada.");
    }

    if (payload.templateId) {
      const template = await this.prisma.template.findUnique({
        where: { id: payload.templateId }
      });

      if (!template) {
        throw new BadRequestException("Template invalido.");
      }
    }
  }

  private async ensureExistingContentInScope(existing: PublicationState, roleId?: string) {
    if (!existing.sectionId) {
      return;
    }

    const scope = await this.getRoleScope(roleId);

    if (scope.sectionIds && !scope.sectionIds.includes(existing.sectionId)) {
      throw new ForbiddenException("Este perfil nao pode alterar conteudo fora do escopo de seção.");
    }
  }

  private ensurePublicationPermission(
    user: AuthenticatedUser,
    existing: PublicationState | null,
    payload: UpsertContentInput
  ) {
    if (!this.requiresPublishPermission(existing, payload)) {
      return;
    }

    if (!user.permissions?.includes(CONTENT_PUBLISH_PERMISSION)) {
      throw new ForbiddenException("Permissao contents.publish obrigatoria para publicar conteudo.");
    }
  }

  private requiresPublishPermission(existing: PublicationState | null, payload: UpsertContentInput) {
    const nextStatus = payload.status ?? existing?.status ?? "draft";
    const createsPublishedContent = !existing && nextStatus === "published";
    const publishesExistingContent = Boolean(existing && existing.status !== "published" && nextStatus === "published");
    const changesPublishedStatus = Boolean(
      existing && existing.status === "published" && payload.status !== undefined && payload.status !== existing.status
    );
    const touchesValidity =
      payload.validFrom !== undefined || payload.validUntil !== undefined || payload.validateValidity !== undefined;
    const changesPublishedValidity = touchesValidity && (existing?.status === "published" || nextStatus === "published");

    return createsPublishedContent || publishesExistingContent || changesPublishedStatus || changesPublishedValidity;
  }

  private async upsertSeo(existingSeoId: string | null | undefined, payload: UpsertContentInput) {
    const seoData = {
      title: payload.seoTitle || payload.title,
      description: payload.seoDescription || payload.excerpt || payload.title,
      keywords: payload.seoKeywords || "abbatech, portal, conteudo",
      canonicalUrl: payload.seoCanonicalUrl,
      robots: payload.seoRobots || "index,follow"
    };

    if (existingSeoId) {
      return this.prisma.seoMetadata.update({
        where: { id: existingSeoId },
        data: seoData
      });
    }

    return this.prisma.seoMetadata.create({
      data: seoData
    });
  }

  private async createRevision(contentId: string, editorId: string, snapshot: unknown) {
    await this.prisma.contentRevision.create({
      data: {
        contentId,
        editorId,
        snapshot: JSON.parse(JSON.stringify(snapshot))
      }
    });
  }

  private async resolveUniqueSlug(value: string, currentId?: string) {
    const baseSlug = toFriendlySlug(value);
    let candidate = baseSlug;
    let suffix = 1;

    while (true) {
      const existing = await this.prisma.content.findFirst({
        where: {
          slug: candidate,
          ...(currentId ? { NOT: { id: currentId } } : {})
        }
      });

      if (!existing) {
        return candidate;
      }

      suffix += 1;
      candidate = `${baseSlug}-${suffix}`;
    }
  }

  private async ensureFriendlyUrlAvailable(slug: string, currentContentId?: string) {
    const path = normalizeFriendlyPath(slug);
    const existing = await this.prisma.friendlyUrl.findFirst({
      where: {
        path
      }
    });

    if (!existing || (existing.targetType === "content" && existing.contentId === currentContentId)) {
      return path;
    }

    throw new ConflictException("Ja existe uma URL amigavel com o mesmo caminho.");
  }

  private async upsertFriendlyUrlForContent(contentId: string, path: string, primarySectionId: string) {
    const existing = await this.prisma.friendlyUrl.findFirst({
      where: {
        targetType: "content",
        contentId
      }
    });

    if (existing) {
      await this.prisma.friendlyUrl.update({
        where: { id: existing.id },
        data: {
          path,
          primarySectionId,
          isActive: true
        }
      });
      return;
    }

    await this.prisma.friendlyUrl.create({
      data: {
        path,
        targetType: "content",
        contentId,
        primarySectionId,
        isActive: true
      }
    });
  }

  private withSeoFallback<T extends SeoFallbackContent>(content: T): T {
    const seo = content.seo;
    const fallbackTitle = this.sanitizeSeoText(seo?.title || content.title || "Conteudo");
    const fallbackDescription = this.sanitizeSeoText(
      seo?.description ||
        content.excerpt ||
        (content.section?.name ? `${fallbackTitle} - ${content.section.name}` : fallbackTitle)
    );

    return {
      ...content,
      seo: {
        ...seo,
        title: fallbackTitle,
        description: fallbackDescription,
        keywords: seo?.keywords ?? undefined,
        canonicalUrl: seo?.canonicalUrl ?? null,
        robots: seo?.robots ?? "index,follow"
      }
    };
  }

  private sanitizeSeoText(value: string) {
    const withoutHtml = value.replace(/<[^>]*>/g, " ");
    const withoutSensitiveValues = withoutHtml.replace(
      /\b(password|senha|token|secret|segredo|authorization|cookie)\s*[:=]\s*\S+/gi,
      "$1=[redacted]"
    );
    const normalized = withoutSensitiveValues.replace(/\s+/g, " ").trim();

    return normalized || "Conteudo";
  }

  private async auditContentChanges(
    actorId: string,
    previous: PublicationState | null,
    current: PublicationState,
    previousFriendlyPath: string | null,
    currentFriendlyPath: string
  ) {
    const events: Array<{ action: string; metadata: Prisma.InputJsonValue }> = [];

    if (!previous && current.status === "published") {
      events.push({
        action: "content.published",
        metadata: { status: { to: "published" } }
      });
    }

    if (previous && previous.status !== "published" && current.status === "published") {
      events.push({
        action: "content.published",
        metadata: { status: { from: previous.status, to: current.status } }
      });
    }

    if (previous?.status === "published" && current.status === "archived") {
      events.push({
        action: "content.archived",
        metadata: { status: { from: previous.status, to: current.status } }
      });
    }

    if (previous && previousFriendlyPath !== currentFriendlyPath) {
      events.push({
        action: "content.url_changed",
        metadata: { path: { from: previousFriendlyPath, to: currentFriendlyPath } }
      });
    }

    if (previous && this.hasValidityChanged(previous, current)) {
      events.push({
        action: "content.validity_changed",
        metadata: {
          validFrom: { from: this.toAuditValue(previous.validFrom), to: this.toAuditValue(current.validFrom) },
          validUntil: { from: this.toAuditValue(previous.validUntil), to: this.toAuditValue(current.validUntil) },
          validateValidity: { from: previous.validateValidity ?? false, to: current.validateValidity ?? false }
        }
      });
    }

    if (previous?.sectionId && current.sectionId && previous.sectionId !== current.sectionId) {
      events.push({
        action: "content.primary_section_changed",
        metadata: { sectionId: { from: previous.sectionId, to: current.sectionId } }
      });
    }

    for (const event of events) {
      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: event.action,
          entityType: "Content",
          entityId: current.id,
          metadata: event.metadata
        }
      });
    }
  }

  private hasValidityChanged(previous: PublicationState, current: PublicationState) {
    const publicationRelevant = previous.status === "published" || current.status === "published";

    if (!publicationRelevant) {
      return false;
    }

    return (
      this.toAuditValue(previous.validFrom) !== this.toAuditValue(current.validFrom) ||
      this.toAuditValue(previous.validUntil) !== this.toAuditValue(current.validUntil) ||
      (previous.validateValidity ?? false) !== (current.validateValidity ?? false)
    );
  }

  private toAuditValue(value: Date | string | null | undefined) {
    if (value instanceof Date) {
      return value.toISOString();
    }

    return value ?? null;
  }

  private async getRoleScope(roleId?: string) {
    if (!roleId) {
      return {
        sectionIds: null as string[] | null,
        contentTypeIds: null as string[] | null
      };
    }

    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        sectionAccesses: true,
        contentTypeAccesses: true
      }
    });

    if (!role) {
      return {
        sectionIds: [] as string[],
        contentTypeIds: [] as string[]
      };
    }

    const normalizedRoleName = role.name.toLowerCase();
    const normalizedFunctionName = role.functionName?.toLowerCase() ?? "";
    const isUnrestrictedRole =
      normalizedRoleName.includes("administrador") ||
      normalizedRoleName.includes("desenvolvedor") ||
      normalizedFunctionName.includes("administrador") ||
      normalizedFunctionName.includes("desenvolvedor");

    if (isUnrestrictedRole) {
      return {
        sectionIds: null as string[] | null,
        contentTypeIds: null as string[] | null
      };
    }

    let sectionIds: string[] | null = [];
    if (role.sectionAccesses.length > 0) {
      sectionIds = role.sectionAccesses.map((entry: (typeof role.sectionAccesses)[number]) => entry.sectionId);
    }

    const contentTypeIds =
      role.contentTypeAccesses.length > 0
        ? role.contentTypeAccesses.map(
            (entry: (typeof role.contentTypeAccesses)[number]) => entry.contentTypeId
          )
        : [];

    return {
      sectionIds,
      contentTypeIds
    };
  }

  private buildPublicContentWhere(extraWhere: Prisma.ContentWhereInput = {}): Prisma.ContentWhereInput {
    const now = new Date();
    const startOfToday = this.startOfDay(now);
    const publicPolicy: Prisma.ContentWhereInput = {
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
              OR: [{ validFrom: null }, { validFrom: { lte: now } }]
            },
            {
              OR: [{ validUntil: null }, { validUntil: { gte: startOfToday } }]
            }
          ]
        }
      ]
    };

    if (Object.keys(extraWhere).length === 0) {
      return publicPolicy;
    }

    return {
      AND: [extraWhere, publicPolicy]
    };
  }

  private startOfDay(date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }
}
