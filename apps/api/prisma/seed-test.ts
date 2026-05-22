import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { runBootstrapSeed } from "./seed/bootstrap";

loadLocalTestEnv();

const prisma = new PrismaClient();

type TestRoleDefinition = {
  name: string;
  description: string;
  functionName: string;
  permissionCodes: string[];
  menuAccesses: Array<{
    topMenu: string;
    viewKey: string;
  }>;
};

const testRoles: TestRoleDefinition[] = [
  {
    name: "Editor Teste",
    description: "Perfil usado em testes automatizados de conteúdo.",
    functionName: "Editor",
    permissionCodes: ["contents.read", "sections.read"],
    menuAccesses: [{ topMenu: "content", viewKey: "content-list" }]
  },
  {
    name: "Sem Permissao Teste",
    description: "Perfil usado para validar bloqueios de autorizacao.",
    functionName: "Bloqueado",
    permissionCodes: [],
    menuAccesses: []
  }
];

function loadLocalTestEnv() {
  const candidates = [
    path.resolve(process.cwd(), ".env.test"),
    path.resolve(process.cwd(), "..", ".env.test"),
    path.resolve(process.cwd(), "..", "..", ".env.test")
  ];
  const envPath = candidates.find((candidate) => existsSync(candidate));

  if (!envPath) {
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

async function upsertRole(roleDefinition: TestRoleDefinition) {
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

  await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
  await prisma.roleMenuAccess.deleteMany({ where: { roleId: role.id } });

  const permissions = roleDefinition.permissionCodes.length
    ? await prisma.permission.findMany({
        where: {
          code: {
            in: roleDefinition.permissionCodes
          }
        }
      })
    : [];

  for (const permission of permissions) {
    await prisma.rolePermission.create({
      data: {
        permissionId: permission.id,
        roleId: role.id
      }
    });
  }

  for (const menuAccess of roleDefinition.menuAccesses) {
    await prisma.roleMenuAccess.create({
      data: {
        roleId: role.id,
        topMenu: menuAccess.topMenu,
        viewKey: menuAccess.viewKey
      }
    });
  }

  return role;
}

async function upsertTestUser(input: {
  email: string;
  isActive: boolean;
  name: string;
  password: string;
  roleIds: string[];
  status: string;
  username: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email }
  });
  const passwordHash = await hash(input.password);

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          forcePasswordChange: false,
          isActive: input.isActive,
          isSuperAdmin: false,
          name: input.name,
          passwordHash,
          status: input.status,
          username: input.username
        }
      })
    : await prisma.user.create({
        data: {
          consentAt: new Date(),
          consentVersion: "1.0",
          email: input.email,
          forcePasswordChange: false,
          isActive: input.isActive,
          isSuperAdmin: false,
          name: input.name,
          passwordHash,
          status: input.status,
          username: input.username
        }
      });

  await prisma.userRole.deleteMany({
    where: { userId: user.id }
  });

  for (const roleId of input.roleIds) {
    await prisma.userRole.create({
      data: {
        roleId,
        userId: user.id
      }
    });
  }

  return user;
}

async function main() {
  await runBootstrapSeed(prisma);
  const roleByName = new Map<string, { id: string }>();

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: "Administrador" }
  });
  roleByName.set(adminRole.name, adminRole);

  for (const roleDefinition of testRoles) {
    const role = await upsertRole(roleDefinition);
    roleByName.set(role.name, role);
  }

  const commonRole = roleByName.get("Editor Teste");
  const blockedRole = roleByName.get("Sem Permissao Teste");

  if (!commonRole || !blockedRole) {
    throw new Error("Perfis de teste nao foram criados corretamente.");
  }

  await upsertTestUser({
    email: process.env.TEST_COMMON_EMAIL ?? "editor.test@abbatech.local",
    isActive: true,
    name: "Editor Teste Refresh",
    password: process.env.TEST_COMMON_PASSWORD ?? "Refresh123!",
    roleIds: [commonRole.id],
    status: "Ativo",
    username: "editor.test"
  });

  await upsertTestUser({
    email: process.env.TEST_NO_PERMISSION_EMAIL ?? "blocked.test@abbatech.local",
    isActive: true,
    name: "Usuario Sem Permissao Teste",
    password: process.env.TEST_NO_PERMISSION_PASSWORD ?? "Refresh123!",
    roleIds: [blockedRole.id],
    status: "Ativo",
    username: "blocked.test"
  });

  await upsertTestUser({
    email: process.env.TEST_DELETED_EMAIL ?? "deleted.test@abbatech.local",
    isActive: false,
    name: "Usuario Excluido Teste",
    password: process.env.TEST_DELETED_PASSWORD ?? "Refresh123!",
    roleIds: [],
    status: "Excluído",
    username: "deleted.test"
  });

  process.stdout.write("Seed de teste concluido.\n");
}

main()
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
