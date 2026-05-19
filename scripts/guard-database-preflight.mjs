import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const truthyValues = new Set(["1", "true", "yes", "y", "on"]);
const falsyValues = new Set(["0", "false", "no", "n", "off"]);
const errors = [];
const warnings = [];

function clean(value) {
  return String(value ?? "").trim();
}

function isTruthy(value) {
  return truthyValues.has(clean(value).toLowerCase());
}

function isFalse(value) {
  return falsyValues.has(clean(value).toLowerCase());
}

function appEnvironment() {
  return clean(process.env.APP_ENV || process.env.NODE_ENV || "development").toLowerCase();
}

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function isDevelopmentEnvironment() {
  return appEnvironment() === "development" || appEnvironment() === "test";
}

function allowsNonStrictMigrationHistory() {
  return isDevelopmentEnvironment() || isTruthy(process.env.ALLOW_NONSTRICT_MIGRATION_HISTORY);
}

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function parseDatabaseUrl() {
  const databaseUrl = clean(process.env.DATABASE_URL);

  if (!databaseUrl) {
    fail("DATABASE_URL is missing or empty.");
    return null;
  }

  try {
    const parsed = new URL(databaseUrl);

    if (!["mysql:", "mysqls:"].includes(parsed.protocol)) {
      fail("DATABASE_URL must use the mysql protocol.");
    }

    return parsed;
  } catch {
    fail("DATABASE_URL must be a valid URL.");
    return null;
  }
}

function databaseNameFromUrl(parsedUrl) {
  if (!parsedUrl) {
    return "";
  }

  return decodeURIComponent(parsedUrl.pathname.replace(/^\//, "").split("?")[0]);
}

function tableNameFrom(row) {
  return row.TABLE_NAME ?? row.tableName ?? row.table_name;
}

function valueFrom(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined) {
      return row[key];
    }
  }

  return undefined;
}

async function validateDatabaseIdentity(parsedUrl) {
  const expectedDatabaseName =
    clean(process.env.EXPECTED_DATABASE_NAME) ||
    databaseNameFromUrl(parsedUrl);

  if (!expectedDatabaseName) {
    fail("Database name could not be inferred from DATABASE_URL. Configure EXPECTED_DATABASE_NAME.");
    return;
  }

  const rows = await prisma.$queryRaw`
    SELECT DATABASE() AS databaseName, VERSION() AS mysqlVersion
  `;
  const row = rows[0] ?? {};
  const currentDatabaseName = clean(valueFrom(row, ["databaseName", "DATABASE()"]));
  const mysqlVersion = clean(valueFrom(row, ["mysqlVersion", "VERSION()"]));

  if (!currentDatabaseName) {
    fail("Could not read the active database name.");
  } else if (currentDatabaseName !== expectedDatabaseName) {
    fail(`Connected database is ${currentDatabaseName}, expected ${expectedDatabaseName}.`);
  }

  validateMysqlVersion(mysqlVersion);
}

async function waitForDatabase() {
  const maxAttempts = Number(clean(process.env.DB_CONNECT_RETRIES) || "30");
  const delayMs = Number(clean(process.env.DB_CONNECT_RETRY_DELAY_MS) || "2000");
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        warn(`Database is not ready yet. Retrying connection (${attempt}/${maxAttempts}).`);
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
}

function validateMysqlVersion(mysqlVersion) {
  if (!mysqlVersion) {
    fail("Could not read MySQL version.");
    return;
  }

  const requiredMajor = clean(process.env.MYSQL_REQUIRED_MAJOR || "8");
  const allowNonstandard = isTruthy(process.env.ALLOW_NONSTANDARD_MYSQL);
  const isMariaDb = mysqlVersion.toLowerCase().includes("mariadb");
  const major = mysqlVersion.match(/^(\d+)/)?.[1] ?? "";

  if (allowNonstandard) {
    warn("Non-standard MySQL version check bypassed by ALLOW_NONSTANDARD_MYSQL=true.");
    return;
  }

  if (isMariaDb) {
    fail("MariaDB was detected. This project is standardized on MySQL 8.");
    return;
  }

  if (requiredMajor && major !== requiredMajor) {
    fail(`MySQL major version is ${major || "unknown"}, expected ${requiredMajor}.`);
  }
}

async function validateMigrationHistory() {
  const tableRows = await prisma.$queryRaw`
    SELECT TABLE_NAME
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
  `;
  const tableNames = new Set(tableRows.map(tableNameFrom).filter(Boolean));

  if (!tableNames.has("_prisma_migrations")) {
    if (isDevelopmentEnvironment() || isTruthy(process.env.ALLOW_EMPTY_DATABASE_BOOTSTRAP)) {
      warn("Prisma migration history table does not exist yet. This is allowed for an explicit first bootstrap.");
      return;
    }

    fail("The current database has no Prisma migration history table.");
    return;
  }

  const migrationRows = await prisma.$queryRaw`
    SELECT migration_name AS migrationName, finished_at AS finishedAt, rolled_back_at AS rolledBackAt
    FROM _prisma_migrations
    ORDER BY started_at ASC
  `;

  const unfinishedMigrations = migrationRows.filter((row) => !row.finishedAt && !row.rolledBackAt);
  const rolledBackMigrations = migrationRows.filter((row) => row.rolledBackAt);

  if (unfinishedMigrations.length > 0) {
    const message = `There are ${unfinishedMigrations.length} unfinished Prisma migration(s). Resolve migration history before deploying.`;

    if (allowsNonStrictMigrationHistory()) {
      warn(message);
    } else {
      fail(message);
    }
  }

  if (rolledBackMigrations.length > 0) {
    const message = `There are ${rolledBackMigrations.length} rolled back Prisma migration marker(s). Review and resolve before deploying.`;

    if (allowsNonStrictMigrationHistory()) {
      warn(message);
    } else {
      fail(message);
    }
  }
}

async function validateDdlPermissions() {
  if (isFalse(process.env.CHECK_DATABASE_DDL_PERMISSIONS ?? "true")) {
    warn("DDL permission check skipped by CHECK_DATABASE_DDL_PERMISSIONS=false.");
    return;
  }

  try {
    await prisma.$executeRawUnsafe(
      "CREATE TEMPORARY TABLE __abbatech_deploy_permission_check (id INT NOT NULL PRIMARY KEY)"
    );
    await prisma.$executeRawUnsafe(
      "ALTER TABLE __abbatech_deploy_permission_check ADD COLUMN name VARCHAR(16) NULL"
    );
    await prisma.$executeRawUnsafe("DROP TEMPORARY TABLE __abbatech_deploy_permission_check");
  } catch {
    fail("Database user could not create/alter/drop a temporary table. Check migration DDL permissions.");
  }
}

function printAndExit() {
  for (const message of warnings) {
    console.warn(`Database preflight warning: ${message}`);
  }

  if (errors.length === 0) {
    console.warn("Database preflight guard passed.");
    return;
  }

  console.error("");
  console.error("Database preflight guard blocked startup.");
  console.error("Fix the following problems before running migrations:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error("");
  process.exitCode = 1;
}

async function main() {
  const parsedUrl = parseDatabaseUrl();

  if (errors.length === 0) {
    await waitForDatabase();
    await validateDatabaseIdentity(parsedUrl);
    await validateMigrationHistory();
    await validateDdlPermissions();
  }
}

try {
  await main();
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  await prisma.$disconnect();
  printAndExit();
}
