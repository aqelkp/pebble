/**
 * Resolves a static asset path in `public/` so it works identically on localhost (`/`),
 * Vite preview, and sub-path deployments like GitHub Pages (`/pebble/`).
 */
export function assetUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL || './';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = relativePath.replace(/^\/+/, '');
  return `${normalizedBase}${normalizedPath}`;
}
