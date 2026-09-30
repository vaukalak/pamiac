import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ws", "@neondatabase/serverless"],
  outputFileTracingIncludes: {
    "/api/mcp": ["./skills/pamiac/**/*"],
  },
  agentRules: false,
};

export default nextConfig;
