import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const errors = [];

function repoPath(...segments) {
  return path.join(rootDir, ...segments);
}

function read(relativePath) {
  const filePath = repoPath(relativePath);

  if (!existsSync(filePath)) {
    errors.push(`${relativePath} does not exist.`);
    return "";
  }

  return readFileSync(filePath, "utf8");
}

function requireIncludes(filePath, content, expected, message) {
  if (!content.includes(expected)) {
    errors.push(`${filePath}: ${message}`);
  }
}

function requireMatch(filePath, content, pattern, message) {
  if (!pattern.test(content)) {
    errors.push(`${filePath}: ${message}`);
  }
}

function requireOrder(filePath, content, first, second, message) {
  const firstIndex = content.indexOf(first);
  const secondIndex = content.indexOf(second);

  if (firstIndex === -1 || secondIndex === -1 || firstIndex > secondIndex) {
    errors.push(`${filePath}: ${message}`);
  }
}

function validateMigrations() {
  const migrationsPath = repoPath("apps", "api", "prisma", "migrations");

  if (!existsSync(migrationsPath)) {
    errors.push("apps/api/prisma/migrations does not exist.");
    return;
  }

  const migrationDirs = readdirSync(migrationsPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (migrationDirs.length === 0) {
    errors.push("apps/api/prisma/migrations has no migration directories.");
  }

  const seenNames = new Set();

  for (const migrationDir of migrationDirs) {
    if (!/^\d{14}_[a-z0-9_]+$/.test(migrationDir)) {
      errors.push(`Migration ${migrationDir} must use YYYYMMDDHHMMSS_snake_case naming.`);
    }

    if (seenNames.has(migrationDir)) {
      errors.push(`Migration ${migrationDir} is duplicated.`);
    }

    seenNames.add(migrationDir);

    const migrationSqlPath = path.join(migrationsPath, migrationDir, "migration.sql");

    if (!existsSync(migrationSqlPath)) {
      errors.push(`Migration ${migrationDir} has no migration.sql.`);
      continue;
    }

    if (!readFileSync(migrationSqlPath, "utf8").trim()) {
      errors.push(`Migration ${migrationDir}/migration.sql is empty.`);
    }
  }
}

function validateDockerfiles() {
  const apiDockerfile = read("apps/api/Dockerfile");

  requireOrder(
    "apps/api/Dockerfile",
    apiDockerfile,
    "RUN npm run prisma:generate -w @abbatech/api",
    "RUN npm run build -w @abbatech/api",
    "Prisma Client must be generated before building the Nest API image."
  );
  requireOrder(
    "apps/api/Dockerfile",
    apiDockerfile,
    "node scripts/guard-database-bootstrap.mjs",
    "npm run prisma:migrate -w @abbatech/api",
    "The database bootstrap guard must run before prisma migrate deploy."
  );
  requireOrder(
    "apps/api/Dockerfile",
    apiDockerfile,
    "node scripts/guard-database-preflight.mjs",
    "npm run prisma:migrate -w @abbatech/api",
    "The database preflight guard must run before prisma migrate deploy."
  );
  requireOrder(
    "apps/api/Dockerfile",
    apiDockerfile,
    "npm run prisma:migrate -w @abbatech/api",
    "npm run prisma:status -w @abbatech/api",
    "Prisma migrate status must run after applying migrations."
  );
  requireOrder(
    "apps/api/Dockerfile",
    apiDockerfile,
    "npm run prisma:status -w @abbatech/api",
    "node scripts/guard-database-identity.mjs",
    "Database identity guard must run after migration status."
  );
  requireOrder(
    "apps/api/Dockerfile",
    apiDockerfile,
    "npm run prisma:seed -w @abbatech/api",
    "node scripts/guard-domain-data-integrity.mjs",
    "Domain data integrity guard must run after seed/bootstrap."
  );
  requireIncludes(
    "apps/api/Dockerfile",
    apiDockerfile,
    "node scripts/guard-production-config.mjs",
    "API startup must validate production configuration before touching the database."
  );

  for (const appName of ["portal", "refresh"]) {
    const dockerfilePath = `apps/${appName}/Dockerfile`;
    const dockerfile = read(dockerfilePath);

    requireIncludes(dockerfilePath, dockerfile, "ARG NEXT_PUBLIC_API_URL", "Next build must receive the public API URL.");
    requireIncludes(dockerfilePath, dockerfile, "ENV NEXT_PUBLIC_API_URL=", "Next runtime image must retain the public API URL.");
  }
}

function validateCompose() {
  const devCompose = read("docker-compose.yml");
  const localProdCompose = read("docker-compose.local-prod.yml");
  const prodCompose = read("docker-compose.prod.yml");

  requireOrder(
    "docker-compose.yml",
    devCompose,
    "npm run prisma:generate -w @abbatech/api",
    "node scripts/guard-database-preflight.mjs",
    "Dev API must run database preflight after generating Prisma Client."
  );
  requireOrder(
    "docker-compose.yml",
    devCompose,
    "node scripts/guard-database-preflight.mjs",
    "npm run prisma:migrate -w @abbatech/api",
    "Dev API must run database preflight before applying migrations."
  );
  requireOrder(
    "docker-compose.yml",
    devCompose,
    "npm run prisma:migrate -w @abbatech/api",
    "npm run prisma:status -w @abbatech/api",
    "Dev API must check Prisma migration status after applying migrations."
  );
  requireOrder(
    "docker-compose.yml",
    devCompose,
    "npm run prisma:status -w @abbatech/api",
    "node scripts/guard-database-identity.mjs",
    "Dev API must stamp/check database identity after migrations."
  );
  requireOrder(
    "docker-compose.yml",
    devCompose,
    "node scripts/guard-database-identity.mjs",
    "npm run prisma:seed -w @abbatech/api",
    "Dev API must validate database identity before seeding."
  );
  requireOrder(
    "docker-compose.yml",
    devCompose,
    "npm run prisma:seed -w @abbatech/api",
    "node scripts/guard-domain-data-integrity.mjs",
    "Dev API must validate domain data after seeding."
  );
  requireIncludes("docker-compose.yml", devCompose, "APP_ENV: development", "Dev services must declare APP_ENV.");
  requireIncludes(
    "docker-compose.yml",
    devCompose,
    "EXPECTED_DATABASE_ENVIRONMENT: development",
    "Dev API must declare the expected database environment."
  );
  requireIncludes(
    "docker-compose.yml",
    devCompose,
    "ALLOW_NONSTRICT_MIGRATION_HISTORY: \"true\"",
    "Dev API must tolerate old local rollback markers without blocking bootstrap."
  );
  requireIncludes("docker-compose.yml", devCompose, "AUTH_COOKIE_SECURE: \"false\"", "Dev cookies must work over local HTTP.");
  requireIncludes(
    "docker-compose.yml",
    devCompose,
    "SMTP_HOST: ${SMTP_HOST:-mailpit}",
    "Dev SMTP must respect .env credentials and use Mailpit only as fallback."
  );
  requireIncludes(
    "docker-compose.yml",
    devCompose,
    "SMTP_REQUIRE_AUTH: ${SMTP_REQUIRE_AUTH:-}",
    "Dev SMTP auth mode must be configurable from .env."
  );
  requireIncludes(
    "docker-compose.yml",
    devCompose,
    "REQUIRE_SMTP_FOR_PASSWORD_RESET: ${REQUIRE_SMTP_FOR_PASSWORD_RESET:-true}",
    "Dev password reset must fail loudly if Mailpit is unavailable."
  );
  requireIncludes(
    "docker-compose.yml",
    devCompose,
    "NEXT_PUBLIC_API_URL: http://localhost:3333/api/v1",
    "Dev must use the dev public API URL explicitly."
  );

  requireIncludes(
    "docker-compose.local-prod.yml",
    localProdCompose,
    "APP_ENV: local-prod",
    "Local-prod services must declare APP_ENV."
  );
  requireIncludes(
    "docker-compose.local-prod.yml",
    localProdCompose,
    "EXPECTED_DATABASE_ENVIRONMENT: local-prod",
    "Local-prod API must declare the expected database environment."
  );
  requireIncludes(
    "docker-compose.local-prod.yml",
    localProdCompose,
    "ALLOW_DATABASE_IDENTITY_ADOPTION: ${ALLOW_DATABASE_IDENTITY_ADOPTION:-false}",
    "Local-prod must not adopt a missing database identity unless bootstrap explicitly allows it."
  );
  requireIncludes(
    "docker-compose.local-prod.yml",
    localProdCompose,
    "ALLOW_NONSTRICT_MIGRATION_HISTORY: \"false\"",
    "Local-prod must reject partial or rolled back migration history."
  );
  requireIncludes(
    "scripts/run-local-prod-bootstrap.mjs",
    read("scripts/run-local-prod-bootstrap.mjs"),
    "ALLOW_DATABASE_IDENTITY_ADOPTION: \"true\"",
    "Local-prod bootstrap must be the explicit path for first database identity adoption."
  );
  requireIncludes(
    "docker-compose.local-prod.yml",
    localProdCompose,
    "condition: service_healthy",
    "Local-prod API must wait for MySQL health before startup."
  );
  requireIncludes(
    "docker-compose.local-prod.yml",
    localProdCompose,
    "DB_CONNECT_RETRIES: \"30\"",
    "Local-prod API must retry database connection during startup."
  );
  requireIncludes(
    "docker-compose.local-prod.yml",
    localProdCompose,
    "NEXT_PUBLIC_API_URL: http://localhost:4333/api/v1",
    "Local-prod Next builds must default to the local-prod public API URL."
  );
  requireIncludes(
    "docker-compose.local-prod.yml",
    localProdCompose,
    "CORS_ORIGINS: http://localhost:4100,http://localhost:4101",
    "Local-prod API must allow only the local-prod web origins by default."
  );
  requireIncludes(
    "docker-compose.local-prod.yml",
    localProdCompose,
    "AUTH_COOKIE_SECURE: \"false\"",
    "Local-prod session cookies must work over local HTTP."
  );
  requireIncludes(
    "docker-compose.local-prod.yml",
    localProdCompose,
    "- .env.local-prod",
    "Local-prod must load SMTP and runtime variables from .env.local-prod."
  );
  requireIncludes(
    "docker-compose.local-prod.yml",
    localProdCompose,
    "healthcheck:",
    "Local-prod services must declare healthchecks."
  );
  requireIncludes(
    "docker-compose.local-prod.yml",
    localProdCompose,
    "profiles:\n      - test",
    "Local-prod must provide a Docker test service instead of running tests inside the runtime API image."
  );

  for (const variableName of [
    "DATABASE_URL",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "COOKIE_SECRET",
    "MYSQL_PASSWORD",
    "MYSQL_ROOT_PASSWORD",
    "S3_ACCESS_KEY",
    "S3_SECRET_KEY",
    "S3_BUCKET",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD"
  ]) {
    requireMatch(
      "docker-compose.prod.yml",
      prodCompose,
      new RegExp(`\\$\\{${variableName}:\\?`),
      `Production must fail early when ${variableName} is missing.`
    );
  }

  requireIncludes(
    "docker-compose.prod.yml",
    prodCompose,
    "AUTH_CSRF_SECRET: ${AUTH_CSRF_SECRET:-${COOKIE_SECRET:?COOKIE_SECRET is required in production}}",
    "Production must provide AUTH_CSRF_SECRET while allowing legacy Dokploy envs to fall back to COOKIE_SECRET."
  );

  requireIncludes(
    "docker-compose.prod.yml",
    prodCompose,
    "NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-https://abbatech.dev.br/abbatech/api}",
    "Production Next builds must default to the Traefik public API path."
  );
  requireIncludes(
    "docker-compose.prod.yml",
    prodCompose,
    "AUTH_COOKIE_SECURE: ${AUTH_COOKIE_SECURE:-true}",
    "Production session cookies must be secure by default."
  );
  requireIncludes(
    "docker-compose.prod.yml",
    prodCompose,
    "ALLOW_DATABASE_IDENTITY_ADOPTION: ${ALLOW_DATABASE_IDENTITY_ADOPTION:-false}",
    "Production must not adopt a missing database identity unless explicitly allowed."
  );
  requireIncludes(
    "docker-compose.prod.yml",
    prodCompose,
    "ALLOW_NONSTRICT_MIGRATION_HISTORY: ${ALLOW_NONSTRICT_MIGRATION_HISTORY:-false}",
    "Production must reject partial or rolled back migration history."
  );
  requireIncludes(
    "docker-compose.prod.yml",
    prodCompose,
    "condition: service_healthy",
    "Production API must wait for MySQL health before startup."
  );
  requireIncludes(
    "docker-compose.prod.yml",
    prodCompose,
    "EXPECTED_DATABASE_ENVIRONMENT: ${EXPECTED_DATABASE_ENVIRONMENT:-production}",
    "Production must declare the expected database environment."
  );
  requireIncludes(
    "docker-compose.prod.yml",
    prodCompose,
    "CORS_ORIGINS: ${CORS_ORIGINS:-https://abbatech.dev.br}",
    "Production CORS must default to the public domain."
  );
}

function validateEnvExample() {
  const envExample = read(".env.example");

  for (const variableName of [
    "APP_ENV",
    "NEXT_PUBLIC_API_URL",
    "DATABASE_URL",
    "COOKIE_SECRET",
    "AUTH_CSRF_SECRET",
    "AUTH_COOKIE_SECURE",
    "EXPECTED_DATABASE_ENVIRONMENT",
    "EXPECTED_DATABASE_NAME",
    "ALLOW_DATABASE_IDENTITY_ADOPTION",
    "ALLOW_NONSTRICT_MIGRATION_HISTORY",
    "CHECK_DATABASE_DDL_PERMISSIONS",
    "MYSQL_REQUIRED_MAJOR",
    "DB_CONNECT_RETRIES",
    "DB_CONNECT_RETRY_DELAY_MS",
    "AUTH_SESSION_IDLE_TTL_MINUTES",
    "AUTH_SESSION_ABSOLUTE_TTL_HOURS",
    "CORS_ORIGINS"
  ]) {
    requireMatch(".env.example", envExample, new RegExp(`^${variableName}=`, "m"), `${variableName} must be documented.`);
  }
}

function main() {
  validateMigrations();
  validateDockerfiles();
  validateCompose();
  validateEnvExample();

  if (errors.length > 0) {
    console.error("");
    console.error("Deployment flow guard failed.");
    console.error("Fix the following problems before building or deploying:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    console.error("");
    process.exitCode = 1;
    return;
  }

  console.warn("Deployment flow guard passed.");
}

main();
