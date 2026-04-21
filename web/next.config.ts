import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export — produces `web/out/` that the daemon serves
  // directly on :3737. No separate Next.js server needed in prod.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },

  // Proxy /api to the daemon during `next dev`
  async rewrites() {
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://127.0.0.1:3737/api/:path*",
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
