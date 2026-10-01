import type { NextConfig } from "next";
import { HTML_LIMITED_BOT_UA_RE } from "next/dist/shared/lib/router/utils/html-bots";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ws", "@neondatabase/serverless"],
  htmlLimitedBots: new RegExp(`${HTML_LIMITED_BOT_UA_RE.source}|TelegramBot`),
  outputFileTracingIncludes: {
    "/api/mcp": ["./skills/pamiac/**/*"],
    "/share-card.png": ["./assets/*.ttf"],
    "/d/**/share-card.png": ["./assets/*.ttf"],
  },
  agentRules: false,
};

export default nextConfig;
