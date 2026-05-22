import { spawn } from "node:child_process";
import { loadTestEnv } from "./load-test-env.mjs";

loadTestEnv();

const args = new Set(process.argv.slice(2));
const keepStack = args.has("--keep-stack");
const skipPlaywrightInstall = args.has("--skip-playwright-install");
const dryRun = args.has("--dry-run");
const showHelp = args.has("--help") || args.has("-h");
const dockerComposeFile = "docker-compose.test.yml";
const testEnv = {
  ...process.env,
  APP_ENV: "test",
  NODE_ENV: "test",
  RUN_TEST_DATABASE: "true",
  RUN_E2E: "true",
  RUN_SMOKE: "true"
};

function commandName(command) {
  if (process.platform !== "win32") {
    return command;
  }

  return command === "npm" || command === "npx" ? `${command}.cmd` : command;
}

function printHelp() {
  console.log(`
Usage:
  npm run test:all

Options:
  -- --keep-stack                Keep docker-compose.test.yml services running after the suite.
  -- --skip-playwright-install   Do not run "npx playwright install chromium".
  -- --dry-run                   Print the commands without executing them.
  -- --help                      Show this help.

What it does:
  1. Loads .env.test when present.
  2. Installs the Playwright Chromium browser unless skipped.
  3. Builds and starts docker-compose.test.yml.
  4. Waits for API, Refresh and Portal smoke URLs.
  5. Applies migrations to the isolated test database.
  6. Runs seed:test.
  7. Runs test:ci with RUN_TEST_DATABASE=true and RUN_E2E=true.
  8. Runs smoke tests with RUN_SMOKE=true.
  9. Stops and removes the test stack unless --keep-stack was passed.
`);
}

function describeCommand(command, commandArgs) {
  return [command, ...commandArgs].join(" ");
}

function run(command, commandArgs, options = {}) {
  const printable = describeCommand(command, commandArgs);

  if (dryRun) {
    console.log(`[dry-run] ${printable}`);
    return Promise.resolve();
  }

  console.log(`\n$ ${printable}`);

  return new Promise((resolve, reject) => {
    const child = spawn(commandName(command), commandArgs, {
      env: options.env ?? testEnv,
      shell: false,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${printable} failed with exit code ${code ?? "unknown"}.`));
    });
  });
}

async function waitForUrl(name, url, timeoutMs = 180_000) {
  if (dryRun) {
    console.log(`[dry-run] wait for ${name}: ${url}`);
    return;
  }

  const startedAt = Date.now();
  let lastError = "";

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(5_000)
      });

      if (response.status >= 200 && response.status < 400) {
        console.log(`${name} is ready: ${url}`);
        return;
      }

      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 3_000);
    });
  }

  throw new Error(`${name} did not become ready at ${url}. Last error: ${lastError}`);
}

async function stopStack() {
  if (keepStack) {
    console.log("Keeping the test stack running because --keep-stack was passed.");
    return;
  }

  await run("docker", ["compose", "-f", dockerComposeFile, "down", "--volumes"]);
}

async function main() {
  if (showHelp) {
    printHelp();
    return;
  }

  await run("docker", ["--version"]);

  if (!skipPlaywrightInstall) {
    await run("npx", ["playwright", "install", "chromium"]);
  }

  let stackStarted = false;

  try {
    await run("docker", ["compose", "-f", dockerComposeFile, "up", "-d", "--build"]);
    stackStarted = true;

    await waitForUrl("API", testEnv.SMOKE_API_HEALTH_URL ?? "http://localhost:3333/api/v1/health");
    await waitForUrl("Refresh", testEnv.SMOKE_REFRESH_URL ?? "http://localhost:3101/abbatech/refresh");
    await waitForUrl("Portal", testEnv.SMOKE_PORTAL_URL ?? "http://localhost:3100/abbatech/portal");

    await run("npm", ["run", "test:migrations"]);
    await run("npm", ["run", "seed:test"]);
    await run("npm", ["run", "test:ci"]);
    await run("npm", ["run", "test:smoke"]);
  } finally {
    if (stackStarted || dryRun) {
      await stopStack();
    }
  }
}

main().catch((error) => {
  console.error("");
  console.error("Full automated test suite failed.");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  process.exitCode = 1;
});
