import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { loadTestEnv } from "./load-test-env.mjs";

const truthyValues = new Set(["1", "true", "yes", "y", "on"]);
const playwrightCliPath = path.join(process.cwd(), "node_modules", "@playwright", "test", "cli.js");
loadTestEnv();

function isTruthy(value) {
  return truthyValues.has(String(value ?? "").trim().toLowerCase());
}

if (!isTruthy(process.env.RUN_E2E)) {
  console.warn("E2E tests skipped. Set RUN_E2E=true after starting the local test stack.");
  process.exit(0);
}

if (!existsSync(playwrightCliPath)) {
  console.error("Playwright CLI was not found in node_modules. Run npm ci before test:e2e.");
  process.exit(1);
}

const child = spawn(process.execPath, [playwrightCliPath, "test"], {
  env: process.env,
  shell: false,
  stdio: "inherit"
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
