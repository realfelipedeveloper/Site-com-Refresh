import { existsSync, readdirSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { loadTestEnv } from "./load-test-env.mjs";

const rootDir = process.cwd();
loadTestEnv({ cwd: rootDir });

const schemaPath = path.join(rootDir, "apps", "api", "prisma", "schema.prisma");
const migrationsPath = path.join(rootDir, "apps", "api", "prisma", "migrations");
const prismaCliPath = path.join(rootDir, "node_modules", "prisma", "build", "index.js");
const errors = [];

function truthy(value) {
  return ["1", "true", "yes", "y", "on"].includes(String(value ?? "").trim().toLowerCase());
}

function fail(message) {
  errors.push(message);
}

function validateStaticMigrationFiles() {
  if (!existsSync(schemaPath)) {
    fail("apps/api/prisma/schema.prisma does not exist.");
  }

  if (!existsSync(migrationsPath)) {
    fail("apps/api/prisma/migrations does not exist.");
    return;
  }

  const migrationDirs = readdirSync(migrationsPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (migrationDirs.length === 0) {
    fail("apps/api/prisma/migrations has no versioned migrations.");
  }

  for (const migrationDir of migrationDirs) {
    if (!/^\d{14}_[a-z0-9_]+$/.test(migrationDir)) {
      fail(`Migration ${migrationDir} must use YYYYMMDDHHMMSS_snake_case naming.`);
    }

    const migrationSqlPath = path.join(migrationsPath, migrationDir, "migration.sql");
    if (!existsSync(migrationSqlPath)) {
      fail(`Migration ${migrationDir} has no migration.sql file.`);
      continue;
    }

    if (!readFileSync(migrationSqlPath, "utf8").trim()) {
      fail(`Migration ${migrationDir}/migration.sql is empty.`);
    }
  }
}

function databaseNameFrom(databaseUrl) {
  try {
    return decodeURIComponent(new URL(databaseUrl).pathname.replace(/^\//, "").split("?")[0]);
  } catch {
    return "";
  }
}

function assertSafeTestDatabase(databaseUrl) {
  const databaseName = databaseNameFrom(databaseUrl).toLowerCase();

  if (truthy(process.env.ALLOW_NON_TEST_DATABASE_MIGRATION_TEST)) {
    return;
  }

  if (!databaseName.includes("test") && !databaseName.includes("ci")) {
    fail(
      `Refusing to run migrate deploy against "${databaseName || "unknown"}". Use a database name containing test/ci or set ALLOW_NON_TEST_DATABASE_MIGRATION_TEST=true intentionally.`
    );
  }
}

function runPrisma(args, env = process.env) {
  if (!existsSync(prismaCliPath)) {
    fail("Prisma CLI was not found in node_modules. Run npm ci before test:migrations.");
    return Promise.resolve(1);
  }

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [prismaCliPath, ...args], {
      env,
      shell: false,
      stdio: "inherit"
    });

    child.on("exit", (code) => {
      resolve(code ?? 1);
    });
  });
}

async function main() {
  validateStaticMigrationFiles();

  if (errors.length > 0) {
    return;
  }

  const validateCode = await runPrisma(["validate", "--schema", schemaPath]);
  if (validateCode !== 0) {
    fail("Prisma schema validation failed.");
    return;
  }

  if (!truthy(process.env.RUN_TEST_DATABASE)) {
    console.warn("Migration deploy test skipped. Set RUN_TEST_DATABASE=true to apply migrations against the isolated test database.");
    return;
  }

  const testDatabaseUrl = process.env.TEST_MIGRATIONS_DATABASE_URL || process.env.TEST_DATABASE_URL;
  if (!testDatabaseUrl) {
    fail("RUN_TEST_DATABASE=true requires TEST_DATABASE_URL or TEST_MIGRATIONS_DATABASE_URL.");
    return;
  }

  assertSafeTestDatabase(testDatabaseUrl);
  if (errors.length > 0) {
    return;
  }

  const migrateCode = await runPrisma(
    ["migrate", "deploy", "--schema", schemaPath],
    {
      ...process.env,
      APP_ENV: "test",
      NODE_ENV: "test",
      DATABASE_URL: testDatabaseUrl
    }
  );

  if (migrateCode !== 0) {
    fail("Prisma migrate deploy failed against the configured test database.");
  }
}

await main();

if (errors.length > 0) {
  console.error("");
  console.error("Migration test failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error("");
  process.exitCode = 1;
} else {
  console.warn("Migration test passed.");
}
