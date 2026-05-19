import { spawnSync } from "node:child_process";

const containerName = "abbatech-api";

function usage() {
  console.error("");
  console.error("Migration dev precisa de um nome explicito.");
  console.error("");
  console.error("Uso:");
  console.error("  npm run docker:dev:migrate -- nome_da_migration");
  console.error("  npm run docker:dev:migrate -- --name nome_da_migration");
  console.error("");
  console.error("Use snake_case em minusculas. Exemplo:");
  console.error("  npm run docker:dev:migrate -- add_customer_status");
  console.error("");
}

function parseMigrationName(args) {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--name") {
      return args[index + 1] ?? "";
    }

    if (arg.startsWith("--name=")) {
      return arg.slice("--name=".length);
    }

    if (!arg.startsWith("-")) {
      return arg;
    }
  }

  return "";
}

function ensureContainerRunning() {
  const result = spawnSync("docker", ["inspect", "-f", "{{.State.Running}}", containerName], {
    encoding: "utf8"
  });

  if (result.status !== 0 || result.stdout.trim() !== "true") {
    console.error("");
    console.error(`Container ${containerName} nao esta rodando.`);
    console.error("Suba o ambiente dev antes de gerar migration:");
    console.error("  npm run docker:dev:up");
    console.error("");
    process.exit(1);
  }
}

const migrationName = parseMigrationName(process.argv.slice(2)).trim();

if (!/^[a-z0-9_]+$/.test(migrationName)) {
  usage();
  process.exit(1);
}

ensureContainerRunning();

const result = spawnSync(
  "docker",
  ["exec", "-w", "/app/apps/api", containerName, "npx", "prisma", "migrate", "dev", "--name", migrationName],
  {
    stdio: "inherit"
  }
);

process.exit(result.status ?? 1);
