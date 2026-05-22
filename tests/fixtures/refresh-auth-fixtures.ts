export const refreshTestCredentials = {
  admin: {
    email: process.env.ADMIN_EMAIL ?? "admin.test@abbatech.local",
    password: process.env.ADMIN_PASSWORD ?? "Refresh123!"
  },
  common: {
    email: process.env.TEST_COMMON_EMAIL ?? "editor.test@abbatech.local",
    password: process.env.TEST_COMMON_PASSWORD ?? "Refresh123!"
  },
  noPermission: {
    email: process.env.TEST_NO_PERMISSION_EMAIL ?? "blocked.test@abbatech.local",
    password: process.env.TEST_NO_PERMISSION_PASSWORD ?? "Refresh123!"
  },
  deleted: {
    email: process.env.TEST_DELETED_EMAIL ?? "deleted.test@abbatech.local",
    password: process.env.TEST_DELETED_PASSWORD ?? "Refresh123!"
  }
};

export const refreshAdminUserFixture = {
  id: "user-admin",
  name: "Admin Refresh",
  email: refreshTestCredentials.admin.email,
  username: "admin",
  cpf: null,
  picture: null,
  permissions: ["management.read", "users.read", "roles.read"],
  csrfToken: "csrf-token",
  activeRoleId: "role-admin",
  roles: [
    {
      id: "role-admin",
      name: "Administrador",
      description: null,
      functionName: "Administrador",
      status: "Ativo",
      permissions: ["management.read", "users.read", "roles.read"],
      menuAccesses: [
        { topMenu: "administration", viewKey: "users" },
        { topMenu: "administration", viewKey: "groups" }
      ],
      appAccesses: []
    }
  ]
};

export const emptyManagementBootstrapFixture = {
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
  newsletterRecipients: [],
  newsletterCampaigns: [],
  privacyRequests: []
};
