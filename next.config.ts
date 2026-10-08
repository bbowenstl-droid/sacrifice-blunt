import type { NextConfig } from "next";

/**
 * Static export for GitHub Pages.
 * PAGES_BASE_PATH is the repository sub-path ("/sacrifice-blunt" for
 * https://bbowenstl-droid.github.io/sacrifice-blunt/). Leave it empty for a custom domain
 * or local preview at the root. The GitHub Actions workflow sets it automatically.
 */
const basePath = (process.env.PAGES_BASE_PATH ?? "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
