import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // waliet.com/@username → /user/username (same page handles both wallet addresses and usernames)
        source: "/@:username",
        destination: "/user/:username",
      },
    ];
  },
  serverExternalPackages: ["magic-sdk", "@magic-ext/oauth", "@magic-sdk/commons", "@magic-sdk/provider", "@magic-sdk/types"],
  experimental: {
    optimizePackageImports: [
      "wagmi",
      "viem",
      "@azuro-org/sdk",
      "@azuro-org/toolkit",
      "@tanstack/react-query",
      "motion",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
