import { loadTestEnv } from "./load-test-env.mjs";

loadTestEnv();

const truthyValues = new Set(["1", "true", "yes", "y", "on"]);

function isTruthy(value) {
  return truthyValues.has(String(value ?? "").trim().toLowerCase());
}

function smokeTargets() {
  if (process.env.SMOKE_URLS) {
    return process.env.SMOKE_URLS.split(",")
      .map((url) => url.trim())
      .filter(Boolean);
  }

  return [
    process.env.SMOKE_API_HEALTH_URL || "http://localhost:3333/api/v1/health",
    process.env.SMOKE_REFRESH_URL || "http://localhost:3101/abbatech/refresh",
    process.env.SMOKE_PORTAL_URL || "http://localhost:3100/abbatech/portal"
  ];
}

if (!isTruthy(process.env.RUN_SMOKE)) {
  console.warn("Smoke tests skipped. Set RUN_SMOKE=true when the target services are running.");
  process.exit(0);
}

const failures = [];

for (const url of smokeTargets()) {
  try {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(10_000)
    });

    if (response.status < 200 || response.status >= 400) {
      failures.push(`${url} returned HTTP ${response.status}.`);
    } else {
      console.warn(`Smoke target passed: ${url}`);
    }
  } catch (error) {
    failures.push(`${url} failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures.length > 0) {
  console.error("");
  console.error("Smoke tests failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  console.error("");
  process.exitCode = 1;
} else {
  console.warn("Smoke tests passed.");
}
