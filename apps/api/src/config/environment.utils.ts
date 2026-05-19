export type EnvSource =
  | {
      get<T = string>(key: string): T | undefined;
    }
  | Record<string, string | undefined>;

const refreshBasePath = "/abbatech/refresh";

function readEnvValue(source: EnvSource, key: string) {
  if ("get" in source && typeof source.get === "function") {
    const value = source.get<string>(key);
    return typeof value === "string" ? value.trim() : "";
  }

  return String((source as Record<string, string | undefined>)[key] ?? "").trim();
}

export function firstConfiguredEnv(source: EnvSource, keys: string[]) {
  for (const key of keys) {
    const value = readEnvValue(source, key);

    if (value) {
      return value;
    }
  }

  return "";
}

export function normalizeUrl(value: string, fallback: string) {
  const configuredValue = value.trim() || fallback;
  const url = new URL(configuredValue);

  url.pathname = url.pathname.replace(/\/+$/, "");
  url.search = "";
  url.hash = "";

  return url;
}

export function resolveApiUrls(source: EnvSource) {
  const publicApiUrl = normalizeUrl(
    firstConfiguredEnv(source, ["NEXT_PUBLIC_API_URL"]),
    "http://localhost:3333/api/v1"
  ).toString();
  const internalApiUrl = normalizeUrl(firstConfiguredEnv(source, ["INTERNAL_API_URL"]) || publicApiUrl, publicApiUrl)
    .toString();

  return {
    internalApiUrl,
    publicApiUrl
  };
}

export function resolveRefreshPublicUrl(source: EnvSource) {
  const configuredRefreshUrl = firstConfiguredEnv(source, ["REFRESH_APP_URL", "NEXT_PUBLIC_REFRESH_URL", "APP_URL"]);
  const url = normalizeUrl(configuredRefreshUrl, "http://localhost:3101");
  const normalizedPath = url.pathname.replace(/\/+$/, "");

  url.pathname = normalizedPath.endsWith(refreshBasePath)
    ? normalizedPath
    : `${normalizedPath}${refreshBasePath}`.replace(/\/{2,}/g, "/");

  return url.toString().replace(/\/$/, "");
}

export function buildRefreshRouteUrl(
  source: EnvSource,
  routePath: `/${string}`,
  searchParams: Record<string, string> = {}
) {
  const url = new URL(resolveRefreshPublicUrl(source));

  url.pathname = `${url.pathname.replace(/\/+$/, "")}${routePath}`;
  url.search = "";

  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}
