import { describe, expect, it, vi } from "vitest";

import { ManagementUsersService } from "./management-users.service";

vi.mock("argon2", () => ({
  hash: vi.fn(async (password: string) => `hashed:${password}`)
}));

function createService() {
  const prisma = {
    user: {
      create: vi.fn(async ({ data }) => ({ id: "user-created", ...data })),
      delete: vi.fn(async ({ where }) => ({ id: where.id, deleted: true })),
      findUnique: vi.fn(),
      update: vi.fn(async ({ data, where }) => ({ id: where.id, ...data }))
    }
  };
  const sequence = {
    nextFor: vi.fn().mockResolvedValue(1001)
  };
  const validation = {
    ensureRoleIds: vi.fn().mockResolvedValue(undefined),
    ensureUniqueUserIdentity: vi.fn().mockResolvedValue(undefined)
  };

  return {
    prisma,
    sequence,
    service: new ManagementUsersService(prisma as never, sequence as never, validation as never),
    validation
  };
}

describe("ManagementUsersService", () => {
  it("creates users with normalized identities, deterministic display id and hashed temporary password", async () => {
    const { prisma, sequence, service, validation } = createService();

    await service.createUser({
      cpf: "123.456.789-01",
      email: " MARIA@EXAMPLE.TEST ",
      name: "Maria Refresh",
      password: "Refresh123!",
      roleIds: ["role-admin"],
      status: "Inativo",
      username: " MARIA "
    });

    expect(sequence.nextFor).toHaveBeenCalledWith("user");
    expect(validation.ensureUniqueUserIdentity).toHaveBeenCalledWith({
      cpf: "12345678901",
      email: "maria@example.test",
      username: "maria"
    });
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          displayId: 1001,
          email: "maria@example.test",
          isActive: false,
          passwordHash: "hashed:Refresh123!",
          roles: {
            create: [{ roleId: "role-admin" }]
          },
          username: "maria"
        })
      })
    );
  });

  it("preserves the existing picture when an update does not include a new upload", async () => {
    const { prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "old@example.test",
      forcePasswordChange: false,
      isSuperAdmin: false,
      passwordHash: "LDAP",
      picture: "http://cdn.example.test/current.jpg",
      status: "Ativo"
    });

    await service.updateUser("user-1", {
      email: "new@example.test",
      name: "Maria Atualizada",
      username: "maria"
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          picture: "http://cdn.example.test/current.jpg"
        })
      })
    );
  });

  it("hard deletes users without historical links", async () => {
    const { prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      status: "Ativo",
      _count: {
        auditLogs: 0,
        authoredContents: 0,
        revisions: 0,
        roles: 1
      }
    });

    await expect(service.deleteUser("user-1")).resolves.toEqual({ deleted: true, id: "user-1" });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "user-1" } });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("logically deletes users with audit or content history and removes active identities", async () => {
    const { prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue({
      id: "user-history-12345678",
      name: "Historico",
      username: "historico",
      status: "Ativo",
      _count: {
        auditLogs: 1,
        authoredContents: 0,
        revisions: 0,
        roles: 1
      }
    });

    await service.deleteUser("user-history-12345678");

    expect(prisma.user.delete).not.toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "excluido+12345678@abbatech.dev.br",
          isActive: false,
          roles: { deleteMany: {} },
          status: "Excluído",
          username: "excluido.12345678"
        }),
        where: { id: "user-history-12345678" }
      })
    );
  });
});
