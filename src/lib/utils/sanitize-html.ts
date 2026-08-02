/**
 * Removes HTML tags and comments from user-provided text.
 * No HTML markup is accepted in any form field.
 */
export function stripHtml(input: string): string {
  if (!input) return input;

  return input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s[^>]*)?\/?>/g, "");
}

/**
 * Recursively strips HTML from every string inside JSON-like payloads.
 */
export function stripHtmlDeep<T>(value: T): T {
  if (typeof value === "string") return stripHtml(value) as T;

  if (Array.isArray(value)) {
    return value.map((item) => stripHtmlDeep(item)) as T;
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, stripHtmlDeep(entry)]),
    ) as T;
  }

  return value;
}
