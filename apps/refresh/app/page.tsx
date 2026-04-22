"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";

type LoggedUser = {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  cpf?: string | null;
  permissions: string[];
  activeRoleId?: string | null;
  roles: Array<{
    id: string;
    name: string;
    description: string | null;
    functionName?: string | null;
    status?: string;
    menuAccesses: Array<{
      topMenu: TopMenuKey;
      viewKey: ViewKey;
    }>;
    appAccesses: Array<{
      id: string;
      name: string;
      area: string;
      link: string;
      canCreate: boolean;
      canUpdate: boolean;
      canDelete: boolean;
      canAccess: boolean;
    }>;
    permissions: string[];
  }>;
};

type Section = {
  id: string;
  legacyId?: number | null;
  name: string;
  slug: string;
  path: string;
  parentId: string | null;
  description: string | null;
  isActive: boolean;
  visibleInMenu: boolean;
  order: number;
  visits?: number;
  _count?: {
    children: number;
    contents: number;
  };
};

type Template = {
  id: string;
  legacyId?: number | null;
  name: string;
  slug: string;
  description?: string | null;
  componentKey?: string;
  isActive?: boolean;
  configSchema?: Record<string, unknown>;
};

type ContentType = {
  id: string;
  legacyId?: number | null;
  name: string;
  slug: string;
  description: string | null;
  allowRichText: boolean;
  allowFeaturedMedia: boolean;
  schemaJson: Record<string, unknown>;
  _count?: {
    contents: number;
  };
};

type Content = {
  id: string;
  legacyId?: number | null;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  status: string;
  visibility: string;
  publishedAt: string | null;
  sectionId: string;
  contentTypeId: string;
  templateId: string | null;
  section: {
    id: string;
    name: string;
  };
  contentType: {
    id: string;
    name: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string;
    canonicalUrl: string | null;
    robots: string | null;
  } | null;
  author?: {
    id: string;
    name: string;
  } | null;
};

type Permission = {
  id: string;
  legacyId?: number | null;
  code: string;
  description: string | null;
  roles: Array<{
    id: string;
    name: string;
  }>;
};

type Role = {
  id: string;
  legacyId?: number | null;
  name: string;
  description: string | null;
  functionName?: string | null;
  status?: string;
  parentRoleId?: string | null;
  parentRoleName?: string | null;
  permissions: Permission[];
  menuAccesses: Array<{
    topMenu: TopMenuKey;
    viewKey: ViewKey;
  }>;
  appAccesses: Array<{
    id: string;
    appId: string;
    appName: string;
    area: string;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canAccess: boolean;
  }>;
  sectionIds: string[];
  contentTypeIds: string[];
  users: Array<{
    id: string;
    name: string;
    email: string;
  }>;
};

type LegacyApplicationRecord = {
  id: string;
  legacyId?: number | null;
  name: string;
  area: string;
  link: string;
  description: string | null;
};

type RoleApplicationAccessRecord = {
  id: string;
  legacyId?: number | null;
  roleId: string;
  roleName: string;
  appId: string;
  appName: string;
  area: string;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canAccess: boolean;
};

type SystemEmailRecord = {
  id: string;
  legacyId?: number | null;
  name: string;
  email: string;
  area: string;
  description: string | null;
  value: string | null;
};

type ManagedElement = {
  id: string;
  legacyId?: number | null;
  name: string;
  thumbLabel: string | null;
  content: string;
  status: string;
  category: string | null;
};

type ManagedUser = {
  id: string;
  legacyId?: number | null;
  name: string;
  email: string;
  username?: string | null;
  cpf?: string | null;
  cnh?: string | null;
  status?: string;
  company?: string | null;
  jobTitle?: string | null;
  phone?: string | null;
  address?: string | null;
  zipCode?: string | null;
  city?: string | null;
  state?: string | null;
  secondaryAddress?: string | null;
  secondaryNumber?: string | null;
  secondaryComplement?: string | null;
  neighborhood?: string | null;
  notes?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  forcePasswordChange?: boolean;
  isActive: boolean;
  isSuperAdmin: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
  stats: {
    authoredContents: number;
    revisions: number;
  };
};

type NewsletterGroup = {
  id: string;
  legacyId?: number | null;
  name: string;
  description: string | null;
  createdAt: string;
  _count: {
    recipients: number;
    campaigns: number;
  };
};

type NewsletterCampaign = {
  id: string;
  legacyId?: number | null;
  name: string;
  subject: string;
  status: string;
  recipientGroup: {
    id: string;
    name: string;
  } | null;
  _count: {
    dispatches: number;
  };
};

type PrivacyRequest = {
  id: string;
  legacyId?: number | null;
  type: string;
  subjectEmail: string;
  description: string | null;
  status: string;
  createdAt: string;
};

type EditorMeta = {
  sections: Section[];
  templates: Template[];
  contentTypes: ContentType[];
};

type ManagementBootstrap = {
  contentTypes: ContentType[];
  users: ManagedUser[];
  roles: Role[];
  permissions: Permission[];
  applications: LegacyApplicationRecord[];
  roleApplicationAccesses: RoleApplicationAccessRecord[];
  systemEmails: SystemEmailRecord[];
  templates: Template[];
  elements: ManagedElement[];
  newsletterGroups: NewsletterGroup[];
  newsletterCampaigns: NewsletterCampaign[];
  privacyRequests: PrivacyRequest[];
};

type SectionFormState = {
  name: string;
  slug: string;
  description: string;
  order: string;
  parentId: string;
  visibleInMenu: boolean;
  isActive: boolean;
};

type ContentFormState = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  status: "draft" | "published" | "archived";
  visibility: "public" | "private";
  sectionId: string;
  contentTypeId: string;
  templateId: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  seoCanonicalUrl: string;
  seoRobots: string;
  publishDate: string;
  publishTime: string;
  startDate: string;
  endDate: string;
};

type ContentTypeFormState = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  allowRichText: boolean;
  allowFeaturedMedia: boolean;
};

type PermissionFormState = {
  id?: string;
  roleId: string;
  appId: string;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canAccess: boolean;
};

type ApplicationFormState = {
  id?: string;
  name: string;
  area: string;
  link: string;
  description: string;
};

type RoleFormState = {
  id?: string;
  name: string;
  description: string;
  functionName: string;
  status: string;
  parentRoleId: string;
  permissionIds: string[];
  menuAccessKeys: string[];
  sectionIds: string[];
  contentTypeIds: string[];
};

type UserFormState = {
  id?: string;
  name: string;
  email: string;
  username: string;
  cpf: string;
  cnh: string;
  status: string;
  company: string;
  jobTitle: string;
  phone: string;
  address: string;
  zipCode: string;
  city: string;
  state: string;
  secondaryAddress: string;
  secondaryNumber: string;
  secondaryComplement: string;
  neighborhood: string;
  notes: string;
  facebook: string;
  instagram: string;
  youtube: string;
  forcePasswordChange: boolean;
  password: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  roleIds: string[];
};

type TemplateFormState = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  componentKey: string;
  isActive: boolean;
};

type ElementFormState = {
  id?: string;
  name: string;
  thumbLabel: string;
  category: string;
  status: string;
  content: string;
};

type SystemEmailFormState = {
  id?: string;
  name: string;
  email: string;
  area: string;
  description: string;
  value: string;
};

type ViewKey =
  | "content-list"
  | "content-editor"
  | "sections-tree"
  | "section-editor"
  | "masks"
  | "templates"
  | "elements"
  | "users"
  | "groups"
  | "permissions"
  | "applications"
  | "emails"
  | "newsletter"
  | "statistics";

type TopMenuKey = "content" | "administration" | "system" | "newsletter";

type LegacyElement = {
  id: number;
  name: string;
  thumbLabel: string;
  category: string;
  status: "Ativo" | "Inativo";
};

type TreeSection = Section & {
  childrenNodes: TreeSection[];
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api/v1";

const emptySectionForm: SectionFormState = {
  name: "",
  slug: "",
  description: "",
  order: "1",
  parentId: "",
  visibleInMenu: true,
  isActive: true
};

const emptyContentForm: ContentFormState = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  status: "draft",
  visibility: "public",
  sectionId: "",
  contentTypeId: "",
  templateId: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  seoCanonicalUrl: "",
  seoRobots: "index,follow",
  publishDate: "21/04/2026",
  publishTime: "18:24",
  startDate: "21/04/2026",
  endDate: "21/04/2027"
};

const emptyContentTypeForm: ContentTypeFormState = {
  name: "",
  slug: "",
  description: "",
  allowRichText: true,
  allowFeaturedMedia: true
};

const emptyPermissionForm: PermissionFormState = {
  roleId: "",
  appId: "",
  canCreate: false,
  canUpdate: false,
  canDelete: false,
  canAccess: true
};

const emptyApplicationForm: ApplicationFormState = {
  name: "",
  area: "",
  link: "",
  description: ""
};

const emptyRoleForm: RoleFormState = {
  name: "",
  description: "",
  functionName: "",
  status: "Ativo",
  parentRoleId: "",
  permissionIds: [],
  menuAccessKeys: [],
  sectionIds: [],
  contentTypeIds: []
};

const emptyUserForm: UserFormState = {
  name: "",
  email: "",
  username: "",
  cpf: "",
  cnh: "",
  status: "Novo",
  company: "",
  jobTitle: "",
  phone: "",
  address: "",
  zipCode: "",
  city: "",
  state: "",
  secondaryAddress: "",
  secondaryNumber: "",
  secondaryComplement: "",
  neighborhood: "",
  notes: "",
  facebook: "",
  instagram: "",
  youtube: "",
  forcePasswordChange: false,
  password: "",
  isActive: true,
  isSuperAdmin: false,
  roleIds: []
};

const emptyTemplateForm: TemplateFormState = {
  name: "",
  slug: "",
  description: "",
  componentKey: "",
  isActive: true
};

const emptyElementForm: ElementFormState = {
  name: "",
  thumbLabel: "",
  category: "",
  status: "active",
  content: ""
};

const emptySystemEmailForm: SystemEmailFormState = {
  name: "",
  email: "",
  area: "",
  description: "",
  value: ""
};

const legacyElements: LegacyElement[] = [
  { id: 58, name: "Barra de progresso", thumbLabel: "Web Design", category: '200, "Destaques"', status: "Ativo" },
  { id: 54, name: "Destaque Leia Mais", thumbLabel: "Leia Mais", category: '200, "Destaques"', status: "Ativo" },
  { id: 57, name: "Galeria Carrossel", thumbLabel: "Galeria Carrossel", category: '201, "Galeria de Imagens"', status: "Inativo" },
  { id: 55, name: "Galeria Grade", thumbLabel: "Galeria Grade", category: '201, "Galeria de Imagens"', status: "Inativo" },
  { id: 56, name: "Galeria Tijolo", thumbLabel: "Galeria Tijolo", category: '201, "Galeria de Imagens"', status: "Inativo" },
  { id: 59, name: "Lista de Arquivos", thumbLabel: "Ata 15", category: '202, "Galeria de Arquivos"', status: "Inativo" }
];

const templateLibrary = [
  { id: "lib-1", title: "BEAUTIFUL CONTENT. RESPONSIVE.", accent: "from-slate-200 to-slate-100" },
  { id: "lib-2", title: "Headline / Text block", accent: "from-zinc-100 to-zinc-50" },
  { id: "lib-3", title: "Heading / Two line", accent: "from-neutral-100 to-neutral-50" },
  { id: "lib-4", title: "Heading with intro", accent: "from-stone-100 to-stone-50" },
  { id: "lib-5", title: "Hero image", accent: "from-yellow-200 to-sky-100" },
  { id: "lib-6", title: "Color card", accent: "from-pink-100 to-orange-100" },
  { id: "lib-7", title: "Blue content", accent: "from-sky-100 to-white" },
  { id: "lib-8", title: "Split columns", accent: "from-gray-100 to-white" },
  { id: "lib-9", title: "Simple footer text", accent: "from-zinc-100 to-white" }
];

const menuGroups: Record<TopMenuKey, Array<{ key: ViewKey; label: string }>> = {
  content: [
    { key: "content-list", label: "Conteúdo" },
    { key: "sections-tree", label: "Seção" },
    { key: "templates", label: "Templates" },
    { key: "masks", label: "Máscara" },
    { key: "elements", label: "Blocos de Conteúdo" }
  ],
  administration: [
    { key: "permissions", label: "Permissões" },
    { key: "groups", label: "Grupos" },
    { key: "users", label: "Usuários" },
    { key: "statistics", label: "Estatísticas" }
  ],
  system: [
    { key: "applications", label: "Aplicativos" },
    { key: "emails", label: "Email" }
  ],
  newsletter: [{ key: "newsletter", label: "Newsletter" }]
};

const permissionLabelMap: Record<string, string> = {
  "contents.read": "Consultar conteudos",
  "contents.write": "Incluir, editar e excluir conteudos",
  "sections.read": "Consultar secoes",
  "sections.write": "Incluir, editar e excluir secoes",
  "templates.read": "Consultar templates",
  "templates.write": "Incluir, editar e excluir templates",
  "elements.read": "Consultar blocos de conteudo",
  "elements.write": "Incluir, editar e excluir blocos de conteudo",
  "users.read": "Consultar usuarios",
  "users.write": "Incluir, editar e excluir usuarios",
  "roles.read": "Consultar grupos",
  "roles.write": "Incluir, editar e excluir grupos",
  "permissions.read": "Consultar permissoes",
  "permissions.write": "Incluir, editar e excluir permissoes",
  "applications.read": "Consultar aplicativos",
  "applications.write": "Incluir, editar e excluir aplicativos",
  "emails.read": "Consultar emails do sistema",
  "emails.write": "Incluir, editar e excluir emails do sistema",
  "statistics.read": "Consultar estatisticas",
  "statistics.write": "Gerenciar estatisticas",
  "newsletters.read": "Consultar newsletter",
  "newsletters.write": "Gerenciar newsletter",
  "privacy.read": "Consultar LGPD",
  "privacy.write": "Gerenciar LGPD",
  "management.read": "Consultar administracao",
  "management.write": "Gerenciar administracao"
};

const emptyManagementBootstrap: ManagementBootstrap = {
  contentTypes: [],
  users: [],
  roles: [],
  permissions: [],
  applications: [],
  roleApplicationAccesses: [],
  systemEmails: [],
  templates: [],
  elements: [],
  newsletterGroups: [],
  newsletterCampaigns: [],
  privacyRequests: []
};

async function apiRequest<T>(
  path: string,
  options?: RequestInit,
  token?: string
): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    let parsedMessage = message;

    try {
      const parsed = JSON.parse(message) as { message?: string | string[] };
      if (Array.isArray(parsed.message)) {
        parsedMessage = parsed.message.join(" ");
      } else if (parsed.message) {
        parsedMessage = parsed.message;
      }
    } catch {
      parsedMessage = message;
    }

    const error = new Error(parsedMessage || "Falha ao comunicar com a API.") as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}

