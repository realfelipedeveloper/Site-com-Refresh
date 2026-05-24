export function toFriendlySlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeFriendlyPath(value: string) {
  const segments = value
    .split("/")
    .map((segment) => toFriendlySlug(segment))
    .filter(Boolean);

  return `/${segments.join("/")}`;
}
