import { describe, expect, it, vi } from "vitest";

import { buildManagementBootstrap } from "./management.bootstrap";

function createBootstrapPrisma() {
  const emptyFindMany = vi.fn().mockResolvedValue([]);

  return {
    contentType: { findMany: emptyFindMany },
    user: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "user-1",
          displayId: 12,
          name: "Maria Refresh",
          email: "maria@example.test",
          username: "maria",
          cpf: null,
          picture: "/media/users/maria/avatar.jpg",
          cnh: null,
          status: "Ativo",
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
          notes: null,
          facebook: null,
          instagram: null,
          youtube: null,
          forcePasswordChange: false,
          isActive: true,
          isSuperAdmin: false,
          lastLoginAt: null,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          roles: [{ role: { id: "role-admin", name: "Administrador", description: null } }],
          _count: { authoredContents: 0, revisions: 0 }
        }
      ])
    },
    role: { findMany: emptyFindMany },
    permission: { findMany: emptyFindMany },
    systemApplication: { findMany: emptyFindMany },
    roleApplicationAccess: { findMany: emptyFindMany },
    systemEmail: { findMany: emptyFindMany },
    template: { findMany: emptyFindMany },
    element: { findMany: emptyFindMany },
    newsletterGroup: { findMany: emptyFindMany },
    newsletterRecipient: { findMany: emptyFindMany },
    newsletterCampaign: { findMany: emptyFindMany },
    privacyRequest: { findMany: emptyFindMany }
  };
}

describe("buildManagementBootstrap integration mapping", () => {
  it("filters logically deleted users out of the common management bootstrap", async () => {
    const prisma = createBootstrapPrisma();

    const result = await buildManagementBootstrap(prisma as never);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: {
            not: "Excluído"
          }
        }
      })
    );
    expect(result.users).toEqual([
      expect.objectContaining({
        displayId: 12,
        email: "maria@example.test",
        name: "Maria Refresh",
        roles: [{ id: "role-admin", name: "Administrador", description: null }],
        stats: { authoredContents: 0, revisions: 0 }
      })
    ]);
  });
});
