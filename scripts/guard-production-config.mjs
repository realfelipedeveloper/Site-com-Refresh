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

function shouldRequireSmtp() {
  const configured = clean(process.env.REQUIRE_SMTP_FOR_PASSWORD_RESET);

  if (configured) {
    return isTruthy(configured);
  }

  return clean(process.env.NODE_ENV).toLowerCase() === "production";
}

function shouldRequireAuth(host) {
  const configured = clean(process.env.SMTP_REQUIRE_AUTH);

  if (configured) {
    return !isFalse(configured);
  }

  return !localSmtpHosts.has(host.toLowerCase());
}

function fail(missingVariables) {
  console.error("");
  console.error("Production config guard blocked API startup.");
  console.error("Password reset e-mail is enabled for this environment, but SMTP is incomplete.");
  console.error("");
  console.error("Missing or empty variables:");
  for (const variableName of missingVariables) {
    console.error(`- ${variableName}`);
  }
  console.error("");
  console.error("Configure these variables in the deploy environment, for example in Dokploy.");
  console.error("Do not commit real SMTP credentials to Git.");
  console.error("");
  process.exitCode = 1;
}

function main() {
  if (!shouldRequireSmtp()) {
    console.warn("Production config guard skipped SMTP validation.");
    return;
  }

  const smtpHost = clean(process.env.SMTP_HOST);
  const smtpFrom = clean(process.env.SMTP_FROM);
  const smtpPort = Number(clean(process.env.SMTP_PORT) || "587");
  const missingVariables = [];

  if (!smtpHost) {
    missingVariables.push("SMTP_HOST");
  }

  if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
    missingVariables.push("SMTP_PORT");
  }

  if (!smtpFrom) {
    missingVariables.push("SMTP_FROM");
  }

  if (smtpHost && shouldRequireAuth(smtpHost)) {
    if (!clean(process.env.SMTP_USER)) {
      missingVariables.push("SMTP_USER");
    }

    if (!clean(process.env.SMTP_PASSWORD)) {
      missingVariables.push("SMTP_PASSWORD");
    }
  }

  if (missingVariables.length > 0) {
    fail(missingVariables);
    return;
  }

  console.warn("Production config guard passed: SMTP configuration is present.");
}

main();
