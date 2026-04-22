import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";

const prisma = new PrismaClient();

type SeedSection = {
  name: string;
  slug: string;
  description: string;
  order: number;
  parentSlug?: string;
};

type SeedContent = {
  title: string;
  slug: string;
  excerpt: string;
  body: string[];
  sectionSlug: string;
  contentTypeSlug: string;
  seoDescription: string;
  keywords: string;
};

async function main() {
  const resetMode = process.env.SEED_RESET === "true";

  const permissions = [
    { code: "sections.read", description: "Ler secoes" },
    { code: "sections.write", description: "Gerenciar secoes" },
    { code: "contents.read", description: "Ler conteudos no CMS" },
    { code: "contents.write", description: "Gerenciar conteudos" },
    { code: "templates.read", description: "Ler templates" },
    { code: "templates.write", description: "Gerenciar templates" },
    { code: "elements.read", description: "Ler elementos" },
    { code: "elements.write", description: "Gerenciar elementos" },
    { code: "users.read", description: "Ler usuarios" },
    { code: "users.write", description: "Gerenciar usuarios" },
    { code: "roles.read", description: "Ler grupos e perfis" },
    { code: "roles.write", description: "Gerenciar grupos e perfis" },
    { code: "permissions.read", description: "Ler permissoes" },
    { code: "permissions.write", description: "Gerenciar permissoes" },
    { code: "newsletters.read", description: "Ler campanhas" },
    { code: "privacy.read", description: "Ler pedidos LGPD" },
    { code: "management.read", description: "Ler cadastros administrativos" },
    { code: "management.write", description: "Gerenciar cadastros administrativos" }
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        description: permission.description
      },
      create: permission
    });
  }

  const allPermissions = await prisma.permission.findMany();
  const permissionByCode = new Map(allPermissions.map((permission) => [permission.code, permission]));

  const roleDefinitions = [
    {
      name: "Administrador",
      description: "Acesso total ao MVP",
      functionName: "Administrador",
      permissionCodes: allPermissions.map((permission) => permission.code),
      menuAccesses: [
        { topMenu: "administration", viewKey: "permissions" },
        { topMenu: "administration", viewKey: "groups" },
        { topMenu: "administration", viewKey: "users" },
        { topMenu: "administration", viewKey: "statistics" },
        { topMenu: "system", viewKey: "applications" },
        { topMenu: "system", viewKey: "emails" },
        { topMenu: "content", viewKey: "content-list" },
        { topMenu: "content", viewKey: "sections-tree" },
        { topMenu: "content", viewKey: "templates" },
        { topMenu: "content", viewKey: "masks" },
        { topMenu: "content", viewKey: "elements" },
        { topMenu: "newsletter", viewKey: "newsletter" }
      ]
    },
    {
      name: "Desenvolvedor",
      description: "Responsavel pela criacao e manutencao dos templates internos e externos. Cria secoes.",
      functionName: "Desenvolvedor",
      permissionCodes: [
        "sections.read",
        "sections.write",
        "contents.read",
        "contents.write",
        "templates.read",
        "templates.write",
        "elements.read",
        "elements.write",
        "management.read",
        "management.write"
      ],
      menuAccesses: [
        { topMenu: "content", viewKey: "content-list" },
        { topMenu: "content", viewKey: "sections-tree" },
        { topMenu: "content", viewKey: "templates" },
        { topMenu: "content", viewKey: "masks" },
        { topMenu: "content", viewKey: "elements" },
        { topMenu: "system", viewKey: "applications" }
      ]
    },
    {
      name: "Publicador Geral",
      description: "Responsavel pela publicacao dos conteudos dinamicos e validacao da newsletter.",
      functionName: "Publicador",
      permissionCodes: [
        "contents.read",
        "contents.write",
        "sections.read",
        "templates.read",
        "newsletters.read",
        "management.read"
      ],
      menuAccesses: [
        { topMenu: "content", viewKey: "content-list" },
        { topMenu: "content", viewKey: "sections-tree" },
        { topMenu: "newsletter", viewKey: "newsletter" }
      ]
    },
    {
      name: "Editor",
      description: "Opera conteudos, secoes e leitura administrativa",
      functionName: "Editor",
      permissionCodes: [
        "sections.read",
        "sections.write",
        "contents.read",
        "contents.write",
        "templates.read",
        "management.read"
      ],
      menuAccesses: [
        { topMenu: "content", viewKey: "content-list" },
        { topMenu: "content", viewKey: "sections-tree" }
      ]
    },
    {
      name: "Marketing",
      description: "Opera comunicacao, newsletters e leitura do painel",
      functionName: "Editor",
      permissionCodes: ["contents.read", "templates.read", "newsletters.read", "management.read"],
      menuAccesses: [
        { topMenu: "content", viewKey: "content-list" },
        { topMenu: "newsletter", viewKey: "newsletter" }
      ]
    },
    {
      name: "LGPD",
      description: "Acompanha solicitacoes de privacidade e governanca",
      functionName: "Administrador",
      permissionCodes: ["privacy.read", "management.read"],
      menuAccesses: [{ topMenu: "administration", viewKey: "statistics" }]
    }
  ];

  const roleMap = new Map<string, Awaited<ReturnType<typeof prisma.role.upsert>>>();

  for (const roleDefinition of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { name: roleDefinition.name },
      update: {
        description: roleDefinition.description,
        functionName: roleDefinition.functionName,
        status: "Ativo"
      },
      create: {
        name: roleDefinition.name,
        description: roleDefinition.description,
        functionName: roleDefinition.functionName,
        status: "Ativo"
      }
    });

    roleMap.set(role.name, role);

    if (resetMode) {
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id }
      });
      await prisma.roleMenuAccess.deleteMany({
        where: { roleId: role.id }
      });
    }

    for (const permissionCode of roleDefinition.permissionCodes) {
      const permission = permissionByCode.get(permissionCode);

      if (!permission) {
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
    }

    for (const menuAccess of roleDefinition.menuAccesses) {
      await prisma.roleMenuAccess.upsert({
        where: {
          roleId_topMenu_viewKey: {
            roleId: role.id,
            topMenu: menuAccess.topMenu,
            viewKey: menuAccess.viewKey
          }
        },
        update: {},
        create: {
          roleId: role.id,
          topMenu: menuAccess.topMenu,
          viewKey: menuAccess.viewKey
        }
      });
    }
  }

  const applicationDefinitions = [
    { name: "Conteúdo", area: "Conteúdo", link: "/Manager/Conteudo.php", description: "Cadastro e listagem de conteúdos." },
    { name: "Seção", area: "Conteúdo", link: "/Manager/Secao.php", description: "Navegação, menus e arquitetura de informação." },
    { name: "Templates", area: "Conteúdo", link: "/Manager/Template.php", description: "Cadastro de templates." },
    { name: "Máscara", area: "Conteúdo", link: "/Manager/Mascara.php", description: "Máscaras de conteúdo." },
    { name: "Blocos de Conteúdo", area: "Conteúdo", link: "/Manager/Elemento.php", description: "Elementos e blocos customizados." },
    { name: "Permissões", area: "Administração", link: "/Manager/Permissao.php", description: "Permissões por grupo e aplicativo." },
    { name: "Grupos", area: "Administração", link: "/Manager/Grupos.php", description: "Cadastro de grupos e workflow." },
    { name: "Usuários", area: "Administração", link: "/Manager/Usuarios.php", description: "Cadastro de usuários." },
    { name: "Email", area: "Sistema", link: "/Manager/Email.php", description: "E-mails utilizados pelo portal." },
    { name: "Aplicativos", area: "Sistema", link: "/Manager/Aplicativos.php", description: "Cadastro de aplicativos e áreas de menu." },
    { name: "Estatísticas", area: "Administração", link: "/Manager/Estatistica.php", description: "Acessos por seção." }
  ];

  const applicationMap = new Map<string, Awaited<ReturnType<typeof prisma.legacyApplication.upsert>>>();

  for (const application of applicationDefinitions) {
    const saved = await prisma.legacyApplication.upsert({
      where: { name: application.name },
      update: application,
      create: application
    });

    applicationMap.set(application.name, saved);
  }

  const roleAccessDefinitions = [
    { role: "Administrador", app: "Conteúdo", canCreate: true, canUpdate: true, canDelete: true, canAccess: true },
    { role: "Administrador", app: "Seção", canCreate: true, canUpdate: true, canDelete: true, canAccess: true },
    { role: "Administrador", app: "Templates", canCreate: true, canUpdate: true, canDelete: true, canAccess: true },
    { role: "Administrador", app: "Máscara", canCreate: true, canUpdate: true, canDelete: true, canAccess: true },
    { role: "Administrador", app: "Blocos de Conteúdo", canCreate: true, canUpdate: true, canDelete: true, canAccess: true },
    { role: "Administrador", app: "Permissões", canCreate: true, canUpdate: true, canDelete: true, canAccess: true },
    { role: "Administrador", app: "Grupos", canCreate: true, canUpdate: true, canDelete: true, canAccess: true },
    { role: "Administrador", app: "Usuários", canCreate: true, canUpdate: true, canDelete: true, canAccess: true },
    { role: "Administrador", app: "Email", canCreate: true, canUpdate: true, canDelete: true, canAccess: true },
    { role: "Administrador", app: "Aplicativos", canCreate: true, canUpdate: true, canDelete: true, canAccess: true },
    { role: "Administrador", app: "Estatísticas", canCreate: false, canUpdate: true, canDelete: true, canAccess: true },
    { role: "Desenvolvedor", app: "Conteúdo", canCreate: true, canUpdate: true, canDelete: true, canAccess: true },
    { role: "Desenvolvedor", app: "Seção", canCreate: true, canUpdate: true, canDelete: true, canAccess: true },
    { role: "Desenvolvedor", app: "Templates", canCreate: true, canUpdate: true, canDelete: true, canAccess: true },
    { role: "Desenvolvedor", app: "Máscara", canCreate: true, canUpdate: true, canDelete: true, canAccess: true },
    { role: "Desenvolvedor", app: "Blocos de Conteúdo", canCreate: true, canUpdate: true, canDelete: true, canAccess: true },
    { role: "Publicador Geral", app: "Conteúdo", canCreate: true, canUpdate: true, canDelete: true, canAccess: true },
    { role: "Publicador Geral", app: "Seção", canCreate: true, canUpdate: true, canDelete: false, canAccess: true },
    { role: "Editor", app: "Conteúdo", canCreate: true, canUpdate: true, canDelete: false, canAccess: true },
    { role: "Marketing", app: "Email", canCreate: false, canUpdate: true, canDelete: false, canAccess: true },
    { role: "LGPD", app: "Estatísticas", canCreate: false, canUpdate: true, canDelete: false, canAccess: true }
  ];

  if (resetMode) {
    await prisma.roleApplicationAccess.deleteMany({});
  }

  for (const access of roleAccessDefinitions) {
    const role = roleMap.get(access.role);
    const app = applicationMap.get(access.app);

    if (!role || !app) {
      continue;
    }

    await prisma.roleApplicationAccess.upsert({
      where: {
        roleId_appId: {
          roleId: role.id,
          appId: app.id
        }
      },
      update: resetMode
        ? {
            canCreate: access.canCreate,
            canUpdate: access.canUpdate,
            canDelete: access.canDelete,
            canAccess: access.canAccess
          }
        : {},
      create: {
        roleId: role.id,
        appId: app.id,
        canCreate: access.canCreate,
        canUpdate: access.canUpdate,
        canDelete: access.canDelete,
        canAccess: access.canAccess
      }
    });
  }

  const seedContentTypes = [
    {
      name: "Pagina editorial",
      slug: "pagina-editorial",
      description: "Tipo base para paginas e noticias",
      allowRichText: true,
      allowFeaturedMedia: true,
      schemaJson: {
        fields: ["title", "excerpt", "body", "seo"]
      }
    },
    {
      name: "Mascara institucional",
      slug: "mascara-institucional",
      description: "Estrutura para paginas de apresentacao e posicionamento.",
      allowRichText: true,
      allowFeaturedMedia: true,
      schemaJson: {
        fields: ["title", "excerpt", "body", "highlights", "seo"]
      }
    },
    {
      name: "Mascara de case",
      slug: "mascara-case",
      description: "Estrutura orientada a desafios, entregas e resultados.",
      allowRichText: true,
      allowFeaturedMedia: true,
      schemaJson: {
        fields: ["title", "challenge", "solution", "result", "seo"]
      }
    },
    {
      name: "Mascara documental",
      slug: "mascara-documental",
      description: "Estrutura para guias, notas tecnicas e materiais de apoio.",
      allowRichText: true,
      allowFeaturedMedia: false,
      schemaJson: {
        fields: ["title", "summary", "body", "attachments", "seo"]
      }
    }
  ];

  const contentTypeMap = new Map<string, Awaited<ReturnType<typeof prisma.contentType.upsert>>>();

  for (const entry of seedContentTypes) {
    const saved = await prisma.contentType.upsert({
      where: { slug: entry.slug },
      update: entry,
      create: entry
    });

    contentTypeMap.set(entry.slug, saved);
  }

  const seedTemplates = [
    {
      name: "Pagina padrao",
      slug: "pagina-padrao",
      description: "Template base para o portal",
      componentKey: "default-page",
      configSchema: { layout: "default" }
    },
    {
      name: "Lista noticias",
      slug: "lista-noticias",
      description: "Template de listagem de noticias",
      componentKey: "news-list",
      configSchema: { layout: "list" }
    },
    {
      name: "Interna detalhe",
      slug: "interna-detalhe",
      description: "Template interno de detalhe",
      componentKey: "detail-page",
      configSchema: { layout: "detail" }
    }
  ];

  const templateMap = new Map<string, Awaited<ReturnType<typeof prisma.template.upsert>>>();

  for (const templateEntry of seedTemplates) {
    const savedTemplate = await prisma.template.upsert({
      where: { slug: templateEntry.slug },
      update: {
        ...templateEntry,
        isActive: true
      },
      create: {
        ...templateEntry,
        isActive: true
      }
    });

    templateMap.set(templateEntry.slug, savedTemplate);
  }

  const template = templateMap.get("pagina-padrao");

  if (!template) {
    throw new Error("Template base nao encontrado no seed.");
  }

  const seedElements = [
    {
      name: "Barra de progresso",
      thumbLabel: "Web Design",
      content: "<div class='progress-bars'>Barra de progresso</div>",
      status: "active",
      category: "Destaques"
    },
    {
      name: "Destaque Leia Mais",
      thumbLabel: "Leia Mais",
      content: "<div class='highlight-read-more'>Leia mais</div>",
      status: "active",
      category: "Destaques"
    },
    {
      name: "Galeria Carrossel",
      thumbLabel: "Galeria Carrossel",
      content: "<div class='gallery-carousel'>Galeria</div>",
      status: "inactive",
      category: "Galeria de Imagens"
    }
  ];

  for (const element of seedElements) {
    const existing = await prisma.element.findFirst({
      where: { name: element.name }
    });

    if (existing) {
      await prisma.element.update({
        where: { id: existing.id },
        data: element
      });
    } else {
      await prisma.element.create({
        data: element
      });
    }
  }

  const sections: SeedSection[] = [
    {
      name: "Institucional",
      slug: "institucional",
      description: "Paginas institucionais e posicionamento da empresa.",
      order: 1
    },
    {
      name: "Sobre",
      slug: "sobre",
      description: "Historia, proposta e contexto institucional.",
      order: 1,
      parentSlug: "institucional"
    },
    {
      name: "Servicos",
      slug: "servicos",
      description: "Linhas de atuacao e entregas centrais.",
      order: 2,
      parentSlug: "institucional"
    },
    {
      name: "Noticias",
      slug: "noticias",
      description: "Novidades, comunicados e anuncios do time.",
      order: 2
    },
    {
      name: "Cases",
      slug: "cases",
      description: "Resultados entregues e historias de projeto.",
      order: 3
    },
    {
      name: "Documentos",
      slug: "documentos",
      description: "Materiais de apoio, downloads e documentos institucionais.",
      order: 4
    }
  ];

  const sectionMap = new Map<string, Awaited<ReturnType<typeof prisma.section.upsert>>>();

  for (const section of sections) {
    const parent = section.parentSlug ? sectionMap.get(section.parentSlug) ?? null : null;
    const path = parent ? `${parent.path}/${section.slug}` : `/${section.slug}`;

    const saved = await prisma.section.upsert({
      where: { slug: section.slug },
      update: {
        name: section.name,
        description: section.description,
        order: section.order,
        parentId: parent?.id ?? null,
        path,
        visibleInMenu: true,
        isActive: true
      },
      create: {
        name: section.name,
        slug: section.slug,
        description: section.description,
        order: section.order,
        parentId: parent?.id ?? null,
        path,
        visibleInMenu: true,
        isActive: true
      }
    });

    sectionMap.set(section.slug, saved);
  }

  const visitSeeds = new Map([
    ["institucional", 148],
    ["sobre", 92],
    ["servicos", 134],
    ["noticias", 716],
    ["cases", 87],
    ["documentos", 56]
  ]);

  for (const [slug, visits] of visitSeeds.entries()) {
    const section = sectionMap.get(slug);

    if (!section) {
      continue;
    }

    await prisma.section.update({
      where: { id: section.id },
      data: { visits }
    });
  }

  if (resetMode) {
    await prisma.roleSectionAccess.deleteMany({});
    await prisma.roleContentTypeAccess.deleteMany({});
  }

  const adminRole = roleMap.get("Administrador");
  const developerRole = roleMap.get("Desenvolvedor");
  const publisherRole = roleMap.get("Publicador Geral");
  const editorRole = roleMap.get("Editor");

  for (const role of [adminRole, developerRole, publisherRole, editorRole]) {
    if (!role) {
      continue;
    }

    for (const section of sectionMap.values()) {
      await prisma.roleSectionAccess.upsert({
        where: {
          roleId_sectionId: {
            roleId: role.id,
            sectionId: section.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          sectionId: section.id
        }
      });
    }
  }

  for (const role of [adminRole, developerRole]) {
    if (!role) {
      continue;
    }

    for (const contentType of contentTypeMap.values()) {
      await prisma.roleContentTypeAccess.upsert({
        where: {
          roleId_contentTypeId: {
            roleId: role.id,
            contentTypeId: contentType.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          contentTypeId: contentType.id
        }
      });
    }
  }

  for (const role of [publisherRole, editorRole]) {
    if (!role) {
      continue;
    }

    for (const slug of ["pagina-editorial", "mascara-institucional"]) {
      const contentType = contentTypeMap.get(slug);

      if (!contentType) {
        continue;
      }

      await prisma.roleContentTypeAccess.upsert({
        where: {
          roleId_contentTypeId: {
            roleId: role.id,
            contentTypeId: contentType.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          contentTypeId: contentType.id
        }
      });
    }
  }

  const systemEmails = [
    {
      name: "Central de Atendimento",
      email: "contato@abbatech.local",
      area: "Contato",
      description: "Endereço principal para relacionamento com o usuário.",
      value: "portal"
    },
    {
      name: "Newsletter Abbatech",
      email: "newsletter@abbatech.local",
      area: "Newsletter",
      description: "Remetente padrão para campanhas editoriais.",
      value: "newsletter"
    },
    {
      name: "RH Interno",
      email: "rh@abbatech.local",
      area: "RH",
      description: "Comunicação de pessoas e processos internos.",
      value: "interno"
    }
  ];

  for (const systemEmail of systemEmails) {
    const existing = await prisma.systemEmail.findFirst({
      where: {
        name: systemEmail.name
      }
    });

    if (existing) {
      await prisma.systemEmail.update({
        where: { id: existing.id },
        data: systemEmail
      });
    } else {
      await prisma.systemEmail.create({
        data: systemEmail
      });
    }
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@abbatech.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Refresh123!";

  const seedUsers = [
    {
      name: "Administrador Abbatech",
      email: adminEmail,
      username: "felipe",
      cpf: "11111111111",
      password: adminPassword,
      isSuperAdmin: true,
      roleNames: ["Administrador", "Desenvolvedor", "Publicador Geral"]
    },
    {
      name: "Paula Conteudo",
      email: "conteudo@abbatech.local",
      username: "conteudo",
      cpf: "22222222222",
      password: "Refresh123!",
      isSuperAdmin: false,
      roleNames: ["Editor"]
    },
    {
      name: "Marcos Marketing",
      email: "marketing@abbatech.local",
      username: "marketing",
      cpf: "33333333333",
      password: "Refresh123!",
      isSuperAdmin: false,
      roleNames: ["Marketing"]
    },
    {
      name: "Livia Privacidade",
      email: "lgpd@abbatech.local",
      username: "lgpd",
      cpf: "44444444444",
      password: "Refresh123!",
      isSuperAdmin: false,
      roleNames: ["LGPD"]
    }
  ];

  let adminUserId = "";

  for (const seedUser of seedUsers) {
    const user = await prisma.user.upsert({
      where: { email: seedUser.email },
      update: {
        name: seedUser.name,
        username: seedUser.username,
        cpf: seedUser.cpf,
        passwordHash: await hash(seedUser.password),
        isActive: true,
        isSuperAdmin: seedUser.isSuperAdmin,
        consentVersion: "1.0"
      },
      create: {
        name: seedUser.name,
        email: seedUser.email,
        username: seedUser.username,
        cpf: seedUser.cpf,
        passwordHash: await hash(seedUser.password),
        isActive: true,
        isSuperAdmin: seedUser.isSuperAdmin,
        consentVersion: "1.0",
        consentAt: new Date()
      }
    });

    if (seedUser.email === adminEmail) {
      adminUserId = user.id;
    }

    if (resetMode) {
      await prisma.userRole.deleteMany({
        where: { userId: user.id }
      });
    }

    for (const roleName of seedUser.roleNames) {
      const role = roleMap.get(roleName);

      if (!role) {
        continue;
      }

      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: role.id
          }
        },
        update: {},
        create: {
          userId: user.id,
          roleId: role.id
        }
      });
    }
  }

  const newsletterGroups = [
    {
      name: "Clientes ativos",
      description: "Lista base para comunicados voltados aos clientes em operacao."
    },
    {
      name: "Leads portal",
      description: "Interessados em conteudos, novidades e demonstracoes da plataforma."
    }
  ];

  const newsletterGroupMap = new Map<
    string,
    Awaited<ReturnType<typeof prisma.newsletterGroup.upsert>>
  >();

  for (const group of newsletterGroups) {
    const saved = await prisma.newsletterGroup.upsert({
      where: { name: group.name },
      update: group,
      create: group
    });

    newsletterGroupMap.set(group.name, saved);
  }

  const recipients = [
    {
      email: "contato@cliente-exemplo.com",
      name: "Contato Cliente Exemplo",
      groupName: "Clientes ativos"
    },
    {
      email: "time@empresa-parceira.com",
      name: "Time Empresa Parceira",
      groupName: "Clientes ativos"
    },
    {
      email: "lead@interessado.com",
      name: "Lead Interessado",
      groupName: "Leads portal"
    }
  ];

  for (const recipient of recipients) {
    const group = newsletterGroupMap.get(recipient.groupName);

    if (!group) {
      continue;
    }

    await prisma.newsletterRecipient.upsert({
      where: { email: recipient.email },
      update: {
        name: recipient.name,
        groupId: group.id,
        consentAt: new Date()
      },
      create: {
        email: recipient.email,
        name: recipient.name,
        groupId: group.id,
        consentAt: new Date()
      }
    });
  }

  const leadGroup = newsletterGroupMap.get("Leads portal");

  if (leadGroup) {
    const existingCampaign = await prisma.newsletterCampaign.findFirst({
      where: { name: "Lancamento do portal MVP" }
    });

    if (existingCampaign) {
      await prisma.newsletterCampaign.update({
        where: { id: existingCampaign.id },
        data: {
          subject: "Novo portal Abbatech no ar",
          senderName: "Equipe Abbatech",
          senderEmail: "noreply@abbatech.local",
          bodyHtml: "<p>O novo portal Abbatech ja esta em demonstracao com CMS e API integrados.</p>",
          bodyText: "O novo portal Abbatech ja esta em demonstracao com CMS e API integrados.",
          status: "draft",
          recipientGroupId: leadGroup.id
        }
      });
    } else {
      await prisma.newsletterCampaign.create({
        data: {
          name: "Lancamento do portal MVP",
          subject: "Novo portal Abbatech no ar",
          senderName: "Equipe Abbatech",
          senderEmail: "noreply@abbatech.local",
          bodyHtml: "<p>O novo portal Abbatech ja esta em demonstracao com CMS e API integrados.</p>",
          bodyText: "O novo portal Abbatech ja esta em demonstracao com CMS e API integrados.",
          status: "draft",
          recipientGroupId: leadGroup.id
        }
      });
    }
  }

  const contents: SeedContent[] = [
    {
      title: "Nova plataforma Abbatech",
      slug: "nova-plataforma-abbatech",
      excerpt: "O MVP do novo portal ja esta operando com API, CMS e publicacao inicial.",
      body: [
        "A Abbatech agora conta com uma base moderna separando portal, CMS e API.",
        "Este conteudo inicial foi criado automaticamente para validar o fluxo editorial.",
        "A partir daqui, o time pode cadastrar novas secoes e publicar novos materiais."
      ],
      sectionSlug: "noticias",
      contentTypeSlug: "pagina-editorial",
      seoDescription: "Portal reconstruido com CMS moderno, SEO e governanca editorial.",
      keywords: "abbatech, portal, cms, refresh"
    },
    {
      title: "Como estruturamos o Refresh para o time editorial",
      slug: "estrutura-refresh-time-editorial",
      excerpt: "Uma visao rapida do fluxo entre autenticacao, gestao de secoes e publicacao de conteudos.",
      body: [
        "O Refresh foi desenhado para separar operacao editorial, API e experiencia publica sem carregar as limitacoes do legado.",
        "No MVP atual, a equipe consegue autenticar, cadastrar secoes, editar publicacoes e validar o reflexo imediato no portal.",
        "Esse desenho reduz acoplamento, facilita evolucao do front e cria uma base mais segura para futuros modulos."
      ],
      sectionSlug: "noticias",
      contentTypeSlug: "pagina-editorial",
      seoDescription: "Fluxo editorial do Refresh e da nova arquitetura da Abbatech.",
      keywords: "refresh, editorial, cms, arquitetura"
    },
    {
      title: "Quem somos",
      slug: "quem-somos",
      excerpt: "A Abbatech combina estrategia, produto e implementacao para projetos digitais com necessidade de escala.",
      body: [
        "Somos um time orientado a resolver operacao e produto com uma base tecnica que suporta crescimento.",
        "Atuamos em projetos que exigem clareza de dominio, automacao e experiencia digital consistente.",
        "A nova plataforma nasce para refletir essa mesma filosofia internamente."
      ],
      sectionSlug: "sobre",
      contentTypeSlug: "mascara-institucional",
      seoDescription: "Apresentacao institucional da Abbatech e da proposta da nova plataforma.",
      keywords: "abbatech, institucional, sobre, empresa"
    },
    {
      title: "Linhas de servico da Abbatech",
      slug: "linhas-de-servico-abbatech",
      excerpt: "Consultoria, evolucao de produto e operacao digital com foco em implementacao pragmatica.",
      body: [
        "A Abbatech atua com diagnostico, estruturacao de fluxos, desenvolvimento de sistemas e modernizacao de experiencia digital.",
        "Nosso foco e tirar a operacao do improviso e levar o time para uma base mais governavel.",
        "Esse portal novo serve tambem como demonstracao da forma como desenhamos produtos internos e externos."
      ],
      sectionSlug: "servicos",
      contentTypeSlug: "mascara-institucional",
      seoDescription: "Resumo das principais linhas de servico da Abbatech.",
      keywords: "servicos, consultoria, produto, operacao digital"
    },
    {
      title: "Caso de modernizacao de CMS e portal",
      slug: "caso-modernizacao-cms-portal",
      excerpt: "Uma entrega focada em separar legado, API e camada de experiencia sem interromper a operacao.",
      body: [
        "Neste caso, o objetivo era reconstruir a base sem depender diretamente do codigo legado.",
        "A solucao envolveu um CMS administrativo novo, API centralizada, mapeamento de dominio e infraestrutura preparada para evolucao.",
        "O resultado e uma fundacao mais segura para SEO, publicacao e governanca editorial."
      ],
      sectionSlug: "cases",
      contentTypeSlug: "mascara-case",
      seoDescription: "Exemplo de caso de modernizacao de CMS, API e portal.",
      keywords: "case, cms, modernizacao, portal"
    },
    {
      title: "Guia rapido do portal e do CMS",
      slug: "guia-rapido-portal-cms",
      excerpt: "Documento inicial para orientar demonstracao interna e validacao do MVP.",
      body: [
        "Use o Refresh para entrar com o usuario seedado, cadastrar secoes e criar novos conteudos.",
        "O portal consome automaticamente os conteudos publicados e os apresenta na home e na pagina de detalhe.",
        "Esse fluxo serve como base para homologacao visual e para priorizacao das proximas entregas."
      ],
      sectionSlug: "documentos",
      contentTypeSlug: "mascara-documental",
      seoDescription: "Guia inicial de uso do portal e do CMS Refresh no MVP.",
      keywords: "guia, portal, cms, mvp"
    }
  ];

  for (const content of contents) {
    const section = sectionMap.get(content.sectionSlug);
    const contentType = contentTypeMap.get(content.contentTypeSlug);

    if (!section) {
      throw new Error(`Secao nao encontrada para o seed: ${content.sectionSlug}`);
    }

    if (!contentType) {
      throw new Error(`Mascara nao encontrada para o seed: ${content.contentTypeSlug}`);
    }

    const canonicalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100"}/${content.slug}`;
    const existing = await prisma.content.findUnique({
      where: { slug: content.slug },
      include: {
        seo: true
      }
    });

    const seo = existing?.seo
      ? await prisma.seoMetadata.update({
          where: { id: existing.seo.id },
          data: {
            title: content.title,
            description: content.seoDescription,
            keywords: content.keywords,
            canonicalUrl,
            robots: "index,follow"
          }
        })
      : await prisma.seoMetadata.create({
          data: {
            title: content.title,
            description: content.seoDescription,
            keywords: content.keywords,
            canonicalUrl,
            robots: "index,follow"
          }
        });

    const savedContent = existing
      ? await prisma.content.update({
          where: { id: existing.id },
          data: {
            title: content.title,
            excerpt: content.excerpt,
            body: content.body.join("\n\n"),
            status: "published",
            visibility: "public",
            publishedAt: existing.publishedAt ?? new Date(),
            sectionId: section.id,
            contentTypeId: contentType.id,
            templateId: template.id,
            seoId: seo.id,
            authorId: adminUserId
          }
        })
      : await prisma.content.create({
          data: {
            title: content.title,
            slug: content.slug,
            excerpt: content.excerpt,
            body: content.body.join("\n\n"),
            status: "published",
            visibility: "public",
            publishedAt: new Date(),
            sectionId: section.id,
            contentTypeId: contentType.id,
            templateId: template.id,
            seoId: seo.id,
            authorId: adminUserId
          }
        });

    const latestRevision = await prisma.contentRevision.findFirst({
      where: { contentId: savedContent.id },
      orderBy: { createdAt: "desc" }
    });

    const snapshot = {
      title: savedContent.title,
      slug: savedContent.slug,
      excerpt: savedContent.excerpt,
      body: savedContent.body,
      status: savedContent.status
    };

    if (!latestRevision || JSON.stringify(latestRevision.snapshot) !== JSON.stringify(snapshot)) {
      await prisma.contentRevision.create({
        data: {
          contentId: savedContent.id,
          editorId: adminUserId,
          snapshot
        }
      });
    }
  }

  const privacyCount = await prisma.privacyRequest.count();

  if (privacyCount === 0) {
    await prisma.privacyRequest.createMany({
      data: [
        {
          type: "access",
          subjectEmail: "titular@abbatech.local",
          description: "Exemplo inicial de solicitacao LGPD"
        },
        {
          type: "delete",
          subjectEmail: "remocao@abbatech.local",
          description: "Pedido de exclusao de dados em homologacao"
        }
      ]
    });
  }

  console.log(`Seed concluido. Admin: ${adminEmail}`);
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
