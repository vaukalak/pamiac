import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ws", "@neondatabase/serverless"],
  outputFileTracingIncludes: {
    "/api/mcp": ["./skills/pamiac/**/*"],
    "/opengraph-image": ["./assets/*.ttf"],
    "/twitter-image": ["./assets/*.ttf"],
    "/d/**/opengraph-image/**": ["./assets/*.ttf"],
    "/d/**/twitter-image/**": ["./assets/*.ttf"],
  },
  agentRules: false,
};

export default nextConfig;
