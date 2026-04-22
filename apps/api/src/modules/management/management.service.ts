import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { hash } from "argon2";
import { PrismaService } from "../../infra/prisma.service";

type UpsertContentTypeInput = {
  name: string;
  slug?: string;
  description?: string;
  allowRichText?: boolean;
  allowFeaturedMedia?: boolean;
  schemaJson?: unknown;
};

type UpsertPermissionInput = {
  code: string;
  description?: string;
};

type UpsertApplicationInput = {
  name: string;
  area: string;
  link: string;
  description?: string;
};

type UpsertRoleApplicationAccessInput = {
  roleId: string;
  appId: string;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  canAccess?: boolean;
};

type UpsertRoleInput = {
  name: string;
  description?: string;
  functionName?: string;
  status?: string;
  parentRoleId?: string;
  permissionIds?: string[];
  menuAccesses?: Array<{
    topMenu: string;
    viewKey: string;
  }>;
  sectionIds?: string[];
  contentTypeIds?: string[];
};

type UpsertUserInput = {
  name: string;
  email: string;
  username?: string;
  cpf?: string;
  cnh?: string;
  status?: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  address?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  secondaryAddress?: string;
  secondaryNumber?: string;
  secondaryComplement?: string;
  neighborhood?: string;
  notes?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  forcePasswordChange?: boolean;
  password?: string;
  isActive?: boolean;
  isSuperAdmin?: boolean;
  roleIds?: string[];
};

type UpsertNewsletterGroupInput = {
  name: string;
  description?: string;
};

type UpsertSystemEmailInput = {
  name: string;
  email: string;
  area: string;
  description?: string;
  value?: string;
};

type UpsertTemplateInput = {
  name: string;
  slug?: string;
  description?: string;
  componentKey?: string;
  configSchema?: unknown;
  isActive?: boolean;
};

type UpsertElementInput = {
  name: string;
  thumbLabel?: string;
  content?: string;
  status?: string;
  category?: string;
};

@Injectable()
export class ManagementService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextLegacyIdFor(modelName: string) {
    const aggregate = await (this.prisma as any)[modelName].aggregate({
      _max: {
        legacyId: true
      }
    });

