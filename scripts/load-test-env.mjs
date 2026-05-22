import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function parseEnvLine(line) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const separatorIndex = trimmed.indexOf("=");
  if (separatorIndex === -1) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  let value = trimmed.slice(separatorIndex + 1).trim();

  if (!key || key.startsWith("export ")) {
    return null;
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

export function loadEnvFile(filePath, options = {}) {
  const { override = false } = options;

  if (!existsSync(filePath)) {
    return { loaded: false, path: filePath, variables: 0 };
  }

  let variables = 0;
  const content = readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);

    if (!parsed) {
      continue;
    }

    if (!override && process.env[parsed.key] !== undefined) {
      continue;
    }

    process.env[parsed.key] = parsed.value;
    variables += 1;
  }

  return { loaded: true, path: filePath, variables };
}

export function loadTestEnv(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  return loadEnvFile(path.join(cwd, ".env.test"), options);
}