async function safeApiRequest<T>(
  path: string,
  fallback: T,
  options?: RequestInit,
  token?: string
): Promise<T> {
  try {
    return await apiRequest<T>(path, options, token);
  } catch (requestError) {
    if (
      requestError instanceof Error &&
      "status" in requestError &&
      typeof requestError.status === "number" &&
      [401, 403, 404].includes(requestError.status)
    ) {
      return fallback;
    }

    throw requestError;
  }
}

function getPermissionLabel(code: string) {
  return permissionLabelMap[code] ?? code.replaceAll(".", " / ");
}

function normalizeIdentityValue(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : "";
}

function compareLegacyIdsDesc(leftId: string, rightId: string) {
  const leftNumeric = Number(leftId);
  const rightNumeric = Number(rightId);

  if (Number.isFinite(leftNumeric) && Number.isFinite(rightNumeric)) {
    return rightNumeric - leftNumeric;
  }

  return rightId.localeCompare(leftId);
}

function displayRecordCode(legacyId?: number | null, id?: string) {
  if (typeof legacyId === "number") {
    return String(legacyId);
  }

  return id ? id.slice(-8).toUpperCase() : "--";
}

function buildDuplicateUserMessage(
  conflictingUser: ManagedUser,
  field: "username" | "cpf" | "email",
  attemptedValue: string
) {
  const label =
    field === "username" ? "username" : field === "cpf" ? "CPF" : "e-mail";

  return `Já existe um usuário com este ${label}: ${attemptedValue}. Registro localizado: ${conflictingUser.name} (${conflictingUser.email}).`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleDateString("pt-BR");
}

function formatTime(value: string | null) {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleString("pt-BR");
}

function getRoleKind(roleName: string | null | undefined) {
  const normalizedRoleName = roleName?.toLowerCase() ?? "";

  if (normalizedRoleName.includes("administrador")) {
    return "admin";
  }

  if (normalizedRoleName.includes("desenvolvedor")) {
    return "developer";
  }

  return "publisher";
}

function resolveLegacyAppView(applicationName: string, link: string): ViewKey | null {
  const normalizedName = applicationName.toLowerCase();
  const normalizedLink = link.toLowerCase();

  if (normalizedLink.includes("conteudo.php") || normalizedName === "conteúdo") return "content-list";
  if (normalizedLink.includes("secao.php") || normalizedName === "seção") return "sections-tree";
  if (normalizedLink.includes("template.php") || normalizedName === "templates") return "templates";
  if (normalizedLink.includes("mascara.php") || normalizedName === "máscara") return "masks";
  if (normalizedLink.includes("elemento.php") || normalizedName.includes("blocos")) return "elements";
  if (normalizedLink.includes("permissao.php") || normalizedName === "permissões") return "permissions";
  if (normalizedLink.includes("grupos.php") || normalizedName === "grupos") return "groups";
  if (normalizedLink.includes("usuarios.php") || normalizedName === "usuários") return "users";
  if (normalizedLink.includes("aplicativos.php") || normalizedName === "aplicativos") return "applications";
  if (normalizedLink.includes("email.php") || normalizedName === "email") return "emails";
  if (normalizedLink.includes("estatistica.php") || normalizedName === "estatísticas") return "statistics";
  if (normalizedLink.includes("newsletter.php") || normalizedName === "newsletter") return "newsletter";

  return null;
}

function normalizeLegacyTopMenu(area: string): TopMenuKey {
  const normalizedArea = area.toLowerCase();

  if (normalizedArea.includes("admin")) {
    return "administration";
  }

  if (normalizedArea.includes("system") || normalizedArea.includes("sistema")) {
    return "system";
  }

  if (normalizedArea.includes("newsletter")) {
    return "newsletter";
  }

  return "content";
}

function getTopMenus(kind: "admin" | "developer" | "publisher") {
  if (kind === "admin") {
    return [
      { key: "administration" as const, label: "Administração" },
      { key: "system" as const, label: "Sistema" }
    ];
  }

  if (kind === "developer") {
    return [
      { key: "content" as const, label: "Conteúdo" },
      { key: "system" as const, label: "Sistema" }
    ];
  }

  return [
    { key: "content" as const, label: "Conteúdo" },
    { key: "newsletter" as const, label: "Newsletter" }
  ];
}

function getDefaultView(
  kind: "admin" | "developer" | "publisher",
  role?: LoggedUser["roles"][number] | null,
  menuConfig?: {
    topMenus: Array<{ key: TopMenuKey; label: string }>;
    groups: Record<TopMenuKey, Array<{ key: ViewKey; label: string }>>;
  }
): ViewKey {
  const normalizedName = role?.name?.toLowerCase() ?? "";
  const normalizedFunction = role?.functionName?.toLowerCase() ?? "";

  if (normalizedName.includes("administrador")) {
    return "users";
  }

  if (normalizedName.includes("desenvolvedor")) {
    return "sections-tree";
  }

  if (["publicador", "editor", "autor"].some((item) => normalizedFunction.includes(item))) {
    return "content-list";
  }

  if (kind === "admin") {
    return "users";
  }

  const firstTopMenu = menuConfig?.topMenus[0]?.key;
  const firstView = firstTopMenu ? menuConfig?.groups[firstTopMenu]?.[0]?.key : null;
  if (firstView) {
    return firstView;
  }

  return "content-list";
}

function getDefaultTopMenu(kind: "admin" | "developer" | "publisher"): TopMenuKey {
  if (kind === "admin") {
    return "administration";
  }

  if (kind === "developer") {
    return "content";
  }

  return "content";
}

function getMenuConfig(role: LoggedUser["roles"][number] | null) {
  if (!role) {
    const kind = getRoleKind("");
    const topMenus = getTopMenus(kind);
    return {
      topMenus,
      groups: Object.fromEntries(topMenus.map((menu) => [menu.key, menuGroups[menu.key]])) as Record<
        TopMenuKey,
        Array<{ key: ViewKey; label: string }>
      >
    };
  }

  const groups = {
    content: [] as Array<{ key: ViewKey; label: string }>,
    administration: [] as Array<{ key: ViewKey; label: string }>,
    system: [] as Array<{ key: ViewKey; label: string }>,
    newsletter: [] as Array<{ key: ViewKey; label: string }>
  };

  if (role.appAccesses.length > 0) {
    for (const access of role.appAccesses) {
      if (!access.canAccess) {
        continue;
      }

      const viewKey = resolveLegacyAppView(access.name, access.link);

      if (!viewKey) {
        continue;
      }

      const topMenu = normalizeLegacyTopMenu(access.area);
      const label = getBreadcrumbLabel(viewKey);

      if (!groups[topMenu].some((item) => item.key === viewKey)) {
        groups[topMenu].push({
          key: viewKey,
          label
        });
      }
    }
  } else {
    for (const access of role.menuAccesses) {
      const label = getBreadcrumbLabel(access.viewKey);

      if (!groups[access.topMenu].some((item) => item.key === access.viewKey)) {
        groups[access.topMenu].push({
          key: access.viewKey,
          label
        });
      }
    }
  }

  const topMenus = (Object.entries(groups) as Array<[TopMenuKey, Array<{ key: ViewKey; label: string }>]>)
    .filter(([, items]) => items.length > 0)
    .map(([key]) => ({
      key,
      label:
        key === "administration"
          ? "Administração"
          : key === "newsletter"
            ? "Newsletter"
            : key === "system"
              ? "Sistema"
              : "Conteúdo"
    }));

  return {
    topMenus,
    groups
  };
}

function buildSectionTree(sections: Section[]) {
  const map = new Map<string, TreeSection>();

  for (const section of sections) {
    map.set(section.id, {
      ...section,
      childrenNodes: []
    });
  }

  const roots: TreeSection[] = [];

  for (const section of sections) {
    const node = map.get(section.id);

    if (!node) {
      continue;
    }

    if (section.parentId) {
      const parent = map.get(section.parentId);

      if (parent) {
        parent.childrenNodes.push(node);
        continue;
      }
    }

    roots.push(node);
  }

  return roots.sort((left, right) => left.path.localeCompare(right.path));
}

function getBreadcrumbLabel(view: ViewKey) {
  const labels: Record<ViewKey, string> = {
    "content-list": "Conteúdo",
    "content-editor": "Conteúdo",
    "sections-tree": "Seção",
    "section-editor": "Seção",
    masks: "Máscara",
    templates: "Templates",
    elements: "Blocos de Conteúdo",
    users: "Usuários",
    groups: "Grupos",
    permissions: "Permissões",
    applications: "Aplicativos",
    emails: "Email",
    newsletter: "Newsletter",
    statistics: "Estatísticas"
  };

  return labels[view];
}

function getBreadcrumbTop(view: ViewKey) {
  if (["users", "groups", "permissions", "statistics"].includes(view)) {
    return "Administração";
  }

  if (["applications", "emails"].includes(view)) {
    return "Sistema";
  }

  if (view === "newsletter") {
    return "Newsletter";
  }

  return "Conteúdo";
}

function legacyStatus(status: string) {
  if (status === "published") {
    return "Publicado";
  }

  if (status === "draft") {
    return "Novo";
  }

  return "Arquivado";
}

function roleName(role: LoggedUser["roles"][number] | null | undefined) {
  return role?.name ?? "Publicador Geral";
}

function toggleItem(list: string[], item: string) {
  return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];
}

