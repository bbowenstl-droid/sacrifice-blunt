/**
 * Deployment paths. The site is exported as static files for GitHub Pages, which serves a
 * project site from a sub-path (https://bbowenstl-droid.github.io/sacrifice-blunt/).
 *
 * One variable controls it: PAGES_BASE_PATH (e.g. "/sacrifice-blunt"), set in next.config.ts
 * and passed to the browser as NEXT_PUBLIC_BASE_PATH. <Link> and _next assets get the prefix
 * automatically; plain files in /public (images, PDFs, icons) go through asset().
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix a /public path with the base path: asset("/brand/x.png") → "/sacrifice-blunt/brand/x.png". */
export const asset = (p: string) => `${BASE_PATH}${p.startsWith("/") ? p : `/${p}`}`;

/** Absolute public URL of the site root, no trailing slash. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? `https://bbowenstl-droid.github.io${BASE_PATH}`).replace(/\/$/, "");
