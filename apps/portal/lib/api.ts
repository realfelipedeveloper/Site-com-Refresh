import type { PublicContent, SectionTreeNode } from "@abbatech/contracts";

const publicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api/v1";
const internalApiUrl = process.env.INTERNAL_API_URL ?? publicApiUrl;

async function request<T>(path: string): Promise<T>;
async function request<T>(path: string, options: { notFoundAsNull: true }): Promise<T | null>;
async function request<T>(path: string, options?: { notFoundAsNull?: boolean }): Promise<T | null> {
  const response = await fetch(`${internalApiUrl}${path}`, {
    cache: "no-store"
  });

  if (response.status === 404 && options?.notFoundAsNull) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Falha ao carregar ${path}`);
  }

  return response.json() as Promise<T>;
}

function normalizePortalPath(path: string | null | undefined, fallback: string) {
  const candidate = path?.trim() || fallback;

  if (/^https?:\/\//i.test(candidate)) {
    return fallback;
  }

  const withLeadingSlash = candidate.startsWith("/") ? candidate : `/${candidate}`;
  return withLeadingSlash.replace(/\/{2,}/g, "/");
}

export function getPortalApiUrl() {
  return publicApiUrl;
}

export function getSections() {
  return request<SectionTreeNode[]>("/sections");
}

export function getPublishedContents() {
  return request<PublicContent[]>("/contents");
}

export function getContentBySlug(slug: string) {
  return request<PublicContent>(`/contents/${slug}`, { notFoundAsNull: true });
}

export function getContentHref(content: Pick<PublicContent, "slug" | "url">) {
  return normalizePortalPath(content.url, `/${content.slug}`);
}