function LegacyButton({
  children,
  tone = "blue",
  type = "button",
  onClick
}: {
  children: React.ReactNode;
  tone?: "blue" | "green" | "red";
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  const toneClass =
    tone === "green"
      ? "bg-[linear-gradient(135deg,#29b36f_0%,#1f8f58_100%)] hover:brightness-105"
      : tone === "red"
        ? "bg-[linear-gradient(135deg,#e06269_0%,#c7424d_100%)] hover:brightness-105"
        : "bg-[linear-gradient(135deg,#1f6feb_0%,#21c7d9_100%)] hover:brightness-105";

  return (
    <button
      className={`rounded-[10px] border border-white/10 px-4 py-2 text-sm font-semibold tracking-[0.01em] text-white shadow-[0_12px_28px_rgba(15,33,57,0.16)] transition ${toneClass}`}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}

function SectionTree({
  nodes,
  onEdit,
  onOpenContents,
  onDelete
}: {
  nodes: TreeSection[];
  onEdit: (section: Section) => void;
  onOpenContents: () => void;
  onDelete: (section: Section) => void;
}) {
  return (
    <ul className="space-y-1 text-[15px] text-[#0c67ad]">
      {nodes.map((node) => (
        <li key={node.id}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#333]">{node.name}</span>
            <span className="text-[#555]">({node._count?.contents ?? 0})</span>
            <button className="text-[12px] text-[#0c67ad] hover:underline" onClick={() => onEdit(node)} type="button">
              Editar conteúdo
            </button>
            <button className="text-[12px] text-[#0c67ad] hover:underline" onClick={onOpenContents} type="button">
              Listar conteúdos
            </button>
            <button className="text-[12px] text-[#c4473c] hover:underline" onClick={() => onDelete(node)} type="button">
              Excluir
            </button>
          </div>
          {node.childrenNodes.length > 0 ? (
            <div className="ml-6 mt-1">
              <SectionTree
                nodes={node.childrenNodes}
                onEdit={onEdit}
                onOpenContents={onOpenContents}
                onDelete={onDelete}
              />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default function RefreshPage() {
  const [token, setToken] = useState("");
  const [identifier, setIdentifier] = useState("admin@abbatech.local");
  const [password, setPassword] = useState("Refresh123!");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState<LoggedUser | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [meta, setMeta] = useState<EditorMeta>({
    sections: [],
    templates: [],
    contentTypes: []
  });
  const [management, setManagement] = useState<ManagementBootstrap>({
    contentTypes: [],
    users: [],
    roles: [],
    permissions: [],
    applications: [],
    roleApplicationAccesses: [],
    systemEmails: [],
    templates: [],
    elements: [],
    newsletterGroups: [],
    newsletterCampaigns: [],
    privacyRequests: []
  });
  const [sectionForm, setSectionForm] = useState<SectionFormState>(emptySectionForm);
  const [contentForm, setContentForm] = useState<ContentFormState>(emptyContentForm);
  const [contentTypeForm, setContentTypeForm] = useState<ContentTypeFormState>(emptyContentTypeForm);
  const [permissionForm, setPermissionForm] = useState<PermissionFormState>(emptyPermissionForm);
  const [applicationForm, setApplicationForm] = useState<ApplicationFormState>(emptyApplicationForm);
  const [roleForm, setRoleForm] = useState<RoleFormState>(emptyRoleForm);
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);
  const [templateForm, setTemplateForm] = useState<TemplateFormState>(emptyTemplateForm);
  const [elementForm, setElementForm] = useState<ElementFormState>(emptyElementForm);
  const [systemEmailForm, setSystemEmailForm] = useState<SystemEmailFormState>(emptySystemEmailForm);
  const [highlightedUserId, setHighlightedUserId] = useState("");
  const [view, setView] = useState<ViewKey>("content-list");
  const [topMenu, setTopMenu] = useState<TopMenuKey>("content");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [expandedTopMenu, setExpandedTopMenu] = useState<TopMenuKey | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState("");
  const [isPending, startTransition] = useTransition();

  const activeProfile = useMemo(
    () => user?.roles.find((role) => role.id === selectedProfileId) ?? user?.roles[0] ?? null,
    [selectedProfileId, user]
  );
  const roleKind = getRoleKind(activeProfile?.name);
  const activeMenuConfig = useMemo(() => getMenuConfig(activeProfile), [activeProfile]);
  const topMenus = activeMenuConfig.topMenus;
  const sectionTree = useMemo(() => buildSectionTree(sections), [sections]);
  const selectedUserRoles = useMemo(
    () => management.roles.filter((role) => userForm.roleIds.includes(role.id)),
    [management.roles, userForm.roleIds]
  );
  const selectedUserPermissionCodes = useMemo(
    () => Array.from(new Set(selectedUserRoles.flatMap((role) => role.permissions.map((permission) => permission.code)))).sort(),
    [selectedUserRoles]
  );
  const selectedUserPermissionLabels = useMemo(
    () => selectedUserPermissionCodes.map(getPermissionLabel),
    [selectedUserPermissionCodes]
  );
  const selectedUserAppAccesses = useMemo(
    () =>
      Array.from(
        new Map(
          selectedUserRoles
            .flatMap((role) => role.appAccesses.filter((access) => access.canAccess))
            .map((access) => [access.appId, access])
        ).values()
      ).sort((left, right) => `${left.area}:${left.appName}`.localeCompare(`${right.area}:${right.appName}`)),
    [selectedUserRoles]
  );
  const sortedUsers = useMemo(
    () =>
      [...management.users].sort((left, right) => {
        if (highlightedUserId && left.id === highlightedUserId) {
          return -1;
        }

        if (highlightedUserId && right.id === highlightedUserId) {
          return 1;
        }

        if (typeof left.legacyId === "number" && typeof right.legacyId === "number") {
          return right.legacyId - left.legacyId;
        }

        const byId = compareLegacyIdsDesc(left.id, right.id);
        if (byId !== 0) {
          return byId;
        }

        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }),
    [highlightedUserId, management.users]
  );
  const availableContentTypes = useMemo(
    () => (management.contentTypes.length > 0 ? management.contentTypes : meta.contentTypes),
    [management.contentTypes, meta.contentTypes]
  );

  useEffect(() => {
    const storedToken = window.localStorage.getItem("refresh_access_token");

    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    startTransition(() => {
      void bootstrap(token);
    });
  }, [token]);

  useEffect(() => {
    if (!user?.roles.length) {
      return;
    }

    const selectedStillExists = user.roles.some((role) => role.id === selectedProfileId);

    if (!selectedStillExists) {
      const fallbackProfile = user.roles[0];
      const kind = getRoleKind(fallbackProfile?.name);
      const fallbackMenuConfig = getMenuConfig(fallbackProfile ?? null);
      const defaultTopMenu = fallbackMenuConfig.topMenus[0]?.key ?? getDefaultTopMenu(kind);
      const defaultView =
        fallbackMenuConfig.groups[defaultTopMenu]?.[0]?.key ??
        getDefaultView(kind, fallbackProfile ?? null, fallbackMenuConfig);
      setSelectedProfileId(fallbackProfile?.id ?? "");
      setTopMenu(defaultTopMenu);
      setView(defaultView);
    }
  }, [selectedProfileId, user]);

  async function bootstrap(accessToken: string) {
    try {
      setError("");
      const profile = await apiRequest<LoggedUser>("/auth/me", undefined, accessToken);
      const [nextMeta, nextSections, nextContents, nextManagement] = await Promise.all([
        safeApiRequest<EditorMeta>("/contents/meta", { templates: [], sections: [], contentTypes: [] }, undefined, accessToken),
        safeApiRequest<Section[]>("/sections/admin/list", [], undefined, accessToken),
        safeApiRequest<Content[]>("/contents/admin/list", [], undefined, accessToken),
        safeApiRequest<ManagementBootstrap>("/management/bootstrap", emptyManagementBootstrap, undefined, accessToken)
      ]);

      const firstProfileId = profile.activeRoleId ?? profile.roles[0]?.id ?? "";
      const activeProfile = profile.roles.find((role) => role.id === firstProfileId) ?? profile.roles[0] ?? null;
      const kind = getRoleKind(activeProfile?.name);
      const initialMenuConfig = getMenuConfig(activeProfile);
      const defaultTopMenu = initialMenuConfig.topMenus[0]?.key ?? getDefaultTopMenu(kind);
      const defaultView =
        initialMenuConfig.groups[defaultTopMenu]?.[0]?.key ??
        getDefaultView(kind, activeProfile, initialMenuConfig);

      setUser(profile);
      setSelectedProfileId(firstProfileId);
      setMeta(nextMeta);
      setSections(nextSections);
      setContents(nextContents);
      setManagement(nextManagement);
      const shouldResetShell = selectedProfileId !== firstProfileId || !selectedProfileId;

      if (shouldResetShell) {
        setTopMenu(defaultTopMenu);
        setView(defaultView);
      }
      setExpandedTopMenu(null);
      setContentForm((current) => ({
        ...current,
        sectionId: current.sectionId || nextMeta.sections[0]?.id || "",
        contentTypeId: current.contentTypeId || nextMeta.contentTypes[0]?.id || "",
        templateId: current.templateId || nextMeta.templates[0]?.id || ""
      }));
    } catch (bootstrapError) {
      if (
        bootstrapError instanceof Error &&
        "status" in bootstrapError &&
        [401, 403].includes((bootstrapError as Error & { status?: number }).status ?? 0)
      ) {
        window.localStorage.removeItem("refresh_access_token");
        setToken("");
        setUser(null);
        setError("Sua sessão expirou. Faça login novamente.");
        return;
      }

      setError(bootstrapError instanceof Error ? bootstrapError.message : "Falha ao carregar o ambiente do manager.");
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await apiRequest<{ accessToken: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password })
      });

      window.localStorage.setItem("refresh_access_token", response.accessToken);
      setToken(response.accessToken);
      setSuccess("Login realizado com sucesso.");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Falha ao autenticar.");
    }
  }

  async function handleSectionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const path = editingSectionId ? `/sections/admin/${editingSectionId}` : "/sections/admin";
      const method = editingSectionId ? "PATCH" : "POST";
      await apiRequest(
        path,
        {
          method,
          body: JSON.stringify({
            name: sectionForm.name,
            slug: sectionForm.slug || undefined,
            description: sectionForm.description || undefined,
            order: Number(sectionForm.order),
            parentId: sectionForm.parentId || undefined,
            visibleInMenu: sectionForm.visibleInMenu,
            isActive: sectionForm.isActive
          })
        },
        token
      );

      setSectionForm(emptySectionForm);
      setEditingSectionId("");
      await bootstrap(token);
      setSuccess(editingSectionId ? "Seção atualizada com sucesso." : "Seção cadastrada com sucesso.");
      setView("sections-tree");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao salvar seção.");
    }
  }

  async function handleContentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const path = contentForm.id ? `/contents/admin/${contentForm.id}` : "/contents/admin";
      const method = contentForm.id ? "PATCH" : "POST";

      await apiRequest(
        path,
        {
          method,
          body: JSON.stringify({
            title: contentForm.title,
            slug: contentForm.slug || undefined,
            excerpt: contentForm.excerpt || undefined,
            body: contentForm.body || undefined,
            status: contentForm.status,
            visibility: contentForm.visibility,
            sectionId: contentForm.sectionId,
            contentTypeId: contentForm.contentTypeId,
            templateId: contentForm.templateId || undefined,
            seoTitle: contentForm.seoTitle || undefined,
            seoDescription: contentForm.seoDescription || undefined,
            seoKeywords: contentForm.seoKeywords || undefined,
            seoCanonicalUrl: contentForm.seoCanonicalUrl || undefined,
            seoRobots: contentForm.seoRobots || undefined
          })
        },
        token
      );

      resetContentForm();
      await bootstrap(token);
      setSuccess("Conteúdo salvo com sucesso.");
      setView("content-list");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao salvar conteúdo.");
    }
  }

  async function handleContentTypeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const path = contentTypeForm.id
        ? `/management/content-types/${contentTypeForm.id}`
        : "/management/content-types";
      const method = contentTypeForm.id ? "PATCH" : "POST";

      await apiRequest(
        path,
        {
          method,
          body: JSON.stringify({
            name: contentTypeForm.name,
            slug: contentTypeForm.slug || undefined,
            description: contentTypeForm.description || undefined,
            allowRichText: contentTypeForm.allowRichText,
            allowFeaturedMedia: contentTypeForm.allowFeaturedMedia
          })
        },
        token
      );

      setContentTypeForm(emptyContentTypeForm);
      await bootstrap(token);
      setSuccess(contentTypeForm.id ? "Máscara atualizada com sucesso." : "Máscara criada com sucesso.");
      setTopMenu("content");
      setView("masks");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao salvar máscara.");
    }
  }

  async function handlePermissionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const path = permissionForm.id
        ? `/management/role-application-accesses/${permissionForm.id}`
        : "/management/role-application-accesses";
      const method = permissionForm.id ? "PATCH" : "POST";

      await apiRequest(
        path,
        {
          method,
          body: JSON.stringify({
            roleId: permissionForm.roleId,
            appId: permissionForm.appId,
            canCreate: permissionForm.canCreate,
            canUpdate: permissionForm.canUpdate,
            canDelete: permissionForm.canDelete,
            canAccess: permissionForm.canAccess
          })
        },
        token
      );

      setPermissionForm(emptyPermissionForm);
      await bootstrap(token);
      setSuccess(permissionForm.id ? "Permissão atualizada com sucesso." : "Permissão criada com sucesso.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao salvar permissão.");
    }
  }

  async function handleApplicationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const path = applicationForm.id ? `/management/applications/${applicationForm.id}` : "/management/applications";
      const method = applicationForm.id ? "PATCH" : "POST";

      await apiRequest(
        path,
        {
          method,
          body: JSON.stringify({
            name: applicationForm.name,
            area: applicationForm.area,
            link: applicationForm.link,
            description: applicationForm.description || undefined
          })
        },
        token
      );

      setApplicationForm(emptyApplicationForm);
      await bootstrap(token);
      setSuccess(applicationForm.id ? "Aplicativo atualizado com sucesso." : "Aplicativo criado com sucesso.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao salvar aplicativo.");
    }
  }

  async function handleRoleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const path = roleForm.id ? `/management/roles/${roleForm.id}` : "/management/roles";
      const method = roleForm.id ? "PATCH" : "POST";

      await apiRequest(
        path,
        {
          method,
          body: JSON.stringify({
            name: roleForm.name,
            description: roleForm.description || undefined,
            functionName: roleForm.functionName || undefined,
            status: roleForm.status,
            parentRoleId: roleForm.parentRoleId || undefined,
            permissionIds: roleForm.permissionIds,
            menuAccesses: (Object.entries(menuGroups) as Array<[TopMenuKey, Array<{ key: ViewKey; label: string }>]>) 
              .flatMap(([topMenuKey, items]) =>
                items
                  .filter((item) => roleForm.menuAccessKeys.includes(`${topMenuKey}:${item.key}`))
                  .map((item) => ({
                    topMenu: topMenuKey,
                    viewKey: item.key
                  }))
              ),
            sectionIds: roleForm.sectionIds,
            contentTypeIds: roleForm.contentTypeIds
          })
        },
        token
      );

      setRoleForm(emptyRoleForm);
      await bootstrap(token);
      setSuccess(roleForm.id ? "Perfil atualizado com sucesso." : "Perfil criado com sucesso.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao salvar perfil.");
    }
  }

  async function handleSystemEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const path = systemEmailForm.id ? `/management/system-emails/${systemEmailForm.id}` : "/management/system-emails";
      const method = systemEmailForm.id ? "PATCH" : "POST";

      await apiRequest(
        path,
        {
          method,
          body: JSON.stringify({
            name: systemEmailForm.name,
            email: systemEmailForm.email,
            area: systemEmailForm.area,
            description: systemEmailForm.description || undefined,
            value: systemEmailForm.value || undefined
          })
        },
        token
      );

      setSystemEmailForm(emptySystemEmailForm);
      await bootstrap(token);
      setSuccess(systemEmailForm.id ? "Email atualizado com sucesso." : "Email criado com sucesso.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao salvar email.");
    }
  }

  async function resetStatistics() {
    setError("");
    setSuccess("");

    try {
      await apiRequest("/management/statistics/reset", { method: "POST" }, token);
      await bootstrap(token);
      setSuccess("Estatísticas zeradas com sucesso.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao zerar estatísticas.");
    }
  }

  async function handleUserSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const normalizedEmail = normalizeIdentityValue(userForm.email);
      const normalizedUsername = normalizeIdentityValue(userForm.username);
      const normalizedCpf = userForm.cpf.replace(/\D/g, "");
      const conflictingUser = management.users.find((managedUser) => {
        if (userForm.id && managedUser.id === userForm.id) {
          return false;
        }

        const managedEmail = normalizeIdentityValue(managedUser.email);
        const managedUsername = normalizeIdentityValue(managedUser.username ?? "");
        const managedCpf = (managedUser.cpf ?? "").replace(/\D/g, "");

        return (
          (normalizedEmail && managedEmail === normalizedEmail) ||
          (normalizedUsername && managedUsername === normalizedUsername) ||
          (normalizedCpf && managedCpf === normalizedCpf)
        );
      });

      if (conflictingUser) {
        if (normalizedUsername && normalizeIdentityValue(conflictingUser.username ?? "") === normalizedUsername) {
          setHighlightedUserId(conflictingUser.id);
          setError(buildDuplicateUserMessage(conflictingUser, "username", userForm.username));
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        if (normalizedCpf && (conflictingUser.cpf ?? "").replace(/\D/g, "") === normalizedCpf) {
          setHighlightedUserId(conflictingUser.id);
          setError(buildDuplicateUserMessage(conflictingUser, "cpf", userForm.cpf));
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        setHighlightedUserId(conflictingUser.id);
        setError(buildDuplicateUserMessage(conflictingUser, "email", userForm.email));
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const path = userForm.id ? `/management/users/${userForm.id}` : "/management/users";
      const method = userForm.id ? "PATCH" : "POST";

      const savedUser = await apiRequest<ManagedUser>(
        path,
        {
          method,
          body: JSON.stringify({
            name: userForm.name,
            email: userForm.email,
            username: userForm.username || undefined,
            cpf: userForm.cpf || undefined,
            cnh: userForm.cnh || undefined,
            status: userForm.status,
            company: userForm.company || undefined,
            jobTitle: userForm.jobTitle || undefined,
            phone: userForm.phone || undefined,
            address: userForm.address || undefined,
            zipCode: userForm.zipCode || undefined,
            city: userForm.city || undefined,
            state: userForm.state || undefined,
            secondaryAddress: userForm.secondaryAddress || undefined,
            secondaryNumber: userForm.secondaryNumber || undefined,
            secondaryComplement: userForm.secondaryComplement || undefined,
            neighborhood: userForm.neighborhood || undefined,
            notes: userForm.notes || undefined,
            facebook: userForm.facebook || undefined,
            instagram: userForm.instagram || undefined,
            youtube: userForm.youtube || undefined,
            forcePasswordChange: userForm.forcePasswordChange,
            password: userForm.password || undefined,
            isActive: userForm.isActive,
            isSuperAdmin: userForm.isSuperAdmin,
            roleIds: userForm.roleIds
          })
        },
        token
      );

      setHighlightedUserId(savedUser.id);
      setUserForm(emptyUserForm);
      await bootstrap(token);
      setSuccess(userForm.id ? "Usuário atualizado com sucesso." : "Usuário criado com sucesso.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao salvar usuário.");
    }
  }

  async function handleTemplateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const path = templateForm.id ? `/management/templates/${templateForm.id}` : "/management/templates";
      const method = templateForm.id ? "PATCH" : "POST";

      await apiRequest(
        path,
        {
          method,
          body: JSON.stringify({
            name: templateForm.name,
            slug: templateForm.slug || undefined,
            description: templateForm.description || undefined,
            componentKey: templateForm.componentKey || undefined,
            isActive: templateForm.isActive
          })
        },
        token
      );

      setTemplateForm(emptyTemplateForm);
      await bootstrap(token);
      setSuccess(templateForm.id ? "Template atualizado com sucesso." : "Template criado com sucesso.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao salvar template.");
    }
  }

  async function handleElementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const path = elementForm.id ? `/management/elements/${elementForm.id}` : "/management/elements";
      const method = elementForm.id ? "PATCH" : "POST";

      await apiRequest(
        path,
        {
          method,
          body: JSON.stringify({
            name: elementForm.name,
            thumbLabel: elementForm.thumbLabel || undefined,
            category: elementForm.category || undefined,
            status: elementForm.status,
            content: elementForm.content
          })
        },
        token
      );

      setElementForm(emptyElementForm);
      await bootstrap(token);
      setSuccess(elementForm.id ? "Elemento atualizado com sucesso." : "Elemento criado com sucesso.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao salvar elemento.");
    }
  }

  function handleLogout() {
    window.localStorage.removeItem("refresh_access_token");
    setToken("");
    setUser(null);
    setSuccess("");
    setError("");
  }

  function resetContentForm() {
    setContentForm({
      ...emptyContentForm,
      sectionId: meta.sections[0]?.id || "",
      contentTypeId: meta.contentTypes[0]?.id || "",
      templateId: meta.templates[0]?.id || ""
    });
  }

  function selectContent(content: Content) {
    setContentForm({
      id: content.id,
      title: content.title,
      slug: content.slug,
      excerpt: content.excerpt ?? "",
      body: content.body ?? "",
      status: content.status as ContentFormState["status"],
      visibility: content.visibility as ContentFormState["visibility"],
      sectionId: content.sectionId,
      contentTypeId: content.contentTypeId,
      templateId: content.templateId ?? "",
      seoTitle: content.seo?.title ?? "",
      seoDescription: content.seo?.description ?? "",
      seoKeywords: content.seo?.keywords ?? "",
      seoCanonicalUrl: content.seo?.canonicalUrl ?? "",
      seoRobots: content.seo?.robots ?? "index,follow",
      publishDate: formatDate(content.publishedAt),
      publishTime: formatTime(content.publishedAt),
      startDate: formatDate(content.publishedAt),
      endDate: "21/04/2027"
    });
    setTopMenu("content");
    setView("content-editor");
  }

  function openNewContent() {
    resetContentForm();
    setTopMenu("content");
    setView("content-editor");
  }

  function openNewSection() {
    setSectionForm(emptySectionForm);
    setEditingSectionId("");
    setTopMenu("content");
    setView("section-editor");
  }

  function editSection(section: Section) {
    setEditingSectionId(section.id);
    setSectionForm({
      name: section.name,
      slug: section.slug,
      description: section.description ?? "",
      order: String(section.order),
      parentId: section.parentId ?? "",
      visibleInMenu: section.visibleInMenu,
      isActive: section.isActive
    });
    setTopMenu("content");
    setView("section-editor");
  }

  async function switchProfile(profileId: string) {
    const nextProfile = user?.roles.find((role) => role.id === profileId);

    if (!nextProfile) {
      return;
    }

    try {
      const nextMenuConfig = getMenuConfig(nextProfile);
      const nextKind = getRoleKind(nextProfile.name);
      const nextTopMenu = nextMenuConfig.topMenus[0]?.key ?? getDefaultTopMenu(nextKind);
      const nextView =
        nextMenuConfig.groups[nextTopMenu]?.[0]?.key ??
        getDefaultView(nextKind, nextProfile, nextMenuConfig);
      const response = await apiRequest<{ accessToken: string }>(
        "/auth/switch-profile",
        {
          method: "POST",
          body: JSON.stringify({ roleId: profileId })
        },
        token
      );

      window.localStorage.setItem("refresh_access_token", response.accessToken);
      setToken(response.accessToken);
      setSelectedProfileId(profileId);
      setTopMenu(nextTopMenu);
      setView(nextView);
      setProfileMenuOpen(false);
      setExpandedTopMenu(null);
      setSuccess(`Perfil ativo: ${nextProfile.name}`);
    } catch (switchError) {
      setError(switchError instanceof Error ? switchError.message : "Falha ao trocar o perfil.");
    }
  }

  function editContentType(contentType: ContentType) {
    setContentTypeForm({
      id: contentType.id,
      name: contentType.name,
      slug: contentType.slug,
      description: contentType.description ?? "",
      allowRichText: contentType.allowRichText,
      allowFeaturedMedia: contentType.allowFeaturedMedia
    });
  }

  function editPermission(permission: RoleApplicationAccessRecord) {
    setPermissionForm({
      id: permission.id,
      roleId: permission.roleId,
      appId: permission.appId,
      canCreate: permission.canCreate,
      canUpdate: permission.canUpdate,
      canDelete: permission.canDelete,
      canAccess: permission.canAccess
    });
  }

  function editApplication(application: LegacyApplicationRecord) {
    setApplicationForm({
      id: application.id,
      name: application.name,
      area: application.area,
      link: application.link,
      description: application.description ?? ""
    });
  }

  function editRole(role: Role) {
    setRoleForm({
      id: role.id,
      name: role.name,
      description: role.description ?? "",
      functionName: role.functionName ?? "",
      status: role.status ?? "Ativo",
      parentRoleId: role.parentRoleId ?? "",
      permissionIds: role.permissions.map((permission) => permission.id),
      menuAccessKeys: role.menuAccesses.map((access) => `${access.topMenu}:${access.viewKey}`),
      sectionIds: role.sectionIds,
      contentTypeIds: role.contentTypeIds
    });
  }

  function editUser(managedUser: ManagedUser) {
    setHighlightedUserId(managedUser.id);
    setUserForm({
      id: managedUser.id,
      name: managedUser.name,
      email: managedUser.email,
      username: managedUser.username ?? "",
      cpf: managedUser.cpf ?? "",
      cnh: managedUser.cnh ?? "",
      status: managedUser.status ?? (managedUser.isActive ? "Ativo" : "Inativo"),
      company: managedUser.company ?? "",
      jobTitle: managedUser.jobTitle ?? "",
      phone: managedUser.phone ?? "",
      address: managedUser.address ?? "",
      zipCode: managedUser.zipCode ?? "",
      city: managedUser.city ?? "",
      state: managedUser.state ?? "",
      secondaryAddress: managedUser.secondaryAddress ?? "",
      secondaryNumber: managedUser.secondaryNumber ?? "",
      secondaryComplement: managedUser.secondaryComplement ?? "",
      neighborhood: managedUser.neighborhood ?? "",
      notes: managedUser.notes ?? "",
      facebook: managedUser.facebook ?? "",
      instagram: managedUser.instagram ?? "",
      youtube: managedUser.youtube ?? "",
      forcePasswordChange: managedUser.forcePasswordChange ?? false,
      password: "",
      isActive: managedUser.isActive,
      isSuperAdmin: managedUser.isSuperAdmin,
      roleIds: managedUser.roles.map((role) => role.id)
    });
    setSuccess(`Editando usuário: ${managedUser.name}`);
  }

  function editTemplate(template: Template) {
    setTemplateForm({
      id: template.id,
      name: template.name,
      slug: template.slug,
      description: template.description ?? "",
      componentKey: template.componentKey ?? "",
      isActive: template.isActive ?? true
    });
  }

  function editElement(element: ManagedElement) {
    setElementForm({
      id: element.id,
      name: element.name,
      thumbLabel: element.thumbLabel ?? "",
      category: element.category ?? "",
      status: element.status,
      content: element.content
    });
  }

  function editSystemEmail(systemEmail: SystemEmailRecord) {
    setSystemEmailForm({
      id: systemEmail.id,
      name: systemEmail.name,
      email: systemEmail.email,
      area: systemEmail.area,
      description: systemEmail.description ?? "",
      value: systemEmail.value ?? ""
    });
  }

  async function removeEntity(path: string, successMessage: string) {
    setError("");
    setSuccess("");

    try {
      await apiRequest(path, { method: "DELETE" }, token);
      await bootstrap(token);
      setSuccess(successMessage);
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Falha ao excluir registro.");
    }
  }

  function renderLogin() {
    return (
      <main className="min-h-screen bg-transparent">
        <div className="border-b border-[rgba(183,205,227,0.8)] bg-white/85 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[1860px] items-center px-6 py-8">
            <div className="leading-none">
              <div className="font-display text-[70px] font-bold uppercase tracking-[-0.04em] text-[#1973ea]">Conecta</div>
              <div className="pl-12 text-[24px] font-semibold uppercase tracking-[0.08em] text-[#1aa3bf]">FMUSP-HC News</div>
            </div>
          </div>
        </div>

        <section className="border-b border-[rgba(18,39,66,0.3)] bg-[radial-gradient(circle_at_78%_28%,rgba(33,199,217,0.28),transparent_16%),radial-gradient(circle_at_15%_10%,rgba(31,111,235,0.24),transparent_24%),linear-gradient(135deg,#091427_0%,#0f223c_54%,#143256_100%)]">
          <div className="mx-auto flex max-w-[1860px] items-start justify-between gap-10 px-6 py-10 text-white">
            <div className="pl-6">
              <p className="font-display text-[54px] font-bold uppercase leading-none tracking-[0.02em]">Atualiza DXP - 2026</p>
              <p className="mt-2 max-w-[420px] text-[34px] font-light leading-[1.06] text-[#d9e7ff]">
                Plataforma de Experiência Digital
              </p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/6 px-8 py-6 pr-24 text-right shadow-[0_20px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
              <p className="text-[17px] uppercase tracking-[0.12em] text-[#b5caea]">Suporte DNAnet</p>
              <p className="mt-1 text-[30px] font-bold">(51) 3231-7002</p>
              <p className="mt-8 text-[18px] text-[#d7e6fb]">www.dna.com.br</p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1600px] gap-6 px-6 py-14 lg:grid-cols-[0.95fr_0.85fr]">
          <form className="overflow-hidden rounded-[24px] border border-[rgba(183,205,227,0.82)] bg-white/92 shadow-[0_24px_50px_rgba(15,33,57,0.12)] backdrop-blur-sm" onSubmit={handleLogin}>
            <div className="border-b border-[rgba(215,227,241,0.9)] bg-[linear-gradient(135deg,#f7fbff_0%,#eef6ff_100%)] px-6 py-5 text-[18px] font-semibold text-[#132742]">Login de usuário</div>
            <div className="space-y-7 px-5 py-6">
              <label className="block">
                <span className="mb-2 block text-[14px] font-semibold uppercase tracking-[0.08em] text-[#4d6680]">Usuário</span>
                <input
                  className="h-[46px] w-full rounded-[12px] border border-[#d7e3f1] bg-[linear-gradient(180deg,#ffffff_0%,#f4f9ff_100%)] px-4 text-[18px] text-[#16324f] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition focus:border-[#1f6feb] focus:ring-4 focus:ring-[rgba(31,111,235,0.14)]"
                  onChange={(event) => setIdentifier(event.target.value)}
                  value={identifier}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[14px] font-semibold uppercase tracking-[0.08em] text-[#4d6680]">Senha</span>
                <input
                  className="h-[46px] w-full rounded-[12px] border border-[#d7e3f1] bg-[linear-gradient(180deg,#ffffff_0%,#f4f9ff_100%)] px-4 text-[18px] text-[#16324f] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition focus:border-[#1f6feb] focus:ring-4 focus:ring-[rgba(31,111,235,0.14)]"
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  value={password}
                />
              </label>
              <div className="flex items-center justify-between border-t border-[rgba(215,227,241,0.9)] pt-4">
                <button className="text-[13px] font-semibold text-[#1f6feb]" type="button">
                  Lembrar senha
                </button>
                <LegacyButton tone="blue" type="submit">
                  Entrar
                </LegacyButton>
              </div>
              {error ? <p className="text-sm font-semibold text-[#c0392b]">{error}</p> : null}
              {success ? <p className="text-sm font-semibold text-[#2d8d46]">{success}</p> : null}
            </div>
          </form>

          <section className="px-4 py-4">
            <h2 className="font-display text-[54px] font-bold uppercase tracking-[0.02em] text-[#10233d]">Precisa de Ajuda?</h2>
            <div className="mt-8 space-y-6 text-[17px] leading-8 text-[#58708a]">
              <p>
                No campo <strong>Usuário</strong> pode ser utilizado seu username, e-mail ou CPF.
              </p>
              <p>
                <strong>Esqueceu a senha?</strong> Entre com o Username e clique em <strong>Lembrar senha</strong>.
                Você receberá por e-mail as instruções para recuperação da senha.
              </p>
              <div className="rounded-[18px] border border-[rgba(183,205,227,0.78)] bg-[linear-gradient(135deg,#ffffff_0%,#f4f9ff_100%)] p-5 text-[15px] shadow-[0_18px_34px_rgba(15,33,57,0.08)]">
                <p>Ambiente atual do MVP: `http://localhost:3101`</p>
                <p>API conectada: `http://localhost:3333/api/v1`</p>
              </div>
            </div>
          </section>
        </section>
      </main>
    );
  }

  function renderLegacyShell() {
    return (
      <main className="min-h-screen bg-transparent text-[#16324f]">
        <header className="border-b border-[rgba(183,205,227,0.86)] bg-white/84 shadow-[0_14px_36px_rgba(15,33,57,0.06)] backdrop-blur-sm">
          <div className="mx-auto flex max-w-[1860px] items-start justify-between px-6 py-7">
            <div className="leading-none">
              <div className="font-display text-[70px] font-bold uppercase tracking-[-0.04em] text-[#1973ea]">Conecta</div>
              <div className="pl-12 text-[24px] font-semibold uppercase tracking-[0.08em] text-[#1aa3bf]">FMUSP-HC News</div>
            </div>

            <div className="relative flex min-w-[320px] items-center justify-between rounded-[22px] border border-[rgba(18,39,66,0.1)] bg-[linear-gradient(135deg,#0f223c_0%,#143256_60%,#1973ea_100%)] px-5 py-5 text-white shadow-[0_18px_40px_rgba(15,33,57,0.24)]">
              <div className="flex items-center gap-4">
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-white/20 bg-white/12 text-lg font-semibold backdrop-blur-sm">
                  {user?.name.slice(0, 1) ?? "U"}
                </div>
                <div>
                  <p className="text-[15px] font-semibold tracking-[0.02em]">{user?.name ?? "Usuário"}</p>
                  <p className="text-[13px] uppercase tracking-[0.12em] text-[#dbe8ff]">{roleName(activeProfile)}</p>
                </div>
              </div>

              <button
                className="text-[30px] font-light leading-none"
                onClick={() => setProfileMenuOpen((current) => !current)}
                type="button"
              >
                ≡
              </button>

              {profileMenuOpen ? (
                <div className="absolute right-0 top-full z-30 mt-3 min-w-[300px] overflow-hidden rounded-[18px] border border-[rgba(183,205,227,0.9)] bg-white/96 text-[#16324f] shadow-[0_24px_44px_rgba(15,33,57,0.16)] backdrop-blur-sm">
                  <div className="border-b border-[rgba(215,227,241,0.9)] bg-[linear-gradient(135deg,#f7fbff_0%,#eef6ff_100%)] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5a7592]">
                    Perfis do usuário
                  </div>
                  {user?.roles.map((role) => (
                    <button
                      key={role.id}
                      className={`flex w-full items-start justify-between border-b border-[rgba(233,240,247,0.95)] px-4 py-3 text-left text-[14px] hover:bg-[#f4f9ff] ${
                        selectedProfileId === role.id ? "bg-[#edf5ff]" : ""
                      }`}
                      onClick={() => switchProfile(role.id)}
                      type="button"
                    >
                      <span>
                        <span className="block font-semibold text-[#1b5fc8]">{role.name}</span>
                        <span className="block text-[12px] text-[#58708a]">
                          {role.permissions.length} permissões neste perfil
                        </span>
                      </span>
                      <span className="text-[12px] font-semibold text-[#1f6feb]">
                        {selectedProfileId === role.id ? "Ativo" : "Trocar"}
                      </span>
                    </button>
                  ))}
                  <button
                    className="w-full px-4 py-3 text-left text-[14px] font-semibold text-[#c7424d] hover:bg-[#fff3f4]"
                    onClick={handleLogout}
                    type="button"
                  >
                    Sair do manager
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-t border-[rgba(215,227,241,0.9)] bg-white/88">
            <div className="mx-auto flex max-w-[1860px] items-center px-6">
              {topMenus.map((menu) => (
                <div className="relative" key={menu.key}>
                  <button
                    className={`border-r border-[rgba(215,227,241,0.9)] px-9 py-4 text-[15px] font-medium tracking-[0.03em] ${
                      topMenu === menu.key ? "bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] text-[#10233d]" : "text-[#45617d]"
                    }`}
                  onClick={() => {
                    setTopMenu(menu.key);
                    setExpandedTopMenu((current) => (current === menu.key ? null : menu.key));
                  }}
                    type="button"
                  >
                    {menu.label}
                  </button>

                  {expandedTopMenu === menu.key ? (
                    <div className="absolute left-0 top-full z-20 min-w-[240px] overflow-hidden rounded-[16px] border border-[rgba(183,205,227,0.9)] bg-white/96 shadow-[0_20px_40px_rgba(15,33,57,0.14)] backdrop-blur-sm">
                      {(activeMenuConfig.groups[menu.key] ?? []).map((item) => (
                        <button
                          key={item.key}
                          className={`block w-full border-b border-[rgba(233,240,247,0.95)] px-4 py-3 text-left text-[14px] hover:bg-[#f4f9ff] ${
                            view === item.key ? "font-semibold text-[#1f6feb]" : "text-[#45617d]"
                          }`}
                          onClick={() => {
                            setTopMenu(menu.key);
                            setView(item.key);
                            setExpandedTopMenu(null);
                          }}
                          type="button"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

        </header>

        <div className="mx-auto max-w-[1600px] px-6 py-8">
          <div className="flex items-start justify-between border-b border-[rgba(215,227,241,0.9)] pb-5">
            <h1 className="font-display text-[34px] font-bold uppercase tracking-[0.02em] text-[#10233d]">
              {view === "content-list" && "Cadastro de Conteúdo"}
              {view === "content-editor" && "Cadastro de Conteúdo"}
              {view === "sections-tree" && "Seções, Navegação, Menus"}
              {view === "section-editor" && "Seções, Navegação, Menus"}
              {view === "masks" && "Cadastro de Máscaras"}
              {view === "templates" && "Cadastro de Templates"}
              {view === "elements" && "Cadastro de Blocos personalizados"}
              {view === "users" && "Cadastro de Usuários"}
              {view === "groups" && "Cadastro de Grupos"}
              {view === "permissions" && "Permissões de acesso"}
              {view === "applications" && "Cadastro de Aplicativos"}
              {view === "emails" && "Emails do Sistema"}
              {view === "newsletter" && "Cadastro de Newsletter"}
              {view === "statistics" && "Estatísticas"}
            </h1>
            <p className="pt-4 text-[13px] font-medium uppercase tracking-[0.1em] text-[#6b8198]">
              {getBreadcrumbTop(view)} &gt; <span className="text-[#1f6feb]">{getBreadcrumbLabel(view)}</span>
            </p>
          </div>

          {error ? <p className="mt-4 rounded-[14px] border border-[#f1c9cf] bg-[#fff4f5] px-4 py-3 text-sm font-semibold text-[#c0392b]">{error}</p> : null}
          {success ? <p className="mt-4 rounded-[14px] border border-[#cbe9d8] bg-[#f2fcf6] px-4 py-3 text-sm font-semibold text-[#2d8d46]">{success}</p> : null}
          {isPending ? <p className="mt-4 rounded-[14px] border border-[#dbe8f5] bg-[#f6fbff] px-4 py-3 text-sm text-[#58708a]">Atualizando dados...</p> : null}

          <div className="pt-8">{renderModule()}</div>
        </div>
      </main>
    );
  }

  function renderModule() {
    if (view === "content-list") {
      return (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <LegacyButton onClick={openNewContent} tone="green">
              Incluir
            </LegacyButton>
            <LegacyButton>Buscar</LegacyButton>
            <LegacyButton tone="red">Excluir</LegacyButton>
            <select className="ml-4 h-[38px] min-w-[135px] border border-[#d7d7d7] bg-white px-3 text-[15px]">
              <option>Publicado</option>
              <option>Novo</option>
              <option>Arquivado</option>
            </select>
            <LegacyButton>Mudar Status</LegacyButton>
            <LegacyButton>Mudar Usuário</LegacyButton>
            <LegacyButton>Mudar Datas</LegacyButton>
            <LegacyButton tone="green">Marcar Newsletter</LegacyButton>
            <LegacyButton tone="red">Desmarcar Newsletter</LegacyButton>
            <LegacyButton>Mudar Ordem</LegacyButton>
          </div>

          <div className="overflow-x-auto border border-[#d8d8d8]">
            <table className="legacy-table min-w-full">
              <thead>
                <tr>
                  <th className="w-[40px]">
                    <input type="checkbox" />
                  </th>
                  <th className="w-[90px]">Id</th>
                  <th className="w-[140px]">Data</th>
                  <th>Conteúdo</th>
                  <th>Seções Associadas</th>
                  <th className="w-[95px]">Máscara</th>
                  <th className="w-[80px]">News.</th>
                  <th className="w-[240px]">Usuário</th>
                  <th className="w-[90px]">Status</th>
                  <th className="w-[150px]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contents.map((content) => (
                  <tr key={content.id}>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>{displayRecordCode(content.legacyId, content.id)}</td>
                    <td>
                      <div>{formatDate(content.publishedAt)}</div>
                      <div className="mt-2 inline-flex items-center gap-2 border border-[#ddd] px-2 py-1 text-[13px]">
                        {formatTime(content.publishedAt)}
                      </div>
                    </td>
                    <td>
                      <button className="text-left text-[#0c67ad] hover:underline" onClick={() => selectContent(content)} type="button">
                        {content.title}
                      </button>
                    </td>
                    <td className="text-[#0c67ad]">
                      &gt;conectahc&gt;Home&gt;{content.section.name}
                    </td>
                    <td>{content.contentType.name}</td>
                    <td>--</td>
                    <td>{content.author?.name ?? "--"}</td>
                    <td className="text-[#0c67ad]">{legacyStatus(content.status)}</td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <button className="text-left text-[#0c67ad] hover:underline" onClick={() => selectContent(content)} type="button">
                          Editar
                        </button>
                        <button className="text-left text-[#c4473c] hover:underline" onClick={() => removeEntity(`/contents/admin/${content.id}`, "Conteúdo excluído com sucesso.")} type="button">
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (view === "content-editor") {
      return (
        <form className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_180px]" onSubmit={handleContentSubmit}>
          <div className="space-y-0 pr-0 lg:pr-4">
            <div className="legacy-form-row">
              <label className="legacy-label">Máscara: (?)</label>
              <select
                className="legacy-input"
                onChange={(event) =>
                  setContentForm((current) => ({
                    ...current,
                    contentTypeId: event.target.value
                  }))
                }
                value={contentForm.contentTypeId}
              >
                {meta.contentTypes.map((contentType) => (
                  <option key={contentType.id} value={contentType.id}>
                    {contentType.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-0 border-x border-t border-[#e5e5e5] bg-[#f4f4f4] px-6 py-5 lg:grid-cols-6">
              <div className="lg:col-span-2">
                <label className="legacy-label">Data do conteúdo: (?)</label>
                <input
                  className="legacy-input"
                  onChange={(event) =>
                    setContentForm((current) => ({
                      ...current,
                      publishDate: event.target.value
                    }))
                  }
                  value={contentForm.publishDate}
                />
              </div>
              <div className="lg:col-span-1 lg:px-3">
                <label className="legacy-label">Hora:</label>
                <input
                  className="legacy-input"
                  onChange={(event) =>
                    setContentForm((current) => ({
                      ...current,
                      publishTime: event.target.value
                    }))
                  }
                  value={contentForm.publishTime}
                />
              </div>
              <div className="lg:col-span-1 lg:px-3">
                <label className="legacy-label">Data inicial: (?)</label>
                <input
                  className="legacy-input"
                  onChange={(event) =>
                    setContentForm((current) => ({
                      ...current,
                      startDate: event.target.value
                    }))
                  }
                  value={contentForm.startDate}
                />
              </div>
              <div className="lg:col-span-1 lg:px-3">
                <label className="legacy-label">Data Final: (?)</label>
                <input
                  className="legacy-input"
                  onChange={(event) =>
                    setContentForm((current) => ({
                      ...current,
                      endDate: event.target.value
                    }))
                  }
                  value={contentForm.endDate}
                />
              </div>
              <div className="lg:col-span-1">
                <label className="legacy-label">Status: (?)</label>
                <select
                  className="legacy-input"
                  onChange={(event) =>
                    setContentForm((current) => ({
                      ...current,
                      status: event.target.value as ContentFormState["status"]
                    }))
                  }
                  value={contentForm.status}
                >
                  <option value="draft">Novo</option>
                  <option value="published">Publicado</option>
                  <option value="archived">Arquivado</option>
                </select>
              </div>
            </div>

            <div className="legacy-form-row">
              <label className="legacy-label">Url amigável: (?)</label>
              <input
                className="legacy-input"
                onChange={(event) =>
                  setContentForm((current) => ({
                    ...current,
                    slug: event.target.value
                  }))
                }
                value={contentForm.slug}
              />
            </div>

            <div className="legacy-form-row">
              <label className="legacy-label">Título do Conteúdo: (?)</label>
              <input
                className="legacy-input"
                onChange={(event) =>
                  setContentForm((current) => ({
                    ...current,
                    title: event.target.value
                  }))
                }
                value={contentForm.title}
              />
            </div>

            <div className="legacy-form-row">
              <label className="legacy-label">Chamada destaque: (?)</label>
              <textarea
                className="legacy-textarea min-h-[84px]"
                onChange={(event) =>
                  setContentForm((current) => ({
                    ...current,
                    excerpt: event.target.value
                  }))
                }
                value={contentForm.excerpt}
              />
            </div>

            <div className="border border-[#c9c9c9]">
              <div className="bg-[#4f4f4f] px-3 py-3 text-[15px] font-semibold text-white">
                Conteúdo completo (selecione templates padrão a direita): (?)
              </div>
              <div className="border-t border-dashed border-[#d9d9d9] px-6 py-6">
                <textarea
                  className="min-h-[180px] w-full border border-[#ddd] px-4 py-4 text-[15px] outline-none"
                  onChange={(event) =>
                    setContentForm((current) => ({
                      ...current,
                      body: event.target.value
                    }))
                  }
                  placeholder="+ Click para adicionar conteúdo"
                  value={contentForm.body}
                />
              </div>
            </div>

            <div className="legacy-form-row">
              <label className="legacy-label">Entra na Newsletter?</label>
              <select className="legacy-input">
                <option>Não entra na Newsletter</option>
                <option>Sim</option>
              </select>
            </div>

            <div className="legacy-form-row">
              <label className="legacy-label">Imagem de destaque do conteúdo (1300px x 730px): (?)</label>
              <div className="border border-[#ddd] bg-white px-4 py-5 text-[15px] text-[#666]">Escolher arquivo</div>
            </div>

            <div className="mt-8">
              <h2 className="mb-6 text-[28px] font-light text-[#151515]">Seções associadas</h2>
              <p className="mb-4 text-[15px] leading-7 text-[#444]">
                Associe abaixo as seções Origem e Destino nas quais deseja publicar o seu conteúdo.
                Indique a seção principal marcando o rádio e a mesma seção visualizada marcando o checkbox.
              </p>
              <div className="overflow-x-auto border border-[#d8d8d8]">
                <table className="legacy-table min-w-full">
                  <thead>
                    <tr>
                      <th className="w-[90px]">Origem</th>
                      <th className="w-[90px]">Destino</th>
                      <th>Seção</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sections.slice(0, 6).map((section) => (
                      <tr key={section.id}>
                        <td>
                          <input checked={contentForm.sectionId === section.id} name="origem" readOnly type="radio" />
                        </td>
                        <td>
                          <input type="checkbox" />
                        </td>
                        <td>{section.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <LegacyButton>Salvar Imagens</LegacyButton>
              <div className="flex gap-3">
                <LegacyButton onClick={() => setView("content-list")}>Voltar</LegacyButton>
                <LegacyButton tone="green" type="submit">
                  Incluir
                </LegacyButton>
              </div>
            </div>
          </div>

          <aside className="border-l border-[#ececec] bg-[#fbfbfb] px-4 py-2">
            <p className="mb-4 text-[30px] font-light text-[#444]">Básico</p>
            <div className="space-y-4">
              {templateLibrary.map((card) => (
                <button
                  key={card.id}
                  className={`flex h-[62px] w-full items-center justify-center border border-[#e2e2e2] bg-gradient-to-r px-3 text-center text-[10px] font-semibold text-[#555] ${card.accent}`}
                  onClick={() =>
                    setContentForm((current) => ({
                      ...current,
                      body: `${current.body}\n\n[${card.title}]`
                    }))
                  }
                  type="button"
                >
                  {card.title}
                </button>
              ))}
            </div>
          </aside>
        </form>
      );
    }

    if (view === "sections-tree") {
      return (
        <section className="space-y-8">
          <p className="max-w-[980px] text-[16px] leading-8 text-[#4b4b4b]">
            Organização lógica e hierárquica para classificação dos conteúdos.
            Seções representam a arquitetura de informação que define a estrutura completa de navegação do Portal.
          </p>

          <div className="flex items-center gap-4 border border-[#e6e6e6] px-4 py-3">
            <LegacyButton onClick={openNewSection} tone="green">
              Incluir Seção
            </LegacyButton>
            <input className="h-[38px] flex-1 border border-[#ddd] px-3 text-[15px] outline-none" placeholder="Nome da seção para busca" />
            <LegacyButton>Buscar</LegacyButton>
          </div>

          <div className="min-h-[380px]">
            <div className="mb-2 text-[17px] font-semibold text-[#333]">≣ conectahc ()</div>
            <div className="ml-6">
              <SectionTree
                nodes={sectionTree}
                onDelete={(section) => void removeEntity(`/sections/admin/${section.id}`, "Seção excluída com sucesso.")}
                onEdit={editSection}
                onOpenContents={() => setView("content-list")}
              />
            </div>
          </div>
        </section>
      );
    }

    if (view === "section-editor") {
      return (
        <section className="space-y-8">
          <p className="max-w-[980px] text-[16px] leading-8 text-[#4b4b4b]">
            Organização lógica e hierárquica para classificação dos conteúdos.
            Seções representam a arquitetura de informação que define a estrutura completa de navegação do Portal.
          </p>

          <form className="border border-[#dedede]" onSubmit={handleSectionSubmit}>
            <div className="border-b border-[#ececec] bg-[#f7f7f7] px-4 py-4 text-[18px] text-[#333]">Dados da Seção ...</div>

            <div className="space-y-6 px-4 py-5">
              <div>
                <label className="legacy-label">Nome da Seção:</label>
                <input
                  className="legacy-input"
                  onChange={(event) =>
                    setSectionForm((current) => ({ ...current, name: event.target.value }))
                  }
                  value={sectionForm.name}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-4">
                <div>
                  <label className="legacy-label">Template ou link associado a seção:</label>
                  <select className="legacy-input">
                    <option>Selecione</option>
                    {meta.templates.map((template) => (
                      <option key={template.id}>{template.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="legacy-label">Templates disponíveis:</label>
                  <select className="legacy-input">
                    <option>Selecione</option>
                    {meta.templates.map((template) => (
                      <option key={template.id}>{template.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <LegacyButton>Ver Template</LegacyButton>
                </div>
                <div>
                  <label className="legacy-label">Novo Template ou link:</label>
                  <input className="legacy-input" />
                </div>
              </div>

              <div>
                <label className="legacy-label">Url Amigável:</label>
                <input
                  className="legacy-input"
                  onChange={(event) =>
                    setSectionForm((current) => ({ ...current, slug: event.target.value }))
                  }
                  value={sectionForm.slug}
                />
              </div>

              <div>
                <label className="legacy-label">Posição da seção (paternidade dos menus):</label>
                <select
                  className="legacy-input"
                  onChange={(event) =>
                    setSectionForm((current) => ({ ...current, parentId: event.target.value }))
                  }
                  value={sectionForm.parentId}
                >
                  <option value="">:: Selecione a seção Pai ::</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 lg:grid-cols-4">
                <div>
                  <label className="legacy-label">Menu Interno:</label>
                  <select
                    className="legacy-input"
                    onChange={(event) =>
                      setSectionForm((current) => ({
                        ...current,
                        visibleInMenu: event.target.value === "Sim"
                      }))
                    }
                    value={sectionForm.visibleInMenu ? "Sim" : "Não"}
                  >
                    <option>Não</option>
                    <option>Sim</option>
                  </select>
                </div>
                <div>
                  <label className="legacy-label">Abertura:</label>
                  <select className="legacy-input">
                    <option>Mesma janela</option>
                    <option>Nova janela</option>
                  </select>
                </div>
                <div>
                  <label className="legacy-label">Controle:</label>
                  <select className="legacy-input">
                    <option>Livre</option>
                    <option>Restrito</option>
                  </select>
                </div>
                <div>
                  <label className="legacy-label">Ordem:</label>
                  <input
                    className="legacy-input"
                    onChange={(event) =>
                      setSectionForm((current) => ({ ...current, order: event.target.value }))
                    }
                    value={sectionForm.order}
                  />
                </div>
              </div>

              <div>
                <label className="legacy-label">Descrição:</label>
                <textarea
                  className="legacy-textarea min-h-[120px]"
                  onChange={(event) =>
                    setSectionForm((current) => ({
                      ...current,
                      description: event.target.value
                    }))
                  }
                  value={sectionForm.description}
                />
              </div>

              <div className="flex items-center justify-between">
                <LegacyButton onClick={() => setView("sections-tree")}>Voltar</LegacyButton>
                <LegacyButton tone="green" type="submit">
                  Salvar Seção
                </LegacyButton>
              </div>
            </div>
          </form>
        </section>
      );
    }

    if (view === "masks") {
      return (
        <section className="space-y-6">
          <p className="text-[16px] leading-8 text-[#4b4b4b]">
            Determina para o usuário a formatação da inclusão para cada tipo de conteúdo.
          </p>
          <form className="grid gap-4 border border-[#d8d8d8] bg-[#fbfbfb] p-4 lg:grid-cols-5" onSubmit={handleContentTypeSubmit}>
            <div>
              <label className="legacy-label">Nome da máscara</label>
              <input
                className="legacy-input"
                onChange={(event) => setContentTypeForm((current) => ({ ...current, name: event.target.value }))}
                value={contentTypeForm.name}
              />
            </div>
            <div>
              <label className="legacy-label">Slug</label>
              <input
                className="legacy-input"
                onChange={(event) => setContentTypeForm((current) => ({ ...current, slug: event.target.value }))}
                value={contentTypeForm.slug}
              />
            </div>
            <div className="lg:col-span-2">
              <label className="legacy-label">Descrição</label>
              <input
                className="legacy-input"
                onChange={(event) =>
                  setContentTypeForm((current) => ({ ...current, description: event.target.value }))
                }
                value={contentTypeForm.description}
              />
            </div>
            <div className="flex items-end gap-2">
              <LegacyButton tone="green" type="submit">
                {contentTypeForm.id ? "Salvar" : "Incluir"}
              </LegacyButton>
              <LegacyButton
                onClick={() => setContentTypeForm(emptyContentTypeForm)}
              >
                Novo
              </LegacyButton>
            </div>
            <label className="flex items-center gap-2 text-[14px]">
              <input
                checked={contentTypeForm.allowRichText}
                onChange={(event) =>
                  setContentTypeForm((current) => ({ ...current, allowRichText: event.target.checked }))
                }
                type="checkbox"
              />
              Editor rico
            </label>
            <label className="flex items-center gap-2 text-[14px]">
              <input
                checked={contentTypeForm.allowFeaturedMedia}
                onChange={(event) =>
                  setContentTypeForm((current) => ({ ...current, allowFeaturedMedia: event.target.checked }))
                }
                type="checkbox"
              />
              Mídia destacada
            </label>
          </form>
          <div className="overflow-x-auto border border-[#d8d8d8]">
            <table className="legacy-table min-w-full">
              <thead>
                <tr>
                  <th className="w-[40px]">
                    <input type="checkbox" />
                  </th>
                  <th className="w-[90px]">Id</th>
                  <th>Nome da Máscara</th>
                  <th className="w-[90px]">Ação</th>
                </tr>
              </thead>
              <tbody>
                {availableContentTypes.map((contentType) => (
                  <tr key={contentType.id}>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>{displayRecordCode(contentType.legacyId, contentType.id)}</td>
                    <td>
                      <button className="text-[#0c67ad] hover:underline" onClick={() => editContentType(contentType)} type="button">
                        {contentType.name}
                      </button>
                    </td>
                    <td>
                      <button className="text-[#0c67ad] hover:underline" onClick={() => editContentType(contentType)} type="button">
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (view === "templates") {
      return (
        <section className="space-y-6">
          <p className="max-w-[1200px] text-[16px] leading-8 text-[#4b4b4b]">
            Os templates determinam a formatação de apresentação dos conteúdos que serão exibidos para o usuário de acordo com as configurações e regras programadas.
          </p>
          <form className="grid gap-4 border border-[#d8d8d8] bg-[#fbfbfb] p-4 lg:grid-cols-[1.2fr_1fr_1fr_auto]" onSubmit={handleTemplateSubmit}>
            <div>
              <label className="legacy-label">Nome do template</label>
              <input className="legacy-input" onChange={(event) => setTemplateForm((current) => ({ ...current, name: event.target.value }))} value={templateForm.name} />
            </div>
            <div>
              <label className="legacy-label">Slug</label>
              <input className="legacy-input" onChange={(event) => setTemplateForm((current) => ({ ...current, slug: event.target.value }))} value={templateForm.slug} />
            </div>
            <div>
              <label className="legacy-label">Componente</label>
              <input className="legacy-input" onChange={(event) => setTemplateForm((current) => ({ ...current, componentKey: event.target.value }))} value={templateForm.componentKey} />
            </div>
            <div className="flex items-end gap-2">
              <LegacyButton tone="green" type="submit">{templateForm.id ? "Salvar" : "Incluir"}</LegacyButton>
              <LegacyButton onClick={() => setTemplateForm(emptyTemplateForm)}>Novo</LegacyButton>
            </div>
            <div className="lg:col-span-3">
              <label className="legacy-label">Descrição</label>
              <input className="legacy-input" onChange={(event) => setTemplateForm((current) => ({ ...current, description: event.target.value }))} value={templateForm.description} />
            </div>
            <label className="flex items-center gap-2 text-[14px]">
              <input checked={templateForm.isActive} onChange={(event) => setTemplateForm((current) => ({ ...current, isActive: event.target.checked }))} type="checkbox" />
              Template ativo
            </label>
          </form>
          <div className="overflow-x-auto border border-[#d8d8d8]">
            <table className="legacy-table min-w-full">
              <thead>
                <tr>
                  <th className="w-[40px]">
                    <input type="checkbox" />
                  </th>
                  <th className="w-[90px]">Id</th>
                  <th>Nome do Template</th>
                  <th className="w-[140px]">Tipo</th>
                  <th>Seções associadas</th>
                  <th>Observações</th>
                  <th className="w-[90px]">Ação</th>
                </tr>
              </thead>
              <tbody>
                {management.templates.map((template) => (
                  <tr key={template.id}>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>{displayRecordCode(template.legacyId, template.id)}</td>
                    <td>
                      <button className="text-[#0c67ad] hover:underline" onClick={() => editTemplate(template)} type="button">
                        {template.slug}
                      </button>
                    </td>
                    <td>{template.componentKey ?? "Template"}</td>
                    <td>--</td>
                    <td>{template.description ?? ""}</td>
                    <td>
                      <button className="text-[#0c67ad] hover:underline" onClick={() => removeEntity(`/management/templates/${template.id}`, "Template excluído com sucesso.")} type="button">
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (view === "elements") {
      return (
        <section className="space-y-6">
          <p className="text-[16px] leading-8 text-[#4b4b4b]">Elementos Tipo HTML para utilização no cadastro de conteúdos.</p>
          <form className="space-y-4 border border-[#d8d8d8] bg-[#fbfbfb] p-4" onSubmit={handleElementSubmit}>
            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
              <div>
                <label className="legacy-label">Nome</label>
                <input className="legacy-input" onChange={(event) => setElementForm((current) => ({ ...current, name: event.target.value }))} value={elementForm.name} />
              </div>
              <div>
                <label className="legacy-label">Thumb</label>
                <input className="legacy-input" onChange={(event) => setElementForm((current) => ({ ...current, thumbLabel: event.target.value }))} value={elementForm.thumbLabel} />
              </div>
              <div>
                <label className="legacy-label">Categoria</label>
                <input className="legacy-input" onChange={(event) => setElementForm((current) => ({ ...current, category: event.target.value }))} value={elementForm.category} />
              </div>
              <div>
                <label className="legacy-label">Status</label>
                <select className="legacy-input" onChange={(event) => setElementForm((current) => ({ ...current, status: event.target.value }))} value={elementForm.status}>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <LegacyButton tone="green" type="submit">{elementForm.id ? "Salvar" : "Incluir"}</LegacyButton>
                <LegacyButton onClick={() => setElementForm(emptyElementForm)}>Novo</LegacyButton>
              </div>
            </div>
            <div>
              <label className="legacy-label">HTML / conteúdo do bloco</label>
              <textarea className="legacy-textarea min-h-[120px]" onChange={(event) => setElementForm((current) => ({ ...current, content: event.target.value }))} value={elementForm.content} />
            </div>
          </form>
          <div className="overflow-x-auto border border-[#d8d8d8]">
            <table className="legacy-table min-w-full">
              <thead>
                <tr>
                  <th className="w-[40px]">
                    <input type="checkbox" />
                  </th>
                  <th className="w-[90px]">Id</th>
                  <th>Nome Elemento</th>
                  <th>Thumb Elemento</th>
                  <th>Categoria</th>
                  <th>Status</th>
                  <th className="w-[90px]">Ação</th>
                </tr>
              </thead>
              <tbody>
                {management.elements.map((element) => (
                  <tr key={element.id}>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>{displayRecordCode(element.legacyId, element.id)}</td>
                    <td>
                      <button className="text-[#0c67ad] hover:underline" onClick={() => editElement(element)} type="button">
                        {element.name}
                      </button>
                    </td>
                    <td>
                      <div className="inline-flex h-[68px] w-[265px] items-center justify-center bg-gradient-to-r from-[#f3f3f3] to-[#fcfcfc] text-[18px] font-semibold text-[#555]">
                        {element.thumbLabel ?? "Sem thumb"}
                      </div>
                    </td>
                    <td className="text-[#0c67ad]">{element.category ?? "--"}</td>
                    <td className="text-[#0c67ad]">{element.status === "active" ? "Ativo" : "Inativo"}</td>
                    <td>
                      <button className="text-[#0c67ad] hover:underline" onClick={() => removeEntity(`/management/elements/${element.id}`, "Elemento excluído com sucesso.")} type="button">
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (view === "permissions") {
      return (
        <section className="space-y-6">
          <p className="text-[16px] leading-8 text-[#4b4b4b]">
            Configurações de permissões para acesso, inclusão, alteração e exclusão de registros nos aplicativos do Sistema.
          </p>
          <form className="space-y-4 border border-[#d8d8d8] bg-[#fbfbfb] p-4" onSubmit={handlePermissionSubmit}>
            {permissionForm.id ? (
              <div className="flex items-center justify-between border border-[#cfe3f3] bg-[#eef7fd] px-4 py-3 text-[14px] text-[#215d85]">
                <span>Editando uma permissão administrativa existente.</span>
                <button
                  className="font-semibold text-[#0c67ad] hover:underline"
                  onClick={() => setPermissionForm(emptyPermissionForm)}
                  type="button"
                >
                  Cancelar edição
                </button>
              </div>
            ) : null}
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label className="legacy-label">Aplicativo</label>
                <select
                  className="legacy-input"
                  onChange={(event) => setPermissionForm((current) => ({ ...current, appId: event.target.value }))}
                  value={permissionForm.appId}
                >
                  <option value="">Selecione</option>
                  {management.applications.map((application) => (
                    <option key={application.id} value={application.id}>
                      {application.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="legacy-label">Grupo</label>
                <select
                  className="legacy-input"
                  onChange={(event) => setPermissionForm((current) => ({ ...current, roleId: event.target.value }))}
                  value={permissionForm.roleId}
                >
                  <option value="">Selecione</option>
                  {management.roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <LegacyButton tone="green" type="submit">
                  {permissionForm.id ? "Salvar" : "Incluir"}
                </LegacyButton>
                <LegacyButton onClick={() => setPermissionForm(emptyPermissionForm)}>Novo</LegacyButton>
              </div>
            </div>
            <div>
              <label className="legacy-label">Acesso</label>
              <div className="grid gap-2 lg:grid-cols-4">
                <label className="flex items-center gap-2 text-[14px]">
                  <input
                    checked={permissionForm.canCreate}
                    onChange={(event) => setPermissionForm((current) => ({ ...current, canCreate: event.target.checked }))}
                    type="checkbox"
                  />
                  Inclusão
                </label>
                <label className="flex items-center gap-2 text-[14px]">
                  <input
                    checked={permissionForm.canUpdate}
                    onChange={(event) => setPermissionForm((current) => ({ ...current, canUpdate: event.target.checked }))}
                    type="checkbox"
                  />
                  Alteração
                </label>
                <label className="flex items-center gap-2 text-[14px]">
                  <input
                    checked={permissionForm.canDelete}
                    onChange={(event) => setPermissionForm((current) => ({ ...current, canDelete: event.target.checked }))}
                    type="checkbox"
                  />
                  Exclusão
                </label>
                <label className="flex items-center gap-2 text-[14px]">
                  <input
                    checked={permissionForm.canAccess}
                    onChange={(event) => setPermissionForm((current) => ({ ...current, canAccess: event.target.checked }))}
                    type="checkbox"
                  />
                  Acesso
                </label>
              </div>
            </div>
          </form>
          <div className="overflow-x-auto border border-[#d8d8d8]">
            <table className="legacy-table min-w-full">
              <thead>
                <tr>
                  <th className="w-[40px]">
                    <input type="checkbox" />
                  </th>
                  <th className="w-[90px]">Id</th>
                  <th>Aplicativo</th>
                  <th>Grupo</th>
                  <th>Inclui</th>
                  <th>Altera</th>
                  <th>Exclui</th>
                  <th>Acessa</th>
                  <th className="w-[90px]">Ação</th>
                </tr>
              </thead>
              <tbody>
                {management.roleApplicationAccesses.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>{displayRecordCode(row.legacyId, row.id)}</td>
                    <td>
                      <button
                        className="text-[#0c67ad] hover:underline"
                        onClick={() => editPermission(row)}
                        type="button"
                      >
                        {row.appName}
                      </button>
                    </td>
                    <td className="text-[#0c67ad]">{row.roleName}</td>
                    <td>{row.canCreate ? "Sim" : "Não"}</td>
                    <td>{row.canUpdate ? "Sim" : "Não"}</td>
                    <td>{row.canDelete ? "Sim" : "Não"}</td>
                    <td>{row.canAccess ? "Sim" : "Não"}</td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <button
                          className="text-left text-[#0c67ad] hover:underline"
                          onClick={() => editPermission(row)}
                          type="button"
                        >
                          Editar
                        </button>
                        <button
                          className="text-left text-[#c4473c] hover:underline"
                          onClick={() =>
                            removeEntity(
                              `/management/role-application-accesses/${row.id}`,
                              "Permissão excluída com sucesso."
                            )
                          }
                          type="button"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (view === "groups") {
      return (
        <section className="space-y-6">
          <p className="text-[16px] leading-8 text-[#4b4b4b]">
            O Workflow de publicação sempre inicia com o grupo de Autor e termina com o Publicador. Entre o Autor e o Publicador poderão ser acrescentados vários grupos de Editor conforme a necessidade.
          </p>
          <form className="space-y-4 border border-[#d8d8d8] bg-[#fbfbfb] p-4" onSubmit={handleRoleSubmit}>
            <div className="grid gap-4 lg:grid-cols-4">
              <div>
                <label className="legacy-label">Nome do perfil</label>
                <input
                  className="legacy-input"
                  onChange={(event) => setRoleForm((current) => ({ ...current, name: event.target.value }))}
                  value={roleForm.name}
                />
              </div>
              <div>
                <label className="legacy-label">Descrição</label>
                <input
                  className="legacy-input"
                  onChange={(event) => setRoleForm((current) => ({ ...current, description: event.target.value }))}
                  value={roleForm.description}
                />
              </div>
              <div>
                <label className="legacy-label">Função</label>
                <input
                  className="legacy-input"
                  onChange={(event) => setRoleForm((current) => ({ ...current, functionName: event.target.value }))}
                  value={roleForm.functionName}
                />
              </div>
              <div>
                <label className="legacy-label">Status</label>
                <select
                  className="legacy-input"
                  onChange={(event) => setRoleForm((current) => ({ ...current, status: event.target.value }))}
                  value={roleForm.status}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Excluído">Excluído</option>
                </select>
              </div>
            </div>
            <div>
              <label className="legacy-label">Grupo superior</label>
              <select
                className="legacy-input"
                onChange={(event) => setRoleForm((current) => ({ ...current, parentRoleId: event.target.value }))}
                value={roleForm.parentRoleId}
              >
                <option value="">Selecione</option>
                {management.roles
                  .filter((role) => role.id !== roleForm.id)
                  .map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="legacy-label">Permissões do perfil</label>
              <div className="grid gap-2 lg:grid-cols-3">
                {management.permissions.map((permission) => (
                  <label className="flex items-center gap-2 text-[14px]" key={permission.id}>
                    <input
                      checked={roleForm.permissionIds.includes(permission.id)}
                      onChange={() =>
                        setRoleForm((current) => ({
                          ...current,
                          permissionIds: toggleItem(current.permissionIds, permission.id)
                        }))
                      }
                      type="checkbox"
                    />
                    {getPermissionLabel(permission.code)}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="legacy-label">Seções associadas</label>
                <div className="max-h-[220px] overflow-auto border border-[#e4e4e4] bg-white p-3">
                  <div className="grid gap-2">
                    {sections.map((section) => (
                      <label className="flex items-center gap-2 text-[14px]" key={section.id}>
                        <input
                          checked={roleForm.sectionIds.includes(section.id)}
                          onChange={() =>
                            setRoleForm((current) => ({
                              ...current,
                              sectionIds: toggleItem(current.sectionIds, section.id)
                            }))
                          }
                          type="checkbox"
                        />
                        {section.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="legacy-label">Máscaras permitidas</label>
                <p className="mb-2 text-[12px] text-[#666]">
                  Estas máscaras definem quais tipos de conteúdo este grupo pode listar, criar e editar.
                </p>
                <div className="max-h-[220px] overflow-auto border border-[#e4e4e4] bg-white p-3">
                  <div className="grid gap-2">
                    {availableContentTypes.map((contentType) => (
                      <label className="flex items-center gap-2 text-[14px]" key={contentType.id}>
                        <input
                          checked={roleForm.contentTypeIds.includes(contentType.id)}
                          onChange={() =>
                            setRoleForm((current) => ({
                              ...current,
                              contentTypeIds: toggleItem(current.contentTypeIds, contentType.id)
                            }))
                          }
                          type="checkbox"
                        />
                        {contentType.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="legacy-label">Menus habilitados para este grupo</label>
              <div className="grid gap-4 lg:grid-cols-2">
                {(Object.entries(menuGroups) as Array<[TopMenuKey, Array<{ key: ViewKey; label: string }>]>).map(([menuKey, items]) => (
                  <div className="border border-[#e4e4e4] bg-white p-3" key={menuKey}>
                    <div className="mb-3 text-[14px] font-semibold text-[#333]">
                      {menuKey === "administration" ? "Administração" : menuKey === "newsletter" ? "Newsletter" : menuKey === "system" ? "Sistema" : "Conteúdo"}
                    </div>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <label className="flex items-center gap-2 text-[14px]" key={item.key}>
                          <input
                            checked={roleForm.menuAccessKeys.includes(`${menuKey}:${item.key}`)}
                            onChange={() =>
                              setRoleForm((current) => ({
                                ...current,
                                menuAccessKeys: toggleItem(current.menuAccessKeys, `${menuKey}:${item.key}`)
                              }))
                            }
                            type="checkbox"
                          />
                          {item.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <LegacyButton tone="green" type="submit">
                {roleForm.id ? "Salvar" : "Incluir"}
              </LegacyButton>
              <LegacyButton onClick={() => setRoleForm(emptyRoleForm)}>Novo</LegacyButton>
            </div>
          </form>
          <div className="overflow-x-auto border border-[#d8d8d8]">
            <table className="legacy-table min-w-full">
              <thead>
                <tr>
                  <th className="w-[40px]">
                    <input type="checkbox" />
                  </th>
                  <th className="w-[90px]">Id</th>
                  <th>Nome do Grupo</th>
                  <th>Workflow</th>
                  <th>Descrição</th>
                  <th>Status</th>
                  <th className="w-[90px]">Ação</th>
                </tr>
              </thead>
              <tbody>
                {management.roles.map((role) => (
                  <tr key={role.id}>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>{displayRecordCode(role.legacyId, role.id)}</td>
                    <td>
                      <button className="text-[#0c67ad] hover:underline" onClick={() => editRole(role)} type="button">
                        {role.name}
                      </button>
                    </td>
                    <td className="text-[#0c67ad]">
                      {role.functionName ?? "-"}
                      {role.parentRoleName ? <div className="text-[12px] text-[#666]">Superior: {role.parentRoleName}</div> : null}
                    </td>
                    <td className="text-[#0c67ad]">
                      {role.description}
                      <div className="mt-2 text-[12px] text-[#666]">
                        Menus: {role.menuAccesses.map((access) => getBreadcrumbLabel(access.viewKey)).join(", ") || "Nenhum"}
                      </div>
                      <div className="mt-1 text-[12px] text-[#666]">
                        Máscaras: {role.contentTypeIds.length} | Seções: {role.sectionIds.length}
                      </div>
                    </td>
                    <td className="text-[#0c67ad]">{role.status ?? "Ativo"}</td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <button className="text-left text-[#0c67ad] hover:underline" onClick={() => editRole(role)} type="button">
                          Editar
                        </button>
                        <button className="text-left text-[#c4473c] hover:underline" onClick={() => removeEntity(`/management/roles/${role.id}`, "Grupo excluído com sucesso.")} type="button">
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (view === "applications") {
      return (
        <section className="space-y-6">
          <p className="text-[16px] leading-8 text-[#4b4b4b]">
            Cadastro de aplicativos, posicionamento nos menus e referência de link para as páginas do sistema.
          </p>
          <form className="space-y-4 border border-[#d8d8d8] bg-[#fbfbfb] p-4" onSubmit={handleApplicationSubmit}>
            <div className="grid gap-4 lg:grid-cols-4">
              <div>
                <label className="legacy-label">Aplicativo</label>
                <input
                  className="legacy-input"
                  onChange={(event) => setApplicationForm((current) => ({ ...current, name: event.target.value }))}
                  value={applicationForm.name}
                />
              </div>
              <div>
                <label className="legacy-label">Área</label>
                <input
                  className="legacy-input"
                  onChange={(event) => setApplicationForm((current) => ({ ...current, area: event.target.value }))}
                  value={applicationForm.area}
                />
              </div>
              <div>
                <label className="legacy-label">Link</label>
                <input
                  className="legacy-input"
                  onChange={(event) => setApplicationForm((current) => ({ ...current, link: event.target.value }))}
                  value={applicationForm.link}
                />
              </div>
              <div className="flex items-end gap-2">
                <LegacyButton tone="green" type="submit">
                  {applicationForm.id ? "Salvar" : "Incluir"}
                </LegacyButton>
                <LegacyButton onClick={() => setApplicationForm(emptyApplicationForm)}>Novo</LegacyButton>
              </div>
            </div>
            <div>
              <label className="legacy-label">Descrição</label>
              <textarea
                className="legacy-textarea min-h-[90px]"
                onChange={(event) => setApplicationForm((current) => ({ ...current, description: event.target.value }))}
                value={applicationForm.description}
              />
            </div>
          </form>
          <div className="overflow-x-auto border border-[#d8d8d8]">
            <table className="legacy-table min-w-full">
              <thead>
                <tr>
                  <th className="w-[90px]">Id</th>
                  <th>Aplicativo</th>
                  <th>Área</th>
                  <th>Link</th>
                  <th>Descrição</th>
                  <th className="w-[90px]">Ação</th>
                </tr>
              </thead>
              <tbody>
                {management.applications.map((application) => (
                  <tr key={application.id}>
                    <td>{displayRecordCode(application.legacyId, application.id)}</td>
                    <td>
                      <button className="text-[#0c67ad] hover:underline" onClick={() => editApplication(application)} type="button">
                        {application.name}
                      </button>
                    </td>
                    <td>{application.area}</td>
                    <td className="text-[#0c67ad]">{application.link}</td>
                    <td>{application.description ?? ""}</td>
                    <td>
                      <button className="text-[#c4473c] hover:underline" onClick={() => removeEntity(`/management/applications/${application.id}`, "Aplicativo excluído com sucesso.")} type="button">
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (view === "emails") {
      return (
        <section className="space-y-6">
          <p className="text-[16px] leading-8 text-[#4b4b4b]">
            Aqui estão listados todos os e-mails utilizados pelo portal em contato, newsletter, inscrições e demais aplicações.
          </p>
          <form className="space-y-4 border border-[#d8d8d8] bg-[#fbfbfb] p-4" onSubmit={handleSystemEmailSubmit}>
            <div className="grid gap-4 lg:grid-cols-4">
              <div>
                <label className="legacy-label">Nome</label>
                <input className="legacy-input" onChange={(event) => setSystemEmailForm((current) => ({ ...current, name: event.target.value }))} value={systemEmailForm.name} />
              </div>
              <div>
                <label className="legacy-label">Email</label>
                <input className="legacy-input" onChange={(event) => setSystemEmailForm((current) => ({ ...current, email: event.target.value }))} value={systemEmailForm.email} />
              </div>
              <div>
                <label className="legacy-label">Área</label>
                <input className="legacy-input" onChange={(event) => setSystemEmailForm((current) => ({ ...current, area: event.target.value }))} value={systemEmailForm.area} />
              </div>
              <div>
                <label className="legacy-label">Valor</label>
                <input className="legacy-input" onChange={(event) => setSystemEmailForm((current) => ({ ...current, value: event.target.value }))} value={systemEmailForm.value} />
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div>
                <label className="legacy-label">Descrição</label>
                <textarea className="legacy-textarea min-h-[90px]" onChange={(event) => setSystemEmailForm((current) => ({ ...current, description: event.target.value }))} value={systemEmailForm.description} />
              </div>
              <div className="flex items-end gap-2">
                <LegacyButton tone="green" type="submit">
                  {systemEmailForm.id ? "Salvar" : "Incluir"}
                </LegacyButton>
                <LegacyButton onClick={() => setSystemEmailForm(emptySystemEmailForm)}>Novo</LegacyButton>
              </div>
            </div>
          </form>
          <div className="overflow-x-auto border border-[#d8d8d8]">
            <table className="legacy-table min-w-full">
              <thead>
                <tr>
                  <th className="w-[90px]">Id</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Área</th>
                  <th>Descrição</th>
                  <th className="w-[90px]">Ação</th>
                </tr>
              </thead>
              <tbody>
                {management.systemEmails.map((systemEmail) => (
                  <tr key={systemEmail.id}>
                    <td>{displayRecordCode(systemEmail.legacyId, systemEmail.id)}</td>
                    <td>
                      <button className="text-[#0c67ad] hover:underline" onClick={() => editSystemEmail(systemEmail)} type="button">
                        {systemEmail.name}
                      </button>
                    </td>
                    <td className="text-[#0c67ad]">{systemEmail.email}</td>
                    <td>{systemEmail.area}</td>
                    <td>{systemEmail.description ?? ""}</td>
                    <td>
                      <button className="text-[#c4473c] hover:underline" onClick={() => removeEntity(`/management/system-emails/${systemEmail.id}`, "Email excluído com sucesso.")} type="button">
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (view === "statistics") {
      const statisticRows = [...sections].sort((left, right) => (right.visits ?? 0) - (left.visits ?? 0));

      return (
        <section className="space-y-6">
          <p className="text-[16px] leading-8 text-[#4b4b4b]">
            Estatística resumida de acesso por navegação em seção. Clique em zerar estatística para recomeçar a contagem.
          </p>
          <div className="flex flex-wrap gap-2">
            <LegacyButton tone="red" onClick={() => void resetStatistics()}>
              Zerar TODAS as Estatísticas
            </LegacyButton>
          </div>
          <div className="overflow-x-auto border border-[#d8d8d8]">
            <table className="legacy-table min-w-full">
              <thead>
                <tr>
                  <th className="w-[90px]">Id</th>
                  <th>Seção</th>
                  <th>Caminho</th>
                  <th>Visitas</th>
                </tr>
              </thead>
              <tbody>
                {statisticRows.map((section) => (
                  <tr key={section.id}>
                    <td>{displayRecordCode(section.legacyId, section.id)}</td>
                    <td>{section.name}</td>
                    <td className="text-[#0c67ad]">{section.path}</td>
                    <td>{section.visits ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (view === "users") {
      return (
        <section className="space-y-6">
          <form className="space-y-4 border border-[#d8d8d8] bg-[#fbfbfb] p-4" onSubmit={handleUserSubmit}>
            {userForm.id ? (
              <div className="flex items-center justify-between border border-[#cfe3f3] bg-[#eef7fd] px-4 py-3 text-[14px] text-[#215d85]">
                <span>Modo de edição ativo para este usuário.</span>
                <button
                  className="font-semibold text-[#0c67ad] hover:underline"
                  onClick={() => {
                    setUserForm(emptyUserForm);
                    setHighlightedUserId("");
                  }}
                  type="button"
                >
                  Cancelar edição
                </button>
              </div>
            ) : null}
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label className="legacy-label">Nome</label>
                <input
                  className="legacy-input"
                  onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))}
                  value={userForm.name}
                />
              </div>
              <div>
                <label className="legacy-label">E-mail</label>
                <input
                  className="legacy-input"
                  onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
                  value={userForm.email}
                />
              </div>
              <div>
                <label className="legacy-label">Username</label>
                <input
                  className="legacy-input"
                  onChange={(event) => setUserForm((current) => ({ ...current, username: event.target.value }))}
                  value={userForm.username}
                />
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label className="legacy-label">CPF</label>
                <input
                  className="legacy-input"
                  onChange={(event) => setUserForm((current) => ({ ...current, cpf: event.target.value }))}
                  value={userForm.cpf}
                />
              </div>
              <div>
                <label className="legacy-label">CNH</label>
                <input
                  className="legacy-input"
                  onChange={(event) => setUserForm((current) => ({ ...current, cnh: event.target.value }))}
                  value={userForm.cnh}
                />
              </div>
              <div>
                <label className="legacy-label">Senha</label>
                <input
                  className="legacy-input"
                  onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))}
                  value={userForm.password}
                />
              </div>
              <div>
                <label className="legacy-label">Status</label>
                <select
                  className="legacy-input"
                  onChange={(event) =>
                    setUserForm((current) => ({
                      ...current,
                      status: event.target.value,
                      isActive: !["Inativo", "Excluído"].includes(event.target.value)
                    }))
                  }
                  value={userForm.status}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Verificado">Verificado</option>
                  <option value="Novo">Novo</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Excluído">Excluído</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <LegacyButton tone="green" type="submit">
                  {userForm.id ? "Salvar alterações" : "Incluir"}
                </LegacyButton>
                <LegacyButton
                  onClick={() => {
                    setUserForm(emptyUserForm);
                    setHighlightedUserId("");
                  }}
                >
                  Novo
                </LegacyButton>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label className="legacy-label">Empresa</label>
                <input
                  className="legacy-input"
                  onChange={(event) => setUserForm((current) => ({ ...current, company: event.target.value }))}
                  value={userForm.company}
                />
              </div>
              <div>
                <label className="legacy-label">Função</label>
                <input
                  className="legacy-input"
                  onChange={(event) => setUserForm((current) => ({ ...current, jobTitle: event.target.value }))}
                  value={userForm.jobTitle}
                />
              </div>
              <div>
                <label className="legacy-label">Telefone</label>
                <input
                  className="legacy-input"
                  onChange={(event) => setUserForm((current) => ({ ...current, phone: event.target.value }))}
                  value={userForm.phone}
                />
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-3">
                <label className="legacy-label">Endereço</label>
                <textarea
                  className="legacy-textarea"
                  onChange={(event) => setUserForm((current) => ({ ...current, address: event.target.value }))}
                  value={userForm.address}
                />
              </div>
              <div>
                <label className="legacy-label">CEP</label>
                <input
                  className="legacy-input"
                  onChange={(event) => setUserForm((current) => ({ ...current, zipCode: event.target.value }))}
                  value={userForm.zipCode}
                />
              </div>
              <div>
                <label className="legacy-label">Cidade</label>
                <input
                  className="legacy-input"
                  onChange={(event) => setUserForm((current) => ({ ...current, city: event.target.value }))}
                  value={userForm.city}
                />
              </div>
              <div>
                <label className="legacy-label">Estado</label>
                <input
                  className="legacy-input"
                  onChange={(event) => setUserForm((current) => ({ ...current, state: event.target.value }))}
                  value={userForm.state}
                />
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-4">
              <div>
                <label className="legacy-label">Endereço 2</label>
                <input
                  className="legacy-input"
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, secondaryAddress: event.target.value }))
                  }
                  value={userForm.secondaryAddress}
                />
              </div>
              <div>
                <label className="legacy-label">Número</label>
                <input
                  className="legacy-input"
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, secondaryNumber: event.target.value }))
                  }
                  value={userForm.secondaryNumber}
                />
              </div>
              <div>
                <label className="legacy-label">Complemento</label>
                <input
                  className="legacy-input"
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, secondaryComplement: event.target.value }))
                  }
                  value={userForm.secondaryComplement}
                />
              </div>
              <div>
                <label className="legacy-label">Bairro</label>
                <input
                  className="legacy-input"
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, neighborhood: event.target.value }))
                  }
                  value={userForm.neighborhood}
                />
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label className="legacy-label">Facebook</label>
                <input
                  className="legacy-input"
                  onChange={(event) => setUserForm((current) => ({ ...current, facebook: event.target.value }))}
                  value={userForm.facebook}
                />
              </div>
              <div>
                <label className="legacy-label">Instagram</label>
                <input
                  className="legacy-input"
                  onChange={(event) => setUserForm((current) => ({ ...current, instagram: event.target.value }))}
                  value={userForm.instagram}
                />
              </div>
              <div>
                <label className="legacy-label">YouTube</label>
                <input
                  className="legacy-input"
                  onChange={(event) => setUserForm((current) => ({ ...current, youtube: event.target.value }))}
                  value={userForm.youtube}
                />
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-4">
              <label className="flex items-center gap-2 text-[14px]">
                <input
                  checked={userForm.isActive}
                  onChange={(event) => setUserForm((current) => ({ ...current, isActive: event.target.checked }))}
                  type="checkbox"
                />
                Usuário ativo
              </label>
              <label className="flex items-center gap-2 text-[14px]">
                <input
                  checked={userForm.isSuperAdmin}
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, isSuperAdmin: event.target.checked }))
                  }
                  type="checkbox"
                />
                Super admin
              </label>
              <label className="flex items-center gap-2 text-[14px]">
                <input
                  checked={userForm.forcePasswordChange}
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, forcePasswordChange: event.target.checked }))
                  }
                  type="checkbox"
                />
                Obrigar troca de senha
              </label>
            </div>
            <div>
              <label className="legacy-label">Observações</label>
              <textarea
                className="legacy-textarea min-h-[120px]"
                onChange={(event) => setUserForm((current) => ({ ...current, notes: event.target.value }))}
                value={userForm.notes}
              />
            </div>
            <div>
              <label className="legacy-label">Perfis vinculados</label>
              <p className="mb-3 text-[13px] text-[#666]">
                No legado, as permissões do usuário vêm dos grupos/perfis marcados abaixo.
              </p>
              <div className="grid gap-2 lg:grid-cols-3">
                {management.roles.map((role) => (
                  <label className="flex items-center gap-2 text-[14px]" key={role.id}>
                    <input
                      checked={userForm.roleIds.includes(role.id)}
                      onChange={() =>
                        setUserForm((current) => ({
                          ...current,
                          roleIds: toggleItem(current.roleIds, role.id)
                        }))
                      }
                      type="checkbox"
                    />
                    {role.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="border border-[#d8d8d8] bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[16px] font-semibold text-[#333]">Permissões herdadas</h3>
                  <button
                    className="text-[13px] font-semibold text-[#0c67ad] hover:underline"
                    onClick={() => {
                      setTopMenu("administration");
                      setView("permissions");
                    }}
                    type="button"
                  >
                    Abrir Permissões
                  </button>
                </div>
                {selectedUserPermissionLabels.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedUserPermissionLabels.map((label) => (
                      <span className="border border-[#cfe1ee] bg-[#f5fbff] px-2 py-1 text-[12px] text-[#215d85]" key={label}>
                        {label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#777]">Nenhuma permissão herdada. Vincule pelo menos um grupo.</p>
                )}
              </div>
              <div className="border border-[#d8d8d8] bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[16px] font-semibold text-[#333]">Aplicativos liberados</h3>
                  <button
                    className="text-[13px] font-semibold text-[#0c67ad] hover:underline"
                    onClick={() => {
                      setTopMenu("administration");
                      setView("groups");
                    }}
                    type="button"
                  >
                    Abrir Grupos
                  </button>
                </div>
                {selectedUserAppAccesses.length > 0 ? (
                  <div className="space-y-2">
                    {selectedUserAppAccesses.map((access) => (
                      <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-2 text-[13px]" key={access.id}>
                        <div>
                          <div className="font-semibold text-[#333]">{access.appName}</div>
                          <div className="text-[#777]">{access.area}</div>
                        </div>
                        <div className="text-right text-[#0c67ad]">
                          {[
                            access.canCreate ? "inclui" : null,
                            access.canUpdate ? "altera" : null,
                            access.canDelete ? "exclui" : null,
                            access.canAccess ? "acessa" : null
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#777]">Nenhum aplicativo liberado pelos grupos selecionados.</p>
                )}
              </div>
            </div>
          </form>
          <div className="overflow-x-auto border border-[#d8d8d8]">
            <table className="legacy-table min-w-full">
              <thead>
                <tr>
                  <th className="w-[40px]">
                    <input type="checkbox" />
                  </th>
                  <th className="w-[70px]">Id</th>
                  <th>Nome/Município</th>
                  <th>Username</th>
                  <th className="w-[90px]">CPF</th>
                  <th>E-mail</th>
                  <th>Grupos</th>
                  <th>Status</th>
                  <th className="w-[90px]">Ação</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((managedUser) => (
                  <tr className={managedUser.id === highlightedUserId ? "bg-[#fff8d9]" : undefined} key={managedUser.id}>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>{displayRecordCode(managedUser.legacyId, managedUser.id)}</td>
                    <td>
                      <button className="text-[#0c67ad] hover:underline" onClick={() => editUser(managedUser)} type="button">
                        {managedUser.name}
                        {managedUser.city ? `-${managedUser.city}` : ""}
                      </button>
                    </td>
                    <td className="text-[#0c67ad]">{managedUser.username ?? "-"}</td>
                    <td className="text-[#0c67ad]">{managedUser.cpf ?? "-"}</td>
                    <td className="text-[#0c67ad]">{managedUser.email}</td>
                    <td className="text-[#0c67ad]">{managedUser.roles.map((role) => role.name).join(", ")}</td>
                    <td className="text-[#0c67ad]">{managedUser.status ?? (managedUser.isActive ? "Ativo" : "Inativo")}</td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <button className="text-left text-[#0c67ad] hover:underline" onClick={() => editUser(managedUser)} type="button">
                          Editar
                        </button>
                        <button className="text-left text-[#c4473c] hover:underline" onClick={() => removeEntity(`/management/users/${managedUser.id}`, "Usuário excluído com sucesso.")} type="button">
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (view === "newsletter") {
      return (
        <section className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <LegacyButton tone="green">Incluir</LegacyButton>
            <LegacyButton>Buscar</LegacyButton>
            <LegacyButton>Mudar Status</LegacyButton>
          </div>
          <div className="overflow-x-auto border border-[#d8d8d8]">
            <table className="legacy-table min-w-full">
              <thead>
                <tr>
                  <th className="w-[90px]">Id</th>
                  <th>Campanha</th>
                  <th>Assunto</th>
                  <th>Grupo</th>
                  <th>Status</th>
                  <th>Disparos</th>
                </tr>
              </thead>
              <tbody>
                {management.newsletterCampaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>{displayRecordCode(campaign.legacyId, campaign.id)}</td>
                    <td className="text-[#0c67ad]">{campaign.name}</td>
                    <td>{campaign.subject}</td>
                    <td>{campaign.recipientGroup?.name ?? "Sem grupo"}</td>
                    <td>{campaign.status}</td>
                    <td>{campaign._count.dispatches}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    return (
      <section className="space-y-6">
        <p className="text-[16px] leading-8 text-[#4b4b4b]">Visão inicial de estatísticas e contexto operacional do manager.</p>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="border border-[#ddd] bg-[#fafafa] p-6">
            <div className="text-[14px] uppercase tracking-[0.08em] text-[#777]">Conteúdos</div>
            <div className="mt-2 text-[44px] font-light text-[#111]">{contents.length}</div>
          </div>
          <div className="border border-[#ddd] bg-[#fafafa] p-6">
            <div className="text-[14px] uppercase tracking-[0.08em] text-[#777]">Usuários</div>
            <div className="mt-2 text-[44px] font-light text-[#111]">{management.users.length}</div>
          </div>
          <div className="border border-[#ddd] bg-[#fafafa] p-6">
            <div className="text-[14px] uppercase tracking-[0.08em] text-[#777]">LGPD</div>
            <div className="mt-2 text-[44px] font-light text-[#111]">{management.privacyRequests.length}</div>
          </div>
        </div>
      </section>
    );
  }

  if (!token || !user) {
    return renderLogin();
  }

  return renderLegacyShell();
}
