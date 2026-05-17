import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const truthyValues = new Set(["1", "true", "yes", "y", "on"]);
const falsyValues = new Set(["0", "false", "no", "n", "off"]);

function isTruthy(value) {
  return truthyValues.has(String(value ?? "").trim().toLowerCase());
}

function isExplicitlyFalse(value) {
  return falsyValues.has(String(value ?? "").trim().toLowerCase());
}

function fail(message) {
  console.error("");
  console.error("Database bootstrap guard blocked API startup.");
  console.error(message);
  console.error("");
  console.error("This guard exists to prevent local-prod/production from booting against");
  console.error("a new or empty database by accident. Attach/restore the expected data");
  console.error("volume or managed database before deploying.");
  console.error("");
  console.error("Only for an intentional first bootstrap, set:");
  console.error("  ALLOW_EMPTY_DATABASE_BOOTSTRAP=true");
  console.error("");
  process.exitCode = 1;
}

function tableNameFrom(row) {
  return row.TABLE_NAME ?? row.tableName ?? row.table_name;
}

function numericCount(value) {
  if (typeof value === "bigint") {
    return Number(value);
  }

  return Number(value ?? 0);
}

async function main() {
  if (isTruthy(process.env.ALLOW_EMPTY_DATABASE_BOOTSTRAP)) {
    console.warn("Database bootstrap guard bypassed by ALLOW_EMPTY_DATABASE_BOOTSTRAP=true.");
    return;
  }

  const requireData = !isExplicitlyFalse(process.env.REQUIRE_DATABASE_DATA ?? "true");
  const tables = await prisma.$queryRaw`
    SELECT TABLE_NAME
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
  `;
  const tableNames = new Set(tables.map(tableNameFrom).filter(Boolean));

  if (!tableNames.has("_prisma_migrations")) {
    fail("The current database has no Prisma migration history table.");
    return;
  }

  if (!requireData) {
    console.warn("Database bootstrap guard passed: Prisma migration history exists.");
    return;
  }

  if (!tableNames.has("User")) {
    fail("The current database has migration history but no User table.");
    return;
  }

  const userCountRows = await prisma.$queryRawUnsafe('SELECT COUNT(*) AS count FROM `User`');
  const userCount = numericCount(userCountRows[0]?.count);

  if (userCount < 1) {
    fail("The current database has no users. Refusing to treat it as an existing data store.");
    return;
  }

  console.warn("Database bootstrap guard passed: migration history and user data exist.");
}

try {
  await main();
} catch (error) {
  console.error("");
  console.error("Database bootstrap guard could not validate the database.");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
