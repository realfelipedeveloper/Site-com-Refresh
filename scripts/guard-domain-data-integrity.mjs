import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const falsyValues = new Set(["0", "false", "no", "n", "off"]);
const errors = [];
const warnings = [];

function clean(value) {
  return String(value ?? "").trim();
}

function isFalse(value) {
  return falsyValues.has(clean(value).toLowerCase());
}

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

async function validateCoreData() {
  const requireData = !isFalse(process.env.REQUIRE_DATABASE_DATA ?? "true");
  const userCount = await prisma.user.count();
  const roleCount = await prisma.role.count();

  if (!requireData) {
    warn("Domain data requirement skipped by REQUIRE_DATABASE_DATA=false.");
    return;
  }

  if (userCount < 1) {
    fail("No users were found after seed/bootstrap.");
  }

  if (roleCount < 1) {
    fail("No roles were found after seed/bootstrap.");
  }
}

async function validateAdminAccess() {
  const adminRole = await prisma.role.findFirst({
    where: {
      OR: [
        {
          name: {
            contains: "Administrador"
          }
        },
        {
          functionName: {
            contains: "Administrador"
          }
        }
      ]
    },
    include: {
      permissions: true,
      menuAccesses: true,
      users: {
        include: {
          user: true
        }
      }
    }
  });

  if (!adminRole) {
    fail("Administrator role was not found.");
    return;
  }

  const activeAdminUsers = adminRole.users.filter(
    (entry) => entry.user.isActive && !["Inativo", "Excluído"].includes(entry.user.status)
  );

  if (activeAdminUsers.length < 1) {
    fail("Administrator role has no active user assigned.");
  }

  if (adminRole.permissions.length < 1) {
    fail("Administrator role has no permissions assigned.");
  }

  if (adminRole.menuAccesses.length < 1) {
    fail("Administrator role has no menu accesses assigned.");
  }
}

async function validateUserRoleConsistency() {
  const activeUsersWithoutRole = await prisma.user.count({
    where: {
      isActive: true,
      status: {
        notIn: ["Inativo", "Excluído"]
      },
      roles: {
        none: {}
      }
    }
  });

  if (activeUsersWithoutRole > 0) {
    fail(`There are ${activeUsersWithoutRole} active user(s) without any role.`);
  }
}

function printAndExit() {
  for (const message of warnings) {
    console.warn(`Domain data integrity warning: ${message}`);
  }

  if (errors.length === 0) {
    console.warn("Domain data integrity guard passed.");
    return;
  }

  console.error("");
  console.error("Domain data integrity guard blocked startup.");
  console.error("The database schema exists, but required business data is inconsistent.");
  console.error("");
  console.error("Problems found:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error("");
  process.exitCode = 1;
}

try {
  await validateCoreData();
  await validateAdminAccess();
  await validateUserRoleConsistency();
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  await prisma.$disconnect();
  printAndExit();
}
