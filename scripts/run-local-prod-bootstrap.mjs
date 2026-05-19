import { execFileSync, spawnSync } from "node:child_process";

execFileSync(process.execPath, ["scripts/ensure-local-prod-volumes.mjs"], {
  stdio: "inherit"
});

const result = spawnSync(
  "docker",
  ["compose", "-f", "docker-compose.local-prod.yml", "up", "-d", "--build"],
  {
    env: {
      ...process.env,
      ALLOW_EMPTY_DATABASE_BOOTSTRAP: "true",
      ALLOW_DATABASE_IDENTITY_ADOPTION: "true"
    },
    stdio: "inherit"
  }
);

process.exit(result.status ?? 1);
