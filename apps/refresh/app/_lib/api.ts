const apiUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api/v1");
const defaultTimeoutMs = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 15_000);
let csrfToken = "";

type ApiRequestOptions = {
  timeoutMs?: number;
};

export function setApiCsrfToken(nextToken: string | undefined | null) {
  csrfToken = nextToken ?? "";
}

export function clearApiCsrfToken() {
  csrfToken = "";
}

export function normalizeApiBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export function buildApiRequestUrl(path: string, baseUrl = apiUrl) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizeApiBaseUrl(baseUrl)}${normalizedPath}`;
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
  _token?: string,
  requestOptions: ApiRequestOptions = {}
): Promise<T> {
  const method = (options?.method ?? "GET").toUpperCase();
  const shouldSendCsrfToken = csrfToken && !["GET", "HEAD", "OPTIONS"].includes(method);
  const timeoutMs = requestOptions.timeoutMs ?? defaultTimeoutMs;
  const { clear, signal } = createTimeoutSignal(options?.signal, timeoutMs);
  let response: Response;

  try {
    response = await fetch(buildApiRequestUrl(path), {
      ...options,
      credentials: "include",
      signal,
      headers: {
        ...(options?.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(shouldSendCsrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        ...(options?.headers ?? {})
      }
    });
  } catch (requestError) {
    if (isAbortError(requestError)) {
      throw new Error("Tempo esgotado ao comunicar com a API.", { cause: requestError });
    }

    throw requestError instanceof Error ? requestError : new Error("Falha ao comunicar com a API.");
  } finally {
    clear();
  }

  if (!response.ok) {
    const message = await response.text();
    let parsedMessage = message;

    try {
      const parsed = JSON.parse(message) as { message?: string | string[] };
      if (Array.isArray(parsed.message)) {
        parsedMessage = parsed.message.join(" ");
      } else if (parsed.message) {
        parsedMessage = parsed.message;
      }
    } catch {
      parsedMessage = message;
    }

    const error = new Error(parsedMessage || "Falha ao comunicar com a API.") as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}

export async function safeApiRequest<T>(
  path: string,
  fallback: T,
  options?: RequestInit,
  _token?: string,
  requestOptions?: ApiRequestOptions
): Promise<T> {
  try {
    return await apiRequest<T>(path, options, _token, requestOptions);
  } catch (requestError) {
    if (
      requestError instanceof Error &&
      "status" in requestError &&
      typeof requestError.status === "number" &&
      [401, 403, 404].includes(requestError.status)
    ) {
      return fallback;
    }

    throw requestError;
  }
}

function createTimeoutSignal(externalSignal: AbortSignal | null | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const onAbort = () => controller.abort();

  if (externalSignal?.aborted) {
    controller.abort();
  } else {
    externalSignal?.addEventListener("abort", onAbort, { once: true });
  }

  const timeoutId =
    Number.isFinite(timeoutMs) && timeoutMs > 0
      ? globalThis.setTimeout(() => controller.abort(), timeoutMs)
      : undefined;

  return {
    signal: controller.signal,
    clear: () => {
      if (timeoutId !== undefined) {
        globalThis.clearTimeout(timeoutId);
      }

      externalSignal?.removeEventListener("abort", onAbort);
    }
  };
}

function isAbortError(error: unknown) {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : error instanceof Error && error.name === "AbortError";
}
