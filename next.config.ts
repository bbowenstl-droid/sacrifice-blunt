import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  outputFileTracingIncludes: { "/": ["./src/data/dataset.json"] },
};

export default nextConfig;
