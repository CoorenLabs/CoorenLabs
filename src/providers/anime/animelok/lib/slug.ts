/**
 * Normalise an anime title into a URL-safe slug.
 * e.g. "【OSHI NO KO】Season 3" → "oshi-no-ko-season-3"
 * Ported from animelok-worker/src/index.js → `titleToSlug`.
 */
export function titleToSlug(title: string): string {
  return title
    .replace(/[^\w\s-]/g, " ") // replace special chars (brackets, commas, etc.) with a space
    .toLowerCase()
    .replace(/[\s_]+/g, "-") // collapse whitespace/underscores into a single dash
    .replace(/-+/g, "-") // collapse multiple consecutive dashes into one
    .replace(/^-+|-+$/g, ""); // trim leading/trailing dashes
}

/**
 * Build the full animelok slug from a title + anilist ID.
 * e.g. ("Sword Art Online", 11757) → "sword-art-online-11757"
 */
export function buildFullSlug(title: string, anilistId: string | number): string {
  return `${titleToSlug(title)}-${anilistId}`;
}
