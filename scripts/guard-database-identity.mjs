import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const truthyValues = new Set(["1", "true", "yes", "y", "on"]);
const errors = [];
const warnings = [];

const ENVIRONMENT_KEY = "deployment.environment";
const DATABASE_NAME_KEY = "deployment.database_name";

function clean(value) {
  return String(value ?? "").trim();
}

function isTruthy(value) {
  return truthyValues.has(clean(value).toLowerCase());
}

function appEnvironment() {
  return clean(process.env.EXPECTED_DATABASE_ENVIRONMENT || process.env.APP_ENV || process.env.NODE_ENV || "development").toLowerCase();
}

function defaultAllowIdentityAdoption(environment) {
  return environment === "development" || environment === "test";
}

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function databaseNameFromUrl() {
  const explicitName = clean(process.env.EXPECTED_DATABASE_NAME);

  if (explicitName) {
    return explicitName;
  }

  const databaseUrl = clean(process.env.DATABASE_URL);

  if (!databaseUrl) {
    return "";
  }

  try {
    const parsed = new URL(databaseUrl);
    return decodeURIComponent(parsed.pathname.replace(/^\//, "").split("?")[0]);
  } catch {
    return "";
  }
}

async function getCurrentDatabaseName() {
  const rows = await prisma.$queryRaw`
    SELECT DATABASE() AS databaseName
  `;
  const row = rows[0] ?? {};

  return clean(row.databaseName ?? row["DATABASE()"]);
}

async function ensureSetting(key, expectedValue, description) {
  if (!expectedValue) {
    fail(`${description} is empty. Configure the expected value before deploying.`);
    return;
  }

  const existing = await prisma.systemSetting.findUnique({
    where: {
      key
    }
  });

  if (!existing) {
    await prisma.systemSetting.create({
      data: {
        key,
        value: expectedValue
      }
    });
    warn(`${description} was adopted as ${expectedValue}. Future mismatches will be blocked.`);
    return;
  }

  if (existing.value !== expectedValue) {
    fail(`${description} mismatch. Database has ${existing.value}, expected ${expectedValue}.`);
  }
}

function printAndExit() {
  for (const message of warnings) {
    console.warn(`Database identity warning: ${message}`);
  }

  if (errors.length === 0) {
    console.warn("Database identity guard passed.");
    return;
  }

  console.error("");
  console.error("Database identity guard blocked startup.");
  console.error("The connected database does not match the expected deployment identity.");
  console.error("");
  console.error("Problems found:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error("");
  console.error("If this is an intentional first adoption after restoring the correct database,");
  console.error("review the database manually and run again with ALLOW_DATABASE_IDENTITY_ADOPTION=true.");
  console.error("");
  process.exitCode = 1;
}

async function main() {
  const expectedEnvironment = appEnvironment();
  const expectedDatabaseName = databaseNameFromUrl();
  const currentDatabaseName = await getCurrentDatabaseName();
  const allowAdoption = isTruthy(
    process.env.ALLOW_DATABASE_IDENTITY_ADOPTION ?? (defaultAllowIdentityAdoption(expectedEnvironment) ? "true" : "false")
  );

  if (!allowAdoption) {
    const existingEnvironment = await prisma.systemSetting.findUnique({ where: { key: ENVIRONMENT_KEY } });
    const existingDatabaseName = await prisma.systemSetting.findUnique({ where: { key: DATABASE_NAME_KEY } });

    if (!existingEnvironment || !existingDatabaseName) {
      fail("Database identity settings are missing and adoption is disabled.");
      return;
    }
  }

  await ensureSetting(ENVIRONMENT_KEY, expectedEnvironment, "Deployment environment identity");
  await ensureSetting(DATABASE_NAME_KEY, expectedDatabaseName || currentDatabaseName, "Database name identity");

  if (expectedDatabaseName && currentDatabaseName && expectedDatabaseName !== currentDatabaseName) {
    fail(`Active database is ${currentDatabaseName}, expected ${expectedDatabaseName}.`);
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