    return (aggregate?._max?.legacyId ?? 0) + 1;
  }

  async bootstrap() {
    const [
      contentTypes,
      users,
      roles,
      permissions,
      applications,
      roleApplicationAccesses,
      systemEmails,
      templates,
      elements,
      newsletterGroups,
      newsletterCampaigns,
      privacyRequests
    ] = await Promise.all([
      this.prisma.contentType.findMany({
        include: {
          _count: {
            select: {
              contents: true
            }
          }
        },
        orderBy: [{ name: "asc" }]
      }),
      this.prisma.user.findMany({
        include: {
          roles: {
            include: {
              role: true
            }
          },
          _count: {
            select: {
              authoredContents: true,
              revisions: true
            }
          }
        },
        orderBy: [{ createdAt: "desc" }]
      }),
      this.prisma.role.findMany({
        include: {
          parentRole: true,
          permissions: {
            include: {
              permission: true
            }
          },
          menuAccesses: true,
          appAccesses: {
            include: {
              app: true
            }
          },
          sectionAccesses: true,
          contentTypeAccesses: true,
          users: {
            include: {
              user: true
            }
          }
        },
        orderBy: [{ name: "asc" }]
      }),
      this.prisma.permission.findMany({
        include: {
          roles: {
            include: {
              role: true
            }
          }
        },
        orderBy: [{ code: "asc" }]
      }),
      this.prisma.legacyApplication.findMany({
        orderBy: [{ area: "asc" }, { name: "asc" }]
      }),
      this.prisma.roleApplicationAccess.findMany({
        include: {
          role: true,
          app: true
        },
        orderBy: [{ role: { name: "asc" } }, { app: { name: "asc" } }]
      }),
      this.prisma.systemEmail.findMany({
        orderBy: [{ area: "asc" }, { name: "asc" }]
      }),
      this.prisma.template.findMany({
        orderBy: [{ name: "asc" }]
      }),
      this.prisma.element.findMany({
        orderBy: [{ name: "asc" }]
      }),
      this.prisma.newsletterGroup.findMany({
        include: {
          _count: {
            select: {
              recipients: true,
              campaigns: true
            }
          }
        },
        orderBy: [{ createdAt: "asc" }]
      }),
      this.prisma.newsletterCampaign.findMany({
        include: {
          recipientGroup: true,
          _count: {
            select: {
              dispatches: true
            }
          }
        },
        orderBy: [{ createdAt: "desc" }]
      }),
      this.prisma.privacyRequest.findMany({
        orderBy: [{ createdAt: "desc" }]
      })
    ]);

    return {
      contentTypes,
      users: users.map((user: (typeof users)[number] & Record<string, unknown>) => ({
        id: user.id,
        legacyId: (user.legacyId as number | undefined) ?? null,
        name: user.name,
        email: user.email,
        username: user.username,
        cpf: user.cpf,
        cnh: (user.cnh as string | null | undefined) ?? null,
        status: (user.legacyStatus as string | null | undefined) ?? (user.isActive ? "Ativo" : "Inativo"),
        company: (user.company as string | null | undefined) ?? null,
        jobTitle: (user.jobTitle as string | null | undefined) ?? null,
        phone: (user.phone as string | null | undefined) ?? null,
        address: (user.address as string | null | undefined) ?? null,
        zipCode: (user.zipCode as string | null | undefined) ?? null,
        city: (user.city as string | null | undefined) ?? null,
        state: (user.state as string | null | undefined) ?? null,
        secondaryAddress: (user.secondaryAddress as string | null | undefined) ?? null,
        secondaryNumber: (user.secondaryNumber as string | null | undefined) ?? null,
        secondaryComplement: (user.secondaryComplement as string | null | undefined) ?? null,
        neighborhood: (user.neighborhood as string | null | undefined) ?? null,
        notes: (user.notes as string | null | undefined) ?? null,
        facebook: (user.facebook as string | null | undefined) ?? null,
        instagram: (user.instagram as string | null | undefined) ?? null,
        youtube: (user.youtube as string | null | undefined) ?? null,
        forcePasswordChange: Boolean(user.forcePasswordChange),
        isActive: user.isActive,
        isSuperAdmin: user.isSuperAdmin,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        roles: user.roles.map((entry: (typeof user.roles)[number]) => entry.role),
        stats: user._count
      })),
      roles: roles.map((role: (typeof roles)[number]) => ({
        id: role.id,
        legacyId: role.legacyId,
        name: role.name,
        description: role.description,
        functionName: role.functionName,
        status: role.status,
        parentRoleId: role.parentRoleId,
        parentRoleName: role.parentRole?.name ?? null,
        permissions: role.permissions.map((entry: (typeof role.permissions)[number]) => entry.permission),
        menuAccesses: role.menuAccesses,
        appAccesses: role.appAccesses.map((entry: (typeof role.appAccesses)[number]) => ({
          id: entry.id,
          appId: entry.appId,
          appName: entry.app.name,
          area: entry.app.area,
          canCreate: entry.canCreate,
          canUpdate: entry.canUpdate,
          canDelete: entry.canDelete,
          canAccess: entry.canAccess
        })),
        sectionIds: role.sectionAccesses.map((entry: (typeof role.sectionAccesses)[number]) => entry.sectionId),
        contentTypeIds: role.contentTypeAccesses.map(
          (entry: (typeof role.contentTypeAccesses)[number]) => entry.contentTypeId
        ),
        users: role.users.map((entry: (typeof role.users)[number]) => ({
          id: entry.user.id,
          name: entry.user.name,
          email: entry.user.email
        }))
      })),
      permissions: permissions.map((permission: (typeof permissions)[number]) => ({
        id: permission.id,
        legacyId: permission.legacyId,
        code: permission.code,
        description: permission.description,
        roles: permission.roles.map((entry: (typeof permission.roles)[number]) => ({
          id: entry.role.id,
          name: entry.role.name
        }))
      })),
      applications,
      roleApplicationAccesses: roleApplicationAccesses.map((entry: (typeof roleApplicationAccesses)[number]) => ({
        id: entry.id,
        legacyId: entry.legacyId,
        roleId: entry.roleId,
        roleName: entry.role.name,
        appId: entry.appId,
        appName: entry.app.name,
        area: entry.app.area,
        canCreate: entry.canCreate,
        canUpdate: entry.canUpdate,
        canDelete: entry.canDelete,
        canAccess: entry.canAccess
      })),
      systemEmails,
      templates,
      elements,
      newsletterGroups,
      newsletterCampaigns,
      privacyRequests
    };
  }

  async createContentType(payload: UpsertContentTypeInput) {
    const slug = this.toSlug(payload.slug ?? payload.name);
    await this.ensureUniqueContentType(slug);

    return this.prisma.contentType.create({
      data: {
        legacyId: await this.nextLegacyIdFor("contentType"),
        name: payload.name,
        slug,
        description: payload.description,
        allowRichText: payload.allowRichText ?? true,
        allowFeaturedMedia: payload.allowFeaturedMedia ?? true,
        schemaJson: (payload.schemaJson ?? { fields: ["title", "excerpt", "body", "seo"] }) as never
      }
    });
  }

  async updateContentType(id: string, payload: UpsertContentTypeInput) {
    const current = await this.prisma.contentType.findUnique({
      where: { id }
    });

    if (!current) {
      throw new NotFoundException("Mascara nao encontrada.");
    }

    const slug = this.toSlug(payload.slug ?? current.slug);
    await this.ensureUniqueContentType(slug, id);

    return this.prisma.contentType.update({
      where: { id },
      data: {
        name: payload.name,
        slug,
        description: payload.description,
        allowRichText: payload.allowRichText ?? current.allowRichText,
        allowFeaturedMedia: payload.allowFeaturedMedia ?? current.allowFeaturedMedia,
        schemaJson: (payload.schemaJson ?? current.schemaJson) as never
      }
    });
  }

  async deleteContentType(id: string) {
    return this.prisma.contentType.delete({
      where: { id }
    });
  }

  async createPermission(payload: UpsertPermissionInput) {
    const code = payload.code.trim().toLowerCase();
    await this.ensureUniquePermission(code);

    return this.prisma.permission.create({
      data: {
        legacyId: await this.nextLegacyIdFor("permission"),
        code,
        description: payload.description
      }
    });
  }

  async updatePermission(id: string, payload: UpsertPermissionInput) {
    const current = await this.prisma.permission.findUnique({
      where: { id }
    });

    if (!current) {
      throw new NotFoundException("Permissao nao encontrada.");
    }

    const code = payload.code.trim().toLowerCase();
    await this.ensureUniquePermission(code, id);

    return this.prisma.permission.update({
      where: { id },
      data: {
        code,
        description: payload.description
      }
    });
  }

  async deletePermission(id: string) {
    return this.prisma.permission.delete({
      where: { id }
    });
  }

  async createApplication(payload: UpsertApplicationInput) {
    await this.ensureUniqueApplicationName(payload.name);

    return this.prisma.legacyApplication.create({
      data: {
        legacyId: await this.nextLegacyIdFor("legacyApplication"),
        name: payload.name,
        area: payload.area,
        link: payload.link,
        description: payload.description
      }
    });
  }

  async updateApplication(id: string, payload: UpsertApplicationInput) {
    const current = await this.prisma.legacyApplication.findUnique({
      where: { id }
    });

    if (!current) {
      throw new NotFoundException("Aplicativo nao encontrado.");
    }

    await this.ensureUniqueApplicationName(payload.name, id);

    return this.prisma.legacyApplication.update({
      where: { id },
      data: {
        name: payload.name,
        area: payload.area,
        link: payload.link,
        description: payload.description
      }
    });
  }

  async deleteApplication(id: string) {
    return this.prisma.legacyApplication.delete({
      where: { id }
    });
  }

  async createRoleApplicationAccess(payload: UpsertRoleApplicationAccessInput) {
    await this.ensureRoleApplication(payload.roleId, payload.appId);

    return this.prisma.roleApplicationAccess.create({
      data: {
        legacyId: await this.nextLegacyIdFor("roleApplicationAccess"),
        roleId: payload.roleId,
        appId: payload.appId,
        canCreate: payload.canCreate ?? false,
        canUpdate: payload.canUpdate ?? false,
        canDelete: payload.canDelete ?? false,
        canAccess: payload.canAccess ?? true
      }
    });
  }

  async updateRoleApplicationAccess(id: string, payload: UpsertRoleApplicationAccessInput) {
    let current = await this.prisma.roleApplicationAccess.findUnique({
      where: { id }
    });

    if (!current) {
      current = await this.prisma.roleApplicationAccess.findFirst({
        where: {
          roleId: payload.roleId,
          appId: payload.appId
        }
      });
    }

    if (!current) {
      throw new NotFoundException("Permissao administrativa nao encontrada.");
    }

    await this.ensureRoleApplication(payload.roleId, payload.appId, current.id);

    return this.prisma.roleApplicationAccess.update({
      where: { id: current.id },
      data: {
        roleId: payload.roleId,
        appId: payload.appId,
        canCreate: payload.canCreate ?? current.canCreate,
        canUpdate: payload.canUpdate ?? current.canUpdate,
        canDelete: payload.canDelete ?? current.canDelete,
        canAccess: payload.canAccess ?? current.canAccess
      }
    });
  }

  async deleteRoleApplicationAccess(id: string) {
    return this.prisma.roleApplicationAccess.delete({
      where: { id }
    });
  }

  async createRole(payload: UpsertRoleInput) {
    await this.ensureRolePermissions(payload.permissionIds ?? []);
    await this.ensureParentRole(payload.parentRoleId);
    await this.ensureSectionIds(payload.sectionIds ?? []);
    await this.ensureContentTypeIds(payload.contentTypeIds ?? []);
    this.ensureRoleMenus(payload.menuAccesses ?? []);
    const appAccesses = await this.resolveRoleApplicationAccesses(payload);

    return this.prisma.role.create({
      data: {
        legacyId: await this.nextLegacyIdFor("role"),
        name: payload.name,
        description: payload.description,
        functionName: payload.functionName,
        status: payload.status ?? "Ativo",
        parentRoleId: payload.parentRoleId,
        permissions: {
          create: (payload.permissionIds ?? []).map((permissionId) => ({
            permissionId
          }))
        },
        menuAccesses: {
          create: (payload.menuAccesses ?? []).map((menuAccess) => ({
            topMenu: menuAccess.topMenu,
            viewKey: menuAccess.viewKey
          }))
        },
        sectionAccesses: {
          create: (payload.sectionIds ?? []).map((sectionId) => ({
            sectionId
          }))
        },
        contentTypeAccesses: {
          create: (payload.contentTypeIds ?? []).map((contentTypeId) => ({
            contentTypeId
          }))
        },
        appAccesses: {
          create: appAccesses
        }
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        menuAccesses: true
      }
    });
  }

  async updateRole(id: string, payload: UpsertRoleInput) {
    const current = await this.prisma.role.findUnique({
      where: { id }
    });

    if (!current) {
      throw new NotFoundException("Grupo nao encontrado.");
    }

    await this.ensureRolePermissions(payload.permissionIds ?? []);
    await this.ensureParentRole(payload.parentRoleId, id);
    await this.ensureSectionIds(payload.sectionIds ?? []);
    await this.ensureContentTypeIds(payload.contentTypeIds ?? []);
    this.ensureRoleMenus(payload.menuAccesses ?? []);
    const appAccesses = await this.resolveRoleApplicationAccesses(payload);

    return this.prisma.role.update({
      where: { id },
      data: {
        name: payload.name,
        description: payload.description,
        functionName: payload.functionName,
        status: payload.status ?? current.status,
        parentRoleId: payload.parentRoleId,
        permissions: {
          deleteMany: {},
          create: (payload.permissionIds ?? []).map((permissionId) => ({
            permissionId
          }))
        },
        menuAccesses: {
          deleteMany: {},
          create: (payload.menuAccesses ?? []).map((menuAccess) => ({
            topMenu: menuAccess.topMenu,
            viewKey: menuAccess.viewKey
          }))
        },
        sectionAccesses: {
          deleteMany: {},
          create: (payload.sectionIds ?? []).map((sectionId) => ({
            sectionId
          }))
        },
        contentTypeAccesses: {
          deleteMany: {},
          create: (payload.contentTypeIds ?? []).map((contentTypeId) => ({
            contentTypeId
          }))
        },
        appAccesses: {
          deleteMany: {},
          create: appAccesses
        }
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        menuAccesses: true
      }
    });
  }

  async deleteRole(id: string) {
    return this.prisma.role.delete({
      where: { id }
    });
  }

  async createUser(payload: UpsertUserInput) {
    await this.ensureRoleIds(payload.roleIds ?? []);
    const normalizedEmail = payload.email.trim().toLowerCase();
    const normalizedUsername = payload.username?.trim().toLowerCase() || null;
    const normalizedCpf = this.normalizeCpf(payload.cpf);
    await this.ensureUniqueUserIdentity({
      email: normalizedEmail,
      username: normalizedUsername,
      cpf: normalizedCpf
    });

    const legacyStatus = payload.status?.trim() || "Novo";
    const isActive =
      payload.isActive ?? !["Inativo", "Excluído"].includes(legacyStatus);

    const passwordHash = await hash(payload.password ?? "Refresh123!");

    return this.prisma.user.create({
      data: {
        legacyId: await this.nextLegacyIdFor("user"),
        name: payload.name,
        email: normalizedEmail,
        username: normalizedUsername,
        cpf: normalizedCpf,
        cnh: payload.cnh?.trim() || null,
        legacyStatus,
        company: payload.company?.trim() || null,
        jobTitle: payload.jobTitle?.trim() || null,
        phone: payload.phone?.trim() || null,
        address: payload.address?.trim() || null,
        zipCode: payload.zipCode?.trim() || null,
        city: payload.city?.trim() || null,
        state: payload.state?.trim() || null,
        secondaryAddress: payload.secondaryAddress?.trim() || null,
        secondaryNumber: payload.secondaryNumber?.trim() || null,
        secondaryComplement: payload.secondaryComplement?.trim() || null,
        neighborhood: payload.neighborhood?.trim() || null,
        notes: payload.notes?.trim() || null,
        facebook: payload.facebook?.trim() || null,
        instagram: payload.instagram?.trim() || null,
        youtube: payload.youtube?.trim() || null,
        forcePasswordChange: payload.forcePasswordChange ?? false,
        passwordHash,
        isActive,
        isSuperAdmin: payload.isSuperAdmin ?? false,
        consentVersion: "1.0",
        consentAt: new Date(),
        roles: {
          create: (payload.roleIds ?? []).map((roleId) => ({
            roleId
          }))
        }
      } as any,
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async updateUser(id: string, payload: UpsertUserInput) {
    const current = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!current) {
      throw new NotFoundException("Usuario nao encontrado.");
    }

    await this.ensureRoleIds(payload.roleIds ?? []);
    const normalizedEmail = payload.email.trim().toLowerCase();
    const normalizedUsername = payload.username?.trim().toLowerCase() || null;
    const normalizedCpf = this.normalizeCpf(payload.cpf);
    await this.ensureUniqueUserIdentity(
      {
        email: normalizedEmail,
        username: normalizedUsername,
        cpf: normalizedCpf
      },
      id
    );

    const legacyStatus =
      payload.status?.trim() || ((current as Record<string, unknown>).legacyStatus as string | undefined) || "Novo";
    const isActive =
      payload.isActive ?? !["Inativo", "Excluído"].includes(legacyStatus);

    return this.prisma.user.update({
      where: { id },
      data: {
        name: payload.name,
        email: normalizedEmail,
        username: normalizedUsername,
        cpf: normalizedCpf,
        cnh: payload.cnh?.trim() || null,
        legacyStatus,
        company: payload.company?.trim() || null,
        jobTitle: payload.jobTitle?.trim() || null,
        phone: payload.phone?.trim() || null,
        address: payload.address?.trim() || null,
        zipCode: payload.zipCode?.trim() || null,
        city: payload.city?.trim() || null,
        state: payload.state?.trim() || null,
        secondaryAddress: payload.secondaryAddress?.trim() || null,
        secondaryNumber: payload.secondaryNumber?.trim() || null,
        secondaryComplement: payload.secondaryComplement?.trim() || null,
        neighborhood: payload.neighborhood?.trim() || null,
        notes: payload.notes?.trim() || null,
        facebook: payload.facebook?.trim() || null,
        instagram: payload.instagram?.trim() || null,
        youtube: payload.youtube?.trim() || null,
        forcePasswordChange:
          payload.forcePasswordChange ??
          ((current as Record<string, unknown>).forcePasswordChange as boolean | undefined) ??
          false,
        passwordHash: payload.password ? await hash(payload.password) : undefined,
        isActive,
        isSuperAdmin: payload.isSuperAdmin ?? current.isSuperAdmin,
        roles: {
          deleteMany: {},
          create: (payload.roleIds ?? []).map((roleId) => ({
            roleId
          }))
        }
      } as any,
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async deleteUser(id: string) {
    const current = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            authoredContents: true,
            revisions: true,
            auditLogs: true,
            roles: true
          }
        }
      }
    });

    if (!current) {
      throw new NotFoundException("Usuario nao encontrado.");
    }

    const hasHistory =
      current._count.authoredContents > 0 ||
      current._count.revisions > 0 ||
      current._count.auditLogs > 0;

    if (!hasHistory) {
      return this.prisma.user.delete({
        where: { id }
      });
    }

    const archiveSuffix = id.slice(-8);

    return this.prisma.user.update({
      where: { id },
      data: {
        name: `${current.name} (Excluído)`,
        email: `excluido+${archiveSuffix}@abbatech.local`,
        username: current.username ? `excluido.${archiveSuffix}` : null,
        cpf: null,
        cnh: null,
        legacyStatus: "Excluído",
        isActive: false,
        isSuperAdmin: false,
        forcePasswordChange: false,
        company: null,
        jobTitle: null,
        phone: null,
        address: null,
        zipCode: null,
        city: null,
        state: null,
        secondaryAddress: null,
        secondaryNumber: null,
        secondaryComplement: null,
        neighborhood: null,
        notes: "Usuário arquivado automaticamente por possuir histórico vinculado.",
        facebook: null,
        instagram: null,
        youtube: null,
        roles: {
          deleteMany: {}
        }
      } as any
    });
  }

  async createTemplate(payload: UpsertTemplateInput) {
    const slug = this.toSlug(payload.slug ?? payload.name);
    await this.ensureUniqueTemplate(slug);

    return this.prisma.template.create({
      data: {
        legacyId: await this.nextLegacyIdFor("template"),
        name: payload.name,
        slug,
        description: payload.description,
        componentKey: payload.componentKey ?? slug,
        configSchema: (payload.configSchema ?? { layout: "default" }) as never,
        isActive: payload.isActive ?? true
      }
    });
  }

  async updateTemplate(id: string, payload: UpsertTemplateInput) {
    const current = await this.prisma.template.findUnique({
      where: { id }
    });

    if (!current) {
      throw new NotFoundException("Template nao encontrado.");
    }

    const slug = this.toSlug(payload.slug ?? current.slug);
    await this.ensureUniqueTemplate(slug, id);

    return this.prisma.template.update({
      where: { id },
      data: {
        name: payload.name,
        slug,
        description: payload.description,
        componentKey: payload.componentKey ?? current.componentKey,
        configSchema: (payload.configSchema ?? current.configSchema) as never,
        isActive: payload.isActive ?? current.isActive
      }
    });
  }

  async deleteTemplate(id: string) {
    return this.prisma.template.delete({
      where: { id }
    });
  }

  async createElement(payload: UpsertElementInput) {
    return this.prisma.element.create({
      data: {
        legacyId: await this.nextLegacyIdFor("element"),
        name: payload.name,
        thumbLabel: payload.thumbLabel,
        content: payload.content ?? "",
        status: payload.status ?? "active",
        category: payload.category
      }
    });
  }

  async updateElement(id: string, payload: UpsertElementInput) {
    const current = await this.prisma.element.findUnique({
      where: { id }
    });

    if (!current) {
      throw new NotFoundException("Elemento nao encontrado.");
    }

    return this.prisma.element.update({
      where: { id },
      data: {
        name: payload.name,
        thumbLabel: payload.thumbLabel,
        content: payload.content ?? current.content,
        status: payload.status ?? current.status,
        category: payload.category
      }
    });
  }

  async deleteElement(id: string) {
    return this.prisma.element.delete({
      where: { id }
    });
  }

  async createNewsletterGroup(payload: UpsertNewsletterGroupInput) {
    return this.prisma.newsletterGroup.create({
      data: {
        legacyId: await this.nextLegacyIdFor("newsletterGroup"),
        name: payload.name,
        description: payload.description
      }
    });
  }

  async updateNewsletterGroup(id: string, payload: UpsertNewsletterGroupInput) {
    const current = await this.prisma.newsletterGroup.findUnique({
      where: { id }
    });

    if (!current) {
      throw new NotFoundException("Grupo de newsletter nao encontrado.");
    }

    return this.prisma.newsletterGroup.update({
      where: { id },
      data: {
        name: payload.name,
        description: payload.description
      }
    });
  }

  async createSystemEmail(payload: UpsertSystemEmailInput) {
    return this.prisma.systemEmail.create({
      data: {
        legacyId: await this.nextLegacyIdFor("systemEmail"),
        name: payload.name,
        email: payload.email.trim().toLowerCase(),
        area: payload.area,
        description: payload.description,
        value: payload.value
      }
    });
  }

  async updateSystemEmail(id: string, payload: UpsertSystemEmailInput) {
    const current = await this.prisma.systemEmail.findUnique({
      where: { id }
    });

    if (!current) {
      throw new NotFoundException("Email do sistema nao encontrado.");
    }

    return this.prisma.systemEmail.update({
      where: { id },
      data: {
        name: payload.name,
        email: payload.email.trim().toLowerCase(),
        area: payload.area,
        description: payload.description,
        value: payload.value
      }
    });
  }

  async deleteSystemEmail(id: string) {
    return this.prisma.systemEmail.delete({
      where: { id }
    });
  }

  async resetStatistics() {
    await this.prisma.section.updateMany({
      data: {
        visits: 0
      }
    });

    return { success: true };
  }

  private async ensureUniqueContentType(slug: string, currentId?: string) {
    const existing = await this.prisma.contentType.findFirst({
      where: {
        slug,
        ...(currentId ? { NOT: { id: currentId } } : {})
      }
    });

    if (existing) {
      throw new BadRequestException("Ja existe uma mascara com este slug.");
    }
  }

  private async ensureUniquePermission(code: string, currentId?: string) {
    const existing = await this.prisma.permission.findFirst({
      where: {
        code,
        ...(currentId ? { NOT: { id: currentId } } : {})
      }
    });

    if (existing) {
      throw new BadRequestException("Ja existe uma permissao com este codigo.");
    }
  }

  private async ensureUniqueApplicationName(name: string, currentId?: string) {
    const existing = await this.prisma.legacyApplication.findFirst({
      where: {
        name,
        ...(currentId ? { NOT: { id: currentId } } : {})
      }
    });

    if (existing) {
      throw new BadRequestException("Ja existe um aplicativo com este nome.");
    }
  }

  private async ensureUniqueTemplate(slug: string, currentId?: string) {
    const existing = await this.prisma.template.findFirst({
      where: {
        slug,
        ...(currentId ? { NOT: { id: currentId } } : {})
      }
    });

    if (existing) {
      throw new BadRequestException("Ja existe um template com este slug.");
    }
  }

  private async ensureRolePermissions(permissionIds: string[]) {
    if (permissionIds.length === 0) {
      return;
    }

    const count = await this.prisma.permission.count({
      where: {
        id: {
          in: permissionIds
        }
      }
    });

    if (count !== permissionIds.length) {
      throw new BadRequestException("Uma ou mais permissoes sao invalidas.");
    }
  }

  private async ensureRoleIds(roleIds: string[]) {
    if (roleIds.length === 0) {
      return;
    }

    const count = await this.prisma.role.count({
      where: {
        id: {
          in: roleIds
        }
      }
    });

    if (count !== roleIds.length) {
      throw new BadRequestException("Um ou mais grupos sao invalidos.");
    }
  }

  private async ensureSectionIds(sectionIds: string[]) {
    if (sectionIds.length === 0) {
      return;
    }

    const count = await this.prisma.section.count({
      where: {
        id: {
          in: sectionIds
        }
      }
    });

    if (count !== sectionIds.length) {
      throw new BadRequestException("Uma ou mais secoes sao invalidas.");
    }
  }

  private async ensureContentTypeIds(contentTypeIds: string[]) {
    if (contentTypeIds.length === 0) {
      return;
    }

    const count = await this.prisma.contentType.count({
      where: {
        id: {
          in: contentTypeIds
        }
      }
    });

    if (count !== contentTypeIds.length) {
      throw new BadRequestException("Uma ou mais mascaras sao invalidas.");
    }
  }

  private async ensureParentRole(parentRoleId?: string, currentRoleId?: string) {
    if (!parentRoleId) {
      return;
    }

    if (currentRoleId && parentRoleId === currentRoleId) {
      throw new BadRequestException("Um grupo nao pode ser superior de si mesmo.");
    }

    const role = await this.prisma.role.findUnique({
      where: { id: parentRoleId }
    });

    if (!role) {
      throw new BadRequestException("Grupo superior invalido.");
    }
  }

  private async ensureRoleApplication(roleId: string, appId: string, currentId?: string) {
    const [role, app, duplicate] = await Promise.all([
      this.prisma.role.findUnique({ where: { id: roleId } }),
      this.prisma.legacyApplication.findUnique({ where: { id: appId } }),
      this.prisma.roleApplicationAccess.findFirst({
        where: {
          roleId,
          appId,
          ...(currentId ? { NOT: { id: currentId } } : {})
        }
      })
    ]);

    if (!role) {
      throw new BadRequestException("Grupo nao encontrado.");
    }

    if (!app) {
      throw new BadRequestException("Aplicativo nao encontrado.");
    }

    if (duplicate) {
      throw new BadRequestException("Ja existe permissao cadastrada para este grupo e aplicativo.");
    }
  }

  private normalizeCpf(cpf?: string | null) {
    if (!cpf) {
      return null;
    }

    const digits = cpf.replace(/\D/g, "");
    return digits.length > 0 ? digits : null;
  }

  private async ensureUniqueUserIdentity(
    identity: {
      email: string;
      username: string | null;
      cpf: string | null;
    },
    currentUserId?: string
  ) {
    const matches = await this.prisma.user.findMany({
      where: {
        OR: [
          { email: identity.email },
          ...(identity.username ? [{ username: identity.username }] : []),
          ...(identity.cpf ? [{ cpf: identity.cpf }] : [])
        ]
      }
    });

    for (const match of matches) {
      if (currentUserId && match.id === currentUserId) {
        continue;
      }

      if (match.email === identity.email) {
        throw new BadRequestException("Ja existe um usuario com este e-mail.");
      }

      if (identity.username && match.username === identity.username) {
        throw new BadRequestException("Ja existe um usuario com este username.");
      }

      if (identity.cpf && match.cpf === identity.cpf) {
        throw new BadRequestException("Ja existe um usuario com este CPF.");
      }
    }
  }

  private ensureRoleMenus(menuAccesses: Array<{ topMenu: string; viewKey: string }>) {
    const uniqueViews = new Set<string>();

    for (const menuAccess of menuAccesses) {
      if (!menuAccess.topMenu || !menuAccess.viewKey) {
        throw new BadRequestException("Menu de grupo invalido.");
      }

      const compositeKey = `${menuAccess.topMenu}:${menuAccess.viewKey}`;

      if (uniqueViews.has(compositeKey)) {
        throw new BadRequestException("Existem views duplicadas no menu do grupo.");
      }

      uniqueViews.add(compositeKey);
    }
  }

  private async resolveRoleApplicationAccesses(payload: UpsertRoleInput) {
    const viewToApplicationName: Partial<Record<string, string>> = {
      "content-list": "Conteúdo",
      "content-editor": "Conteúdo",
      "sections-tree": "Seção",
      "section-editor": "Seção",
      masks: "Máscara",
      templates: "Templates",
      elements: "Blocos de Conteúdo",
      permissions: "Permissões",
      groups: "Grupos",
      users: "Usuários",
      applications: "Aplicativos",
      emails: "Email",
      statistics: "Estatísticas",
      newsletter: "Newsletter"
    };

    const requestedApplicationNames = new Set<string>();

    for (const menuAccess of payload.menuAccesses ?? []) {
      const applicationName = viewToApplicationName[menuAccess.viewKey];

      if (applicationName) {
        requestedApplicationNames.add(applicationName);
      }
    }

    if ((payload.contentTypeIds ?? []).length > 0) {
      requestedApplicationNames.add("Máscara");
    }

    if ((payload.sectionIds ?? []).length > 0) {
      requestedApplicationNames.add("Seção");
    }

    if (requestedApplicationNames.size === 0) {
      return [];
    }

    const applications = await this.prisma.legacyApplication.findMany({
      where: {
        name: {
          in: Array.from(requestedApplicationNames)
        }
      }
    });

    return applications.map((application: (typeof applications)[number]) => ({
      appId: application.id,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
      canAccess: true
    }));
  }

  private toSlug(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}
