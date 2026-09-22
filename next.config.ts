import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client", "libsql"],
  allowedDevOrigins: ["*.e2b.app"],
  async rewrites() {
    return [{ source: "/@:username", destination: "/u/:username" }];
  },
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
};

export default nextConfig;
