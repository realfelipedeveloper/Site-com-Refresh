const publicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api/v1";
const internalApiUrl = process.env.INTERNAL_API_URL ?? publicApiUrl;

export type PortalSection = {
  id: string;
  name: string;
  slug: string;
  path: string;
  children: PortalSection[];
};

export type PortalContent = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  publishedAt: string | null;
  section: {
    id: string;
    name: string;
    path: string;
  };
  seo: {
    title: string;
    description: string;
  } | null;
  template: {
    id: string;
    name: string;
  } | null;
};

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${internalApiUrl}${path}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar ${path}`);
  }

  return response.json() as Promise<T>;
}

export function getPortalApiUrl() {
  return publicApiUrl;
}

export function getSections() {
  return request<PortalSection[]>("/sections");
}

export function getPublishedContents() {
  return request<PortalContent[]>("/contents");
}

export function getContentBySlug(slug: string) {
  return request<PortalContent>(`/contents/${slug}`);
}
