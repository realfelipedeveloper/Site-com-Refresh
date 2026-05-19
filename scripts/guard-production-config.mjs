const truthyValues = new Set(["1", "true", "yes", "y", "on"]);
const falsyValues = new Set(["0", "false", "no", "n", "off"]);
const localSmtpHosts = new Set(["mailpit", "localhost", "127.0.0.1"]);

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

function isProductionDeploy() {
  return appEnvironment() === "production";
}

function shouldRequireSmtp() {
  const configured = clean(process.env.REQUIRE_SMTP_FOR_PASSWORD_RESET);

  if (configured) {
    return isTruthy(configured);
  }

  return isProductionDeploy();
}

function shouldRequireAuth(host) {
  const configured = clean(process.env.SMTP_REQUIRE_AUTH);

  if (configured) {
    return !isFalse(configured);
  }

  return !localSmtpHosts.has(host.toLowerCase());
}

function validateUrl(variableName, options = {}) {
  const value = clean(process.env[variableName]);

  if (!value) {
    return `${variableName} is missing or empty.`;
  }

  try {
    const url = new URL(value);
    const isLocalHost = ["localhost", "127.0.0.1", "api", "minio"].includes(url.hostname);

    if (options.requireHttps && url.protocol !== "https:" && !isLocalHost) {
      return `${variableName} must use https in production.`;
    }
  } catch {
    return `${variableName} must be a valid URL.`;
  }

  return null;
}

function validateProductionBaseConfig() {
  if (!isProductionDeploy()) {
    console.warn(`Production config guard running in ${appEnvironment()} mode.`);
    return [];
  }

  const requiredVariables = [
    "DATABASE_URL",
    "COOKIE_SECRET",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "CORS_ORIGINS",
    "S3_ENDPOINT",
    "S3_ACCESS_KEY",
    "S3_SECRET_KEY",
    "S3_BUCKET",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD"
  ];
  const errors = [];

  for (const variableName of requiredVariables) {
    if (!clean(process.env[variableName])) {
      errors.push(`${variableName} is missing or empty.`);
    }
  }

  for (const variableName of ["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_REFRESH_URL", "NEXT_PUBLIC_API_URL"]) {
    const error = validateUrl(variableName, { requireHttps: true });

    if (error) {
      errors.push(error);
    }
  }

  if (!clean(process.env.AUTH_CSRF_SECRET)) {
    console.warn("AUTH_CSRF_SECRET is not set; COOKIE_SECRET will be used for CSRF signing.");
  }

  const cookieSecure = clean(process.env.AUTH_COOKIE_SECURE || "true").toLowerCase();

  if (cookieSecure !== "true") {
    errors.push("AUTH_COOKIE_SECURE must be true in production.");
  }

  const sameSite = clean(process.env.AUTH_COOKIE_SAME_SITE || "lax").toLowerCase();

  if (!["lax", "strict", "none"].includes(sameSite)) {
    errors.push("AUTH_COOKIE_SAME_SITE must be lax, strict or none.");
  }

  return errors;
}

function validateSmtpConfig() {
  if (!shouldRequireSmtp()) {
    console.warn("Production config guard skipped SMTP validation.");
    return [];
  }

  const smtpHost = clean(process.env.SMTP_HOST);
  const smtpFrom = clean(process.env.SMTP_FROM);
  const smtpPort = Number(clean(process.env.SMTP_PORT) || "587");
  const errors = [];

  if (!smtpHost) {
    errors.push("SMTP_HOST is missing or empty.");
  }

  if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
    errors.push("SMTP_PORT must be a valid TCP port.");
  }

  if (!smtpFrom) {
    errors.push("SMTP_FROM is missing or empty.");
  }

  if (smtpHost && shouldRequireAuth(smtpHost)) {
    if (!clean(process.env.SMTP_USER)) {
      errors.push("SMTP_USER is missing or empty.");
    }

    if (!clean(process.env.SMTP_PASSWORD)) {
      errors.push("SMTP_PASSWORD is missing or empty.");
    }
  }

  return errors;
}

function fail(errors) {
  console.error("");
  console.error("Production config guard blocked API startup.");
  console.error("The deployment environment is incomplete or unsafe.");
  console.error("");
  console.error("Problems found:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error("");
  console.error("Configure these variables in the deploy environment.");
  console.error("Do not commit real secrets to Git.");
  console.error("");
  process.exitCode = 1;
}

function main() {
  const errors = [...validateProductionBaseConfig(), ...validateSmtpConfig()];

  if (errors.length > 0) {
    fail(errors);
    return;
  }

  console.warn(`Production config guard passed for ${appEnvironment()} mode.`);
}

main();
